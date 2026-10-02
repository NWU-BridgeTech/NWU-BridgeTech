namespace BridgeTech.Api.Services.Auth;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    Task SendPasswordResetCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    Task SendWelcomeEmailAsync(string email, string firstName, CancellationToken cancellationToken = default);
    Task SendAdministratorInvitationAsync(
        string email,
        string firstName,
        string roleName,
        string setPasswordUrl,
        string signInUrl,
        CancellationToken cancellationToken = default);
    Task SendCertificateEmailAsync(
        string email,
        string firstName,
        string moduleTitle,
        string certificateNumber,
        string certificatePageUrl,
        byte[] pdf,
        CancellationToken cancellationToken = default);
}