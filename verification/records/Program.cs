using Ohana.Server.DTOs.Records;
using Ohana.Server.DTOs.Residents;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ohana.Server.Controllers;
using Ohana.Server.DTOs.Auth;
using Ohana.Server.DTOs.Staff;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;

if (args.Contains("--schema")) { await RecordSchemaCheck.Run(); return; }
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> {
    ["Jwt:Key"] = "verification-only-key-for-local-staff-tests-2026",
    ["Jwt:Issuer"] = "StaffVerification", ["Jwt:Audience"] = "StaffVerification", ["Jwt:ExpiresMinutes"] = "60"
});
builder.Logging.ClearProviders();
var repository = new MemoryStaffRepository();
builder.Services.AddSingleton(repository);
builder.Services.AddSingleton<IStaffRepository>(repository);
builder.Services.AddSingleton<IStaffMaintenanceRepository>(repository);
builder.Services.AddScoped<IStaffMaintenanceService, StaffMaintenanceService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddScoped<StaffVersion>();
builder.Services.AddScoped<StaffJwtBearerEvents>();
var residents = new MemoryResidentRepository(repository);
builder.Services.AddSingleton(residents);
residents.Rows.RemoveAll(value => value.RoomNo == "115");
residents.Rows.Single(value => value.RoomNo == "112").TenantName = "同姓同名の確認利用者";
residents.Rows.Add(new Ohana.Server.Models.Tenant { RoomNo="112", SerialNo="2", TenantName="同姓同名の確認利用者", MoveInDate=new DateTime(2026,5,1) });
residents.Rows.Add(new Ohana.Server.Models.Tenant { RoomNo="VIP", SerialNo="2", TenantName=new string('長',20), MoveInDate=new DateTime(2026,5,1) });
residents.Rows.Add(new Ohana.Server.Models.Tenant { RoomNo="101", SerialNo="3", TenantName="不正連番非表示", MoveInDate=new DateTime(2026,5,1) });
residents.Rows.RemoveAll(value => value.RoomNo == "205");
residents.Rows.Single(value => value.RoomNo == "201").TenantName = "同姓同名の2階利用者";
residents.Rows.Add(new Ohana.Server.Models.Tenant { RoomNo="201", SerialNo="2", TenantName="同姓同名の2階利用者", MoveInDate=new DateTime(2026,5,1,12,30,0) });
residents.Rows.Single(value => value.RoomNo == "228").TenantName = new string('長',20);
residents.Rows.Add(new Ohana.Server.Models.Tenant { RoomNo="202", SerialNo="2", TenantName="退居済み2階利用者", MoveInDate=new DateTime(2024,1,1), MoveOutDate=new DateTime(2025,1,1) });
builder.Services.AddSingleton<IResidentMaintenanceRepository>(residents);
var selection = new MemoryResidentSelectionRepository(residents);
builder.Services.AddSingleton(selection);
builder.Services.AddSingleton<IResidentSelectionRepository>(selection);
builder.Services.AddScoped<IResidentSelectionService, ResidentSelectionService>();
builder.Services.AddScoped<IResidentMaintenanceService, ResidentMaintenanceService>();
builder.Services.AddScoped<ResidentVersion>();
builder.Services.AddControllers().AddApplicationPart(typeof(StaffMaintenanceController).Assembly);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"], ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
    options.EventsType = typeof(StaffJwtBearerEvents);
});
builder.Services.AddSingleton<RecordVersion>();
builder.Services.AddSingleton<MemoryRecordRepository>();
builder.Services.AddSingleton<IRecordRepository>(services=>services.GetRequiredService<MemoryRecordRepository>());
builder.Services.AddScoped<IRecordService,RecordService>();
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://127.0.0.1:5179", "http://127.0.0.1:5180", "http://localhost:5180").AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseRouting(); app.UseCors(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
app.Urls.Add("http://127.0.0.1:7200");
await app.StartAsync();
if (args.Contains("--serve")) {
    Console.WriteLine("Verification API only; in-memory data: http://127.0.0.1:7200/api");
    await app.WaitForShutdownAsync(); return;
}


