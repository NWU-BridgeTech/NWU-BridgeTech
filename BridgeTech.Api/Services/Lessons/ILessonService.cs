using BridgeTech.Api.DTOs.Lessons;

namespace BridgeTech.Api.Services.Lessons;

public interface ILessonService
{
    Task<IEnumerable<LessonListItemResponse>> GetLessonsForModuleAsync(
        Guid moduleId, Guid userId, CancellationToken cancellationToken);

    Task<LessonResponse?> GetByIdAsync(
        Guid lessonId, Guid userId, CancellationToken cancellationToken);

    Task<LessonProgressResponse?> MarkCompleteAsync(
        Guid lessonId, Guid userId, CancellationToken cancellationToken);

    Task<LessonResponse> CreateAsync(
        Guid moduleId, CreateLessonRequest request, CancellationToken cancellationToken);

    Task<LessonViewResponse?> GetCurrentForModuleAsync(Guid moduleId, Guid userId, CancellationToken ct);
    Task<LessonViewResponse?> GetViewAsync(Guid lessonId, Guid userId, CancellationToken ct);

    Task<LessonViewResponse?> GetCurrentForModuleAsync(Guid moduleId, Guid userId, CancellationToken ct);
    Task<LessonViewResponse?> GetViewAsync(Guid lessonId, Guid userId, CancellationToken ct);
}