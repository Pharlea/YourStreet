using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace your_street_server.Migrations
{
    public partial class AddResolutionTracking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Occurrences",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "Occurrences",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastActivityAt",
                table: "Occurrences",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW() at time zone 'utc'");

            migrationBuilder.AddColumn<int>(
                name: "ReopenCount",
                table: "Occurrences",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "OccurrenceResolutionRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OccurrenceId = table.Column<int>(type: "integer", nullable: false),
                    RequestedByUserId = table.Column<int>(type: "integer", nullable: false),
                    RequestType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ProofText = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ProofImageBase64 = table.Column<string>(type: "text", nullable: true),
                    RequestedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastInteractionAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OccurrenceResolutionRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionRequests_Occurrences_OccurrenceId",
                        column: x => x.OccurrenceId,
                        principalTable: "Occurrences",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionRequests_Users_RequestedByUserId",
                        column: x => x.RequestedByUserId,
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
                    ResolutionRequestId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OccurrenceResolutionVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OccurrenceResolutionVotes_OccurrenceResolutionRequests_ResolutionRequestId",
                        column: x => x.ResolutionRequestId,
                        principalTable: "OccurrenceResolutionRequests",
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
                name: "IX_OccurrenceResolutionRequests_OccurrenceId",
                table: "OccurrenceResolutionRequests",
                column: "OccurrenceId");

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionRequests_RequestedByUserId",
                table: "OccurrenceResolutionRequests",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionVotes_ResolutionRequestId",
                table: "OccurrenceResolutionVotes",
                column: "ResolutionRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionVotes_ResolutionRequestId_UserId",
                table: "OccurrenceResolutionVotes",
                columns: new[] { "ResolutionRequestId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionVotes_UserId",
                table: "OccurrenceResolutionVotes",
                column: "UserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OccurrenceResolutionVotes");

            migrationBuilder.DropTable(
                name: "OccurrenceResolutionRequests");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "LastActivityAt",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "ReopenCount",
                table: "Occurrences");
        }
    }
}
