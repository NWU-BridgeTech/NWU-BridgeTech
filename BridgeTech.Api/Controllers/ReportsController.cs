
using BridgeTech.Api.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,SuperAdmin")]
[Route("api/admin/reports/analytics")]
public sealed class ReportsController(
    IAdminReportService service
) : ControllerBase
{
    [HttpGet("course-applications")]
    public async Task<IActionResult> CourseApplications(
        CancellationToken ct)
    {
        var report = await service.GetCourseApplicationsAsync(ct);
        return Ok(report);
    }

    [HttpGet("quiz-pass-rates")]
    public async Task<IActionResult> QuizPassRates(
        CancellationToken ct)
    {
        var report = await service.GetQuizPassRatesAsync(ct);
        return Ok(report);
    }

    [HttpGet("registered-users")]
    public async Task<IActionResult> RegisteredUsers(
        CancellationToken ct)
    {
        var report = await service.GetRegisteredUsersAsync(ct);
        return Ok(report);
    }

    [HttpGet("completion-times")]
    public async Task<IActionResult> CompletionTimes(
        CancellationToken ct)
    {
        var report = await service.GetCompletionTimesAsync(ct);
        return Ok(report);
    }
}
