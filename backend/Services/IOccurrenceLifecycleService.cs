namespace your_street_server.Services;

public interface IOccurrenceLifecycleService
{
    Task RecalculateStatusesAsync(DateTime? utcNow = null);

    Task RecalculateOccurrenceStatusAsync(int occurrenceId, DateTime? utcNow = null);
}
