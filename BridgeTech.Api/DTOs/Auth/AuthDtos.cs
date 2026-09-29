using System.ComponentModel.DataAnnotations;
using BridgeTech.Api.Domain.Enums;

namespace BridgeTech.Api.DTOs.Auth;

public class RegisterRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;

    [StringLength(39)]
    public string? GithubUsername { get; set; }
}

public class UpdateUserRole
{
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public string NewRole { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required]
    public string Identifier { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? VerificationExpiresAt { get; set; }
}

public class VerificationRequest
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
    [Required, RegularExpression("^\\d{6}$")] public string Code { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress] public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest : VerificationRequest
{
    [Required, StringLength(128, MinimumLength = 8)] public string NewPassword { get; set; } = string.Empty;
}

public class VerificationResponse
{
    public DateTimeOffset ExpiresAt { get; set; }
    public string? Token { get; set; }
    public string? RefreshToken { get; set; }
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
