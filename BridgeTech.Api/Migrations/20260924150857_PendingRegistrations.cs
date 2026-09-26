using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class PendingRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pending_registrations",
                schema: "public",
                columns: table => new
                {
                    pending_registration_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    first_name = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    last_name = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    github_username = table.Column<string>(type: "character varying(39)", maxLength: 39, nullable: true),
                    verification_code = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    verification_code_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    verification_attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_code_sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pending_registrations", x => x.pending_registration_id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_pending_registrations_email",
                schema: "public",
                table: "pending_registrations",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pending_registrations_username",
                schema: "public",
                table: "pending_registrations",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pending_registrations_verification_code_expires_at",
                schema: "public",
                table: "pending_registrations",
                column: "verification_code_expires_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pending_registrations",
                schema: "public");
        }
    }
}
