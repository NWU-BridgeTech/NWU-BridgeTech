using System.Net.Http.Json;

namespace BridgeTech.Api.Services.Auth;

public sealed class BrevoEmailService(
    IConfiguration configuration,
    HttpClient httpClient) : IEmailService
{
    public Task SendVerificationCodeAsync(
        string email,
        string code,
        CancellationToken cancellationToken = default) =>
        SendAsync(
            email,
            "Verify your BridgeTech email",
            $"Your BridgeTech verification code is {code}. It expires in 10 minutes.",
            cancellationToken);

    public Task SendPasswordResetCodeAsync(
        string email,
        string code,
        CancellationToken cancellationToken = default) =>
        SendAsync(
            email,
            "Reset your BridgeTech password",
            $"Your BridgeTech password reset code is {code}. It expires in 10 minutes.",
            cancellationToken);

    public Task SendWelcomeEmailAsync(
        string email,
        string firstName,
        CancellationToken cancellationToken = default) =>
        SendAsync(
            email,
            "Welcome to BridgeTech",
            $"Hi {firstName},\n\nWelcome to BridgeTech! Your email has been verified and your account is ready.\n\nStart learning at http://localhost:5173/home\n\nThe BridgeTech team",
            cancellationToken);

    private async Task SendAsync(
        string email,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        string? apiKey = configuration["Email:BrevoApiKey"];
        string? fromAddress = configuration["Email:FromAddress"];

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromAddress))
        {
            throw new InvalidOperationException(
                "Email:BrevoApiKey and Email:FromAddress must be configured.");
        }

        httpClient.DefaultRequestHeaders.Remove("api-key");
        httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

        var payload = new
        {
            sender = new
            {
                email = fromAddress,
                name = configuration["Email:FromName"] ?? "BridgeTech"
            },
            to = new[]
            {
                new { email }
            },
            subject,
            textContent = body
        };

        using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
            "v3/smtp/email",
            payload,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string details = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"Brevo rejected the email request with status {(int)response.StatusCode}: {details}");
        }
    }
}