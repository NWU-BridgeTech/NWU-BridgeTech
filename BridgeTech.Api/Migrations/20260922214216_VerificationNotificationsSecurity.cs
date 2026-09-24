using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class VerificationNotificationsSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "email_verified",
                schema: "public",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_code_sent_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "password_reset_attempts",
                schema: "public",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "password_reset_code",
                schema: "public",
                table: "users",
                type: "character varying(6)",
                maxLength: 6,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "password_reset_code_expires_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "password_reset_last_sent_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "verification_attempts",
                schema: "public",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "verification_code",
                schema: "public",
                table: "users",
                type: "character varying(6)",
                maxLength: 6,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "verification_code_expires_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "notifications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    message = table.Column<string>(type: "text", nullable: true),
                    related_entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_notifications", x => x.id);
                    table.ForeignKey(
                        name: "fk_notifications_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_notifications_user_unread",
                schema: "public",
                table: "notifications",
                columns: new[] { "user_id", "is_read" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notifications",
                schema: "public");

            migrationBuilder.DropColumn(
                name: "email_verified",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "last_code_sent_at",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_attempts",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_code",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_code_expires_at",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "password_reset_last_sent_at",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "verification_attempts",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "verification_code",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "verification_code_expires_at",
                schema: "public",
                table: "users");
        }
    }
}
