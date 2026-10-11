namespace Ohana.Server.Services;

public class StaffOperationException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
