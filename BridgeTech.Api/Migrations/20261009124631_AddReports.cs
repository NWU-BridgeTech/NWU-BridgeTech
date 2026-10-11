using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "reports",
                schema: "public",
                columns: table => new
                {
                    report_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    generated_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    row_count = table.Column<int>(type: "integer", nullable: false),
                    data_json = table.Column<string>(type: "jsonb", nullable: false),
                    generated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reports", x => x.report_id);
                    table.ForeignKey(
                        name: "fk_reports_users_generated_by_user_id",
                        column: x => x.generated_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_reports_generated_at",
                schema: "public",
                table: "reports",
                column: "generated_at");

            migrationBuilder.CreateIndex(
                name: "ix_reports_generated_by_user_id",
                schema: "public",
                table: "reports",
                column: "generated_by_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reports",
                schema: "public");
        }
    }
}
