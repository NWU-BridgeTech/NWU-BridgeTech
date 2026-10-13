
using BridgeTech.Api.DTOs.Reports;

namespace BridgeTech.Api.Services.Reports;

public interface IAdminReportService
{
    // Modules ranked by student registrations
    Task<AdminReportResponse> GetCourseApplicationsAsync(
        CancellationToken ct = default);

    // Quiz pass percentages for each module
    Task<AdminReportResponse> GetQuizPassRatesAsync(
        CancellationToken ct = default);

    // Registered users and monthly registration trends
    Task<AdminReportResponse> GetRegisteredUsersAsync(
        CancellationToken ct = default);

    // Average module completion times
    Task<AdminReportResponse> GetCompletionTimesAsync(
        CancellationToken ct = default);
}