var passed=0;
void Check(bool value,string name){if(!value)throw new Exception("FAILED: "+name);passed++;Console.WriteLine("PASS "+name);}
using var client=new HttpClient{BaseAddress=new Uri("http://127.0.0.1:7200/api/")};
async Task<string> Login(string code){var response=await client.PostAsJsonAsync("auth/login",new LoginRequestDto{EmployeeNumber=code,Password="test-password"});response.EnsureSuccessStatusCode();return(await response.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token;}
void Auth(string token)=>client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token);
const string query="records?roomNo=101&serialNo=1&moveInDate=2026-04-01T00:00:00&recordDate=2026-10-10";
Dictionary<string,object?> Body()=>new(){["roomNo"]="101",["serialNo"]="1",["moveInDate"]="2026-04-01T00:00:00",["recordDate"]="2026-10-10"};
Dictionary<string,object?> Meal(){var b=Body();b["performedAt"]="2026-10-10T14:30:00";b["riceAmount"]=0;b["sideDishAmount"]=null;b["medicationType"]="なし";b["eyeDrops"]="実施";b["oralCare"]="はみがき";return b;}
async Task<RecordsDto> Get()=> (await client.GetFromJsonAsync<RecordsDto>(query))!;
async Task<RecordSaveResult> Put(string endpoint,object body){var response=await client.PutAsJsonAsync(endpoint,body);Check(response.StatusCode==HttpStatusCode.OK,"Save returns 200 "+endpoint);return(await response.Content.ReadFromJsonAsync<RecordSaveResult>())!;}
var memory=app.Services.GetRequiredService<MemoryRecordRepository>();
try {
 Check((await client.GetAsync(query)).StatusCode==HttpStatusCode.Unauthorized,"Anonymous GET rejected");
 Check((await client.PutAsJsonAsync("records/vital",new{})).StatusCode==HttpStatusCode.Unauthorized,"Anonymous PUT rejected");
 var token=await Login("S001");Auth(token);
 var initial=await Get();Check(initial.Meals.Count==0&&initial.Vital is null&&initial.Bath is null,"Unregistered date empty");
 var caregivers=(await client.GetFromJsonAsync<List<CaregiverDto>>("records/caregivers"))!;Check(caregivers.Any(value=>value.StaffCode=="S001")&&!caregivers.Any(value=>value.StaffCode=="S043"),"Only active caregiver codes/names");
 var m=Meal();m["concurrencyToken"]="new";m["createdBy"]="ADMIN02";m["updatedBy"]="ADMIN02";
 var first=await Put("records/meals/朝食",m);Check(first.Created,"Meal initial insert");
 var read=await Get();Check(read.Meals.Single().RiceAmount==0&&read.Meals.Single().SideDishAmount is null,"Null distinct from zero");
 Check(read.Meals.Single().MedicationType=="なし"&&read.Meals.Single().EyeDrops=="実施","Medication none and canonical eye drops");
 Check(read.Meals.Single().PerformedAt==new DateTime(2026,10,10,14,30,0),"Target date + displayed time, no UTC conversion");
 Check(read.Meals.Single().UpdatedBy=="S001"&&memory.Creation[first.RecordId].Actor=="S001","JWT actor used, body audit spoof ignored");
 m["concurrencyToken"]=read.Meals.Single().ConcurrencyToken;m["medicationType"]="食前後薬";m["memo"]="更新確認";
 Auth(await Login("S002"));var second=await Put("records/meals/朝食",m);
 Check(!second.Created&&second.RecordId==first.RecordId,"Meal update preserves ID");
 read=await Get();Check(read.Meals.Count==1&&read.Meals.Single().UpdatedBy=="S002"&&memory.Creation[first.RecordId].Actor=="S001","Update actor changed, creation unchanged");
 Check(read.Meals.Single().MedicationType=="食前後薬","Combined medication stored");
 Check((await client.PutAsJsonAsync("records/meals/朝食",m)).StatusCode==HttpStatusCode.Conflict,"Stale edit same second rejected");
 m.Remove("concurrencyToken");var lunch=await Put("records/meals/昼食",m);Check(lunch.Created&&lunch.RecordId!=first.RecordId,"Different meal separate ID");
 foreach(var type in new[]{"おやつ","夕食"})await Put("records/meals/"+type,m);
 Check((await Get()).Meals.Count==4,"Maximum four meal slots");
 m["medicationType"]=null;m["eyeDrops"]=null;m["oralCare"]=null;m["riceAmount"]=null;await Put("records/meals/昼食",m);
 var nullMeal=(await Get()).Meals.Single(row=>row.MealType=="昼食");Check(nullMeal.MedicationType is null&&nullMeal.EyeDrops is null&&nullMeal.OralCare is null&&nullMeal.RiceAmount is null,"Unselected optional values remain null");
 var v=Body();v["measuredAt"]="2026-10-10T09:15:22";v["heightCm"]=160.5m;v["weightKg"]=52.3m;v["spo2Percent"]=98.0m;
 var vital=await Put("records/vital",v);v["temperatureC"]=36.5m;var vitalAgain=await Put("records/vital",v);
 Check(vital.Created&&!vitalAgain.Created&&vital.RecordId==vitalAgain.RecordId,"Vital daily overwrite");
 Check((await Get()).Vital!.SystolicBloodPressure is null,"Vital blank persists as null");
 var b=Body();b["bathedAt"]="2026-10-10T23:59:00";b["caregiverCode"]="S001";b["bathMethod"]="全身浴";
 var bath=await Put("records/bath",b);b["bathMethod"]="清拭";var bathAgain=await Put("records/bath",b);
 Check(bath.Created&&!bathAgain.Created&&bath.RecordId==bathAgain.RecordId,"Bath daily overwrite");
 Check((await Get()).Bath!.CaregiverCode=="S001"&&(await Get()).Bath!.CaregiverName.Contains("確認用"),"Caregiver code stored, name displayed");
 Check((await client.GetFromJsonAsync<RecordsDto>(query.Replace("2026-10-10","2026-10-09")))!.Meals.Count==0,"Date isolation");
 Check((await client.GetFromJsonAsync<RecordsDto>(query.Replace("2026-04-01T00:00:00","2025-01-01T14:30:00")))!.Meals.Count==0,"Previous tenant same room isolated by exact DATETIME");
 Check((await client.GetAsync(query.Replace("2026-04-01T00:00:00","2025-01-01T00:00:00"))).StatusCode==HttpStatusCode.NotFound,"No inference for wrong admission time");
 Check((await client.GetAsync(query.Replace("2026-04-01T00:00:00","2026-04-01T00:00:00Z"))).StatusCode==HttpStatusCode.BadRequest,"Timezone suffix rejected");
 m["eyeDrops"]="○";var invalid=await client.PutAsJsonAsync("records/meals/朝食",m);Check(invalid.StatusCode==HttpStatusCode.BadRequest&&(await invalid.Content.ReadAsStringAsync()).Contains("eyeDrops"),"Legacy eye symbol rejected with field error");m["eyeDrops"]=null;
 foreach(var invalidAmount in new[]{-1,11}){m["riceAmount"]=invalidAmount;Check((await client.PutAsJsonAsync("records/meals/朝食",m)).StatusCode==HttpStatusCode.BadRequest,"Meal range rejected "+invalidAmount);}m["riceAmount"]=null;
 v["heightCm"]=160.55m;Check((await client.PutAsJsonAsync("records/vital",v)).StatusCode==HttpStatusCode.BadRequest,"Height precision rejected");v["heightCm"]=160.5m;
 v["systolicBloodPressure"]=65536;Check((await client.PutAsJsonAsync("records/vital",v)).StatusCode==HttpStatusCode.BadRequest,"Unsigned smallint overflow rejected");v["systolicBloodPressure"]=null;
 v["measuredAt"]="2026-10-12T09:00:00";Check((await client.PutAsJsonAsync("records/vital",v)).StatusCode==HttpStatusCode.BadRequest,"Timestamp must match record date");v["measuredAt"]="2026-10-10T09:00:00";
 b["caregiverCode"]="S043";Check((await client.PutAsJsonAsync("records/bath",b)).StatusCode==HttpStatusCode.BadRequest,"Inactive caregiver rejected");
 b["caregiverCode"]="確認用スタッフ";Check((await client.PutAsJsonAsync("records/bath",b)).StatusCode==HttpStatusCode.BadRequest,"Staff name never used as caregiver code");
 var malformed=await client.PutAsync("records/vital",new StringContent("{\"heightCm\":\"abc\"}",Encoding.UTF8,"application/json"));Check(malformed.StatusCode==HttpStatusCode.BadRequest&&(await malformed.Content.ReadAsStringAsync()).Contains("message"),"Malformed body follows message error convention");
 m["memo"]=new string('長',22000);Check((await client.PutAsJsonAsync("records/meals/朝食",m)).StatusCode==HttpStatusCode.BadRequest,"TEXT UTF-8 byte limit");m["memo"]="";
 memory.FailSaves=true;var failure=await client.PutAsJsonAsync("records/meals/朝食",m);Check(failure.StatusCode==HttpStatusCode.InternalServerError&&!(await failure.Content.ReadAsStringAsync()).Contains("Private SQL"),"DB error sanitized");memory.FailSaves=false;
 var parallelMeal=Meal();parallelMeal["recordDate"]="2026-10-11";parallelMeal["performedAt"]="2026-10-11T08:00:00";
 var parallel=await Task.WhenAll(Enumerable.Range(0,10).Select(_=>client.PutAsJsonAsync("records/meals/朝食",parallelMeal)));Check(parallel.All(response=>response.IsSuccessStatusCode),"Simultaneous saves succeed without duplicate slot");
 Check((await client.GetFromJsonAsync<RecordsDto>(query.Replace("2026-10-10","2026-10-11")))!.Meals.Count==1,"Parallel saves leave one row");
 repository.Rows["S002"].IsActive=false;Check((await client.GetAsync(query)).StatusCode==HttpStatusCode.Unauthorized,"Disabled staff existing JWT rejected");repository.Rows["S002"].IsActive=true;
 var jwt=new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().ReadJwtToken(token);
 var expired=new System.IdentityModel.Tokens.Jwt.JwtSecurityToken("StaffVerification","StaffVerification",jwt.Claims,DateTime.UtcNow.AddHours(-2),DateTime.UtcNow.AddHours(-1),new Microsoft.IdentityModel.Tokens.SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes("verification-only-key-for-local-staff-tests-2026")),Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256));
 Auth(new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(expired));Check((await client.GetAsync(query)).StatusCode==HttpStatusCode.Unauthorized,"Expired JWT rejected");
 Auth(token);Check((await client.GetAsync("admin/residents")).StatusCode==HttpStatusCode.Forbidden,"Admin rights unchanged");
 Auth(await Login("ADMIN01"));Check((await client.GetAsync("admin/residents")).IsSuccessStatusCode,"Admin resident maintenance intact");
 Console.WriteLine($"ALL {passed} RECORD API CHECKS PASSED (memory repository only; no real DB writes)");
}finally{await app.StopAsync();await app.DisposeAsync();}
