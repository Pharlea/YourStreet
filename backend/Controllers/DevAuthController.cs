using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using your_street_server.Data;
using your_street_server.Models;
using Microsoft.AspNetCore.Hosting;

namespace your_street_server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevAuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public DevAuthController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpPost("impersonate")]
    public async Task<IActionResult> Impersonate([FromQuery] int userId = 1, [FromQuery] string? email = null, [FromQuery] string? name = null)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            user = new User
            {
                GoogleId = Guid.NewGuid().ToString(),
                Email = email ?? $"dev{userId}@example.com",
                Name = name ?? $"Dev User {userId}",
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        HttpContext.Session.SetString("user_id", user.Id.ToString());
        HttpContext.Session.SetString("user_email", user.Email);
        HttpContext.Session.SetString("user_name", user.Name);

        return Ok(new { message = "Impersonated for development", userId = user.Id, email = user.Email, name = user.Name });
    }

    [HttpPost("clear")]
    public IActionResult Clear()
    {
        if (!_env.IsDevelopment()) return NotFound();

        HttpContext.Session.Clear();
        return Ok(new { message = "Session cleared" });
    }
}
