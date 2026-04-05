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

    // data de criação
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // imagem em base64
    public string? ImageBase64 { get; set; }

    public ICollection<OccurrenceLike> Likes { get; set; } = new List<OccurrenceLike>();
    public ICollection<OccurrenceFavorite> Favorites { get; set; } = new List<OccurrenceFavorite>();
    public ICollection<OccurrenceComment> Comments { get; set; } = new List<OccurrenceComment>();
}
