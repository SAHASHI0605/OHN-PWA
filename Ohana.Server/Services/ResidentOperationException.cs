namespace Ohana.Server.Services;

public class ResidentOperationException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
