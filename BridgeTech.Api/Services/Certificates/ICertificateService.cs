using BridgeTech.Api.DTOs.Certificates;

namespace BridgeTech.Api.Services.Certificates;

public interface ICertificateService
{
    Task<CertificateResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CertificateListItemResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CertificateListItemResponse>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CertificateResponse> CreateAsync(CreateCertificateRequest request, CancellationToken cancellationToken = default);
    Task<CertificateResponse> IssueForCompletionAsync(Guid userId, Guid moduleId, CancellationToken cancellationToken = default);
    Task<CertificateResponse?> VerifyAsync(string certificateNumber, CancellationToken cancellationToken = default);
}
