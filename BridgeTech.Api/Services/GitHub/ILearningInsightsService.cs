using BridgeTech.Api.DTOs.GitHub;

namespace BridgeTech.Api.Services.GitHub;

public interface ILearningInsightsService
{
    Task<LearningInsightsResponse> GetAsync(
        Guid userId,
        bool generateAnalysis = false,
        CancellationToken cancellationToken = default);
    Task<LearningChatResponse> ChatAsync(
        Guid userId,
        LearningChatRequest request,
        CancellationToken cancellationToken = default);
    Task<LearningChatHistoryResponse> GetChatHistoryAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
    Task ClearChatHistoryAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
