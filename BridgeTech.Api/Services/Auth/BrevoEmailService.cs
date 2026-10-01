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
            cancellationToken: cancellationToken);

    public Task SendPasswordResetCodeAsync(
        string email,
        string code,
        CancellationToken cancellationToken = default) =>
        SendAsync(
            email,
            "Reset your BridgeTech password",
            $"Your BridgeTech password reset code is {code}. It expires in 10 minutes.",
            cancellationToken: cancellationToken);

    public Task SendWelcomeEmailAsync(
        string email,
        string firstName,
        CancellationToken cancellationToken = default) =>
        SendAsync(
            email,
            "Welcome to BridgeTech",
            $"Hi {firstName},\n\nWelcome to BridgeTech! Your email has been verified and your account is ready.\n\nStart learning at http://localhost:5173/home\n\nThe BridgeTech team",
            cancellationToken: cancellationToken);

    public Task SendCertificateEmailAsync(
        string email,
        string firstName,
        string moduleTitle,
        string certificateNumber,
        string certificatePageUrl,
        byte[] pdf,
        CancellationToken cancellationToken = default) =>
        SendAsync(
            email,
            $"Your BridgeTech certificate: {moduleTitle}",
            $"Hi {firstName},\n\nCongratulations on completing {moduleTitle}! Your PDF certificate is attached to this email.\n\nCertificate number: {certificateNumber}\n\nDownload PNG, JPEG, or PDF versions securely from your BridgeTech Certificates page:\n{certificatePageUrl}\n\nThe BridgeTech team",
            cancellationToken: cancellationToken,
            attachments: new[] { (FileName: $"{certificateNumber}.pdf", Content: pdf) });

    private async Task SendAsync(
        string email,
        string subject,
        string body,
        CancellationToken cancellationToken,
        IReadOnlyList<(string FileName, byte[] Content)>? attachments = null)
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
            textContent = body,
            attachment = attachments?.Select(attachment => new
            {
                content = Convert.ToBase64String(attachment.Content),
                name = attachment.FileName
            })
        };

        using HttpResponseMessage response = await httpClient.PostAsJsonAsync(
            "v3/smtp/email",
            payload,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            string details = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                throw new InvalidOperationException(
                    "Brevo rejected the email because the API key is disabled. Create or enable a Brevo API key and update Email:BrevoApiKey.");
            }

            throw new InvalidOperationException(
                $"Brevo rejected the email request with status {(int)response.StatusCode}: {details}");
        }
    }
}