using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Admin;

// JSON property names deliberately mirror the objects the Students and Administrators
// pages already use (id, name, email, moduleId, progress, quizScore, ...).

// ---------- Students ----------

public class StudentListQuery
{
    // Matches name or email, case-insensitively.
    [StringLength(100)]
    public string? Search { get; set; }

    // Filters on the student's current module.
    public Guid? ModuleId { get; set; }

    // "Active", "Needs support" or "Inactive".
    [StringLength(30)]
    public string? Status { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 200)]
    public int PageSize { get; set; } = 50;
}

public class StudentResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid? ModuleId { get; set; }
    public string? ModuleTitle { get; set; }
    public int Progress { get; set; }
    public DateTimeOffset? LastActiveAt { get; set; }
    public string LastActive { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;

    // Null when the student has not completed a quiz yet.
    public int? QuizScore { get; set; }
    public int CompletedPracticals { get; set; }
    public bool GithubConnected { get; set; }
}

public class StudentEnrollmentResponse
{
    public Guid ModuleId { get; set; }
    public string ModuleTitle { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Progress { get; set; }
    public DateTimeOffset EnrolledAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

public class StudentDetailResponse : StudentResponse
{
    public string Username { get; set; } = string.Empty;
    public string? GithubUsername { get; set; }
    public DateTimeOffset JoinedAt { get; set; }
    public int QuizAttemptsCompleted { get; set; }
    public int CertificatesEarned { get; set; }
    public List<StudentEnrollmentResponse> Enrollments { get; set; } = [];
}

public class StudentListResponse
{
    public List<StudentResponse> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }

    // Students matching the current filters ("Showing X of Y").
    public int FilteredCount { get; set; }

    // Whole-platform figures, unaffected by filters.
    public int TotalStudents { get; set; }
    public int ActiveCount { get; set; }
    public int NeedsSupportCount { get; set; }
    public int InactiveCount { get; set; }
}

// ---------- Administrators ----------

public class AdministratorListQuery
{
    [StringLength(100)]
    public string? Search { get; set; }

    // "Administrator", "Content manager", "Reviewer" or "Super administrator".
    [StringLength(30)]
    public string? Role { get; set; }

    // "Active" or "Inactive".
    [StringLength(30)]
    public string? Status { get; set; }

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 200)]
    public int PageSize { get; set; } = 50;
}

// Used for both "Add administrator" and "Edit administrator".
public class SaveAdministratorRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;

    // "Administrator", "Content manager" or "Reviewer".
    [Required, StringLength(30)]
    public string Role { get; set; } = string.Empty;

    // "Active" or "Inactive".
    [StringLength(30)]
    public string Status { get; set; } = "Active";
}

public class AdministratorResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? LastActiveAt { get; set; }
    public string LastActive { get; set; } = string.Empty;

    // False for super administrator accounts, which can't be changed from this page.
    public bool Editable { get; set; }

    // True for the signed-in administrator: their own role and status are locked.
    public bool IsCurrentUser { get; set; }
}

public class CreateAdministratorResponse : AdministratorResponse
{
    public bool InvitationSent { get; set; }
    public string InvitationMessage { get; set; } = string.Empty;
}

public class AdministratorListResponse
{
    public List<AdministratorResponse> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int FilteredCount { get; set; }
    public int TotalAdministrators { get; set; }
    public int ActiveCount { get; set; }
    public int InactiveCount { get; set; }
}

public class AdminRoleResponse
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class InvitationResponse
{
    public bool Sent { get; set; }
    public string Message { get; set; } = string.Empty;
}
