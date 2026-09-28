using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "address",
                schema: "public",
                table: "users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                schema: "public",
                table: "users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "university",
                schema: "public",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "account_setup_required",
                schema: "public",
                table: "pending_registrations",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.CreateTable(
                name: "lesson_progress",
                schema: "public",
                columns: table => new
                {
                    progress_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: false),
                    completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lesson_progress", x => x.progress_id);
                    table.ForeignKey(
                        name: "fk_lesson_progress_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "public",
                        principalTable: "lessons",
                        principalColumn: "lesson_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_lesson_progress_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_lesson_progress_lesson_id",
                schema: "public",
                table: "lesson_progress",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "ix_lesson_progress_user_id_lesson_id",
                schema: "public",
                table: "lesson_progress",
                columns: new[] { "user_id", "lesson_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lesson_progress",
                schema: "public");

            migrationBuilder.DropColumn(
                name: "address",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "phone_number",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "university",
                schema: "public",
                table: "users");

            migrationBuilder.AlterColumn<bool>(
                name: "account_setup_required",
                schema: "public",
                table: "pending_registrations",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");
        }
    }
}
