using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Data;
using your_street_server.Data;
using your_street_server.Models;
using your_street_server.Services;

namespace your_street_server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OccurrencesController : ControllerBase
{
    private static readonly int[] PromptMilestonesDays = [7, 15, 30];

    private readonly AppDbContext _context;
    private readonly IOccurrenceCategorizationService _categorizationService;
    private readonly IOccurrenceLifecycleService _occurrenceLifecycleService;
    private readonly IOptionsMonitor<OccurrenceStateOptions> _stateOptions;

    public OccurrencesController(
        AppDbContext context,
        IOccurrenceCategorizationService categorizationService,
        IOccurrenceLifecycleService occurrenceLifecycleService,
        IOptionsMonitor<OccurrenceStateOptions> stateOptions)
    {
        _context = context;
        _categorizationService = categorizationService;
        _occurrenceLifecycleService = occurrenceLifecycleService;
        _stateOptions = stateOptions;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOccurrenceDto dto)
    {
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        if (string.IsNullOrWhiteSpace(dto.Description))
            return BadRequest("Descricao obrigatoria para classificar a ocorrencia");

        var inferredType = await _categorizationService.CategorizeAsync(dto.Description);

        var occ = new Occurrence
        {
            UserId = userId.Value,
            Type = inferredType,
            Description = dto.Description,
            Address = dto.Address,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            ImageBase64 = dto.ImageBase64,
            CreatedAt = DateTime.UtcNow,
            LastInteractionAt = DateTime.UtcNow,
            Status = OccurrenceStatuses.Pending
        };

        _context.Occurrences.Add(occ);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = occ.Id }, new { id = occ.Id });
    }

    [HttpGet("categories")]
    public IActionResult ListCategories()
    {
        var categories = OccurrenceCategoryCatalog.All
            .Select(item => new { key = item.Key, label = item.Label });

        return Ok(categories);
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = GetAuthenticatedUserId();

        var list = await _context.Occurrences
            .Where(o => o.Status != OccurrenceStatuses.Deleted)
            .Include(o => o.Comments)
            .Include(o => o.Likes)
            .Include(o => o.Favorites)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                id = o.Id,
                userId = o.UserId,
                type = o.Type,
                description = o.Description,
                address = o.Address,
                latitude = o.Latitude,
                longitude = o.Longitude,
                createdAt = o.CreatedAt,
                imageBase64 = o.ImageBase64,
                status = o.Status,
                likesCount = o.Likes.Count,
                favoritesCount = o.Favorites.Count,
                commentsCount = o.Comments.Count,
                likedByCurrentUser = userId.HasValue && o.Likes.Any(l => l.UserId == userId.Value),
                favoritedByCurrentUser = userId.HasValue && o.Favorites.Any(f => f.UserId == userId.Value)
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetAuthenticatedUserId();

        var occ = await _context.Occurrences
            .Include(o => o.Comments).ThenInclude(c => c.User)
            .Include(o => o.Likes)
            .Include(o => o.Favorites)
            .Include(o => o.ResolutionVotes)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (occ == null || occ.Status == OccurrenceStatuses.Deleted) return NotFound();

        return Ok(new
        {
            id = occ.Id,
            userId = occ.UserId,
            type = occ.Type,
            description = occ.Description,
            address = occ.Address,
            latitude = occ.Latitude,
            longitude = occ.Longitude,
            createdAt = occ.CreatedAt,
            imageBase64 = occ.ImageBase64,
            status = occ.Status,
            likesCount = occ.Likes.Count,
            favoritesCount = occ.Favorites.Count,
            solvedVotes = occ.ResolutionVotes.Count(v => v.IsSolved),
            notSolvedVotes = occ.ResolutionVotes.Count(v => !v.IsSolved),
            comments = occ.Comments.Select(c => new { id = c.Id, userId = c.UserId, text = c.Text, createdAt = c.CreatedAt }),
            likedByCurrentUser = userId.HasValue && occ.Likes.Any(l => l.UserId == userId.Value),
            favoritedByCurrentUser = userId.HasValue && occ.Favorites.Any(f => f.UserId == userId.Value)
        });
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var occ = await _context.Occurrences.FindAsync(id);
        if (occ == null || occ.Status == OccurrenceStatuses.Deleted) return NotFound();

        var existing = await _context.OccurrenceLikes.FirstOrDefaultAsync(l => l.OccurrenceId == id && l.UserId == userId.Value);
        if (existing == null)
        {
            _context.OccurrenceLikes.Add(new OccurrenceLike
            {
                OccurrenceId = id,
                UserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            _context.OccurrenceLikes.Remove(existing);
        }

        occ.LastInteractionAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _occurrenceLifecycleService.RecalculateOccurrenceStatusAsync(id);
        return Ok();
    }

    [HttpPost("{id}/favorite")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var occ = await _context.Occurrences.FindAsync(id);
        if (occ == null || occ.Status == OccurrenceStatuses.Deleted) return NotFound();

        var existing = await _context.OccurrenceFavorites.FirstOrDefaultAsync(f => f.OccurrenceId == id && f.UserId == userId.Value);
        if (existing == null)
        {
            _context.OccurrenceFavorites.Add(new OccurrenceFavorite
            {
                OccurrenceId = id,
                UserId = userId.Value,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            _context.OccurrenceFavorites.Remove(existing);
        }

        occ.LastInteractionAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _occurrenceLifecycleService.RecalculateOccurrenceStatusAsync(id);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var occ = await _context.Occurrences.FirstOrDefaultAsync(o => o.Id == id);
        if (occ == null) return NotFound("Ocorrência não encontrada");
        if (occ.UserId != userId.Value) return Forbid();

        _context.Occurrences.Remove(occ);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var occ = await _context.Occurrences.FindAsync(id);
        if (occ == null || occ.Status == OccurrenceStatuses.Deleted) return NotFound("Ocorrência não encontrada");

        var comments = await _context.OccurrenceComments
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
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var occ = await _context.Occurrences.FindAsync(id);
        if (occ == null || occ.Status == OccurrenceStatuses.Deleted) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Text)) return BadRequest("Comentário vazio");

        var comment = new OccurrenceComment { OccurrenceId = id, UserId = userId.Value, Text = dto.Text, CreatedAt = DateTime.UtcNow };
        _context.OccurrenceComments.Add(comment);
        occ.LastInteractionAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _occurrenceLifecycleService.RecalculateOccurrenceStatusAsync(id);

        return CreatedAtAction(nameof(GetById), new { id = id }, new { commentId = comment.Id });
    }

    [HttpGet("resolution-prompts")]
    public async Task<IActionResult> GetResolutionPrompts([FromQuery] double? userLat, [FromQuery] double? userLng)
    {
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var interactedOccurrenceIds = await _context.OccurrenceLikes
            .Where(l => l.UserId == userId.Value)
            .Select(l => l.OccurrenceId)
            .Union(
                _context.OccurrenceComments
                    .Where(c => c.UserId == userId.Value)
                    .Select(c => c.OccurrenceId)
            )
            .Distinct()
            .ToListAsync();

        if (interactedOccurrenceIds.Count == 0)
        {
            return Ok(Array.Empty<object>());
        }

        var now = DateTime.UtcNow;

        var existingStates = await _context.OccurrenceResolutionPromptStates
            .Where(p => p.UserId == userId.Value && interactedOccurrenceIds.Contains(p.OccurrenceId))
            .ToDictionaryAsync(p => p.OccurrenceId);

        var missingStateIds = interactedOccurrenceIds
            .Where(id => !existingStates.ContainsKey(id))
            .ToList();

        if (missingStateIds.Count > 0)
        {
            var seedOccurrences = await _context.Occurrences
                .Where(o => missingStateIds.Contains(o.Id) && o.Status == OccurrenceStatuses.Pending)
                .Select(o => new { o.Id, o.CreatedAt })
                .ToListAsync();

            foreach (var occurrence in seedOccurrences)
            {
                var state = new OccurrenceResolutionPromptState
                {
                    OccurrenceId = occurrence.Id,
                    UserId = userId.Value,
                    CreatedAt = now,
                    UpdatedAt = now,
                    HasNearbyPrompted = false,
                    LastDayPrompted = 0,
                    NextPromptAt = occurrence.CreatedAt.AddDays(PromptMilestonesDays[0])
                };

                _context.OccurrenceResolutionPromptStates.Add(state);
                existingStates[occurrence.Id] = state;
            }

            if (seedOccurrences.Count > 0)
            {
                await _context.SaveChangesAsync();
            }
        }

        var scheduleBackfillIds = existingStates.Values
            .Where(p => !p.NextPromptAt.HasValue && p.LastDayPrompted < PromptMilestonesDays[^1])
            .Select(p => p.OccurrenceId)
            .Distinct()
            .ToList();

        if (scheduleBackfillIds.Count > 0)
        {
            var occurrencesForSchedule = await _context.Occurrences
                .Where(o => scheduleBackfillIds.Contains(o.Id) && o.Status == OccurrenceStatuses.Pending)
                .Select(o => new { o.Id, o.CreatedAt })
                .ToListAsync();

            foreach (var occurrence in occurrencesForSchedule)
            {
                if (!existingStates.TryGetValue(occurrence.Id, out var state))
                {
                    continue;
                }

                state.NextPromptAt = GetNextPromptAt(occurrence.CreatedAt, state.LastDayPrompted);
                state.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();
        }

        var dueByTimeIds = existingStates.Values
            .Where(p => p.NextPromptAt.HasValue && p.NextPromptAt.Value <= now)
            .Select(p => p.OccurrenceId)
            .ToHashSet();

        var nearbyCandidateIds = new HashSet<int>();
        if (userLat.HasValue && userLng.HasValue)
        {
            foreach (var state in existingStates.Values.Where(s => !s.HasNearbyPrompted))
            {
                nearbyCandidateIds.Add(state.OccurrenceId);
            }
        }

        var candidateIds = dueByTimeIds
            .Union(nearbyCandidateIds)
            .ToList();

        if (candidateIds.Count == 0)
        {
            return Ok(Array.Empty<object>());
        }

        var occurrences = await _context.Occurrences
            .Where(o => candidateIds.Contains(o.Id) && o.Status == OccurrenceStatuses.Pending)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var response = new List<object>();
        var changedPromptStates = false;

        foreach (var occurrence in occurrences)
        {
            if (!existingStates.TryGetValue(occurrence.Id, out var promptState))
            {
                continue;
            }

            var reasons = new List<string>();

            if (!promptState.HasNearbyPrompted &&
                userLat.HasValue &&
                userLng.HasValue &&
                occurrence.Latitude.HasValue &&
                occurrence.Longitude.HasValue)
            {
                var distanceMeters = CalculateDistanceMeters(
                    userLat.Value,
                    userLng.Value,
                    occurrence.Latitude.Value,
                    occurrence.Longitude.Value);

                if (distanceMeters <= 100)
                {
                    reasons.Add("nearby_first");
                    promptState.HasNearbyPrompted = true;
                    promptState.UpdatedAt = now;
                    changedPromptStates = true;
                }
            }

            var ageDays = (int)Math.Floor((now - occurrence.CreatedAt).TotalDays);
            var nextMilestone = PromptMilestonesDays
                .FirstOrDefault(day => day > promptState.LastDayPrompted && ageDays >= day);

            if (nextMilestone > 0)
            {
                reasons.Add($"day_{nextMilestone}");
                promptState.LastDayPrompted = nextMilestone;
                promptState.NextPromptAt = GetNextPromptAt(occurrence.CreatedAt, nextMilestone);
                promptState.UpdatedAt = now;
                changedPromptStates = true;
            }

            if (reasons.Count == 0)
            {
                continue;
            }

            response.Add(new
            {
                occurrenceId = occurrence.Id,
                type = occurrence.Type,
                description = occurrence.Description,
                address = occurrence.Address,
                imageBase64 = occurrence.ImageBase64,
                createdAt = occurrence.CreatedAt,
                status = occurrence.Status,
                reasons
            });
        }

        if (changedPromptStates)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(response);
    }

    [HttpPost("{id}/resolution-vote")]
    public async Task<IActionResult> RegisterResolutionVote(int id, [FromBody] RegisterResolutionVoteDto dto)
    {
        var userId = GetAuthenticatedUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var now = DateTime.UtcNow;
        var minVotes = Math.Max(1, _stateOptions.CurrentValue.ResolutionMinVotes);

        await using var tx = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var occurrence = await _context.Occurrences
            .Include(o => o.ResolutionVotes)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (occurrence == null || occurrence.Status == OccurrenceStatuses.Deleted)
        {
            return NotFound("Ocorrência não encontrada");
        }

        if (occurrence.Status != OccurrenceStatuses.Pending)
        {
            return BadRequest("A ocorrência já está resolvida");
        }

        var hasInteracted = await _context.OccurrenceLikes.AnyAsync(l => l.OccurrenceId == id && l.UserId == userId.Value)
            || await _context.OccurrenceComments.AnyAsync(c => c.OccurrenceId == id && c.UserId == userId.Value);

        if (!hasInteracted)
        {
            return BadRequest("Somente usuários que interagiram podem votar");
        }

        var existingVote = await _context.OccurrenceResolutionVotes
            .FirstOrDefaultAsync(v => v.OccurrenceId == id && v.UserId == userId.Value);

        if (existingVote == null)
        {
            _context.OccurrenceResolutionVotes.Add(new OccurrenceResolutionVote
            {
                OccurrenceId = id,
                UserId = userId.Value,
                IsSolved = dto.IsSolved,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
        else
        {
            existingVote.IsSolved = dto.IsSolved;
            existingVote.UpdatedAt = now;
        }

        occurrence.LastInteractionAt = now;

        await _context.SaveChangesAsync();

        var solvedVotes = await _context.OccurrenceResolutionVotes.CountAsync(v => v.OccurrenceId == id && v.IsSolved);
        var notSolvedVotes = await _context.OccurrenceResolutionVotes.CountAsync(v => v.OccurrenceId == id && !v.IsSolved);
        var totalVotes = solvedVotes + notSolvedVotes;
        if (now - occurrence.CreatedAt >= TimeSpan.FromHours(2)
            && totalVotes >= minVotes
            && solvedVotes > notSolvedVotes)
        {
            occurrence.Status = OccurrenceStatuses.Resolved;
            occurrence.StatusChangedAt = now;
            await _context.SaveChangesAsync();
        }

        await tx.CommitAsync();

        return Ok(new
        {
            status = occurrence.Status,
            solvedVotes,
            notSolvedVotes,
            minVotesRequired = minVotes
        });
    }

    private static DateTime? GetNextPromptAt(DateTime occurrenceCreatedAt, int lastPromptedDay)
    {
        var nextDay = PromptMilestonesDays.FirstOrDefault(day => day > lastPromptedDay);
        if (nextDay == 0)
        {
            return null;
        }

        return occurrenceCreatedAt.AddDays(nextDay);
    }

    private int? GetAuthenticatedUserId()
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (int.TryParse(userIdStr, out var userId))
        {
            return userId;
        }

        return null;
    }

    private static double CalculateDistanceMeters(double lat1, double lng1, double lat2, double lng2)
    {
        const double earthRadiusMeters = 6371000;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLng = DegreesToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(DegreesToRadians(lat1))
                * Math.Cos(DegreesToRadians(lat2))
                * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static double DegreesToRadians(double value)
    {
        return value * Math.PI / 180;
    }

    public class CreateOccurrenceDto
    {
        public string? Description { get; set; }
        public string? Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? ImageBase64 { get; set; }
    }

    public class CreateCommentDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class RegisterResolutionVoteDto
    {
        public bool IsSolved { get; set; }
    }
}
