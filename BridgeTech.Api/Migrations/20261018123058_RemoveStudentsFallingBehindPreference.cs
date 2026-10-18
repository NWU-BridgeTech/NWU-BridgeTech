using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStudentsFallingBehindPreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "notify_students_falling_behind",
                schema: "public",
                table: "user_preferences");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "notify_students_falling_behind",
                schema: "public",
                table: "user_preferences",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }
    }
}
