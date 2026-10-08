using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModuleLessonStatusAndDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "level",
                schema: "public",
                table: "modules",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.AddColumn<short>(
                name: "status",
                schema: "public",
                table: "modules",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.AddColumn<string>(
                name: "description",
                schema: "public",
                table: "lessons",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "duration_minutes",
                schema: "public",
                table: "lessons",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.AddColumn<short>(
                name: "status",
                schema: "public",
                table: "lessons",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            // Existing modules and lessons are already live for students,
            // so mark them as Published (1) instead of the Draft (0) default.
            migrationBuilder.Sql("UPDATE public.modules SET status = 1;");
            migrationBuilder.Sql("UPDATE public.lessons SET status = 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "level",
                schema: "public",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "public",
                table: "modules");

            migrationBuilder.DropColumn(
                name: "description",
                schema: "public",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "duration_minutes",
                schema: "public",
                table: "lessons");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "public",
                table: "lessons");
        }
    }
}