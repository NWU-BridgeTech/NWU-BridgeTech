using BridgeTech.Api.DTOs.Auth;
using BridgeTech.Api.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BridgeTech.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPost("signup")]
    public Task<IActionResult> Signup(RegisterRequest request) => Register(request);

    [HttpPost("verify-email")]
    [EnableRateLimiting("verification")]
    public async Task<IActionResult> VerifyEmail(VerificationRequest request)
    {
        try { return Ok(await _authService.VerifyEmailAsync(request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { code = ex.Data["Code"] ?? "VERIFICATION_FAILED", message = ex.Message }); }
    }

    [HttpPost("resend-verification")]
    [EnableRateLimiting("verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ForgotPasswordRequest request)
    {
        try { return Ok(await _authService.ResendVerificationAsync(request.Email)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request.Email);
        return Ok(new { message = "If that email exists, a code was sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        try { await _authService.ResetPasswordAsync(request); return Ok(new { message = "Password reset successfully." }); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                code = ex.Data["Code"] ?? "UNAUTHORIZED",
                message = ex.Message
            });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                message = ex.Message
            });
        }
    }
}