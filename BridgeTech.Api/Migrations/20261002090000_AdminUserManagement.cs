using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdminUserManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing accounts stay active; the default only back-fills current rows.
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "public",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_login_at",
                schema: "public",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_active",
                schema: "public",
                table: "users");

            migrationBuilder.DropColumn(
                name: "last_login_at",
                schema: "public",
                table: "users");
        }
    }
}
