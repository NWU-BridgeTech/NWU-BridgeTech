using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BridgeTech.Api.Migrations
{
    /// <inheritdoc />
    public partial class CertificateSecurityAndMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "certificate_number",
                schema: "public",
                table: "certificates",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "status",
                schema: "public",
                table: "certificates",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Valid");

            migrationBuilder.CreateIndex(
                name: "ix_certificates_certificate_number",
                schema: "public",
                table: "certificates",
                column: "certificate_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_certificates_certificate_number",
                schema: "public",
                table: "certificates");

            migrationBuilder.DropColumn(
                name: "certificate_number",
                schema: "public",
                table: "certificates");

            migrationBuilder.DropColumn(
                name: "status",
                schema: "public",
                table: "certificates");
        }
    }
}
