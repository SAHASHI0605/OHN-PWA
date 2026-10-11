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

if (args.Contains("--schema")) { await SchemaCheck.Run(); await FirstFloorSchemaCheck.Run(); return; }
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
builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://127.0.0.1:5179", "http://127.0.0.1:5180").AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseRouting(); app.UseCors(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
app.Urls.Add("http://127.0.0.1:7200");
await app.StartAsync();
if (args.Contains("--serve")) {
    Console.WriteLine("Verification API only; in-memory data: http://127.0.0.1:7200/api");
    await app.WaitForShutdownAsync(); return;
}


var passed = 0;
void Check(bool condition,string name) { if(!condition) throw new Exception("FAILED: "+name); passed++; Console.WriteLine("PASS "+name); }
using var client = new HttpClient { BaseAddress=new Uri("http://127.0.0.1:7200/api/") };
async Task<string> Login(string code) { var response=await client.PostAsJsonAsync("auth/login",new LoginRequestDto { EmployeeNumber=code,Password="test-password" }); response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token; }
void Authenticate(string token) => client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token);
try {
    Check((await client.GetAsync("residents/floors/1")).StatusCode==HttpStatusCode.Unauthorized,"Anonymous selection API rejected");
    var generalToken=await Login("S001"); Authenticate(generalToken);
    var response=await client.GetAsync("residents/floors/1");
    Check(response.IsSuccessStatusCode,"General active staff can read selection API");
    var values=(await response.Content.ReadFromJsonAsync<List<ResidentSelectionDto>>())!;
    Check(values.Count==21,"All first-floor residents returned without admin pagination");
    Check(values.All(value=>TenantRooms.Ordered.Take(19).Contains(value.RoomNo)),"Only the 19 first-floor rooms included");
    Check(values.All(value=>value.SerialNo is "1" or "2"),"Only serial 1 and 2 included");
    Check(values.All(value=>value.TenantName!="過去の入居者"),"Departed residents excluded");
    Check(values.All(value=>value.RoomNo!="115"),"Empty room has no resident records");
    Check(values.Count(value=>value.RoomNo=="VIP")==2,"VIP supports two residents");
    Check(values.Count(value=>value.RoomNo=="112" && value.TenantName=="同姓同名の確認利用者")==2,"Same-name residents remain separate by serial");
    Check(values.Select(value=>(value.RoomNo,value.SerialNo,value.MoveInDate)).Distinct().Count()==values.Count,"Full composite keys identify all residents");
    Check(values.Where(value=>value.RoomNo=="112").Select(value=>value.SerialNo).SequenceEqual(new[]{"1","2"}),"Stable serial ordering");
    Check(values.All(value=>value.MoveInDate.Kind==DateTimeKind.Unspecified),"DATETIME identities have no timezone conversion");
    var json=await response.Content.ReadAsStringAsync();
    Check(!json.Contains("password") && !json.Contains("version") && !json.Contains("residentId"),"Read DTO excludes staff secrets and fake person IDs");
    Check(response.Headers.CacheControl?.NoStore==true,"Selection responses are not cached");
    Check((await client.GetAsync("admin/residents")).StatusCode==HttpStatusCode.Forbidden,"Admin maintenance authorization remains restricted");
    Check((await client.PostAsJsonAsync("residents/floors/1",new{})).StatusCode==HttpStatusCode.MethodNotAllowed,"Selection endpoint is read only");
    repository.Rows["S001"].IsActive=false;
    Check((await client.GetAsync("residents/floors/1")).StatusCode==HttpStatusCode.Unauthorized,"Disabled staff's existing JWT rejected");
    repository.Rows["S001"].IsActive=true;
    selection.FailReads=true; var failure=await client.GetAsync("residents/floors/1");
    Check(failure.StatusCode==HttpStatusCode.InternalServerError && !(await failure.Content.ReadAsStringAsync()).Contains("Private SQL"),"Repository failure sanitized");
    selection.FailReads=false;
    var duplicate=new Ohana.Server.Models.Tenant { RoomNo="112",SerialNo="1",TenantName="別履歴",MoveInDate=new DateTime(2026,6,1) }; residents.Rows.Add(duplicate);
    Check((await client.GetAsync("residents/floors/1")).StatusCode==HttpStatusCode.Conflict,"Ambiguous active histories rejected rather than selecting a wrong person");
    residents.Rows.Remove(duplicate);
    Check((await client.GetAsync("residents/floors/1")).IsSuccessStatusCode,"Retry after master correction succeeds");
    var secondResponse=await client.GetAsync("residents/floors/2");
    Check(secondResponse.IsSuccessStatusCode,"Second floor shares authorized API");
    var second=(await secondResponse.Content.ReadFromJsonAsync<List<ResidentSelectionDto>>())!;
    Check(second.Count==23,"All active second-floor residents returned");
    Check(second.All(value=>TenantRooms.Ordered.Skip(19).Contains(value.RoomNo)),"Only 23 second-floor rooms, no VIP");
    Check(second.All(value=>value.SerialNo is "1" or "2"),"Second-floor allowed serials");
    Check(second.All(value=>value.RoomNo!="205"),"Second-floor empty room excluded from resident data");
    Check(second.All(value=>value.TenantName!="退居済み2階利用者"),"Second-floor departed history excluded");
    Check(second.Count(value=>value.RoomNo=="201")==2,"Second-floor same-name residents distinct");
    Check(second.Single(value=>value.RoomNo=="201" && value.SerialNo=="2").MoveInDate.Hour==12,"Composite identity retains non-midnight DATETIME");
    Check(second.Select(value=>(value.RoomNo,value.SerialNo,value.MoveInDate)).Distinct().Count()==second.Count,"Second-floor unique composite keys");
    Check(second.Where(value=>value.RoomNo=="201").Select(value=>value.SerialNo).SequenceEqual(new[]{"1","2"}),"Second-floor stable serial order");
    Check(secondResponse.Headers.CacheControl?.NoStore==true,"Second-floor no-store");
    Check((await client.GetAsync("residents/floors/3")).StatusCode==HttpStatusCode.BadRequest,"Unsupported floor rejected");
    selection.FailReads=true;
    Check((await client.GetAsync("residents/floors/2")).StatusCode==HttpStatusCode.InternalServerError,"Second-floor fetch failure distinguished");
    selection.FailReads=false;
    Check((await client.GetAsync("residents/floors/2")).IsSuccessStatusCode,"Second-floor retry succeeds");
    Check((await client.PostAsJsonAsync("residents/floors/2",new{})).StatusCode==HttpStatusCode.MethodNotAllowed,"Second-floor endpoint read-only");
    Authenticate(await Login("ADMIN01"));
    Check((await client.GetAsync("residents/floors/1")).IsSuccessStatusCode,"Admins retain selection access");
    Check((await client.GetAsync("admin/residents")).IsSuccessStatusCode,"Resident maintenance API unchanged");
    Check((await client.GetAsync("admin/staff")).IsSuccessStatusCode,"Staff maintenance API unchanged");
    Check((await client.GetAsync("staff/login-options")).IsSuccessStatusCode,"Existing public login-options unchanged");
    Console.WriteLine($"ALL {passed} FLOOR SELECTION CHECKS PASSED (memory repository; no real DB writes).");
} finally { await app.StopAsync(); await app.DisposeAsync(); }

