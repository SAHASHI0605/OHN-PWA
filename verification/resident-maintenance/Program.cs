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

if (args.Contains("--schema")) { await SchemaCheck.Run(); return; }
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
builder.Services.AddSingleton<IResidentMaintenanceRepository>(new MemoryResidentRepository(repository));
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
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://127.0.0.1:5178", "http://127.0.0.1:5177").AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseRouting(); app.UseCors(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
app.Urls.Add("http://127.0.0.1:7199");
await app.StartAsync();
if (args.Contains("--serve")) {
    Console.WriteLine("Verification API only; in-memory data: http://127.0.0.1:7199/api");
    await app.WaitForShutdownAsync(); return;
}

var passed = 0;
void Check(bool condition, string name) { if (!condition) throw new Exception("FAILED: " + name); passed++; Console.WriteLine("PASS " + name); }
using var client = new HttpClient { BaseAddress = new Uri("http://127.0.0.1:7199/api/") };
async Task<string> Login(string code) {
    var response = await client.PostAsJsonAsync("auth/login", new LoginRequestDto { EmployeeNumber = code, Password = "test-password" });
    response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token;
}
void Authenticate(string token) => client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
string PathFor(string room, string serial, string date) => "admin/residents/" + room + "/" + serial + "?moveInDate=" + Uri.EscapeDataString(date);
async Task<ResidentDetailDto> Detail(string room, string serial, string date) => (await client.GetFromJsonAsync<ResidentDetailDto>(PathFor(room, serial, date)))!;
Task<HttpResponseMessage> Create(string room, string serial, string name, string date, string? end = null) => client.PostAsJsonAsync("admin/residents", new { roomNo = room, serialNo = serial, tenantName = name, moveInDate = date, moveOutDate = end });
Task<HttpResponseMessage> Update(ResidentDetailDto value, string name, string? end = null) => client.PutAsJsonAsync(PathFor(value.RoomNo, value.SerialNo, value.MoveInDate.ToString("yyyy-MM-dd'T'HH:mm:ss")), new { tenantName = name, moveOutDate = end, version = value.Version });
async Task<ResidentPageDto> Search(string query = "") => (await client.GetFromJsonAsync<ResidentPageDto>("admin/residents" + query))!;
try {
    Check((await client.GetAsync("admin/residents")).StatusCode == HttpStatusCode.Unauthorized, "Anonymous list rejected");
    Check((await client.PostAsJsonAsync("admin/residents", new {})).StatusCode == HttpStatusCode.Unauthorized, "Anonymous create rejected");
    Check((await client.GetAsync(PathFor("101", "1", "2026-04-01T00:00:00"))).StatusCode == HttpStatusCode.Unauthorized, "Anonymous detail rejected");
    Check((await client.PutAsJsonAsync(PathFor("101", "1", "2026-04-01T00:00:00"),new {})).StatusCode == HttpStatusCode.Unauthorized, "Anonymous update rejected");
    Authenticate(await Login("S001"));
    Check((await client.GetAsync("admin/residents")).StatusCode == HttpStatusCode.Forbidden, "General staff list rejected");
    Check((await client.GetAsync(PathFor("101", "1", "2026-04-01T00:00:00"))).StatusCode == HttpStatusCode.Forbidden, "General staff detail rejected");
    Check((await client.PostAsJsonAsync("admin/residents", new {})).StatusCode == HttpStatusCode.Forbidden, "General staff create rejected");
    Check((await client.PutAsJsonAsync(PathFor("101", "1", "2026-04-01T00:00:00"), new {})).StatusCode == HttpStatusCode.Forbidden, "General staff update rejected");
    var token = await Login("ADMIN01"); Authenticate(token);
    var initial = await Search();
    Check(initial.PageSize == 20 && initial.Items.Count == 20 && initial.TotalCount == 43 && initial.Items.All(value => value.MoveOutDate is null), "Default current residents, 20-row server paging");
    Check((await Search("?roomNo=101")).Items.Count == 2, "Room filter includes both serials");
    Check((await Search("?name=入居者VIP")).Items.Single().RoomNo == "VIP", "Name literal substring search");
    Check((await Search("?name=%25")).TotalCount == 0, "Percent search remains literal");
    Check((await Search("?status=departed")).Items.Single().TenantName == "過去の入居者", "Departed filter");
    var all = await Search("?status=all");
    Check(all.TotalCount == 44, "All status includes history");
    Check(all.Items[0].MoveInDate > all.Items[1].MoveInDate && all.Items[2].SerialNo == "2", "Serial ascending and admission descending");
    var ordered = new List<ResidentDetailDto>(); for (var p=1; p<=3; p++) ordered.AddRange((await Search("?status=all&page=" + p)).Items);
    var vipIndex = ordered.FindIndex(value => value.RoomNo == "VIP");
    Check(ordered[vipIndex-1].RoomNo == "122" && ordered[vipIndex+1].RoomNo == "201", "VIP after 122 before 201");
    Check((await Search("?page=2")).Page == 2 && (await Search("?page=2")).Items.Count == 20, "Second page");
    Check((await Search("?page=999")).Page == 3, "Out-of-range page clamps");
    Check((await Search("?name=no-result&page=999")).Page == 1, "Empty results clamp to first page");
    Check((await client.GetAsync("admin/residents?roomNo=104")).StatusCode == HttpStatusCode.BadRequest, "Invalid room search rejected");
    Check((await client.GetAsync("admin/residents?status=invalid")).StatusCode == HttpStatusCode.BadRequest, "Invalid status rejected");
    Check((await client.GetAsync("admin/residents?page=0")).StatusCode == HttpStatusCode.BadRequest, "Invalid page rejected");
    Check((await client.GetAsync(PathFor("101", "1", "2020-01-01T00:00:00"))).StatusCode == HttpStatusCode.NotFound, "Missing target is 404");
    Check((await client.GetAsync(PathFor("101", "1", "2026-04-01T00:00:00Z"))).StatusCode == HttpStatusCode.BadRequest, "Timezone conversion rejected for exact DATETIME key");
    Check((await Create("102", "2", "確認登録", "2026-05-01")).StatusCode == HttpStatusCode.Created, "Create second serial concurrently occupied room");
    var created = await Detail("102", "2", "2026-05-01T00:00:00");
    Check(created.MoveOutDate is null && created.MoveInDate == new DateTime(2026,5,1) && created.MoveInDate.Kind == DateTimeKind.Unspecified, "Null end and midnight calendar date preserved");
    Check((await Create("102", "2", "重複", "2026-05-01")).StatusCode == HttpStatusCode.Conflict, "Duplicate composite key rejected");
    Check((await Create("102", "2", "期間重複", "2026-06-01")).StatusCode == HttpStatusCode.Conflict, "Open-ended period overlap rejected");
    Check((await Create("104", "1", "不正", "2026-01-01")).StatusCode == HttpStatusCode.BadRequest, "Invalid room rejected on create");
    Check((await Create("vip", "1", "不正", "2026-01-01")).StatusCode == HttpStatusCode.BadRequest, "Room allowlist requires exact VIP");
    Check((await Create("103", "3", "不正", "2026-01-01")).StatusCode == HttpStatusCode.BadRequest, "Invalid serial rejected");
    Check((await Create("103", "2", "   ", "2026-01-01")).StatusCode == HttpStatusCode.BadRequest, "Whitespace-only name rejected");
    Check((await Create("103", "2", new string('名',21), "2026-01-01")).StatusCode == HttpStatusCode.BadRequest, "Name over 20 rejected");
    Check((await client.PostAsJsonAsync("admin/residents", new {roomNo="103",serialNo="2",tenantName="日付なし"})).StatusCode == HttpStatusCode.BadRequest, "Missing admission rejected");
    Check((await Create("103", "2", "日付不正", "2026-02-30")).StatusCode == HttpStatusCode.BadRequest, "Invalid calendar date rejected");
    Check((await Create("103", "2", "日付不正", "0999-01-01")).StatusCode == HttpStatusCode.BadRequest, "MySQL minimum year enforced");
    Check((await Create("103", "2", "前日", "2026-05-01", "2026-04-30")).StatusCode == HttpStatusCode.BadRequest, "End before start rejected");
    Check((await Create("103", "2", "同日", "2026-05-01", "2026-05-01")).StatusCode == HttpStatusCode.Created, "Single-day occupancy accepted");
    Check((await Create("103", "2", "境界重複", "2026-05-01", "2026-06-01")).StatusCode == HttpStatusCode.Conflict, "Same-day handover rejected");
    Check((await Create("103", "2", "翌日", "2026-05-02", "2026-06-01")).StatusCode == HttpStatusCode.Created, "Next-day handover accepted");
    Check((await Create("105", "2", "確認登録", "2026-05-01", "2026-06-01")).StatusCode == HttpStatusCode.Created, "Same name in another room allowed");
    Check((await Update(created, "名前変更")).IsSuccessStatusCode, "Name-only edit excludes self from overlap");
    Check((await Update(created, "古い更新")).StatusCode == HttpStatusCode.Conflict, "Same-second stale version rejected");
    var edited = await Detail("102", "2", "2026-05-01T00:00:00");
    Check(edited.TenantName == "名前変更", "Edited name persisted");
    Check((await Update(edited, "名前変更", "2026-06-01")).IsSuccessStatusCode, "Set move-out date");
    edited = await Detail("102", "2", "2026-05-01T00:00:00");
    Check((await Update(edited, "名前変更", "2026-06-02")).IsSuccessStatusCode, "Change move-out date");
    edited = await Detail("102", "2", "2026-05-01T00:00:00");
    Check((await Update(edited, "名前変更")).IsSuccessStatusCode, "Clear move-out date to null");
    Check((await Detail("102", "2", "2026-05-01T00:00:00")).MoveOutDate is null, "Cleared date persisted as null");
    var historical = await Detail("101", "1", "2025-01-01T14:30:00");
    Check((await Update(historical, "過去の名称変更", "2026-03-31")).IsSuccessStatusCode, "Legacy non-midnight primary key preserved");
    historical = await Detail("101", "1", "2025-01-01T14:30:00");
    Check(historical.MoveInDate.Hour == 14 && historical.MoveInDate.Minute == 30, "Edit does not normalize existing key time");
    Check((await Update(historical, "期間延長", "2026-04-01")).StatusCode == HttpStatusCode.Conflict, "Edit overlap including same-day boundary rejected");
    Check((await Update(historical, "退居取消")).StatusCode == HttpStatusCode.Conflict, "Clearing historical end into occupied period rejected");
    Check((await Update(historical, "前日", "2024-12-31")).StatusCode == HttpStatusCode.BadRequest, "Edit end before admission rejected");
    var single = await Detail("103", "2", "2026-05-01T00:00:00");
    Check((await Update(single, "同日編集", "2026-05-01")).IsSuccessStatusCode, "Same period edit excludes only current record");
    var race = await Task.WhenAll(Create("106", "2", "同時登録A", "2026-07-01"), Create("106", "2", "同時登録B", "2026-07-02"));
    Check(race.Count(value=>value.StatusCode==HttpStatusCode.Created)==1 && race.Count(value=>value.StatusCode==HttpStatusCode.Conflict)==1, "Concurrent overlapping insert serialized (memory repository)");
    Check((await client.DeleteAsync(PathFor("102", "2", "2026-05-01T00:00:00"))).StatusCode == HttpStatusCode.MethodNotAllowed, "No delete endpoint");
    edited = await Detail("102", "2", "2026-05-01T00:00:00");
    Check((await client.PutAsJsonAsync(PathFor("102", "2", "2026-05-01T00:00:00"), new { tenantName="キー保護",moveOutDate=(string?)null,version=edited.Version,roomNo="228",serialNo="1",moveInDate="2000-01-01"})).IsSuccessStatusCode && (await Detail("102","2","2026-05-01T00:00:00")).RoomNo == "102", "Body cannot alter composite primary key");
    repository.Rows["ADMIN01"].Role = 1;
    Check((await client.GetAsync("admin/residents")).StatusCode == HttpStatusCode.Forbidden, "Existing admin JWT uses current role");
    repository.Rows["ADMIN01"].Role = 0; repository.Rows["ADMIN01"].IsActive = false;
    Check((await client.GetAsync("admin/residents")).StatusCode == HttpStatusCode.Unauthorized, "Disabled admin JWT rejected");
    repository.Rows["ADMIN01"].IsActive = true;
    Check((await client.GetAsync("staff/login-options")).IsSuccessStatusCode, "Existing public client API unchanged");
    var residentRepository = (MemoryResidentRepository)app.Services.GetRequiredService<IResidentMaintenanceRepository>(); residentRepository.FailReads=true;
    var failed = await client.GetAsync("admin/residents");
    Check(failed.StatusCode==HttpStatusCode.InternalServerError && !(await failed.Content.ReadAsStringAsync()).Contains("Verification error"), "DB errors sanitized");
    residentRepository.FailReads=false;
    Check((await client.GetAsync("admin/staff")).IsSuccessStatusCode, "Existing staff maintenance API still works");
    Console.WriteLine($"ALL {passed} RESIDENT CHECKS PASSED (in-memory repository; real MySQL SQL/locking requires a test DB).");
} finally { await app.StopAsync(); await app.DisposeAsync(); }
