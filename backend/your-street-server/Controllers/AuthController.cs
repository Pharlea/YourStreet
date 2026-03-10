using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using your_street_server.Data;
using your_street_server.Models;

namespace your_street_server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("login/google")]
    public IActionResult GoogleLogin()
    {
        // URL Google OAuth manual
        var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        var redirectUri = $"{Request.Scheme}://{Request.Host}/api/auth/callback/google";
        var scope = "openid profile email";
        var state = Guid.NewGuid().ToString();
        
        // Salvar state no session/cache temporário (para produção use Redis)
        HttpContext.Session.SetString("oauth_state", state);
        
        var googleAuthUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
            $"client_id={clientId}&" +
            $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
            $"scope={Uri.EscapeDataString(scope)}&" +
            $"response_type=code&" +
            $"state={state}";
            
        return Redirect(googleAuthUrl);
    }

    [HttpGet("callback/google")]
    public async Task<IActionResult> GoogleCallback(string code, string state)
    {
        // Verificar state
        var savedState = HttpContext.Session.GetString("oauth_state");
        if (string.IsNullOrEmpty(savedState) || savedState != state)
        {
            return BadRequest("Estado OAuth inválido");
        }

        if (string.IsNullOrEmpty(code))
        {
            return BadRequest("Código de autorização não encontrado");
        }

        try
        {
            // Trocar code por access token
            var tokenResponse = await ExchangeCodeForTokenAsync(code);
            
            if (tokenResponse == null)
            {
                return BadRequest("Falha ao obter token de acesso");
            }

            // Obter informações do usuário
            var userInfo = await GetUserInfoAsync(tokenResponse.access_token);
            
            if (userInfo == null)
            {
                return BadRequest("Falha ao obter informações do usuário");
            }

            // Salvar ou atualizar usuário no banco
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == userInfo.id);
            
            if (user == null)
            {
                user = new User
                {
                    GoogleId = userInfo.id,
                    Email = userInfo.email,
                    Name = userInfo.name,
                    Picture = userInfo.picture,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };
                
                _context.Users.Add(user);
            }
            else
            {
                user.LastLoginAt = DateTime.UtcNow;
                user.Email = userInfo.email;
                user.Name = userInfo.name;
                user.Picture = userInfo.picture;
                
                _context.Users.Update(user);
            }

            await _context.SaveChangesAsync();

            // Criar cookie de sessão simples
            HttpContext.Session.SetString("user_id", user.Id.ToString());
            HttpContext.Session.SetString("user_email", user.Email);
            HttpContext.Session.SetString("user_name", user.Name);

            // Redirecionar para frontend
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5174";
            return Redirect($"{frontendUrl}/?login=success");
        }
        catch (Exception ex)
        {
            return BadRequest($"Erro durante autenticação: {ex.Message}");
        }
    }

    private async Task<TokenResponse?> ExchangeCodeForTokenAsync(string code)
    {
        using var httpClient = new HttpClient();
        
        var tokenRequest = new Dictionary<string, string>
        {
            {"client_id", Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")!},
            {"client_secret", Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET")!},
            {"code", code},
            {"grant_type", "authorization_code"},
            {"redirect_uri", $"{Request.Scheme}://{Request.Host}/api/auth/callback/google"}
        };

        var content = new FormUrlEncodedContent(tokenRequest);
        var response = await httpClient.PostAsync("https://oauth2.googleapis.com/token", content);
        
        if (response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TokenResponse>(json);
        }
        
        return null;
    }

    private async Task<UserInfo?> GetUserInfoAsync(string accessToken)
    {
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        
        var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
        
        if (response.IsSuccessStatusCode)
        {
            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<UserInfo>(json);
        }
        
        return null;
    }

    private class TokenResponse
    {
        public string access_token { get; set; } = "";
        public string token_type { get; set; } = "";
        public int expires_in { get; set; }
    }

    private class UserInfo
    {
        public string id { get; set; } = "";
        public string email { get; set; } = "";
        public string name { get; set; } = "";
        public string picture { get; set; } = "";
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = HttpContext.Session.GetString("user_id");
        
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Usuário não autenticado");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        
        if (user == null)
        {
            return NotFound("Usuário não encontrado");
        }

        return Ok(new
        {
            Id = user.Id,
            GoogleId = user.GoogleId,
            Email = user.Email,
            Name = user.Name,
            Picture = user.Picture,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = HttpContext.Session.GetString("user_id");

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("Usuário não autenticado");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        
        if (user == null)
        {
            return NotFound("Usuário não encontrado");
        }

        return Ok(new
        {
            id = user.Id.ToString(),
            email = user.Email,
            name = user.Name,
            picture = user.Picture
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Ok(new { message = "Logout realizado com sucesso" });
    }
}