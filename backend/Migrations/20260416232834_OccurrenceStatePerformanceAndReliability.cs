using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace your_street_server.Migrations
{
    /// <inheritdoc />
    public partial class OccurrenceStatePerformanceAndReliability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastInteractionAt",
                table: "Occurrences",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");

            migrationBuilder.AddColumn<DateTime>(
                name: "NextPromptAt",
                table: "OccurrenceResolutionPromptStates",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Occurrences"
                SET "LastInteractionAt" = "CreatedAt"
                WHERE "LastInteractionAt" IS NULL
                   OR "LastInteractionAt" <= TIMESTAMPTZ '0001-01-01 00:00:00+00';
            """);

            migrationBuilder.Sql("""
                UPDATE "OccurrenceResolutionPromptStates" p
                SET "NextPromptAt" = CASE
                    WHEN p."LastDayPrompted" < 7 THEN o."CreatedAt" + INTERVAL '7 days'
                    WHEN p."LastDayPrompted" < 15 THEN o."CreatedAt" + INTERVAL '15 days'
                    WHEN p."LastDayPrompted" < 30 THEN o."CreatedAt" + INTERVAL '30 days'
                    ELSE NULL
                END
                FROM "Occurrences" o
                WHERE o."Id" = p."OccurrenceId"
                  AND p."NextPromptAt" IS NULL;
            """);

            migrationBuilder.CreateIndex(
                name: "IX_Occurrences_LastInteractionAt",
                table: "Occurrences",
                column: "LastInteractionAt");

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceResolutionPromptStates_NextPromptAt",
                table: "OccurrenceResolutionPromptStates",
                column: "NextPromptAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Occurrences_LastInteractionAt",
                table: "Occurrences");

            migrationBuilder.DropIndex(
                name: "IX_OccurrenceResolutionPromptStates_NextPromptAt",
                table: "OccurrenceResolutionPromptStates");

            migrationBuilder.DropColumn(
                name: "LastInteractionAt",
                table: "Occurrences");

            migrationBuilder.DropColumn(
                name: "NextPromptAt",
                table: "OccurrenceResolutionPromptStates");
        }
    }
}
