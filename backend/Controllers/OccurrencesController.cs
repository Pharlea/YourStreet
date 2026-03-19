using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using your_street_server.Data;
using your_street_server.Models;

namespace your_street_server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OccurrencesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private static long _listCacheVersion = 0;

    private static readonly string[] AllowedTypes = new[] { "buraco", "alagamento", "acidente" };

    public OccurrencesController(AppDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    private static void InvalidateListCache()
    {
        Interlocked.Increment(ref _listCacheVersion);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOccurrenceDto dto)
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Usuário não autenticado");

        var normalizedType = dto.Type?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedType) || !AllowedTypes.Contains(normalizedType))
            return BadRequest("Tipo inválido");

        var occ = new Occurrence
        {
            UserId = userId,
            Type = normalizedType!,
            Description = dto.Description,
            Address = dto.Address,
            ImageBase64 = dto.ImageBase64,
            CreatedAt = DateTime.UtcNow
        };

        _context.Occurrences.Add(occ);
        await _context.SaveChangesAsync();
        InvalidateListCache();

        return CreatedAtAction(nameof(GetById), new { id = occ.Id }, new { id = occ.Id });
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] bool onlyMine = false,
        [FromQuery] bool includeImage = false,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var boundedSkip = Math.Max(skip, 0);
        var boundedTake = Math.Clamp(take, 1, 300);

        var userIdStr = HttpContext.Session.GetString("user_id");
        int? userId = null;
        if (int.TryParse(userIdStr, out var uid)) userId = uid;

        if (onlyMine && !userId.HasValue)
        {
            return Unauthorized("Usuário não autenticado");
        }

        var version = Interlocked.Read(ref _listCacheVersion);
        var cacheKey = $"occ-list:v{version}:u{userId?.ToString() ?? "anon"}:m{onlyMine}:img{includeImage}:s{boundedSkip}:t{boundedTake}";

        if (_cache.TryGetValue(cacheKey, out object? cachedList) && cachedList != null)
        {
            return Ok(cachedList);
        }

        var query = _context.Occurrences
            .AsNoTracking()
            .AsQueryable();

        if (onlyMine && userId.HasValue)
        {
            query = query.Where(o => o.UserId == userId.Value);
        }

        var list = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip(boundedSkip)
            .Take(boundedTake)
            .Select(o => new
            {
                id = o.Id,
                userId = o.UserId,
                type = o.Type,
                description = o.Description,
                address = o.Address,
                createdAt = o.CreatedAt,
                imageBase64 = includeImage ? o.ImageBase64 : null,
                likesCount = o.Likes.Count,
                favoritesCount = o.Favorites.Count,
                commentsCount = o.Comments.Count,
                likedByCurrentUser = userId.HasValue && o.Likes.Any(l => l.UserId == userId.Value),
                favoritedByCurrentUser = userId.HasValue && o.Favorites.Any(f => f.UserId == userId.Value)
            })
            .ToListAsync();

        _cache.Set(cacheKey, list, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(20),
            SlidingExpiration = TimeSpan.FromSeconds(10)
        });

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        int? userId = null;
        if (int.TryParse(userIdStr, out var uid)) userId = uid;

        var occ = await _context.Occurrences
            .AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => new
            {
                id = o.Id,
                userId = o.UserId,
                type = o.Type,
                description = o.Description,
                address = o.Address,
                createdAt = o.CreatedAt,
                imageBase64 = o.ImageBase64,
                likesCount = o.Likes.Count,
                favoritesCount = o.Favorites.Count,
                comments = o.Comments
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => new
                    {
                        id = c.Id,
                        userId = c.UserId,
                        text = c.Text,
                        createdAt = c.CreatedAt,
                        user = new
                        {
                            id = c.User != null ? c.User.Id : 0,
                            name = c.User != null ? c.User.Name : string.Empty,
                            email = c.User != null ? c.User.Email : string.Empty,
                            picture = c.User != null ? c.User.Picture : null
                        }
                    }),
                likedByCurrentUser = userId.HasValue && o.Likes.Any(l => l.UserId == userId.Value),
                favoritedByCurrentUser = userId.HasValue && o.Favorites.Any(f => f.UserId == userId.Value)
            })
            .FirstOrDefaultAsync();

        if (occ == null) return NotFound();

        return Ok(occ);
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Usuário não autenticado");

        var occExists = await _context.Occurrences.AsNoTracking().AnyAsync(o => o.Id == id);
        if (!occExists) return NotFound();

        var existing = await _context.OccurrenceLikes.FirstOrDefaultAsync(l => l.OccurrenceId == id && l.UserId == userId);
        if (existing == null)
        {
            _context.OccurrenceLikes.Add(new OccurrenceLike { OccurrenceId = id, UserId = userId });
        }
        else
        {
            _context.OccurrenceLikes.Remove(existing);
        }

        await _context.SaveChangesAsync();
        InvalidateListCache();

        var likedByCurrentUser = await _context.OccurrenceLikes
            .AsNoTracking()
            .AnyAsync(l => l.OccurrenceId == id && l.UserId == userId);
        var likesCount = await _context.OccurrenceLikes
            .AsNoTracking()
            .CountAsync(l => l.OccurrenceId == id);

        return Ok(new
        {
            likesCount,
            likedByCurrentUser
        });
    }

    [HttpPost("{id}/favorite")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Usuário não autenticado");

        var occExists = await _context.Occurrences.AsNoTracking().AnyAsync(o => o.Id == id);
        if (!occExists) return NotFound();

        var existing = await _context.OccurrenceFavorites.FirstOrDefaultAsync(f => f.OccurrenceId == id && f.UserId == userId);
        if (existing == null)
        {
            _context.OccurrenceFavorites.Add(new OccurrenceFavorite { OccurrenceId = id, UserId = userId });
        }
        else
        {
            _context.OccurrenceFavorites.Remove(existing);
        }

        await _context.SaveChangesAsync();
        InvalidateListCache();

        var favoritedByCurrentUser = await _context.OccurrenceFavorites
            .AsNoTracking()
            .AnyAsync(f => f.OccurrenceId == id && f.UserId == userId);
        var favoritesCount = await _context.OccurrenceFavorites
            .AsNoTracking()
            .CountAsync(f => f.OccurrenceId == id);

        return Ok(new
        {
            favoritesCount,
            favoritedByCurrentUser
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Usuário não autenticado");

        var occ = await _context.Occurrences.FirstOrDefaultAsync(o => o.Id == id);
        if (occ == null) return NotFound("Ocorrência não encontrada");
        if (occ.UserId != userId) return Forbid();

        _context.Occurrences.Remove(occ);
        await _context.SaveChangesAsync();
        InvalidateListCache();

        return NoContent();
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var occ = await _context.Occurrences.FindAsync(id);
        if (occ == null) return NotFound("Ocorrência não encontrada");

        var comments = await _context.OccurrenceComments
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.OccurrenceId == id)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                id = c.Id,
                userId = c.UserId,
                text = c.Text,
                createdAt = c.CreatedAt,
                user = new
                {
                    id = c.User != null ? c.User.Id : 0,
                    name = c.User != null ? c.User.Name : string.Empty,
                    email = c.User != null ? c.User.Email : string.Empty,
                    picture = c.User != null ? c.User.Picture : null
                }
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Usuário não autenticado");

        var occ = await _context.Occurrences.FindAsync(id);
        if (occ == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest("Comentário vazio");

        var currentUser = await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Id, u.Name, u.Email, u.Picture })
            .FirstOrDefaultAsync();

        var comment = new OccurrenceComment { OccurrenceId = id, UserId = userId, Text = dto.Text.Trim(), CreatedAt = DateTime.UtcNow };
        _context.OccurrenceComments.Add(comment);
        await _context.SaveChangesAsync();
        InvalidateListCache();

        return CreatedAtAction(nameof(GetById), new { id = id }, new
        {
            id = comment.Id,
            occurrenceId = id,
            userId = comment.UserId,
            text = comment.Text,
            createdAt = comment.CreatedAt,
            user = currentUser == null ? null : new
            {
                id = currentUser.Id,
                name = currentUser.Name,
                email = currentUser.Email,
                picture = currentUser.Picture
            }
        });
    }

    // DTOs
    public class CreateOccurrenceDto
    {
        public string Type { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? ImageBase64 { get; set; }
    }

    public class CreateCommentDto
    {
        public string Text { get; set; } = string.Empty;
    }
}
