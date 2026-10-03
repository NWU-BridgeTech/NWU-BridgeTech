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

    Task<AdminLessonResponse> CreateAsync(
        Guid moduleId, CreateLessonRequest request, CancellationToken cancellationToken);

    // Admin: every lesson in every module (drafts included).
    Task<IReadOnlyList<AdminLessonResponse>> GetAllForAdminAsync(CancellationToken cancellationToken);

    // Admin: update a lesson. Returns null when the lesson does not exist.
    Task<AdminLessonResponse?> UpdateAsync(
        Guid lessonId, UpdateLessonRequest request, CancellationToken cancellationToken);

    Task<LessonViewResponse?> GetCurrentForModuleAsync(Guid moduleId, Guid userId, CancellationToken ct);
<<<<<<< HEAD
    Task<LessonViewResponse?> GetViewAsync(Guid lessonId, Guid userId, CancellationToken ct);   
=======
    Task<LessonViewResponse?> GetViewAsync(Guid lessonId, Guid userId, CancellationToken ct);
>>>>>>> origin/Development
}