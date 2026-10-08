using System.ComponentModel.DataAnnotations;

namespace BridgeTech.Api.DTOs.Modules;

// Full module details returned to admins, including the counts shown in the admin table.
public class ModuleResponse
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public short OrderIndex { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int LessonCount { get; set; }
    public int StudentCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class CreateModuleRequest
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    // Optional. When left out, the new module is placed after the existing modules.
    [Range(0, short.MaxValue)]
    public short? OrderIndex { get; set; }

    [RegularExpression("^(Beginner|Intermediate|Advanced)$",
        ErrorMessage = "Level must be Beginner, Intermediate or Advanced.")]
    public string Level { get; set; } = "Beginner";

    [RegularExpression("^(Draft|Published)$",
        ErrorMessage = "Status must be Draft or Published.")]
    public string Status { get; set; } = "Draft";
}

// Every field is optional: only the fields that are sent get updated.
public class UpdateModuleRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [StringLength(2000)]
    public string? Description { get; set; }

    [Range(0, short.MaxValue)]
    public short? OrderIndex { get; set; }

    [RegularExpression("^(Beginner|Intermediate|Advanced)$",
        ErrorMessage = "Level must be Beginner, Intermediate or Advanced.")]
    public string? Level { get; set; }

    [RegularExpression("^(Draft|Published)$",
        ErrorMessage = "Status must be Draft or Published.")]
    public string? Status { get; set; }
}

public class ModuleListItemResponse
{
    public Guid ModuleId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int LessonCount { get; set; }
    public List<string> LessonTitles { get; set; } = new();
    public short OrderIndex { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}