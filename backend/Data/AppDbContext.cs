using Microsoft.EntityFrameworkCore;
using your_street_server.Models;

namespace your_street_server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

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
    }
}