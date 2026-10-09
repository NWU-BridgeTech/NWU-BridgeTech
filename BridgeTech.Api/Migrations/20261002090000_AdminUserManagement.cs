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
            migrationBuilder.Sql("""
                ALTER TABLE public.users
                ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
                ALTER TABLE public.users
                ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;
                """);
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
