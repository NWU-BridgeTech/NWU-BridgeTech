namespace BridgeTech.Api.Common.Options;

public sealed class OpenAIOptions
{
    public string Provider { get; set; } = "OpenAI";
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-4o-mini";
    public string Endpoint { get; set; } = "https://api.openai.com/v1/chat/completions";
}
