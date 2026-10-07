using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConceptBadges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "lesson_id",
                schema: "public",
                table: "quizzes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "badges",
                schema: "public",
                columns: table => new
                {
                    badge_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    lesson_id = table.Column<Guid>(type: "uuid", nullable: false),
                    awarded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_badges", x => x.badge_id);
                    table.ForeignKey(
                        name: "fk_badges_lessons_lesson_id",
                        column: x => x.lesson_id,
                        principalSchema: "public",
                        principalTable: "lessons",
                        principalColumn: "lesson_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_badges_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_quizzes_lesson_id",
                schema: "public",
                table: "quizzes",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "ix_badges_lesson_id",
                schema: "public",
                table: "badges",
                column: "lesson_id");

            migrationBuilder.CreateIndex(
                name: "ix_badges_user_id",
                schema: "public",
                table: "badges",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_badges_user_id_lesson_id",
                schema: "public",
                table: "badges",
                columns: new[] { "user_id", "lesson_id" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_quizzes_lessons_lesson_id",
                schema: "public",
                table: "quizzes",
                column: "lesson_id",
                principalSchema: "public",
                principalTable: "lessons",
                principalColumn: "lesson_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_quizzes_lessons_lesson_id",
                schema: "public",
                table: "quizzes");

            migrationBuilder.DropTable(
                name: "badges",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "ix_quizzes_lesson_id",
                schema: "public",
                table: "quizzes");

            migrationBuilder.DropColumn(
                name: "lesson_id",
                schema: "public",
                table: "quizzes");
        }
    }
}
