using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using BridgeTech.Api.Data;

#nullable disable

namespace BridgeTech.Api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261015112845_AddInstructorNotificationPreferences")]
public partial class AddInstructorNotificationPreferences : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "notify_new_submissions",
            schema: "public",
            table: "user_preferences",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "notify_quiz_completions",
            schema: "public",
            table: "user_preferences",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "notify_students_falling_behind",
            schema: "public",
            table: "user_preferences",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "notify_platform_updates",
            schema: "public",
            table: "user_preferences",
            type: "boolean",
            nullable: false,
            defaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "notify_new_submissions",
            schema: "public",
            table: "user_preferences");

        migrationBuilder.DropColumn(
            name: "notify_quiz_completions",
            schema: "public",
            table: "user_preferences");

        migrationBuilder.DropColumn(
            name: "notify_students_falling_behind",
            schema: "public",
            table: "user_preferences");

        migrationBuilder.DropColumn(
            name: "notify_platform_updates",
            schema: "public",
            table: "user_preferences");
    }
}
