namespace BridgeTech.Api.DTOs.Admin;

/// <summary>
/// Request to update an admin note for a student.
/// </summary>
public class UpdateStudentAdminNoteRequest
{
    public string? AdminNote { get; set; }
}
