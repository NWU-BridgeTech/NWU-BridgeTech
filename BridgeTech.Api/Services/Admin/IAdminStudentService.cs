using BridgeTech.Api.DTOs.Admin;

namespace BridgeTech.Api.Services.Admin;

public interface IAdminStudentService
{
    Task<StudentListResponse> ListAsync(StudentListQuery query, CancellationToken cancellationToken);
    Task<StudentDetailResponse> GetAsync(Guid studentId, CancellationToken cancellationToken);
}
