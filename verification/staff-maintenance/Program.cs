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
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://127.0.0.1:5176", "http://127.0.0.1:5177").AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseRouting(); app.UseCors(); app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
app.Urls.Add("http://127.0.0.1:7198");
await app.StartAsync();
if (args.Contains("--serve")) {
    Console.WriteLine("Verification API only; in-memory data: http://127.0.0.1:7198/api");
    await app.WaitForShutdownAsync(); return;
}
var passed = 0;
void Check(bool condition, string name) { if (!condition) throw new Exception("FAILED: " + name); passed++; Console.WriteLine("PASS " + name); }
using var client = new HttpClient { BaseAddress = new Uri("http://127.0.0.1:7198/api/") };
async Task<string> Login(string code, string password = "test-password") {
    var response = await client.PostAsJsonAsync("auth/login", new LoginRequestDto { EmployeeNumber = code, Password = password });
    response.EnsureSuccessStatusCode();
    return (await response.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token;
}
void Authenticate(string token) => client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
async Task<StaffDetailDto> Detail(string code) => (await client.GetFromJsonAsync<StaffDetailDto>("admin/staff/" + code))!;
UpdateStaffDto Edit(StaffDetailDto staff, int? role = null, bool? active = null, string? name = null) => new() { StaffName = name ?? staff.StaffName, Role = role ?? staff.Role, IsActive = active ?? staff.IsActive, Version = staff.Version };
try {
    Check((await client.GetAsync("admin/staff")).StatusCode == HttpStatusCode.Unauthorized, "Unauthenticated API is 401");
    Check((await client.GetAsync("staff/login-options")).IsSuccessStatusCode, "Public staff options remain available");
    var generalToken = await Login("S001"); Authenticate(generalToken);
    Check((await client.GetAsync("verification/protected")).IsSuccessStatusCode, "Active general staff can access generic authenticated APIs");
    Check((await client.GetAsync("admin/staff")).StatusCode == HttpStatusCode.Forbidden, "General staff list is 403");
    Check((await client.GetAsync("admin/staff/S001")).StatusCode == HttpStatusCode.Forbidden, "General staff detail is 403");
    Check((await client.PostAsJsonAsync("admin/staff", new { })).StatusCode == HttpStatusCode.Forbidden, "General staff creation is 403");
    Check((await client.PutAsJsonAsync("admin/staff/S001", new { })).StatusCode == HttpStatusCode.Forbidden, "General staff update is 403");
    Check((await client.PutAsJsonAsync("admin/staff/S001/password", new { })).StatusCode == HttpStatusCode.Forbidden, "General staff password reset is 403");
    var adminToken = await Login("ADMIN01"); Authenticate(adminToken);
    var first = (await client.GetFromJsonAsync<StaffPageDto>("admin/staff"))!;
    Check(first.Items.Count == 20 && first.TotalCount == 44 && first.Page == 1, "20-row default active page");
    Check(first.Items[0].StaffCode == "ADMIN01", "Staff code ascending order");
    Check(!((await client.GetStringAsync("admin/staff")).Contains("passwordHash", StringComparison.OrdinalIgnoreCase)), "No password hash in list JSON");
    Check(!(await client.GetStringAsync("admin/staff/S001")).Contains("passwordHash", StringComparison.OrdinalIgnoreCase), "No password hash in detail JSON");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?keyword=S001"))!.TotalCount == 1, "Code substring");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?keyword=" + Uri.EscapeDataString("スタッフ01")))!.TotalCount == 1, "Name substring OR code");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?role=0"))!.TotalCount == 2, "Role filter");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?isActive=false"))!.TotalCount == 1, "Inactive filter");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?isActive="))!.TotalCount == 45, "All-state query binds to null");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?keyword=missing"))!.TotalCount == 0, "Empty search");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?page=2"))!.Page == 2, "Second page");
    Check((await client.GetFromJsonAsync<StaffPageDto>("admin/staff?page=99"))!.Page == 3, "Missing page clamps to last valid page");
    Check((await client.GetAsync("admin/staff?role=2")).StatusCode == HttpStatusCode.BadRequest, "Invalid role rejected");
    Check((await client.GetAsync("admin/staff?page=0")).StatusCode == HttpStatusCode.BadRequest, "Invalid page rejected");
    Check((await client.GetAsync("admin/staff/missing")).StatusCode == HttpStatusCode.NotFound, "Missing staff is 404");
    var create = new CreateStaffDto { StaffCode = "NEW001", StaffName = "登録確認", Password = " AbCd123! ", PasswordConfirmation = " AbCd123! " };
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.Created, "Create staff");
    Check(BCrypt.Net.BCrypt.Verify(create.Password, repository.Rows["NEW001"].PasswordHash), "Existing BCrypt login compatibility");
    Check(!BCrypt.Net.BCrypt.Verify(create.Password.Trim(), repository.Rows["NEW001"].PasswordHash), "Passwords are not trimmed");
    Check(!BCrypt.Net.BCrypt.Verify(create.Password.ToLowerInvariant(), repository.Rows["NEW001"].PasswordHash), "Passwords are case sensitive");
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.Conflict, "Duplicate code rejected");
    create.StaffCode = "new001";
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.Conflict, "Case-insensitive duplicate rejected");
    create.StaffCode = "TOOLONG01";
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.BadRequest, "Oversize code rejected");
    create.StaffCode = "NEW002"; create.PasswordConfirmation = "wrong";
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.BadRequest, "Password mismatch rejected");
    create.Password = "short"; create.PasswordConfirmation = "short";
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.BadRequest, "Short password rejected");
    create.Password = new string('a', 65); create.PasswordConfirmation = create.Password;
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.BadRequest, "65-character password rejected");
    create.Password = new string('a', 64); create.PasswordConfirmation = create.Password;
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.Created, "64-character password accepted");
    create.StaffCode = "SPACES"; create.Password = "        "; create.PasswordConfirmation = create.Password;
    Check((await client.PostAsJsonAsync("admin/staff", create)).StatusCode == HttpStatusCode.Created, "No composition rule or whitespace trimming for 8-character passwords");
    var original = await Detail("NEW001");
    Check((await client.PutAsJsonAsync("admin/staff/NEW001", Edit(original, name: "編集確認"))).IsSuccessStatusCode, "Edit name");
    Check((await Detail("NEW001")).StaffName == "編集確認", "Edited name persisted");
    Check((await client.PutAsJsonAsync("admin/staff/NEW001", Edit(original))).StatusCode == HttpStatusCode.Conflict, "Stale edit conflicts within same timestamp second");
    var target = await Detail("NEW001");
    Check((await client.PutAsJsonAsync("admin/staff/NEW001/password", new ResetStaffPasswordDto { Password = "NewPASS123!", PasswordConfirmation = "NewPASS123!", Version = target.Version })).IsSuccessStatusCode, "Reset password");
    Check(BCrypt.Net.BCrypt.Verify("NewPASS123!", repository.Rows["NEW001"].PasswordHash), "Reset hash compatible");
    Check((await client.PutAsJsonAsync("admin/staff/NEW001/password", new ResetStaffPasswordDto { Password = "Another123!", PasswordConfirmation = "Another123!", Version = target.Version })).StatusCode == HttpStatusCode.Conflict, "Stale password reset rejected");
    Check((await client.PostAsJsonAsync("auth/login", new LoginRequestDto { EmployeeNumber = "NEW001", Password = "NewPASS123!" })).IsSuccessStatusCode, "Reset password authenticates through existing login");
    var self = await Detail("ADMIN01");
    Check((await client.PutAsJsonAsync("admin/staff/ADMIN01", Edit(self, active: false))).StatusCode == HttpStatusCode.Conflict, "Self disable rejected");
    Check((await client.PutAsJsonAsync("admin/staff/ADMIN01", Edit(self, role: 1))).StatusCode == HttpStatusCode.Conflict, "Self downgrade rejected");
    Check((await client.PutAsJsonAsync("admin/staff/ADMIN01", Edit(self, name: "本人名称変更"))).IsSuccessStatusCode, "Self name edit allowed");
    var secondToken = await Login("ADMIN02");
    target = await Detail("S001");
    Check((await client.PutAsJsonAsync("admin/staff/S001", Edit(target, active: false))).IsSuccessStatusCode, "Disable staff");
    Authenticate(generalToken);
    Check((await client.GetAsync("verification/protected")).StatusCode == HttpStatusCode.Unauthorized, "Disabled JWT rejected by generic authenticated API");
    Check((await client.GetAsync("admin/staff")).StatusCode == HttpStatusCode.Unauthorized, "Disabled staff's existing JWT rejected at next protected API");
    Check((await client.PostAsJsonAsync("auth/login", new LoginRequestDto { EmployeeNumber = "S001", Password = "test-password" })).StatusCode == HttpStatusCode.Unauthorized, "Disabled staff cannot log in");
    Check((await client.GetAsync("staff/login-options")).IsSuccessStatusCode, "Public API still works with disabled JWT");
    Authenticate(adminToken); target = await Detail("S001");
    Check((await client.PutAsJsonAsync("admin/staff/S001", Edit(target, active: true))).IsSuccessStatusCode, "Re-enable staff");
    Check((await client.PostAsJsonAsync("auth/login", new LoginRequestDto { EmployeeNumber = "S001", Password = "test-password" })).IsSuccessStatusCode, "Re-enabled login works");
    Authenticate(generalToken);
    Check((await client.GetAsync("verification/protected")).IsSuccessStatusCode, "Re-enabled staff can access generic authenticated API");
    Authenticate(adminToken);
    target = await Detail("ADMIN02");
    Check((await client.PutAsJsonAsync("admin/staff/ADMIN02", Edit(target, role: 1))).IsSuccessStatusCode, "Downgrade other admin while one remains");
    Authenticate(secondToken);
    Check((await client.GetAsync("admin/staff")).StatusCode == HttpStatusCode.Forbidden, "Old admin JWT uses current DB role, returns 403");
    Authenticate(adminToken);
    var svc = app.Services.GetRequiredService<IStaffMaintenanceService>();
    repository.Rows["ADMIN02"].Role = 0;
    var a = await svc.GetDetailAsync("ADMIN01"); var b = await svc.GetDetailAsync("ADMIN02");
    var operations = new[] { (Actor: "ADMIN01", Target: "ADMIN02", Value: b), (Actor: "ADMIN02", Target: "ADMIN01", Value: a) };
    var outcomes = await Task.WhenAll(operations.Select(async operation => {
        try { await svc.UpdateAsync(operation.Actor, operation.Target, Edit(operation.Value, role: 1)); return 200; }
        catch (StaffOperationException error) { return error.StatusCode; }
    }));
    Check(outcomes.Count(value => value == 200) == 1 && repository.Rows.Values.Count(value => value.IsActive && value.Role == 0) == 1, "Concurrent admin downgrades preserve one active admin under mutation serialization");
    repository.Rows.Remove("S002");
    var missingToken = new JwtTokenGenerator(builder.Configuration).Generate(new Ohana.Server.Models.Staff { StaffCode = "S002", Role = 1 });
    Authenticate(missingToken);
    Check((await client.GetAsync("admin/staff")).StatusCode == HttpStatusCode.Unauthorized, "Deleted/missing staff JWT is 401");
    Authenticate(adminToken); repository.FailReads = true;
    Check((await client.GetAsync("admin/staff")).StatusCode == HttpStatusCode.Unauthorized, "DB authentication failure fails closed");
    Console.WriteLine($"ALL {passed} CHECKS PASSED (in-memory repository; real MySQL locking/SQL requires a test DB).");
} finally { await app.StopAsync(); }
