using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseCompletions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
                name: "exercise_completions",
                schema: "public",
                columns: table => new
                {
                    completion_id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    exercise_id = table.Column<Guid>(type: "uuid", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_exercise_completions", x => x.completion_id);
                    table.ForeignKey(
                        name: "fk_exercise_completions_exercises_exercise_id",
                        column: x => x.exercise_id,
                        principalSchema: "public",
                        principalTable: "exercises",
                        principalColumn: "exercise_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_exercise_completions_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_exercise_completions_exercise_id",
                schema: "public",
                table: "exercise_completions",
                column: "exercise_id");

            migrationBuilder.CreateIndex(
                name: "ix_exercise_completions_user_id_exercise_id",
                schema: "public",
                table: "exercise_completions",
                columns: new[] { "user_id", "exercise_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
{
            migrationBuilder.DropTable(
            name: "exercise_completions",
            schema: "public");
}
    }
}
