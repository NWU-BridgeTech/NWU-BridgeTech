namespace BridgeTech.Api.Domain.Enums;

// These enum values are stored as SMALLINT values to match the PostgreSQL schema.
public enum UserRole : short
{
    Student = 0,
    Instructor = 1,
    Admin = 2,
    SuperAdmin = 3
}

// Identifies how a quiz question expects students to answer.
public enum QuestionType : short
{
    SingleChoice = 0,
    MultiChoice = 1,
    TrueFalse = 2
}

// Identifies the GitHub-based rule used to verify an exercise.
public enum VerificationType : short
{
    CommitCheck = 0,
    PullRequestCheck = 1,
    FileExists = 2
}

// Tracks the lifecycle of a submitted exercise.
public enum SubmissionStatus : short
{
    Pending = 0,
    Verified = 1,
    Failed = 2
}

// Tracks a student's relationship with a module.
public enum EnrollmentStatus : short
{
    Active = 0,
    Completed = 1,
    Dropped = 2
}