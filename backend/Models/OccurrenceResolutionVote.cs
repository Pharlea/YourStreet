namespace your_street_server.Models;

public class OccurrenceResolutionVote
{
    public int Id { get; set; }

    public int ResolutionRequestId { get; set; }
    public OccurrenceResolutionRequest? ResolutionRequest { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public bool Confirmed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
