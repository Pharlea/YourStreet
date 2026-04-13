using Microsoft.EntityFrameworkCore;
using your_street_server.Models;

namespace your_street_server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Occurrence> Occurrences { get; set; }
    public DbSet<OccurrenceLike> OccurrenceLikes { get; set; }
    public DbSet<OccurrenceFavorite> OccurrenceFavorites { get; set; }
    public DbSet<OccurrenceComment> OccurrenceComments { get; set; }
    public DbSet<OccurrenceResolutionRequest> OccurrenceResolutionRequests { get; set; }
    public DbSet<OccurrenceResolutionVote> OccurrenceResolutionVotes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.GoogleId).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            
            entity.Property(u => u.GoogleId)
                .IsRequired()
                .HasMaxLength(255);
                
            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);
                
            entity.Property(u => u.Name)
                .IsRequired()
                .HasMaxLength(255);
                
            entity.Property(u => u.Picture)
                .HasMaxLength(500);
        });

        modelBuilder.Entity<Occurrence>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Type).IsRequired().HasMaxLength(50);
            entity.Property(o => o.Description).HasMaxLength(2000);
            entity.Property(o => o.Address).HasMaxLength(500);
            entity.Property(o => o.ImageBase64).HasColumnType("text");
            entity.Property(o => o.Status).IsRequired().HasMaxLength(50);
            entity.Property(o => o.CompletedAt).HasColumnType("timestamp with time zone");
            entity.Property(o => o.LastActivityAt).HasColumnType("timestamp with time zone");
            entity.HasOne(o => o.User).WithMany().HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OccurrenceLike>(entity =>
        {
            entity.HasKey(l => l.Id);
            entity.HasIndex(l => new { l.OccurrenceId, l.UserId }).IsUnique();
            entity.HasOne(l => l.Occurrence).WithMany(o => o.Likes).HasForeignKey(l => l.OccurrenceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(l => l.User).WithMany().HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OccurrenceFavorite>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.HasIndex(f => new { f.OccurrenceId, f.UserId }).IsUnique();
            entity.HasOne(f => f.Occurrence).WithMany(o => o.Favorites).HasForeignKey(f => f.OccurrenceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OccurrenceComment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Text).IsRequired().HasMaxLength(1000);
            entity.HasOne(c => c.Occurrence).WithMany(o => o.Comments).HasForeignKey(c => c.OccurrenceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OccurrenceResolutionRequest>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.ProofText).HasMaxLength(2000);
            entity.Property(r => r.ProofImageBase64).HasColumnType("text");
            entity.HasOne(r => r.Occurrence).WithMany(o => o.ResolutionRequests).HasForeignKey(r => r.OccurrenceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(r => r.RequestedByUser).WithMany().HasForeignKey(r => r.RequestedByUserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OccurrenceResolutionVote>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.HasIndex(v => new { v.ResolutionRequestId, v.UserId }).IsUnique();
            entity.HasOne(v => v.ResolutionRequest).WithMany(r => r.Votes).HasForeignKey(v => v.ResolutionRequestId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(v => v.User).WithMany().HasForeignKey(v => v.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}