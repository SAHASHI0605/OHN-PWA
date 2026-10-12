using System.Text.Json;
using Ohana.Server.DTOs.Records;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services;
using Ohana.Server.Utilities;

// Local verification only: no MySQL connection, no existing data writes.
public class MemoryRecordRepository(MemoryResidentRepository tenants, MemoryStaffRepository staff, RecordVersion version) : IRecordRepository
{
    private readonly SemaphoreSlim mutex = new(1);
    private readonly Dictionary<RecordKey, RecordsDto> records = new();
    public Dictionary<ulong, (string Actor, DateTime At)> Creation { get; } = new();
    public bool FailSaves { get; set; }
    public bool FailReads { get; set; }
    public bool FailRefreshAfterSave { get; set; }
    public int ReadDelay { get; set; }
    public int SaveDelay { get; set; }
    public int SaveCount { get; private set; }
    public RecordMutation? LastMutation { get; private set; }
    private ulong nextId = 1;
    private RecordsDto Data(RecordKey key)
    {
        var tenant = tenants.Rows.SingleOrDefault(row => row.RoomNo == key.RoomNo && row.SerialNo == key.SerialNo && row.MoveInDate == key.MoveInDate)
            ?? throw new RecordOperationException(404,"対象の入居者が存在しません。");
        if(!records.TryGetValue(key,out var data)) records[key]=data=new(key.RoomNo,key.SerialNo,key.MoveInDate,key.RecordDate.ToString("yyyy-MM-dd"),tenant.TenantName,[],null,null);
        return data;
    }
    private RecordsDto Copy(RecordsDto data)
    {
        var clone=JsonSerializer.Deserialize<RecordsDto>(JsonSerializer.Serialize(data))!;
        foreach(var row in clone.Meals.Cast<RecordAuditDto>().Concat(clone.Vital is null?[]:new[]{clone.Vital}).Concat(clone.Bath is null?[]:new[]{clone.Bath}))row.ConcurrencyToken=version.Create(row);
        return clone;
    }
    public async Task<RecordsDto> GetAsync(RecordKey key)
    {
        if(ReadDelay>0)await Task.Delay(ReadDelay);
        if(FailReads)throw new InvalidOperationException("Private SQL details");
        await mutex.WaitAsync();try{return Copy(Data(key));}finally{mutex.Release();}
    }
    public async Task<RecordSaveResult> SaveAsync(string actorCode,RecordMutation mutation)
    {
        if(SaveDelay>0)await Task.Delay(SaveDelay);
        if(FailSaves)throw new InvalidOperationException("Private SQL details");
        await mutex.WaitAsync();try {
            if(!staff.Rows.TryGetValue(actorCode,out var actor)||!actor.IsActive)throw new RecordOperationException(401,"認証が無効です。");
            var data=Data(mutation.Key);
            RecordAuditDto? before=mutation.Kind switch {"meal"=>data.Meals.SingleOrDefault(row=>row.MealType==mutation.MealType),"vital"=>data.Vital,_=>data.Bath};
            version.Check(before,mutation.Value.ConcurrencyToken);
            if(mutation.Value is BathSaveDto bath && (!staff.Rows.TryGetValue(bath.CaregiverCode,out var caregiver)||!caregiver.IsActive))throw new RecordOperationException(400,"有効な介護者を選択してください。","caregiverCode");
            var id=before?.RecordId??nextId++;
            RecordAuditDto row;
            switch(mutation.Value) {
                case MealSaveDto m:
                    var meal=new MealRecordDto{MealType=mutation.MealType!,PerformedAt=mutation.RecordedAt,RiceAmount=m.RiceAmount,SideDishAmount=m.SideDishAmount,MedicationType=m.MedicationType,EyeDrops=m.EyeDrops,OralCare=m.OralCare,Memo=m.Memo};
                    records[mutation.Key]=data with{Meals=data.Meals.Where(value=>value.MealType!=mutation.MealType).Append(meal).ToList()};row=meal;break;
                case VitalSaveDto v:
                    var vital=new VitalRecordDto{MeasuredAt=mutation.RecordedAt,HeightCm=v.HeightCm,WeightKg=v.WeightKg,SystolicBloodPressure=v.SystolicBloodPressure,DiastolicBloodPressure=v.DiastolicBloodPressure,TemperatureC=v.TemperatureC,RespirationRate=v.RespirationRate,PulseRate=v.PulseRate,Spo2Percent=v.Spo2Percent};
                    records[mutation.Key]=data with{Vital=vital};row=vital;break;
                case BathSaveDto b:
                    var bathRow=new BathRecordDto{BathedAt=mutation.RecordedAt,CaregiverCode=b.CaregiverCode,CaregiverName=staff.Rows[b.CaregiverCode].StaffName,SystolicBloodPressure=b.SystolicBloodPressure,DiastolicBloodPressure=b.DiastolicBloodPressure,BathMethod=b.BathMethod};
                    records[mutation.Key]=data with{Bath=bathRow};row=bathRow;break;
                default:throw new InvalidOperationException();
            }
            row.RecordId=id;row.UpdatedBy=actorCode;row.UpdatedByName=actor.StaffName;row.UpdatedAt=new DateTime(2026,10,12,12,30,0);
            if(before is null)Creation[id]=(actorCode,row.UpdatedAt);
            SaveCount++;LastMutation=mutation;
            if(FailRefreshAfterSave)FailReads=true;
            return new(id,before is null);
        }finally{mutex.Release();}
    }
}
