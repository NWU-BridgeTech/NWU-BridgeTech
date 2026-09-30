namespace BridgeTech.Api.Domain.Entities;

public class LessonProgress
{
    public Guid ProgressId {get;set;}
    public Guid UserId {get; set;}
    public Guid LessonId {get; set;}
    public bool Completed {get; set;}
    public DateTimeOffset? CompletedAt{get; set;}

    public User User {get; set;} = null!;
    public Lesson Lesson {get; set;} = null!;
}