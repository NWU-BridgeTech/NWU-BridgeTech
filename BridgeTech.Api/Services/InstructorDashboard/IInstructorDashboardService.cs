using BridgeTech.Api.DTOs.InstructorDashboard;

namespace BridgeTech.Api.Services.InstructorDashboard;

public interface IInstructorDashboardService
{
    Task<InstructorDashboardResponse> GetDashboardAsync(
        Guid instructorId,
        CancellationToken cancellationToken = default);
}
