using BridgeTech.Api.DTOs.Auth;

namespace BridgeTech.Api.Services.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<VerificationResponse> VerifyEmailAsync(VerificationRequest request, CancellationToken cancellationToken = default);
    Task<VerificationResponse> ResendVerificationAsync(string email, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(string email, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
}
