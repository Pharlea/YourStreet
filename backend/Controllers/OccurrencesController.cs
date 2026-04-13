using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using your_street_server.Data;
using your_street_server.Models;
using your_street_server.Services;

namespace your_street_server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OccurrencesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IOccurrenceCategorizationService _categorizationService;
    private static readonly TimeSpan SevenDays = TimeSpan.FromDays(7);
    private static readonly TimeSpan ThirtyDays = TimeSpan.FromDays(30);
    private static readonly TimeSpan CompletedCleanupAge = TimeSpan.FromDays(90);

    public OccurrencesController(
        AppDbContext context,
        IOccurrenceCategorizationService categorizationService)
    {
        _context = context;
        _categorizationService = categorizationService;
    }

    private int? GetCurrentUserId()
    {
        var userIdStr = HttpContext.Session.GetString("user_id");
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return null;

        return userId;
    }

    private async Task CleanupCompletedOccurrencesAsync()
    {
        var cutoff = DateTime.UtcNow.Add(-CompletedCleanupAge);
        var oldOccurrences = await _context.Occurrences
            .Where(o => o.Status == "completed" && o.CompletedAt < cutoff)
            .ToListAsync();

        if (oldOccurrences.Count > 0)
        {
            _context.Occurrences.RemoveRange(oldOccurrences);
            await _context.SaveChangesAsync();
        }
    }

    private async Task EnsurePendingResolutionRequestsAsync()
    {
        var pendingRequests = await _context.OccurrenceResolutionRequests
            .Include(r => r.Occurrence!).ThenInclude(o => o.Likes)
            .Include(r => r.Votes)
            .Where(r => r.Status == ResolutionRequestStatus.Pending)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var updated = false;

        foreach (var request in pendingRequests)
        {
            if (request.Occurrence == null) continue;

            var occurrence = request.Occurrence!;
            var totalLikes = occurrence.Likes.Count;
            var approvedVotes = request.Votes.Count(v => v.Confirmed && occurrence.Likes.Any(l => l.UserId == v.UserId));
            var rejectedVotes = request.Votes.Count(v => !v.Confirmed && occurrence.Likes.Any(l => l.UserId == v.UserId));
            var approvalRatio = totalLikes > 0 ? (decimal)approvedVotes / totalLikes : 0m;
            var rejectionRatio = totalLikes > 0 ? (decimal)rejectedVotes / totalLikes : 0m;
            var lastInteraction = request.LastInteractionAt;
            var shouldApprove = false;
            var shouldReject = false;

            if (rejectedVotes > approvedVotes)
            {
                shouldReject = true;
            }
            else if (totalLikes > 0 && approvedVotes == totalLikes && rejectedVotes == 0)
            {
                shouldApprove = true;
            }
            else if (totalLikes > 0 && approvalRatio >= 0.75m && rejectedVotes == 0 && now - lastInteraction >= SevenDays)
            {
                shouldApprove = true;
            }
            else if (totalLikes > 0 && rejectionRatio >= 0.5m)
            {
                shouldReject = true;
            }
            else if (now - occurrence.LastActivityAt >= ThirtyDays && approvedVotes >= rejectedVotes)
            {
                shouldApprove = true;
            }

            if (shouldReject)
            {
                request.Status = ResolutionRequestStatus.Rejected;
                request.LastInteractionAt = now;
                updated = true;
            }
            else if (shouldApprove)
            {
                request.Status = ResolutionRequestStatus.Approved;
                request.LastInteractionAt = now;
                occurrence.LastActivityAt = now;

                if (request.RequestType == ResolutionRequestType.Completion)
                {
                    occurrence.Status = "completed";
                    occurrence.CompletedAt = now;
                }
                else
                {
                    occurrence.Status = "pending";
                    occurrence.CompletedAt = null;
                    occurrence.ReopenCount++;
                }

                updated = true;
            }
        }

        if (updated)
        {
            await _context.SaveChangesAsync();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOccurrenceDto dto)
    {
        var userId = GetCurrentUserId();
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
            ImageBase64 = dto.ImageBase64,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            Status = "pending"
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
        await CleanupCompletedOccurrencesAsync();
        await EnsurePendingResolutionRequestsAsync();

        var userId = GetCurrentUserId();

        var list = await _context.Occurrences
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
                createdAt = o.CreatedAt,
                imageBase64 = o.ImageBase64,
                status = o.Status,
                completedAt = o.CompletedAt,
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
        await CleanupCompletedOccurrencesAsync();
        await EnsurePendingResolutionRequestsAsync();

        var userId = GetCurrentUserId();

        var occ = await _context.Occurrences
            .Include(o => o.Comments).ThenInclude(c => c.User)
            .Include(o => o.Likes)
            .Include(o => o.Favorites)
            .Include(o => o.ResolutionRequests).ThenInclude(r => r.Votes)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (occ == null) return NotFound();

        return Ok(new
        {
            id = occ.Id,
            userId = occ.UserId,
            type = occ.Type,
            description = occ.Description,
            address = occ.Address,
            createdAt = occ.CreatedAt,
            imageBase64 = occ.ImageBase64,
            status = occ.Status,
            completedAt = occ.CompletedAt,
            likesCount = occ.Likes.Count,
            favoritesCount = occ.Favorites.Count,
            comments = occ.Comments.Select(c => new { id = c.Id, userId = c.UserId, text = c.Text, createdAt = c.CreatedAt }),
            resolutionRequests = occ.ResolutionRequests.Select(r => new
            {
                id = r.Id,
                requestType = r.RequestType.ToString().ToLowerInvariant(),
                status = r.Status.ToString().ToLowerInvariant(),
                proofText = r.ProofText,
                proofImageBase64 = r.ProofImageBase64,
                approvalsCount = r.Votes.Count(v => v.Confirmed),
                rejectionsCount = r.Votes.Count(v => !v.Confirmed),
                requestedByUserId = r.RequestedByUserId,
                requestedAt = r.RequestedAt,
                lastInteractionAt = r.LastInteractionAt
            }),
            likedByCurrentUser = userId.HasValue && occ.Likes.Any(l => l.UserId == userId.Value),
            favoritedByCurrentUser = userId.HasValue && occ.Favorites.Any(f => f.UserId == userId.Value)
        });
    }

    [HttpPost("{id}/resolution-requests")]
    public async Task<IActionResult> CreateResolutionRequest(int id, [FromBody] CreateResolutionRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var requestType = ParseRequestType(dto.RequestType);
        if (requestType == null)
            return BadRequest("Tipo de pedido de resolução inválido");

        var occ = await _context.Occurrences
            .Include(o => o.Likes)
            .Include(o => o.ResolutionRequests)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (occ == null) return NotFound();

        if (occ.ResolutionRequests.Any(r => r.Status == ResolutionRequestStatus.Pending))
            return BadRequest("Já existe um pedido de resolução em andamento para esta ocorrência");

        if (requestType == ResolutionRequestType.Completion && occ.Status == "completed")
            return BadRequest("Ocorrência já concluída");

        if (requestType == ResolutionRequestType.Reopen && occ.Status != "completed")
            return BadRequest("Apenas ocorrências concluídas podem ser marcadas como não concluídas");

        var request = new OccurrenceResolutionRequest
        {
            OccurrenceId = id,
            RequestedByUserId = userId.Value,
            RequestType = requestType.Value,
            ProofText = dto.ProofText,
            ProofImageBase64 = dto.ProofImageBase64,
            RequestedAt = DateTime.UtcNow,
            LastInteractionAt = DateTime.UtcNow,
            Status = ResolutionRequestStatus.Pending
        };

        if (requestType == ResolutionRequestType.Reopen && occ.UserId == userId.Value && occ.ReopenCount < 3)
        {
            request.Status = ResolutionRequestStatus.Approved;
            occ.Status = "pending";
            occ.CompletedAt = null;
            occ.ReopenCount++;
            occ.LastActivityAt = DateTime.UtcNow;
        }
        else
        {
            occ.Status = requestType == ResolutionRequestType.Completion ? "waiting_confirmation" : "waiting_reopen_confirmation";
            occ.LastActivityAt = DateTime.UtcNow;
        }

        _context.OccurrenceResolutionRequests.Add(request);
        await _context.SaveChangesAsync();

        if (request.Status == ResolutionRequestStatus.Approved)
        {
            return Ok(new { requestId = request.Id, autoApproved = true });
        }

        return CreatedAtAction(nameof(GetById), new { id = id }, new { requestId = request.Id });
    }

    [HttpPost("resolution-requests/{requestId}/vote")]
    public async Task<IActionResult> VoteResolutionRequest(int requestId, [FromBody] VoteResolutionRequestDto dto)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized("Usuário não autenticado");

        var request = await _context.OccurrenceResolutionRequests
            .Include(r => r.Occurrence!).ThenInclude(o => o.Likes)
            .Include(r => r.Votes)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) return NotFound();
        if (request.Status != ResolutionRequestStatus.Pending)
            return BadRequest("Pedido de resolução já finalizado");

        if (request.Occurrence == null)
            return BadRequest("Ocorrência não encontrada");

        var occurrence = request.Occurrence!;
        if (!occurrence.Likes.Any(l => l.UserId == userId.Value))
            return BadRequest("Apenas usuários que curtiram a ocorrência podem votar");

        if (request.Votes.Any(v => v.UserId == userId.Value))
            return BadRequest("Você já votou neste pedido de resolução");

        var vote = new OccurrenceResolutionVote
        {
            ResolutionRequestId = requestId,
            UserId = userId.Value,
            Confirmed = dto.Confirmed,
            CreatedAt = DateTime.UtcNow
        };

        _context.OccurrenceResolutionVotes.Add(vote);
        request.LastInteractionAt = DateTime.UtcNow;
        request.Occurrence.LastActivityAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await EnsurePendingResolutionRequestsAsync();

        return Ok();
    }

    private ResolutionRequestType? ParseRequestType(string? requestType)
    {
        if (string.IsNullOrWhiteSpace(requestType)) return null;
        if (Enum.TryParse<ResolutionRequestType>(requestType, true, out var parsed)) return parsed;
        return null;
    }

    // DTOs
    public class CreateOccurrenceDto
    {
        public string? Description { get; set; }
        public string? Address { get; set; }
        public string? ImageBase64 { get; set; }
    }

    public class CreateCommentDto
    {
        public string Text { get; set; } = string.Empty;
    }

    public class CreateResolutionRequestDto
    {
        public string? RequestType { get; set; }
        public string? ProofText { get; set; }
        public string? ProofImageBase64 { get; set; }
    }

    public class VoteResolutionRequestDto
    {
        public bool Confirmed { get; set; }
    }
}
