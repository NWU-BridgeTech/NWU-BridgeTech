using BridgeTech.Api.Data;
using BridgeTech.Api.Domain.Entities;
using BridgeTech.Api.Domain.Enums;
using BridgeTech.Api.DTOs.InstructorContent;
using BridgeTech.Api.DTOs.Modules;
using Microsoft.EntityFrameworkCore;

namespace BridgeTech.Api.Services.InstructorContent;

public sealed class InstructorContentService(AppDbContext db) : IInstructorContentService
{
    private const string ModuleCreatedActivity = "ModuleCreated";

    public async Task<InstructorModuleResponse> CreateModuleAsync(
        Guid instructorId,
        CreateInstructorModuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var lastOrder = await db.Modules
            .Select(module => (short?)module.OrderIndex)
            .MaxAsync(cancellationToken) ?? -1;
        if (lastOrder == short.MaxValue)
        {
            throw new InvalidOperationException("The module ordering limit has been reached.");
        }

        var now = DateTimeOffset.UtcNow;
        var module = new Module
        {
            ModuleId = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            OrderIndex = (short)(lastOrder + 1),
            Level = ModuleLevel.Beginner,
            Status = ContentStatus.Draft,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Modules.Add(module);
        db.StaffActivities.Add(new StaffActivity
        {
            StaffActivityId = Guid.NewGuid(),
            UserId = instructorId,
            ActivityType = ModuleCreatedActivity,
            StartedAt = now,
            ModuleId = module.ModuleId,
            ModuleTitle = module.Title
        });
        await db.SaveChangesAsync(cancellationToken);

        return new InstructorModuleResponse
        {
            ModuleId = module.ModuleId,
            Title = module.Title,
            Description = module.Description,
            Level = module.Level.ToString(),
            Status = module.Status.ToString()
        };
    }

    public async Task<IReadOnlyList<InstructorModuleResponse>> GetModulesAsync(
        Guid instructorId,
        CancellationToken cancellationToken = default)
    {
        var ownedModuleIds = OwnedModuleIds(instructorId);
        return await db.Modules.AsNoTracking()
            .Where(module => ownedModuleIds.Contains(module.ModuleId))
            .OrderBy(module => module.OrderIndex)
            .ThenBy(module => module.Title)
            .Select(module => new InstructorModuleResponse
            {
                ModuleId = module.ModuleId,
                Title = module.Title,
                Description = module.Description,
                Level = module.Level.ToString(),
                Status = module.Status.ToString(),
                LessonCount = module.Lessons.Count,
                PublishedLessonCount = module.Lessons.Count(lesson => lesson.Status == ContentStatus.Published),
                StudentCount = module.Enrollments.Count(enrollment =>
                    enrollment.User.Role == UserRole.Student &&
                    enrollment.Status != EnrollmentStatus.Dropped)
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<InstructorModuleResponse?> UpdateModuleAsync(
        Guid instructorId,
        Guid moduleId,
        UpdateModuleRequest request,
        CancellationToken cancellationToken = default)
    {
        var module = await GetOwnedModuleAsync(instructorId, moduleId, cancellationToken);
        if (module is null)
        {
            return null;
        }

        var lessonCount = await db.Lessons.CountAsync(
            lesson => lesson.ModuleId == moduleId,
            cancellationToken);
        var publishedLessonCount = await db.Lessons.CountAsync(
            lesson => lesson.ModuleId == moduleId && lesson.Status == ContentStatus.Published,
            cancellationToken);
        if (request.Status is not null)
        {
            if (!Enum.TryParse<ContentStatus>(request.Status, true, out var status) ||
                !Enum.IsDefined(status))
            {
                throw new InvalidOperationException("Choose a valid module status.");
            }
            if (status == ContentStatus.Published && publishedLessonCount == 0)
            {
                throw new InvalidOperationException("Publish at least one lesson before publishing this module.");
            }
            module.Status = status;
        }
        if (request.Level is not null)
        {
            if (!Enum.TryParse<ModuleLevel>(request.Level, true, out var level) ||
                !Enum.IsDefined(level))
            {
                throw new InvalidOperationException("Choose a valid module level.");
            }
            module.Level = level;
        }

        if (request.Title is not null) module.Title = request.Title.Trim();
        if (request.Description is not null) module.Description = request.Description.Trim();
        if (request.OrderIndex.HasValue) module.OrderIndex = request.OrderIndex.Value;
        module.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return new InstructorModuleResponse
        {
            ModuleId = module.ModuleId,
            Title = module.Title,
            Description = module.Description,
            Level = module.Level.ToString(),
            Status = module.Status.ToString(),
            LessonCount = lessonCount,
            PublishedLessonCount = publishedLessonCount,
            StudentCount = await db.Enrollments.CountAsync(enrollment =>
                enrollment.ModuleId == moduleId &&
                enrollment.User.Role == UserRole.Student &&
                enrollment.Status != EnrollmentStatus.Dropped,
                cancellationToken)
        };
    }

    public async Task<bool> DeleteModuleAsync(
        Guid instructorId,
        Guid moduleId,
        CancellationToken cancellationToken = default)
    {
        var module = await GetOwnedModuleAsync(instructorId, moduleId, cancellationToken);
        if (module is null)
        {
            return false;
        }

        db.Modules.Remove(module);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<InstructorModuleContentResponse?> GetModuleContentAsync(
        Guid instructorId,
        Guid moduleId,
        CancellationToken cancellationToken = default)
    {
        if (!await OwnsModuleAsync(instructorId, moduleId, cancellationToken))
        {
            return null;
        }

        var module = await db.Modules.AsNoTracking()
            .Where(item => item.ModuleId == moduleId)
            .Select(item => new
            {
                item.ModuleId,
                item.Title,
                item.Status,
                Lessons = item.Lessons.OrderBy(lesson => lesson.OrderIndex).ThenBy(lesson => lesson.CreatedAt).ToList(),
                Quizzes = item.Quizzes.Select(quiz => new
                {
                    quiz.QuizId,
                    quiz.LessonId,
                    quiz.Title,
                    Questions = quiz.Questions.OrderBy(question => question.OrderIndex)
                        .Select(question => new
                        {
                            question.QuestionText,
                            Options = question.Options.OrderBy(option => option.OrderIndex)
                                .Select(option => new InstructorQuizOptionResponse
                                {
                                    Text = option.OptionText,
                                    IsCorrect = option.IsCorrect
                                }).ToList()
                        }).ToList()
                }).ToList(),
                Exercises = item.Exercises.Count
            })
            .SingleAsync(cancellationToken);

        var quizIds = module.Quizzes.Select(quiz => quiz.QuizId).ToArray();
        var scores = await db.QuizAttempts.AsNoTracking()
            .Where(attempt => quizIds.Contains(attempt.QuizId) && attempt.CompletedAt != null && attempt.Score != null)
            .GroupBy(attempt => attempt.QuizId)
            .Select(group => new { QuizId = group.Key, AverageScore = group.Average(attempt => (double)attempt.Score!.Value) })
            .ToDictionaryAsync(group => group.QuizId, group => (double?)group.AverageScore, cancellationToken);

        var quizPreviews = module.Quizzes
            .Select(quiz => new InstructorQuizPreviewResponse
            {
                QuizId = quiz.QuizId,
                Title = quiz.Title,
                QuestionCount = quiz.Questions.Count,
                AverageScore = scores.GetValueOrDefault(quiz.QuizId),
                Questions = quiz.Questions.Select(question => new InstructorQuizQuestionResponse
                {
                    QuestionText = question.QuestionText,
                    Options = question.Options
                }).ToList()
            })
            .ToDictionary(quiz => quiz.QuizId);

        var moduleQuizIdsByLesson = module.Quizzes
            .Where(quiz => quiz.LessonId.HasValue)
            .GroupBy(quiz => quiz.LessonId!.Value)
            .ToDictionary(group => group.Key, group => group.Select(quiz => quiz.QuizId).ToHashSet());

        var lessonIds = module.Lessons.Select(lesson => lesson.LessonId).ToArray();
        var videoUrls = await db.VideoSummaries.AsNoTracking()
            .Where(video => lessonIds.Contains(video.LessonId))
            .GroupBy(video => video.LessonId)
            .Select(group => new { LessonId = group.Key, VideoUrl = group.Select(video => video.VideoUrl).First() })
            .ToDictionaryAsync(item => item.LessonId, item => item.VideoUrl, cancellationToken);

        var completedScores = scores.Values.Where(score => score.HasValue).Select(score => score!.Value).ToList();

        return new InstructorModuleContentResponse
        {
            ModuleId = module.ModuleId,
            ModuleTitle = module.Title,
            ModuleStatus = module.Status.ToString(),
            TotalLessons = module.Lessons.Count,
            AttachedQuizzes = module.Quizzes.Count,
            AverageQuizScore = completedScores.Count == 0 ? null : completedScores.Average(),
            ModuleExerciseCount = module.Exercises,
            Lessons = module.Lessons.Select(lesson => new InstructorLessonResponse
            {
                LessonId = lesson.LessonId,
                ModuleId = lesson.ModuleId,
                Title = lesson.Title,
                Description = lesson.Description,
                Content = lesson.Content,
                VideoUrl = videoUrls.GetValueOrDefault(lesson.LessonId),
                OrderIndex = lesson.OrderIndex,
                DurationMinutes = lesson.DurationMinutes,
                Status = lesson.Status.ToString(),
                Quizzes = moduleQuizIdsByLesson.TryGetValue(lesson.LessonId, out var lessonQuizIds)
                    ? lessonQuizIds.Select(id => quizPreviews[id]).ToList()
                    : []
            }).ToList()
        };
    }

    public async Task<InstructorLessonResponse?> CreateLessonAsync(
        Guid instructorId,
        Guid moduleId,
        SaveInstructorLessonRequest request,
        CancellationToken cancellationToken = default)
    {
        var module = await GetOwnedModuleAsync(instructorId, moduleId, cancellationToken);
        if (!IsValidYouTubeUrl(request.VideoUrl))
        {
            throw new InvalidOperationException("Enter a valid YouTube video URL.");
        }
        if (module is null || !TryGetStatus(request.Status, out var status) ||
            !IsValidPublication(request, status))
        {
            return null;
        }

        var lastOrder = await db.Lessons.Where(lesson => lesson.ModuleId == moduleId)
            .Select(lesson => (short?)lesson.OrderIndex)
            .MaxAsync(cancellationToken) ?? 0;
        if (lastOrder == short.MaxValue)
        {
            throw new InvalidOperationException("This module has reached its lesson limit.");
        }

        var lesson = new Lesson
        {
            LessonId = Guid.NewGuid(),
            ModuleId = moduleId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Content = request.Content,
            DurationMinutes = request.DurationMinutes,
            Status = status,
            OrderIndex = (short)(lastOrder + 1),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.Lessons.Add(lesson);
        await SaveLessonVideoUrlAsync(lesson.LessonId, request.VideoUrl, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return ToLessonResponse(lesson, NormalizeVideoUrl(request.VideoUrl));
    }

    public async Task<InstructorLessonResponse?> UpdateLessonAsync(
        Guid instructorId,
        Guid lessonId,
        SaveInstructorLessonRequest request,
        CancellationToken cancellationToken = default)
    {
        var lesson = await db.Lessons.SingleOrDefaultAsync(item => item.LessonId == lessonId, cancellationToken);
        if (lesson is null || !await OwnsModuleAsync(instructorId, lesson.ModuleId, cancellationToken))
        {
            return null;
        }

        if (!TryGetStatus(request.Status, out var status) ||
            !IsValidPublication(request, status) || !IsValidYouTubeUrl(request.VideoUrl))
        {
            throw new InvalidOperationException(
                !IsValidYouTubeUrl(request.VideoUrl)
                    ? "Enter a valid YouTube video URL."
                    : "Published lessons need content.");
        }

        lesson.Title = request.Title.Trim();
        lesson.Description = request.Description?.Trim();
        lesson.Content = request.Content;
        lesson.DurationMinutes = request.DurationMinutes;
        lesson.Status = status;
        lesson.UpdatedAt = DateTimeOffset.UtcNow;
        await SaveLessonVideoUrlAsync(lesson.LessonId, request.VideoUrl, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return ToLessonResponse(lesson, NormalizeVideoUrl(request.VideoUrl));
    }

    public async Task<bool> MoveLessonAsync(
        Guid instructorId,
        Guid lessonId,
        int direction,
        CancellationToken cancellationToken = default)
    {
        if (direction is not (-1 or 1))
        {
            throw new ArgumentOutOfRangeException(nameof(direction));
        }

        var lesson = await db.Lessons.SingleOrDefaultAsync(item => item.LessonId == lessonId, cancellationToken);
        if (lesson is null || !await OwnsModuleAsync(instructorId, lesson.ModuleId, cancellationToken))
        {
            return false;
        }

        var lessons = await db.Lessons.Where(item => item.ModuleId == lesson.ModuleId)
            .OrderBy(item => item.OrderIndex).ThenBy(item => item.CreatedAt).ToListAsync(cancellationToken);
        var currentIndex = lessons.FindIndex(item => item.LessonId == lessonId);
        var targetIndex = currentIndex + direction;
        if (targetIndex < 0 || targetIndex >= lessons.Count)
        {
            return true;
        }

        (lessons[currentIndex].OrderIndex, lessons[targetIndex].OrderIndex) =
            (lessons[targetIndex].OrderIndex, lessons[currentIndex].OrderIndex);
        lessons[currentIndex].UpdatedAt = DateTimeOffset.UtcNow;
        lessons[targetIndex].UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<InstructorQuizPreviewResponse?> AddQuizAsync(
        Guid instructorId,
        Guid lessonId,
        AddInstructorQuizRequest request,
        CancellationToken cancellationToken = default)
    {
        var lesson = await db.Lessons.SingleOrDefaultAsync(item => item.LessonId == lessonId, cancellationToken);
        if (lesson is null || !await OwnsModuleAsync(instructorId, lesson.ModuleId, cancellationToken))
        {
            return null;
        }
        if (request.Questions.Count == 0 || request.Questions.Count > short.MaxValue)
        {
            throw new InvalidOperationException("A quiz needs at least one question.");
        }

        if (request.Questions.Any(question =>
                question.Options.Count < 2 ||
                question.Options.Count > short.MaxValue ||
                question.Options.Count(option => option.IsCorrect) != 1))
        {
            throw new InvalidOperationException("Each quiz question needs at least two answers and exactly one correct answer.");
        }

        var quiz = new Quiz
        {
            QuizId = Guid.NewGuid(),
            ModuleId = lesson.ModuleId,
            LessonId = lesson.LessonId,
            Title = request.Title.Trim(),
            PassingScore = request.PassingScore,
            CreatedAt = DateTimeOffset.UtcNow
        };
        var previewQuestions = new List<InstructorQuizQuestionResponse>(request.Questions.Count);
        foreach (var (questionRequest, questionIndex) in request.Questions.Select((value, index) => (value, index)))
        {
            var question = new QuizQuestion
            {
                QuestionId = Guid.NewGuid(),
                QuizId = quiz.QuizId,
                QuestionText = questionRequest.QuestionText.Trim(),
                QuestionType = QuestionType.SingleChoice,
                OrderIndex = checked((short)questionIndex)
            };
            foreach (var (option, optionIndex) in questionRequest.Options.Select((value, index) => (value, index)))
            {
                question.Options.Add(new QuizOption
                {
                    OptionId = Guid.NewGuid(),
                    QuizId = quiz.QuizId,
                    QuestionId = question.QuestionId,
                    OptionText = option.Text.Trim(),
                    IsCorrect = option.IsCorrect,
                    OrderIndex = checked((short)optionIndex)
                });
            }
            quiz.Questions.Add(question);
            previewQuestions.Add(new InstructorQuizQuestionResponse
            {
                QuestionText = question.QuestionText,
                Options = questionRequest.Options.Select(option => new InstructorQuizOptionResponse
                {
                    Text = option.Text.Trim(),
                    IsCorrect = option.IsCorrect
                }).ToList()
            });
        }

        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync(cancellationToken);

        return new InstructorQuizPreviewResponse
        {
            QuizId = quiz.QuizId,
            Title = quiz.Title,
            QuestionCount = previewQuestions.Count,
            Questions = previewQuestions
        };
    }

    public async Task<InstructorQuizQuestionResponse?> AddQuizQuestionAsync(
        Guid instructorId,
        Guid quizId,
        InstructorQuizQuestionRequest request,
        CancellationToken cancellationToken = default)
    {
        var quiz = await db.Quizzes.SingleOrDefaultAsync(item => item.QuizId == quizId, cancellationToken);
        if (quiz is null || !await OwnsModuleAsync(instructorId, quiz.ModuleId, cancellationToken))
        {
            return null;
        }
        if (request.Options.Count < 2 ||
            request.Options.Count > short.MaxValue ||
            request.Options.Count(option => option.IsCorrect) != 1)
        {
            throw new InvalidOperationException("A quiz question needs at least two answers and exactly one correct answer.");
        }

        var lastOrder = await db.QuizQuestions
            .Where(question => question.QuizId == quizId)
            .Select(question => (short?)question.OrderIndex)
            .MaxAsync(cancellationToken);
        if (lastOrder == short.MaxValue)
        {
            throw new InvalidOperationException("This quiz has reached its question limit.");
        }

        var question = new QuizQuestion
        {
            QuestionId = Guid.NewGuid(),
            QuizId = quiz.QuizId,
            QuestionText = request.QuestionText.Trim(),
            QuestionType = QuestionType.SingleChoice,
            OrderIndex = (short)((lastOrder ?? -1) + 1)
        };
        foreach (var (option, index) in request.Options.Select((value, index) => (value, index)))
        {
            question.Options.Add(new QuizOption
            {
                OptionId = Guid.NewGuid(),
                QuizId = quiz.QuizId,
                QuestionId = question.QuestionId,
                OptionText = option.Text.Trim(),
                IsCorrect = option.IsCorrect,
                OrderIndex = checked((short)index)
            });
        }

        db.QuizQuestions.Add(question);
        await db.SaveChangesAsync(cancellationToken);
        return new InstructorQuizQuestionResponse
        {
            QuestionText = question.QuestionText,
            Options = request.Options.Select(option => new InstructorQuizOptionResponse
            {
                Text = option.Text.Trim(),
                IsCorrect = option.IsCorrect
            }).ToList()
        };
    }

    public async Task<InstructorQuizQuestionResponse?> UpdateQuizQuestionAsync(
        Guid instructorId,
        Guid quizId,
        int questionIndex,
        InstructorQuizQuestionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Options.Count < 2 ||
            request.Options.Count > short.MaxValue ||
            request.Options.Count(option => option.IsCorrect) != 1)
        {
            throw new InvalidOperationException("A quiz question needs at least two answers and exactly one correct answer.");
        }

        var quiz = await db.Quizzes.SingleOrDefaultAsync(item => item.QuizId == quizId, cancellationToken);
        if (quiz is null || !await OwnsModuleAsync(instructorId, quiz.ModuleId, cancellationToken))
        {
            return null;
        }

        var question = await db.QuizQuestions
            .Where(item => item.QuizId == quizId)
            .OrderBy(item => item.OrderIndex)
            .Skip(questionIndex)
            .Take(1)
            .SingleOrDefaultAsync(cancellationToken);
        if (question is null)
        {
            return null;
        }
        if (await db.QuizAnswers.AnyAsync(answer => answer.QuestionId == question.QuestionId, cancellationToken))
        {
            throw new InvalidOperationException("This question cannot be changed because students have already answered it.");
        }

        var currentOptions = await db.QuizOptions
            .Where(option => option.QuestionId == question.QuestionId)
            .OrderBy(option => option.OrderIndex)
            .ToListAsync(cancellationToken);
        question.QuestionText = request.QuestionText.Trim();
        for (var index = 0; index < request.Options.Count; index++)
        {
            var requestOption = request.Options[index];
            if (index < currentOptions.Count)
            {
                currentOptions[index].OptionText = requestOption.Text.Trim();
                currentOptions[index].IsCorrect = requestOption.IsCorrect;
                currentOptions[index].OrderIndex = checked((short)index);
            }
            else
            {
                question.Options.Add(new QuizOption
                {
                    OptionId = Guid.NewGuid(),
                    QuizId = quizId,
                    QuestionId = question.QuestionId,
                    OptionText = requestOption.Text.Trim(),
                    IsCorrect = requestOption.IsCorrect,
                    OrderIndex = checked((short)index)
                });
            }
        }
        if (currentOptions.Count > request.Options.Count)
        {
            db.QuizOptions.RemoveRange(currentOptions.Skip(request.Options.Count));
        }
        await db.SaveChangesAsync(cancellationToken);
        return new InstructorQuizQuestionResponse
        {
            QuestionText = question.QuestionText,
            Options = request.Options.Select(option => new InstructorQuizOptionResponse
            {
                Text = option.Text.Trim(),
                IsCorrect = option.IsCorrect
            }).ToList()
        };
    }

    public async Task<bool?> AddExerciseAsync(
        Guid instructorId,
        Guid moduleId,
        AddInstructorExerciseRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!await OwnsModuleAsync(instructorId, moduleId, cancellationToken))
        {
            return null;
        }

        db.Exercises.Add(new Exercise
        {
            ExerciseId = Guid.NewGuid(),
            ModuleId = moduleId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            VerificationType = VerificationType.CommitCheck,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private IQueryable<Guid> OwnedModuleIds(Guid instructorId) =>
        db.StaffActivities.Where(activity =>
                activity.UserId == instructorId &&
                activity.ActivityType == ModuleCreatedActivity &&
                activity.ModuleId.HasValue)
            .Select(activity => activity.ModuleId!.Value)
            .Distinct();

    private Task<bool> OwnsModuleAsync(Guid instructorId, Guid moduleId, CancellationToken cancellationToken) =>
        db.StaffActivities.AnyAsync(activity =>
            activity.UserId == instructorId &&
            activity.ActivityType == ModuleCreatedActivity &&
            activity.ModuleId == moduleId, cancellationToken);

    private async Task<Module?> GetOwnedModuleAsync(
        Guid instructorId,
        Guid moduleId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsModuleAsync(instructorId, moduleId, cancellationToken))
        {
            return null;
        }
        return await db.Modules.SingleOrDefaultAsync(module => module.ModuleId == moduleId, cancellationToken);
    }

    private static bool TryGetStatus(string status, out ContentStatus parsedStatus) =>
        Enum.TryParse(status, true, out parsedStatus) && Enum.IsDefined(parsedStatus);

    private static bool IsValidPublication(
        SaveInstructorLessonRequest request,
        ContentStatus status) =>
        status != ContentStatus.Published ||
        !string.IsNullOrWhiteSpace(request.Content);

    private async Task SaveLessonVideoUrlAsync(
        Guid lessonId,
        string? videoUrl,
        CancellationToken cancellationToken)
    {
        var video = await db.VideoSummaries
            .FirstOrDefaultAsync(item => item.LessonId == lessonId, cancellationToken);
        var normalizedUrl = NormalizeVideoUrl(videoUrl);
        if (normalizedUrl is null)
        {
            if (video is not null)
            {
                db.VideoSummaries.RemoveRange(db.VideoSummaries.Where(item => item.LessonId == lessonId));
            }
            return;
        }

        if (video is null)
        {
            db.VideoSummaries.Add(new VideoSummary
            {
                VideoId = Guid.NewGuid(),
                LessonId = lessonId,
                VideoUrl = normalizedUrl,
                GeneratedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            video.VideoUrl = normalizedUrl;
        }
    }

    private static string? NormalizeVideoUrl(string? videoUrl) =>
        string.IsNullOrWhiteSpace(videoUrl) ? null : videoUrl.Trim();

    private static bool IsValidYouTubeUrl(string? videoUrl)
    {
        if (string.IsNullOrWhiteSpace(videoUrl))
        {
            return true;
        }

        if (!Uri.TryCreate(videoUrl.Trim(), UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps)
        {
            return false;
        }

        var host = uri.Host;
        return host.Equals("youtu.be", StringComparison.OrdinalIgnoreCase) ||
               host.Equals("youtube.com", StringComparison.OrdinalIgnoreCase) ||
               host.EndsWith(".youtube.com", StringComparison.OrdinalIgnoreCase) ||
               host.Equals("youtube-nocookie.com", StringComparison.OrdinalIgnoreCase) ||
               host.EndsWith(".youtube-nocookie.com", StringComparison.OrdinalIgnoreCase);
    }

    private static InstructorLessonResponse ToLessonResponse(Lesson lesson, string? videoUrl) => new()
    {
        LessonId = lesson.LessonId,
        ModuleId = lesson.ModuleId,
        Title = lesson.Title,
        Description = lesson.Description,
        Content = lesson.Content,
        VideoUrl = videoUrl,
        OrderIndex = lesson.OrderIndex,
        DurationMinutes = lesson.DurationMinutes,
        Status = lesson.Status.ToString()
    };
}
