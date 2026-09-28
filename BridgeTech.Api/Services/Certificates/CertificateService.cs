using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.DTOs.Certificates;
using Microsoft.EntityFrameworkCore;
using BridgeTech.Api.Services.Notifications;
using System.Security.Cryptography;
using System.Text;
using BridgeTech.Api.Services.Auth;

namespace BridgeTech.Api.Services.Certificates;

public sealed class CertificateService(
    AppDbContext db,
    INotificationService notificationService,
    IConfiguration configuration,
    ICertificateRenderer renderer,
    IEmailService emailService,
    ILogger<CertificateService> logger) : ICertificateService
{
    public async Task<CertificateResponse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        ToResponse(await Query().SingleOrDefaultAsync(x => x.CertificateId == id, ct));

    public async Task<IReadOnlyList<CertificateListItemResponse>> GetAllAsync(CancellationToken ct = default) =>
        (await Query().OrderByDescending(x => x.IssuedAt).ToListAsync(ct)).Select(ToList).ToList();

    public async Task<IReadOnlyList<CertificateListItemResponse>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        (await Query().Where(x => x.UserId == userId).OrderByDescending(x => x.IssuedAt).ToListAsync(ct)).Select(ToList).ToList();

    public async Task<CertificateResponse> IssueForCompletionAsync(Guid userId, Guid moduleId, CancellationToken ct = default)
    {
        var existing = await Query().SingleOrDefaultAsync(x => x.UserId == userId && x.ModuleId == moduleId, ct);
        if (existing is not null) return ToResponse(existing)!;

        var user = await db.Users.AsNoTracking().SingleAsync(x => x.UserId == userId, ct);
        var module = await db.Modules.AsNoTracking().SingleAsync(x => x.ModuleId == moduleId, ct);
        var issuedAt = DateTimeOffset.UtcNow;
        var certificate = new Certificate
        {
            CertificateId = Guid.NewGuid(),
            UserId = userId,
            ModuleId = moduleId,
            CertificateNumber = $"BT-{issuedAt:yyyy}-{RandomNumberGenerator.GetInt32(100000, 999999)}",
            IssuedAt = issuedAt,
            Status = "Valid"
        };
        certificate.CertificateHash = Sign(certificate, user.FirstName + " " + user.LastName, module.Title);
        db.Certificates.Add(certificate);
        await db.SaveChangesAsync(ct);
        await notificationService.NotifyAsync(userId, "certificate_issued", "Certificate issued", $"Your certificate for {module.Title} is ready.", certificate.CertificateId, ct);
        certificate.User = user;
        certificate.Module = module;
        var response = ToResponse(certificate)!;

        try
        {
            var pdf = renderer.Render(response, "pdf");
            var frontendUrl = configuration["GitHub:FrontendUrl"] ?? "http://localhost:5173";
            await emailService.SendCertificateEmailAsync(
                user.Email,
                user.FirstName,
                module.Title,
                certificate.CertificateNumber,
                $"{frontendUrl.TrimEnd('/')}/student/certificates",
                pdf,
                ct);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Certificate {CertificateNumber} was issued, but delivery email failed for {Email}.",
                certificate.CertificateNumber,
                user.Email);
        }

        return response;
    }

    public async Task<CertificateResponse?> VerifyAsync(string certificateNumber, CancellationToken ct = default)
    {
        var certificate = await Query().SingleOrDefaultAsync(x => x.CertificateNumber == certificateNumber, ct);
        if (certificate is null) return null;
        var expected = Sign(certificate, $"{certificate.User.FirstName} {certificate.User.LastName}", certificate.Module.Title);
        return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(certificate.CertificateHash))
            ? ToResponse(certificate)
            : null;
    }

    public async Task<CertificateResponse> CreateAsync(CreateCertificateRequest r, CancellationToken ct = default) =>
        await IssueForCompletionAsync(r.UserId, r.ModuleId, ct);

    private IQueryable<Certificate> Query() => db.Certificates.AsNoTracking().Include(x => x.User).Include(x => x.Module);

    private string Sign(Certificate certificate, string studentName, string moduleTitle)
    {
        var key = configuration["Certificates:SigningKey"];
        if (string.IsNullOrWhiteSpace(key)) throw new InvalidOperationException("Certificates:SigningKey is not configured.");
        var payload = $"{certificate.CertificateId:N}|{certificate.CertificateNumber}|{certificate.UserId:N}|{certificate.ModuleId:N}|{studentName.Trim()}|{moduleTitle.Trim()}|{certificate.IssuedAt:O}";
        return Convert.ToHexString(HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    private static CertificateResponse? ToResponse(Certificate? x) => x is null ? null : new CertificateResponse
    {
        CertificateId = x.CertificateId,
        UserId = x.UserId,
        ModuleId = x.ModuleId,
        CertificateNumber = x.CertificateNumber,
        CertificateHash = x.CertificateHash,
        Status = x.Status,
        ModuleTitle = x.Module.Title,
        StudentName = $"{x.User.FirstName} {x.User.LastName}".Trim(),
        IssuedAt = x.IssuedAt
    };

    private static CertificateListItemResponse ToList(Certificate x) => new()
    {
        CertificateId = x.CertificateId,
        UserId = x.UserId,
        ModuleId = x.ModuleId,
        CertificateNumber = x.CertificateNumber,
        CertificateHash = x.CertificateHash,
        Status = x.Status,
        ModuleTitle = x.Module.Title,
        IssuedAt = x.IssuedAt
    };
}
