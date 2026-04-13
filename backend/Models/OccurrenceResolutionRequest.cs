using System.ComponentModel.DataAnnotations;

namespace your_street_server.Models;

public enum ResolutionRequestType
{
    Completion,
    Reopen
}

public enum ResolutionRequestStatus
{
    Pending,
    Approved,
    Rejected
}

public class OccurrenceResolutionRequest
{
    public int Id { get; set; }

    public int OccurrenceId { get; set; }
    public Occurrence? Occurrence { get; set; }

    public int RequestedByUserId { get; set; }
    public User? RequestedByUser { get; set; }

    public ResolutionRequestType RequestType { get; set; }
    public ResolutionRequestStatus Status { get; set; } = ResolutionRequestStatus.Pending;

    [MaxLength(2000)]
    public string? ProofText { get; set; }

    public string? ProofImageBase64 { get; set; }

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastInteractionAt { get; set; } = DateTime.UtcNow;

    public ICollection<OccurrenceResolutionVote> Votes { get; set; } = new List<OccurrenceResolutionVote>();
}
