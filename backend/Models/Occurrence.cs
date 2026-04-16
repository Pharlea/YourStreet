using System.ComponentModel.DataAnnotations;

namespace your_street_server.Models;

public class Occurrence
{
    public int Id { get; set; }

    // vinculada ao usuário que criou a ocorrência
    public int UserId { get; set; }
    public User? User { get; set; }

    // tipo inferido automaticamente a partir da descricao da ocorrencia
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    // data de criação
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // última interação relevante para regras de inatividade
    public DateTime LastInteractionAt { get; set; } = DateTime.UtcNow;

    // imagem em base64
    public string? ImageBase64 { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = OccurrenceStatuses.Pending;

    public DateTime? StatusChangedAt { get; set; }

    public ICollection<OccurrenceLike> Likes { get; set; } = new List<OccurrenceLike>();
    public ICollection<OccurrenceFavorite> Favorites { get; set; } = new List<OccurrenceFavorite>();
    public ICollection<OccurrenceComment> Comments { get; set; } = new List<OccurrenceComment>();
    public ICollection<OccurrenceResolutionVote> ResolutionVotes { get; set; } = new List<OccurrenceResolutionVote>();
    public ICollection<OccurrenceResolutionPromptState> ResolutionPromptStates { get; set; } = new List<OccurrenceResolutionPromptState>();
}

public static class OccurrenceStatuses
{
    public const string Pending = "pending";
    public const string Resolved = "resolved";
    public const string Deleted = "deleted";
}
