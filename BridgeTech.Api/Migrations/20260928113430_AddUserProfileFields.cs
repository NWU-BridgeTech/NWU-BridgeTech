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

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
