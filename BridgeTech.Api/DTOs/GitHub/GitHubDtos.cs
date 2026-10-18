using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace BridgeTech.Api.DTOs.GitHub;

public sealed record GitHubRepositoryResponse(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("full_name")] string FullName,
    [property: JsonPropertyName("html_url")] string HtmlUrl,
    [property: JsonPropertyName("private")] bool IsPrivate);

public sealed record LinkGitHubRepositoryRequest
{
    [Required, MaxLength(200)]
    public required string FullName { get; init; }
}
