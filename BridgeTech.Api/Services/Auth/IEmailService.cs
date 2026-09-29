namespace BridgeTech.Api.Services.Auth;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    Task SendPasswordResetCodeAsync(string email, string code, CancellationToken cancellationToken = default);
    Task SendWelcomeEmailAsync(string email, string firstName, CancellationToken cancellationToken = default);
}