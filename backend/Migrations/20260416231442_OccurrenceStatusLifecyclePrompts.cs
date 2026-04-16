using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace your_street_server.Migrations
{
    /// <inheritdoc />
    public partial class OccurrenceStatusLifecyclePrompts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Occurrences",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Occurrences",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Occurrences",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "StatusChangedAt",
                table: "Occurrences",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "OccurrenceLikes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "OccurrenceFavorites",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "OccurrenceResolutionPromptStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OccurrenceId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    HasNearbyPrompted = table.Column<bool>(type: "boolean", nullable: false),
                    LastDayPrompted = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OccurrenceResolutionPromptStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionPromptStates_Occurrences_OccurrenceId",
                        column: x => x.OccurrenceId,
                        principalTable: "Occurrences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionPromptStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OccurrenceResolutionVotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OccurrenceId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    IsSolved = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OccurrenceResolutionVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionVotes_Occurrences_OccurrenceId",
                        column: x => x.OccurrenceId,
                        principalTable: "Occurrences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionVotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Occurrences_Status",
                table: "Occurrences",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionPromptStates_OccurrenceId_UserId",
                table: "OccurrenceResolutionPromptStates",
                columns: new[] { "OccurrenceId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionPromptStates_UserId",
                table: "OccurrenceResolutionPromptStates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionVotes_OccurrenceId_UserId",
                table: "OccurrenceResolutionVotes",
                columns: new[] { "OccurrenceId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionVotes_UserId",
                table: "OccurrenceResolutionVotes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OccurrenceResolutionPromptStates");

            migrationBuilder.DropTable(
                name: "OccurrenceResolutionVotes");

            migrationBuilder.DropIndex(
                name: "IX_Occurrences_Status",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "StatusChangedAt",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "OccurrenceLikes");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "OccurrenceFavorites");
        }
    }
}
