namespace your_street_server.Models;

public class OccurrenceResolutionPromptState
{
    public int Id { get; set; }

    public int OccurrenceId { get; set; }
    public Occurrence? Occurrence { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public bool HasNearbyPrompted { get; set; }

    public int LastDayPrompted { get; set; }

    public DateTime? NextPromptAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
