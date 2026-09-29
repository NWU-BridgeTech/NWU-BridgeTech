using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;

namespace BridgeTech.Api.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher,
        IEmailService emailService,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        bool usernameExists = await _context.Users
            .AnyAsync(u => u.Username == request.Username, cancellationToken);

        if (usernameExists)
        {
            throw new InvalidOperationException("Username is already in use.");
        }

        bool emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email, cancellationToken);

        if (emailExists)
        {
            throw new InvalidOperationException("Email is already in use.");
        }

        bool pendingUsernameExists = await _context.PendingRegistrations
            .AnyAsync(x => x.Username == request.Username, cancellationToken);

        if (pendingUsernameExists)
        {
            throw new InvalidOperationException("Username is already in use.");
        }

        bool pendingEmailExists = await _context.PendingRegistrations
            .AnyAsync(x => x.Email == request.Email, cancellationToken);

        if (pendingEmailExists)
        {
            throw new InvalidOperationException("Email is already in use.");
        }

        var pendingRegistration = new PendingRegistration
        {
            PendingRegistrationId = Guid.NewGuid(),
            Username = request.Username,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = _passwordHasher.HashPassword(null!, request.Password),
            GithubUsername = request.GithubUsername,
            CreatedAt = DateTimeOffset.UtcNow,
            VerificationCode = GenerateCode(),
            VerificationCodeExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
            LastCodeSentAt = DateTimeOffset.UtcNow
        };

        _context.PendingRegistrations.Add(pendingRegistration);
        await _context.SaveChangesAsync(cancellationToken);

        await _emailService.SendVerificationCodeAsync(
            pendingRegistration.Email,
            pendingRegistration.VerificationCode,
            cancellationToken);

        return new AuthResponse
        {
            Email = pendingRegistration.Email,
            ExpiresAt = DateTimeOffset.UtcNow,
            VerificationExpiresAt = pendingRegistration.VerificationCodeExpiresAt
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Username == request.Identifier ||
                u.Email == request.Identifier, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "Invalid username/email or password.");
        }

        if (!VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException(
                "Invalid username/email or password.");
        }

        if (!user.EmailVerified)
        {
            var exception = new InvalidOperationException("Email verification is required.") { Data = { ["Code"] = "EMAIL_NOT_VERIFIED" } };
            throw exception;
        }

        string accessToken = GenerateAccessToken(user);
        string refreshToken = GenerateRefreshToken(user);

        return new AuthResponse
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(GetAccessTokenMinutes())
        };
    }

    public async Task<VerificationResponse> VerifyEmailAsync(VerificationRequest request, CancellationToken cancellationToken = default)
    {
        var pendingRegistration = await _context.PendingRegistrations
            .FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken)
            ?? throw VerificationError("Incorrect verification code.", "VERIFICATION_FAILED");

        if (pendingRegistration.VerificationCodeExpiresAt <= DateTimeOffset.UtcNow)
            throw VerificationError("Verification code expired.", "CODE_EXPIRED");

        if (pendingRegistration.VerificationCode != request.Code)
        {
            pendingRegistration.VerificationAttempts++;
            if (pendingRegistration.VerificationAttempts >= 5)
            {
                pendingRegistration.VerificationCode = string.Empty;
            }

            await _context.SaveChangesAsync(cancellationToken);
            throw VerificationError(
                $"Incorrect verification code. {Math.Max(0, 5 - pendingRegistration.VerificationAttempts)} attempts remaining.",
                "INCORRECT_CODE");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Username = pendingRegistration.Username,
            FirstName = pendingRegistration.FirstName,
            LastName = pendingRegistration.LastName,
            Email = pendingRegistration.Email,
            PasswordHash = pendingRegistration.PasswordHash,
            GithubUsername = pendingRegistration.GithubUsername,
            Role = UserRole.Student,
            CreatedAt = pendingRegistration.CreatedAt,
            UpdatedAt = DateTimeOffset.UtcNow,
            EmailVerified = true
        };

        _context.Users.Add(user);
        _context.PendingRegistrations.Remove(pendingRegistration);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        try
        {
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Welcome email could not be sent to {Email}.", user.Email);
        }

        return new VerificationResponse { Token = GenerateAccessToken(user), RefreshToken = GenerateRefreshToken(user) };
    }

    public async Task<VerificationResponse> ResendVerificationAsync(string email, CancellationToken cancellationToken = default)
    {
        var pendingRegistration = await _context.PendingRegistrations
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (pendingRegistration is null)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken)
                ?? throw new InvalidOperationException("Account not found.");
            if (existingUser.EmailVerified) throw new InvalidOperationException("Email is already verified.");

            var now = DateTimeOffset.UtcNow;
            if (existingUser.LastCodeSentAt is { } sentAt && sentAt.AddSeconds(60) > now)
                throw new InvalidOperationException($"Please wait {(int)Math.Ceiling((sentAt.AddSeconds(60) - now).TotalSeconds)} seconds before requesting another code.");
            existingUser.VerificationCode = GenerateCode();
            existingUser.VerificationCodeExpiresAt = now.AddMinutes(10);
            existingUser.VerificationAttempts = 0;
            existingUser.LastCodeSentAt = now;
            await _context.SaveChangesAsync(cancellationToken);
            await _emailService.SendVerificationCodeAsync(existingUser.Email, existingUser.VerificationCode, cancellationToken);
            return new VerificationResponse { ExpiresAt = existingUser.VerificationCodeExpiresAt.Value };
        }

        var pendingNow = DateTimeOffset.UtcNow;
        if (pendingRegistration.LastCodeSentAt.AddSeconds(60) > pendingNow)
            throw new InvalidOperationException($"Please wait {(int)Math.Ceiling((pendingRegistration.LastCodeSentAt.AddSeconds(60) - pendingNow).TotalSeconds)} seconds before requesting another code.");
        pendingRegistration.VerificationCode = GenerateCode();
        pendingRegistration.VerificationCodeExpiresAt = pendingNow.AddMinutes(10);
        pendingRegistration.VerificationAttempts = 0;
        pendingRegistration.LastCodeSentAt = pendingNow;
        await _context.SaveChangesAsync(cancellationToken);
        await _emailService.SendVerificationCodeAsync(pendingRegistration.Email, pendingRegistration.VerificationCode, cancellationToken);
        return new VerificationResponse { ExpiresAt = pendingRegistration.VerificationCodeExpiresAt };
    }

    public async Task ForgotPasswordAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is null) return;
        user.PasswordResetCode = GenerateCode();
        user.PasswordResetCodeExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10);
        user.PasswordResetAttempts = 0;
        user.PasswordResetLastSentAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        await _emailService.SendPasswordResetCodeAsync(user.Email, user.PasswordResetCode, cancellationToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken)
            ?? throw new InvalidOperationException("Invalid or expired reset code.");
        if (user.PasswordResetCodeExpiresAt is null || user.PasswordResetCodeExpiresAt <= DateTimeOffset.UtcNow || user.PasswordResetCode is null)
            throw new InvalidOperationException("Reset code expired.");
        if (user.PasswordResetCode != request.Code)
        {
            user.PasswordResetAttempts++;
            if (user.PasswordResetAttempts >= 5) user.PasswordResetCode = null;
            await _context.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Incorrect reset code.");
        }
        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.PasswordResetCode = null;
        user.PasswordResetCodeExpiresAt = null;
        user.PasswordResetAttempts = 0;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private static InvalidOperationException VerificationError(string message, string code)
    {
        var exception = new InvalidOperationException(message);
        exception.Data["Code"] = code;
        return exception;
    }
    public async Task<AuthResponse> RefreshTokenAsync(
        RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var principal = ValidateRefreshToken(request.RefreshToken);

        if (principal == null)
        {
            throw new UnauthorizedAccessException(
                "Invalid or expired refresh token.");
        }

        string? userIdValue =
            principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out Guid userId))
        {
            throw new UnauthorizedAccessException(
                "Invalid refresh token.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "User no longer exists.");
        }

        string accessToken = GenerateAccessToken(user);
        string refreshToken = GenerateRefreshToken(user);

        return new AuthResponse
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(GetAccessTokenMinutes())
        };
    }

    private string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);

        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            100_000,
            HashAlgorithmName.SHA256,
            32);

        return $"PBKDF2$100000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    private bool VerifyPassword(string password, string storedHash)
    {
        if (storedHash.StartsWith("AQAAAA", StringComparison.Ordinal))
            return _passwordHasher.VerifyHashedPassword(null!, storedHash, password) != PasswordVerificationResult.Failed;
        string[] parts = storedHash.Split('$');

        if (parts.Length != 4 || parts[0] != "PBKDF2")
        {
            return false;
        }

        if (!int.TryParse(parts[1], out int iterations))
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;

        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expectedHash = Convert.FromBase64String(parts[3]);
        }
        catch
        {
            return false;
        }

        byte[] actualHash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expectedHash.Length);

        return CryptographicOperations.FixedTimeEquals(
            actualHash,
            expectedHash);
    }

    private string GenerateAccessToken(User user)
    {
        string key = GetJwtKey();

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.UserId.ToString()),

            new Claim(
                ClaimTypes.Name,
                user.Username),

            new Claim(
                ClaimTypes.Email,
                user.Email),

            new Claim(
                ClaimTypes.Role,
                user.Role.ToString()),

            new Claim(
                "token_type",
                "access")
        };

        var securityKey =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                GetAccessTokenMinutes()),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken(User user)
    {
        string key = GetJwtKey();

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.UserId.ToString()),

            new Claim(
                "token_type",
                "refresh"),

            new Claim(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString())
        };

        var securityKey =
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateRefreshToken(
        string refreshToken)
    {
        string key = GetJwtKey();

        var tokenHandler = new JwtSecurityTokenHandler();

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(key)),

            ValidateIssuer = false,
            ValidateAudience = false,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        try
        {
            var principal = tokenHandler.ValidateToken(
                refreshToken,
                validationParameters,
                out SecurityToken validatedToken);

            string? tokenType =
                principal.FindFirst("token_type")?.Value;

            if (tokenType != "refresh")
            {
                return null;
            }

            return principal;
        }
        catch
        {
            return null;
        }
    }

    private string GetJwtKey()
    {
        string? key = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "JWT key is not configured. Add Jwt:Key to the application configuration.");
        }

        return key;
    }

    private int GetAccessTokenMinutes()
    {
        return _configuration
            .GetValue<int?>("Jwt:AccessTokenMinutes") ?? 60;
    }
}