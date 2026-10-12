using Ohana.Server.DTOs.VitalReports;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Utilities;

public sealed class MemoryVitalReportRepository : IVitalReportRepository {
    public List<ReportTenant> Tenants { get; } = [];
    public List<ReportVital> Vitals { get; } = [];
    public bool Fail { get; set; }
    public int Reads { get; private set; }
    public int DelayMs { get; set; }
    public MemoryVitalReportRepository() {
        foreach (var room in TenantRooms.Ordered) {
            if (room is "105" or "205") continue;
            var tenant = new ReportTenant { RoomNo=room,SerialNo="1",TenantName=$"確認利用者{room}",MoveInDate=new(2026,10,5,14,30,0) };
            Tenants.Add(tenant);
            foreach (var day in new[]{10,12,15}) Vitals.Add(new ReportVital { RoomNo=room,SerialNo="1",MoveInDate=tenant.MoveInDate,RecordDate=new(2026,10,day),TemperatureC=36.5m,SystolicBloodPressure=125,DiastolicBloodPressure=78,PulseRate=72,Spo2Percent=98.5m });
        }
        Tenants.Add(new ReportTenant { RoomNo="101",SerialNo="1",TenantName="前入居者",MoveInDate=new(2025,1,1,12,30,0),MoveOutDate=new(2026,10,1,8,0,0) });
        Vitals.Add(new ReportVital { RoomNo="101",SerialNo="1",MoveInDate=new(2025,1,1,12,30,0),RecordDate=new(2026,10,1),TemperatureC=0,PulseRate=0 });
        Tenants.Add(new ReportTenant { RoomNo="201",SerialNo="2",TenantName="同室の第二入居者",MoveInDate=new(2026,10,5,13,0,0) });
        Vitals.Add(new ReportVital { RoomNo="201",SerialNo="2",MoveInDate=new(2026,10,5,13,0,0),RecordDate=new(2026,10,12) });
        Tenants.Single(t=>t.RoomNo=="228").TenantName=new string('長',20);
        Tenants.Single(t=>t.RoomNo=="VIP").TenantName="=1+1";
    }
    public async Task<VitalReportSnapshot> ReadAsync(IReadOnlyList<string> rooms,DateTime start,DateTime end,CancellationToken cancellationToken) {
        Reads++;
        if (DelayMs > 0) await Task.Delay(DelayMs, cancellationToken);
        if (Fail) throw new InvalidOperationException("Sensitive database details must not leak");
        return new VitalReportSnapshot(Tenants.Where(t=>rooms.Contains(t.RoomNo)).ToList(),Vitals.Where(v=>rooms.Contains(v.RoomNo)&&v.RecordDate>=start&&v.RecordDate<end).ToList());
    }
}
