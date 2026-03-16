using System.ComponentModel.DataAnnotations;

namespace your_street_server.Models;

public class OccurrenceComment
{
    public int Id { get; set; }

    public int OccurrenceId { get; set; }
    public Occurrence? Occurrence { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
