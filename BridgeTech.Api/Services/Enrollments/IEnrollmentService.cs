using BridgeTech.Api.DTOs.Enrollments;

namespace BridgeTech.Api.Services.Enrollments;

public interface IEnrollmentService
{
    Task<IEnumerable<EnrollmentResponse>> GetMyEnrollmentsAsync(
        Guid userId, CancellationToken cancellationToken);

    Task<EnrollmentResponse> EnrollAsync(
        Guid userId, Guid moduleId, CancellationToken cancellationToken);
}