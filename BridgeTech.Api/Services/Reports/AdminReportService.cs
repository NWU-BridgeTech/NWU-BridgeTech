
using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Reports;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace BridgeTech.Api.Services.Reports;

public sealed class AdminReportService(AppDbContext db)
    : IAdminReportService
{
    // Helpers for building report responses.
    private static ReportMetricDto Metric(
        string label,
        object value)
    {
        return new ReportMetricDto
        {
            Label = label,
            Value = Convert.ToString(
                value,
                CultureInfo.InvariantCulture
            ) ?? string.Empty
        };
    }

    private static ReportColumnDto Col(
        string key,
        string label)
    {
        return new ReportColumnDto
        {
            Key = key,
            Label = label
        };
    }

    private static Dictionary<string, string> Row(
        params (string Key, string Value)[] values)
    {
        return values.ToDictionary(
            x => x.Key,
            x => x.Value
        );
    }

    private static string FormatNumber(double value)
    {
        return value.ToString(
            "0.0",
            CultureInfo.InvariantCulture
        );
    }

    // ==================================================
    // REPORT 1: COURSE APPLICATIONS
    // ==================================================

    public async Task<AdminReportResponse>
        GetCourseApplicationsAsync(
            CancellationToken ct = default)
    {
        // Count current student enrollments per module.
        var modules = await db.Modules
            .AsNoTracking()
            .Select(m => new
            {
                m.ModuleId,
                m.Title,
                Count = m.Enrollments.Count(e =>
                    e.User.Role == UserRole.Student)
            })
            .OrderByDescending(m => m.Count)
            .ThenBy(m => m.Title)
            .ToListAsync(ct);

        int total = modules.Sum(m => m.Count);

        var response = new AdminReportResponse
        {
            Title = "Course Applications",

            Description =
                "Current student enrollments by module. " +
                "Deregistered enrollments are not included.",

            ChartTitle = "Enrollments per module",
            ChartUnit = "Enrollments",
            ChartType = "bar",

            Metrics =
            [
                Metric("Total enrollments", total),

                Metric("Modules", modules.Count),

                Metric(
                    "Most popular module",
                    modules.FirstOrDefault()?.Title ?? "None"
                )
            ],

            Columns =
            [
                Col("module", "Module"),
                Col("enrollments", "Enrollments"),
                Col("share", "Share")
            ]
        };

        foreach (var module in modules)
        {
            double percentage = total == 0
                ? 0
                : module.Count * 100.0 / total;

            response.Rows.Add(
                Row(
                    ("module", module.Title),
                    ("enrollments", module.Count.ToString()),
                    ("share", FormatNumber(percentage) + "%")
                )
            );

            response.Chart.Add(new ReportChartPointDto
            {
                Label = module.Title,
                Value = module.Count
            });
        }

        return response;
    }

    // ==================================================
    // REPORT 2: QUIZ PASS RATES
    // ==================================================

    public async Task<AdminReportResponse>
        GetQuizPassRatesAsync(
            CancellationToken ct = default)
    {
        // Retrieve all modules.
        var modules = await db.Modules
            .AsNoTracking()
            .OrderBy(m => m.Title)
            .Select(m => new
            {
                m.ModuleId,
                m.Title
            })
            .ToListAsync(ct);

        // Retrieve completed quiz attempts by students.
        var attempts = await db.QuizAttempts
            .AsNoTracking()
            .Where(a =>
                a.CompletedAt != null &&
                a.Passed != null &&
                a.User.Role == UserRole.Student
            )
            .Select(a => new
            {
                a.AttemptId,
                a.UserId,
                a.QuizId,
                a.Quiz.ModuleId,
                a.Passed,
                a.CompletedAt
            })
            .ToListAsync(ct);

        // Each student counts once per quiz.
        // If a student retook a quiz, use the latest result.
        var latestAttempts = attempts
            .GroupBy(a => new
            {
                a.UserId,
                a.QuizId
            })
            .Select(group =>
                group
                    .OrderByDescending(a => a.CompletedAt)
                    .ThenByDescending(a => a.AttemptId)
                    .First()
            )
            .ToList();

        var results = modules
            .Select(module =>
            {
                var moduleAttempts = latestAttempts
                    .Where(a =>
                        a.ModuleId == module.ModuleId
                    )
                    .ToList();

                int passed = moduleAttempts.Count(
                    a => a.Passed == true
                );

                int total = moduleAttempts.Count;
                int failed = total - passed;

                double? passRate = total == 0
                    ? null
                    : passed * 100.0 / total;

                return new
                {
                    module.Title,
                    Total = total,
                    Passed = passed,
                    Failed = failed,
                    PassRate = passRate
                };
            })
            .ToList();

        int totalResults = results.Sum(x => x.Total);
        int totalPassed = results.Sum(x => x.Passed);

        string overallPassRate = totalResults == 0
            ? "N/A"
            : FormatNumber(
                totalPassed * 100.0 / totalResults
            ) + "%";

        var response = new AdminReportResponse
        {
            Title = "Quiz Pass Rates",

            Description =
                "Latest completed quiz attempt per student " +
                "per quiz, grouped by module.",

            ChartTitle = "Quiz pass rate by module",
            ChartUnit = "%",
            ChartType = "bar",

            Metrics =
            [
                Metric("Overall pass rate", overallPassRate),

                Metric(
                    "Completed student-quiz results",
                    totalResults
                ),

                Metric(
                    "Modules with results",
                    results.Count(x => x.Total > 0)
                )
            ],

            Columns =
            [
                Col("module", "Module"),
                Col("attempts", "Assessed results"),
                Col("passed", "Passed"),
                Col("failed", "Failed"),
                Col("rate", "Pass rate")
            ]
        };

        foreach (var result in results)
        {
            response.Rows.Add(
                Row(
                    ("module", result.Title),

                    ("attempts", result.Total.ToString()),

                    ("passed", result.Passed.ToString()),

                    ("failed", result.Failed.ToString()),

                    (
                        "rate",
                        result.PassRate.HasValue
                            ? FormatNumber(result.PassRate.Value) + "%"
                            : "N/A"
                    )
                )
            );

            if (result.PassRate.HasValue)
            {
                response.Chart.Add(
                    new ReportChartPointDto
                    {
                        Label = result.Title,

                        Value = Math.Round(
                            result.PassRate.Value,
                            1
                        )
                    }
                );
            }
        }

        return response;
    }

    // ==================================================
    // REPORT 3: REGISTERED USERS
    // ==================================================

    
public async Task<AdminReportResponse> GetRegisteredUsersAsync(
    CancellationToken ct = default)
{
    // Only retrieve users with the Student role.
    var students = await db.Users
        .AsNoTracking()
        .Where(u => u.Role == UserRole.Student)
        .OrderByDescending(u => u.CreatedAt)
        .Select(u => new
        {
            u.FirstName,
            u.LastName,
            u.Email,
            u.Role,
            u.CreatedAt,
            u.IsActive
        })
        .ToListAsync(ct);

    // Display student registrations for the last 12 months.
    var now = DateTimeOffset.UtcNow;

    var startMonth = new DateTimeOffset(
        now.Year,
        now.Month,
        1,
        0,
        0,
        0,
        TimeSpan.Zero
    ).AddMonths(-11);

    var response = new AdminReportResponse
    {
        Title = "Registered Students",

        Description =
            "Registered student accounts and monthly " +
            "student registration trends (UTC).",

        ChartTitle = "New student registrations by month",
        ChartUnit = "Students",
        ChartType = "line",

        Metrics =
        [
            Metric("Total students", students.Count),

            Metric(
                "Active students",
                students.Count(u => u.IsActive)
            ),

            Metric(
                "Inactive students",
                students.Count(u => !u.IsActive)
            )
        ],

        Columns =
        [
            Col("name", "Name"),
            Col("email", "Email"),
            Col("registered", "Registered (UTC)"),
            Col("status", "Status")
        ]
    };

    // Add each student to the report table.
    foreach (var student in students)
    {
        response.Rows.Add(
            Row(
                (
                    "name",
                    $"{student.FirstName} {student.LastName}".Trim()
                ),

                ("email", student.Email),

                (
                    "registered",
                    student.CreatedAt.ToString(
                        "yyyy-MM-dd",
                        CultureInfo.InvariantCulture
                    )
                ),

                (
                    "status",
                    student.IsActive ? "Active" : "Inactive"
                )
            )
        );
    }

    // Calculate monthly student registration counts.
    for (int i = 0; i < 12; i++)
    {
        var month = startMonth.AddMonths(i);
        var nextMonth = month.AddMonths(1);

        int registrations = students.Count(u =>
            u.CreatedAt >= month &&
            u.CreatedAt < nextMonth
        );

        response.Chart.Add(
            new ReportChartPointDto
            {
                Label = month.ToString(
                    "MMM yyyy",
                    CultureInfo.InvariantCulture
                ),

                Value = registrations
            }
        );
    }

    return response;
}


    // ==================================================
    // REPORT 4: MODULE COMPLETION TIMES
    // ==================================================

    public async Task<AdminReportResponse>
        GetCompletionTimesAsync(
            CancellationToken ct = default)
    {
        var modules = await db.Modules
            .AsNoTracking()
            .OrderBy(m => m.Title)
            .Select(m => new
            {
                m.ModuleId,
                m.Title
            })
            .ToListAsync(ct);

        // Only include completed student enrollments
        // with valid dates.
        var completedEnrollments = await db.Enrollments
            .AsNoTracking()
            .Where(e =>
                e.Status == EnrollmentStatus.Completed &&
                e.CompletedAt != null &&
                e.CompletedAt >= e.EnrolledAt &&
                e.User.Role == UserRole.Student
            )
            .Select(e => new
            {
                e.ModuleId,
                e.EnrolledAt,
                e.CompletedAt
            })
            .ToListAsync(ct);

        var results = modules
            .Select(module =>
            {
                var durations = completedEnrollments
                    .Where(e =>
                        e.ModuleId == module.ModuleId
                    )
                    .Select(e =>
                        (
                            e.CompletedAt!.Value -
                            e.EnrolledAt
                        ).TotalDays
                    )
                    .ToList();

                return new
                {
                    module.Title,

                    Count = durations.Count,

                    Average = durations.Count == 0
                        ? (double?)null
                        : durations.Average(),

                    Fastest = durations.Count == 0
                        ? (double?)null
                        : durations.Min(),

                    Slowest = durations.Count == 0
                        ? (double?)null
                        : durations.Max()
                };
            })
            .ToList();

        var allDurations = completedEnrollments
            .Select(e =>
                (
                    e.CompletedAt!.Value -
                    e.EnrolledAt
                ).TotalDays
            )
            .ToList();

        var response = new AdminReportResponse
        {
            Title = "Module Completion Times",

            Description =
                "Calendar days from module enrollment " +
                "to completion, for completed student enrollments.",

            ChartTitle = "Average completion days per module",
            ChartUnit = "Days",
            ChartType = "bar",

            Metrics =
            [
                Metric(
                    "Completed enrollments",
                    allDurations.Count
                ),

                Metric(
                    "Overall average",
                    allDurations.Count == 0
                        ? "N/A"
                        : FormatNumber(allDurations.Average()) + " days"
                ),

                Metric(
                    "Modules with completions",
                    results.Count(x => x.Count > 0)
                )
            ],

            Columns =
            [
                Col("module", "Module"),
                Col("completed", "Completions"),
                Col("average", "Average days"),
                Col("fastest", "Fastest days"),
                Col("slowest", "Slowest days")
            ]
        };

        foreach (var result in results)
        {
            response.Rows.Add(
                Row(
                    ("module", result.Title),

                    ("completed", result.Count.ToString()),

                    (
                        "average",
                        result.Average.HasValue
                            ? FormatNumber(result.Average.Value)
                            : "N/A"
                    ),

                    (
                        "fastest",
                        result.Fastest.HasValue
                            ? FormatNumber(result.Fastest.Value)
                            : "N/A"
                    ),

                    (
                        "slowest",
                        result.Slowest.HasValue
                            ? FormatNumber(result.Slowest.Value)
                            : "N/A"
                    )
                )
            );

            if (result.Average.HasValue)
            {
                response.Chart.Add(
                    new ReportChartPointDto
                    {
                        Label = result.Title,

                        Value = Math.Round(
                            result.Average.Value,
                            1
                        )
                    }
                );
            }
        }

        return response;
    }
}
