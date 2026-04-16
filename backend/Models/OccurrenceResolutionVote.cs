namespace your_street_server.Models;

public class OccurrenceResolutionVote
{
    public int Id { get; set; }

    public int OccurrenceId { get; set; }
    public Occurrence? Occurrence { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public bool IsSolved { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
