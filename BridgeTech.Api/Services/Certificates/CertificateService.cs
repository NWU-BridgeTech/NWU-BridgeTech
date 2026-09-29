using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Certificates;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.Certificates;

public sealed class CertificateService(AppDbContext db) : ICertificateService
{
    public async Task<CertificateResponse?> GetByIdAsync(Guid id, CancellationToken ct = default) => await db.Certificates.AsNoTracking().Where(x => x.CertificateId == id).Select(ToResponse()).SingleOrDefaultAsync(ct);
    public async Task<IReadOnlyList<CertificateListItemResponse>> GetAllAsync(CancellationToken ct = default) => await db.Certificates.AsNoTracking().OrderByDescending(x => x.IssuedAt).Select(ToList()).ToListAsync(ct);
    public async Task<IReadOnlyList<CertificateListItemResponse>> GetByUserAsync(Guid userId, CancellationToken ct = default) => await db.Certificates.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.IssuedAt).Select(ToList()).ToListAsync(ct);
    public async Task<CertificateResponse> CreateAsync(CreateCertificateRequest r, CancellationToken ct = default) { var e = new Certificate { CertificateId = Guid.NewGuid(), UserId = r.UserId, ModuleId = r.ModuleId, CertificateHash = r.CertificateHash, IssuedAt = r.IssuedAt }; db.Certificates.Add(e); await db.SaveChangesAsync(ct); return new CertificateResponse { CertificateId = e.CertificateId, UserId = e.UserId, ModuleId = e.ModuleId, CertificateHash = e.CertificateHash, IssuedAt = e.IssuedAt }; }
    private static System.Linq.Expressions.Expression<Func<Certificate, CertificateResponse>> ToResponse() => x => new CertificateResponse { CertificateId = x.CertificateId, UserId = x.UserId, ModuleId = x.ModuleId, CertificateHash = x.CertificateHash, IssuedAt = x.IssuedAt };
    private static System.Linq.Expressions.Expression<Func<Certificate, CertificateListItemResponse>> ToList() => x => new CertificateListItemResponse { CertificateId = x.CertificateId, UserId = x.UserId, ModuleId = x.ModuleId, CertificateHash = x.CertificateHash, IssuedAt = x.IssuedAt };
}
