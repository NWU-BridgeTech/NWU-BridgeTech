# Services/Ai

WHAT THIS IS: Everything related to calling Claude/Bedrock for AI features (like generating video summaries).

WHY A WRAPPER: There's no official C# SDK for the Claude API, so IClaudeClient / ClaudeClient is our own thin wrapper around HttpClient that handles the raw HTTP calls to the API. This means the rest of the app doesn't need to know the details of how the AI API works - it just calls IClaudeClient and gets a result back. VideoSummaryService uses this to actually generate summaries for modules.

RULES:
- Nothing outside this folder should call the Claude/Bedrock API directly - always go through IClaudeClient.
- API keys come from Common/Options (ClaudeApiOptions, loaded from appsettings) - never hardcode a key anywhere in the code.
