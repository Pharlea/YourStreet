using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using your_street_server.Data;
using your_street_server.Models;

namespace your_street_server.Services;

public class OccurrenceLifecycleService : IOccurrenceLifecycleService
{
    private static readonly TimeSpan ResolveEligibilityAge = TimeSpan.FromHours(2);
    private static readonly TimeSpan DeletionByInactivityAge = TimeSpan.FromDays(30);

    private readonly AppDbContext _context;
    private readonly IOptionsMonitor<OccurrenceStateOptions> _options;

    public OccurrenceLifecycleService(AppDbContext context, IOptionsMonitor<OccurrenceStateOptions> options)
    {
        _context = context;
        _options = options;
    }

    public async Task RecalculateStatusesAsync(DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var minVotes = Math.Max(1, _options.CurrentValue.ResolutionMinVotes);

        var occurrences = await _context.Occurrences
            .Where(o => o.Status == OccurrenceStatuses.Pending)
            .Include(o => o.ResolutionVotes)
            .ToListAsync();

        var hasChanges = false;

        foreach (var occurrence in occurrences)
        {
            if (now - occurrence.LastInteractionAt > DeletionByInactivityAge)
            {
                occurrence.Status = OccurrenceStatuses.Deleted;
                occurrence.StatusChangedAt = now;
                hasChanges = true;
                continue;
            }

            if (now - occurrence.CreatedAt < ResolveEligibilityAge)
            {
                continue;
            }

            var solvedCount = occurrence.ResolutionVotes.Count(v => v.IsSolved);
            var notSolvedCount = occurrence.ResolutionVotes.Count(v => !v.IsSolved);
            var totalVotes = solvedCount + notSolvedCount;
            if (totalVotes >= minVotes && solvedCount > notSolvedCount)
            {
                occurrence.Status = OccurrenceStatuses.Resolved;
                occurrence.StatusChangedAt = now;
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }
    }

    public async Task RecalculateOccurrenceStatusAsync(int occurrenceId, DateTime? utcNow = null)
    {
        var now = utcNow ?? DateTime.UtcNow;
        var minVotes = Math.Max(1, _options.CurrentValue.ResolutionMinVotes);

        var occurrence = await _context.Occurrences
            .Include(o => o.ResolutionVotes)
            .FirstOrDefaultAsync(o => o.Id == occurrenceId && o.Status == OccurrenceStatuses.Pending);

        if (occurrence == null)
        {
            return;
        }

        var hasChanges = false;

        if (now - occurrence.LastInteractionAt > DeletionByInactivityAge)
        {
            occurrence.Status = OccurrenceStatuses.Deleted;
            occurrence.StatusChangedAt = now;
            hasChanges = true;
        }
        else if (now - occurrence.CreatedAt >= ResolveEligibilityAge)
        {
            var solvedCount = occurrence.ResolutionVotes.Count(v => v.IsSolved);
            var notSolvedCount = occurrence.ResolutionVotes.Count(v => !v.IsSolved);
            var totalVotes = solvedCount + notSolvedCount;
            if (totalVotes >= minVotes && solvedCount > notSolvedCount)
            {
                occurrence.Status = OccurrenceStatuses.Resolved;
                occurrence.StatusChangedAt = now;
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }
    }
}
