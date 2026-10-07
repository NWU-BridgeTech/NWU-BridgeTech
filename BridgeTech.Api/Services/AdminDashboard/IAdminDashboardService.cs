using BridgeTech.Api.DTOs.Admin;

namespace BridgeTech.Api.Services.AdminDashboard;

public interface IAdminDashboardService
{
    Task<AdminDashboardResponse> GetDashboardAsync(CancellationToken cancellationToken = default);
}