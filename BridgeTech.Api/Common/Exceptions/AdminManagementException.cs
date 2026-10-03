namespace BridgeTech.Api.Common.Exceptions;

// Thrown by the admin services when a request breaks a business rule. The
// AdminManagementExceptionFilter turns it into { code, message } with the matching status.
public class AdminManagementException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;

    public static AdminManagementException BadRequest(string code, string message) => new(StatusCodes.Status400BadRequest, code, message);
    public static AdminManagementException Forbidden(string code, string message) => new(StatusCodes.Status403Forbidden, code, message);
    public static AdminManagementException NotFound(string code, string message) => new(StatusCodes.Status404NotFound, code, message);
    public static AdminManagementException Conflict(string code, string message) => new(StatusCodes.Status409Conflict, code, message);
    public static AdminManagementException BadGateway(string code, string message) => new(StatusCodes.Status502BadGateway, code, message);
}
