using System.Globalization;
using System.Text;
using Ohana.Server.DTOs.Records;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;

namespace Ohana.Server.Services;

public class RecordService(IRecordRepository repository, IStaffRepository staffRepository) : IRecordService
{
    private static void Invalid(string field, string message) => throw new RecordOperationException(400, message, field);
    private static DateTime Date(string value, string format, string field)
    {
        if (!DateTime.TryParseExact(value, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) || date.Year < 1000)
            Invalid(field, "日付・日時の形式が不正です。日本時間の日時を指定してください。");
        return DateTime.SpecifyKind(date, DateTimeKind.Unspecified);
    }
    private static RecordKey Key(RecordQueryDto value)
    {
        if (!TenantRooms.IsValid(value.RoomNo)) Invalid("roomNo", "部屋番号の指定が不正です。");
        if (value.SerialNo is not ("1" or "2")) Invalid("serialNo", "連番は1または2を指定してください。");
        return new(value.RoomNo.ToUpperInvariant(), value.SerialNo, Date(value.MoveInDate, "yyyy-MM-dd'T'HH:mm:ss", "moveInDate"), Date(value.RecordDate, "yyyy-MM-dd", "recordDate"));
    }
    private static DateTime Timestamp(string value, RecordKey key, string field)
    {
        var time = Date(value, "yyyy-MM-dd'T'HH:mm:ss", field);
        if (time.Date != key.RecordDate) Invalid(field, "記録日時の日付は対象日と一致させてください。");
        return time;
    }
    private static void Integer(int? value, int max, string field, string label)
    {
        if (value is < 0 || value > max) Invalid(field, $"{label}は0～{max}の整数を入力してください。");
    }
    private static void Decimal(decimal? value, decimal max, string field, string label)
    {
        if (value is < 0 || value > max || (value.HasValue && decimal.Round(value.Value, 1) != value))
            Invalid(field, $"{label}は0～{max}、小数第1位までで入力してください。");
    }
    private static void Choice(string? value, string[] allowed, string field, string label)
    {
        if (value is not null && !allowed.Contains(value)) Invalid(field, $"{label}の選択肢が不正です。");
    }
    public Task<RecordsDto> GetAsync(RecordQueryDto query) => repository.GetAsync(Key(query));
    public async Task<IReadOnlyList<CaregiverDto>> GetCaregiversAsync() =>
        (await staffRepository.GetActiveStaffAsync()).Select(value => new CaregiverDto(value.StaffCode, value.StaffName)).ToList();
    public Task<RecordSaveResult> SaveMealAsync(string actorCode, string mealType, MealSaveDto request)
    {
        var key = Key(request);
        Choice(mealType, ["朝食", "昼食", "おやつ", "夕食"], "mealType", "食事区分");
        Integer(request.RiceAmount, 10, "riceAmount", "主食"); Integer(request.SideDishAmount, 10, "sideDishAmount", "副食");
        Choice(request.MedicationType, ["なし", "食前薬", "食後薬", "食前後薬", "就寝前薬"], "medicationType", "服薬");
        Choice(request.EyeDrops, ["実施", "拒否"], "eyeDrops", "点眼");
        Choice(request.OralCare, ["はみがき", "うがい", "義歯洗浄"], "oralCare", "口腔ケア");
        if (request.Memo is not null && Encoding.UTF8.GetByteCount(request.Memo) > 65535) Invalid("memo", "メモがDBの保存可能な長さを超えています。");
        return repository.SaveAsync(actorCode, new("meal", key, Timestamp(request.PerformedAt, key, "performedAt"), request, mealType));
    }
    public Task<RecordSaveResult> SaveVitalAsync(string actorCode, VitalSaveDto request)
    {
        var key = Key(request);
        Decimal(request.HeightCm, 9999.9m, "heightCm", "身長"); Decimal(request.WeightKg, 9999.9m, "weightKg", "体重");
        Integer(request.SystolicBloodPressure, 65535, "systolicBloodPressure", "血圧 上"); Integer(request.DiastolicBloodPressure, 65535, "diastolicBloodPressure", "血圧 下");
        Decimal(request.TemperatureC, 999.9m, "temperatureC", "体温");
        Integer(request.RespirationRate, 65535, "respirationRate", "呼吸"); Integer(request.PulseRate, 65535, "pulseRate", "脈拍");
        Decimal(request.Spo2Percent, 999.9m, "spo2Percent", "SpO2");
        return repository.SaveAsync(actorCode, new("vital", key, Timestamp(request.MeasuredAt, key, "measuredAt"), request));
    }
    public Task<RecordSaveResult> SaveBathAsync(string actorCode, BathSaveDto request)
    {
        var key = Key(request);
        if (string.IsNullOrWhiteSpace(request.CaregiverCode) || request.CaregiverCode.Length > 8) Invalid("caregiverCode", "介護者を選択してください。");
        if (string.IsNullOrEmpty(request.BathMethod)) Invalid("bathMethod", "入浴方法を選択してください。");
        Choice(request.BathMethod, ["全身浴", "半身浴", "シャワー浴", "機械浴", "清拭"], "bathMethod", "入浴方法");
        Integer(request.SystolicBloodPressure, 65535, "systolicBloodPressure", "血圧 上"); Integer(request.DiastolicBloodPressure, 65535, "diastolicBloodPressure", "血圧 下");
        return repository.SaveAsync(actorCode, new("bath", key, Timestamp(request.BathedAt, key, "bathedAt"), request));
    }
}
