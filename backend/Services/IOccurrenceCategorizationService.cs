namespace your_street_server.Services;

public interface IOccurrenceCategorizationService
{
    Task<string> CategorizeAsync(string description);
}
