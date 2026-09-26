namespace BridgeTech.Api.Common.Options;

public sealed class GitHubApiOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string CallbackUrl { get; set; } = string.Empty;
    public string FrontendUrl { get; set; } = "http://localhost:5173";
}
