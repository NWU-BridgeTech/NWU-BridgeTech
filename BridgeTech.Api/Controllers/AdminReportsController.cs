using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "Admin,SuperAdmin")]
public sealed class AdminReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet("overview.csv")]
    public async Task<IActionResult> DownloadOverviewReport(CancellationToken cancellationToken)
    {
        var counts = new[]
        {
            new OverviewRow("Total users", await db.Users.CountAsync(cancellationToken)),
            new OverviewRow("Students", await db.Users.CountAsync(user => user.Role == UserRole.Student, cancellationToken)),
            new OverviewRow("Instructors", await db.Users.CountAsync(user => user.Role == UserRole.Instructor, cancellationToken)),
            new OverviewRow("Administrators", await db.Users.CountAsync(user => user.Role == UserRole.Admin, cancellationToken)),
            new OverviewRow("Super administrators", await db.Users.CountAsync(user => user.Role == UserRole.SuperAdmin, cancellationToken)),
            new OverviewRow("Modules", await db.Modules.CountAsync(cancellationToken)),
            new OverviewRow("Lessons", await db.Lessons.CountAsync(cancellationToken)),
            new OverviewRow("Quizzes", await db.Quizzes.CountAsync(cancellationToken)),
            new OverviewRow("Enrollments", await db.Enrollments.CountAsync(cancellationToken)),
            new OverviewRow("Completed quiz attempts", await db.QuizAttempts.CountAsync(attempt => attempt.CompletedAt != null, cancellationToken))
        };

        var reportId = Guid.NewGuid();
        var generatedAt = DateTimeOffset.UtcNow;
        db.Reports.Add(new Report
        {
            ReportId = reportId,
            GeneratedByUserId = GetUserId(),
            ReportType = "overview",
            RowCount = counts.Length,
            DataJson = JsonSerializer.Serialize(counts),
            GeneratedAt = generatedAt
        });
        await db.SaveChangesAsync(cancellationToken);

        var csv = new StringBuilder().AppendLine("Metric,Value");
        foreach (var row in counts)
        {
            csv.AppendLine($"{Csv(row.Metric)},{row.Value.ToString(CultureInfo.InvariantCulture)}");
        }

        return File(
            Encoding.UTF8.GetBytes(csv.ToString()),
            "text/csv; charset=utf-8",
            $"platform-overview-{generatedAt:yyyyMMdd-HHmmss}.csv");
    }

    [HttpGet("users.csv")]
    public async Task<IActionResult> DownloadUsersReport(CancellationToken cancellationToken)
    {
        var rows = await db.Users.AsNoTracking()
            .OrderBy(user => user.Role)
            .ThenBy(user => user.LastName)
            .ThenBy(user => user.FirstName)
            .Select(user => new UserReportRow(
                user.FirstName + " " + user.LastName,
                user.Email,
                user.Role.ToString(),
                user.IsActive ? "Active" : "Inactive",
                user.CreatedAt,
                user.LastLoginAt))
            .ToListAsync(cancellationToken);

        var reportId = Guid.NewGuid();
        var generatedAt = DateTimeOffset.UtcNow;
        var userId = GetUserId();
        db.Reports.Add(new Report
        {
            ReportId = reportId,
            GeneratedByUserId = userId,
            ReportType = "users",
            RowCount = rows.Count,
            DataJson = JsonSerializer.Serialize(rows),
            GeneratedAt = generatedAt
        });
        await db.SaveChangesAsync(cancellationToken);

        var csv = new StringBuilder()
            .AppendLine("Name,Email,Role,Status,Created At,Last Login At");
        foreach (var row in rows)
        {
            csv.AppendLine(string.Join(",",
                Csv(row.Name),
                Csv(row.Email),
                Csv(row.Role),
                Csv(row.Status),
                Csv(row.CreatedAt.ToString("O", CultureInfo.InvariantCulture)),
                Csv(row.LastLoginAt?.ToString("O", CultureInfo.InvariantCulture) ?? "")));
        }

        return File(
            Encoding.UTF8.GetBytes(csv.ToString()),
            "text/csv; charset=utf-8",
            $"users-report-{generatedAt:yyyyMMdd-HHmmss}.csv");
    }

    private Guid GetUserId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)
            ? userId
            : throw new UnauthorizedAccessException("User id claim missing or invalid.");

    private static string Csv(string value) =>
        $"\"{value.Replace("\"", "\"\"")}\"";

    private sealed record UserReportRow(
        string Name,
        string Email,
        string Role,
        string Status,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastLoginAt);

    private sealed record OverviewRow(string Metric, int Value);
}
