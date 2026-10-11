namespace Ohana.Server.Models;

public class Tenant
{
    public string RoomNo { get; set; } = "";
    public string SerialNo { get; set; } = "";
    public string TenantName { get; set; } = "";
    public DateTime MoveInDate { get; set; }
    public DateTime? MoveOutDate { get; set; }
    public DateTime UpdatedAt { get; set; }
}
