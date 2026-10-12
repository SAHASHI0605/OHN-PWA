using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using ClosedXML.Excel;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ohana.Server.Controllers;
using Ohana.Server.DTOs.Auth;
using Ohana.Server.DTOs.VitalReports;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Models;
using Ohana.Server.Repositories;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;
using Ohana.Server.Utilities;

Directory.SetCurrentDirectory(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory,"../../../../../")));
if(args.Contains("--format")||args.Contains("--format-before")){ExcelFormatCheck.Run(args.Contains("--format-before"));return;}

if(args.Contains("--schema")) {
    var config=new ConfigurationBuilder().SetBasePath(Path.GetFullPath("Ohana.Server")).AddJsonFile("appsettings.json",true).AddJsonFile("appsettings.Development.json",true).AddUserSecrets(typeof(Staff).Assembly,true).AddEnvironmentVariables().Build();
    var factory=new DbConnectionFactory(config);
    await using var connection=factory.CreateConnection(); await connection.OpenAsync();
    foreach(var table in new[]{"mst_tenant","trn_vital_record"}) {
        Console.WriteLine("DDL "+table);
        foreach(var column in await connection.QueryAsync("SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table ORDER BY ORDINAL_POSITION",new{Table=table})) Console.WriteLine(System.Text.Json.JsonSerializer.Serialize((IDictionary<string,object>)column));
        foreach(var index in await connection.QueryAsync("SELECT INDEX_NAME,NON_UNIQUE,GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) columns_list FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=@Table GROUP BY INDEX_NAME,NON_UNIQUE",new{Table=table})) Console.WriteLine(System.Text.Json.JsonSerializer.Serialize((IDictionary<string,object>)index));
    }
    var service=new VitalReportService(new VitalReportRepository(factory),new VitalReportExcelBuilder());
    foreach(var floor in new[]{1,2}) {
        var result=await service.DaysAsync(new(){Floor=floor,Year=2026,Month=10},default);
        Console.WriteLine($"REAL READ ONLY: floor={floor}, days={result.Days.Count}, totalRecords={result.Days.Sum(d=>d.RecordCount)}, selectableDays={result.Days.Count(d=>d.CanSelect)}");
    }
    Console.WriteLine("Only SELECT and read-only transaction executed. No real resident names exported."); return;
}
var builder=WebApplication.CreateBuilder(args);
builder.Configuration.AddInMemoryCollection(new Dictionary<string,string?>{["Jwt:Key"]="verification-only-key-for-local-staff-tests-2026",["Jwt:Issuer"]="StaffVerification",["Jwt:Audience"]="StaffVerification",["Jwt:ExpiresMinutes"]="60"});
builder.Logging.ClearProviders();
var staff=new MemoryStaffRepository(); var memory=new MemoryVitalReportRepository();
builder.Services.AddSingleton<IStaffRepository>(staff);
builder.Services.AddScoped<IAuthService,AuthService>(); builder.Services.AddScoped<JwtTokenGenerator>(); builder.Services.AddScoped<StaffJwtBearerEvents>();
builder.Services.AddSingleton<IVitalReportRepository>(memory); builder.Services.AddScoped<IVitalReportService,VitalReportService>(); builder.Services.AddScoped<VitalReportExcelBuilder>();
builder.Services.AddControllers().AddApplicationPart(typeof(VitalReportsController).Assembly);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options=> {
    options.TokenValidationParameters=new(){ValidateIssuer=true,ValidateAudience=true,ValidateLifetime=true,ValidateIssuerSigningKey=true,ValidIssuer="StaffVerification",ValidAudience="StaffVerification",IssuerSigningKey=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))}; options.EventsType=typeof(StaffJwtBearerEvents);
});
builder.Services.AddAuthorization();builder.Services.AddCors(o=>o.AddDefaultPolicy(p=>p.WithOrigins("http://127.0.0.1:5179").AllowAnyHeader().AllowAnyMethod()));
var app=builder.Build();app.UseCors();app.UseAuthentication();app.UseAuthorization();app.MapControllers();
app.MapPost("/verification/fail",()=>{memory.Fail=!memory.Fail;return new{memory.Fail};});
app.MapPost("/verification/drop",()=>{var removed=memory.Vitals.RemoveAll(v=>v.RecordDate==new DateTime(2026,10,12));return new{removed};});
app.MapPost("/verification/delay",(int ms)=>{memory.DelayMs=Math.Clamp(ms,0,5000);return new{memory.DelayMs};});
app.MapGet("/verification/reads",()=>new{memory.Reads});
app.Urls.Add("http://127.0.0.1:7210");await app.StartAsync();
if(args.Contains("--serve")){Console.WriteLine("In-memory report API: 7210");await app.WaitForShutdownAsync();return;}
using var client=new HttpClient{BaseAddress=new Uri("http://127.0.0.1:7210/api/")};
var passed=0;void Check(bool good,string name){if(!good)throw new Exception("FAILED "+name);Console.WriteLine("PASS "+name);passed++;}
async Task<string> Login(string code){var response=await client.PostAsJsonAsync("auth/login",new LoginRequestDto{EmployeeNumber=code,Password="test-password"});response.EnsureSuccessStatusCode();return(await response.Content.ReadFromJsonAsync<LoginResponseDto>())!.Token;}
void Auth(string token)=>client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token);
object Body(params string[] dates)=>new{floor=2,year=2026,month=10,dates};
const string days="admin/vital-reports/days?floor=2&year=2026&month=10";
try {
Check((await client.GetAsync(days)).StatusCode==HttpStatusCode.Unauthorized,"Anonymous 401");
Auth(await Login("S001"));Check((await client.GetAsync(days)).StatusCode==HttpStatusCode.Forbidden,"General role 403");
var token=await Login("ADMIN01");Auth(token);staff.Rows["ADMIN01"].IsActive=false;Check((await client.GetAsync(days)).StatusCode==HttpStatusCode.Unauthorized,"Disabled admin 401");staff.Rows["ADMIN01"].IsActive=true;
staff.Rows["ADMIN01"].Role=1;Check((await client.GetAsync(days)).StatusCode==HttpStatusCode.Forbidden,"Current role overrides stale JWT");staff.Rows["ADMIN01"].Role=0;
var month=(await client.GetFromJsonAsync<VitalReportDaysDto>(days))!;
Check(month.Days.Count==31&&month.Days[0].Date=="2026-10-01"&&month.Days[^1].Date=="2026-10-31","All calendar days");
Check(month.Days.Single(d=>d.Date=="2026-10-12").RecordCount==23,"NULL-only vital row counted");
Check(month.Days.First().RecordCount==0&&!month.Days.First().CanSelect,"Zero disabled");
var leap=(await client.GetFromJsonAsync<VitalReportDaysDto>(days.Replace("2026","2028").Replace("month=10","month=2")))!;Check(leap.Days.Count==29,"Leap February");
var lastMonth=(await client.GetFromJsonAsync<VitalReportDaysDto>(days.Replace("2026","9999").Replace("month=10","month=12")))!;Check(lastMonth.Days.Count==31&&lastMonth.Days[^1].Date=="9999-12-31","Maximum database year December");
foreach(var query in new[]{"floor=3&year=2026&month=10","floor=2&year=0&month=10","floor=2&year=2026&month=13","floor=x&year=2026&month=10"}) Check((await client.GetAsync("admin/vital-reports/days?"+query)).StatusCode==HttpStatusCode.BadRequest,"Invalid query 400 "+query);
foreach(var body in new[]{Body(),Body("2026-10-12","2026-10-12"),Body("2026-11-12"),Body("2026-10-32")}) Check((await client.PostAsJsonAsync("admin/vital-reports/export",body)).StatusCode==HttpStatusCode.BadRequest,"Invalid export 400");
Check((await client.PostAsJsonAsync("admin/vital-reports/export",Body("2026-10-01"))).StatusCode==HttpStatusCode.Conflict,"No-data export 409");
var oldCount=memory.Reads;var zipResponse=await client.PostAsJsonAsync("admin/vital-reports/export",Body("2026-10-15","2026-10-12"));zipResponse.EnsureSuccessStatusCode();
Check(memory.Reads==oldCount+1,"Multi-day single snapshot read");
Check(zipResponse.Content.Headers.ContentType!.MediaType=="application/zip"&&zipResponse.Headers.CacheControl!.NoStore,"ZIP and no-store");
Check(zipResponse.Content.Headers.ContentDisposition!.FileNameStar=="バイタル記録表_2F_202610.zip","Japanese download filename");
var zipBytes=await zipResponse.Content.ReadAsByteArrayAsync();using var archive=new ZipArchive(new MemoryStream(zipBytes));
Check(archive.Entries.Select(e=>e.FullName).SequenceEqual(new[]{"バイタル記録表_2F_20261012.xlsx","バイタル記録表_2F_20261015.xlsx"}),"UTF8 flat sorted filenames");
Directory.CreateDirectory("verification/vital-reports/output");
foreach(var entry in archive.Entries){using var input=entry.Open();using var output=File.Create("verification/vital-reports/output/"+entry.Name);input.CopyTo(output);}
using(var stream=archive.Entries[0].Open())using(var sheetBook=new XLWorkbook(stream)) {
 var sheet=sheetBook.Worksheet(1);
 Check(sheet.Cell(5,1).GetString()=="201"&&sheet.Cell(6,1).GetString()=="201"&&sheet.Cell(6,2).GetString()=="同室の第二入居者","Two occupants separate rows");
 Check(sheet.Cell(5,3).DataType==XLDataType.Number&&sheet.Cell(5,3).GetDouble()==36.5,"Typed numeric cells");
 Check(sheet.Cell(6,3).IsEmpty()&&sheet.Cell(6,8).IsEmpty(),"NULL remains blank");
 Check(sheet.Range(5,9,28,14).Cells().All(c=>c.IsEmpty()),"Rechecks all blank");
 Check(sheet.Cell(9,1).GetString()=="205"&&sheet.Cell(9,2).IsEmpty(),"Vacant room retained");
 Check(sheet.PageSetup.PaperSize==XLPaperSize.A4Paper&&sheet.PageSetup.PageOrientation==XLPageOrientation.Portrait&&sheet.PageSetup.PagesWide==1&&sheet.PageSetup.PagesTall==1,"A4 portrait 1 by 1 settings");
}
var snapshot=await memory.ReadAsync(TenantRooms.Ordered,new(2026,10,1),new(2026,11,1),default);
var firstFloor=TenantRooms.Ordered.Take(19).ToArray();
Check(VitalReportService.Resolve(snapshot,firstFloor,new(2026,10,1))[0].TenantName=="前入居者","Departure day inclusive legacy time");
Check(VitalReportService.Resolve(snapshot,firstFloor,new(2026,10,3))[0].TenantName is null,"Gap vacant");
Check(VitalReportService.Resolve(snapshot,firstFloor,new(2026,10,10))[0].TenantName=="確認利用者101","New occupant after arrival");
var extra=new ReportTenant {RoomNo="201",SerialNo="1",TenantName="overlap",MoveInDate=new(2026,10,11)};memory.Tenants.Add(extra);Check((await client.GetAsync(days)).StatusCode==HttpStatusCode.Conflict,"Overlapping occupancy rejected");memory.Tenants.Remove(extra);
memory.Vitals.Add(memory.Vitals.First(v=>v.RoomNo=="201"));Check((await client.GetAsync(days)).StatusCode==HttpStatusCode.Conflict,"Duplicate vital rejected");memory.Vitals.RemoveAt(memory.Vitals.Count-1);
memory.Fail=true;var failure=await client.GetAsync(days);Check(failure.StatusCode==HttpStatusCode.InternalServerError&&!(await failure.Content.ReadAsStringAsync()).Contains("Sensitive"),"Sanitized 500");memory.Fail=false;
var one=await client.PostAsJsonAsync("admin/vital-reports/export",Body("2026-10-12"));using(var oneZip=new ZipArchive(new MemoryStream(await one.Content.ReadAsByteArrayAsync())))Check(oneZip.Entries.Count==1,"One day still ZIP");
var missing=memory.Vitals.Where(v=>v.RecordDate==new DateTime(2026,10,12)).ToList();memory.Vitals.RemoveAll(v=>missing.Contains(v));
var disappeared=await client.PostAsJsonAsync("admin/vital-reports/export",Body("2026-10-12"));Check(disappeared.StatusCode==HttpStatusCode.Conflict&&(await disappeared.Content.ReadAsStringAsync()).Contains("再検索"),"Export rechecks disappearing records");memory.Vitals.AddRange(missing);
using(var stream=archive.Entries[1].Open())using(var book=new XLWorkbook(stream)){var sheet=book.Worksheet(1);Check(sheet.Cell(6,2).GetString()=="同室の第二入居者"&&sheet.Cell(6,3).IsEmpty(),"Occupied without record name only");}
var oldDay=VitalReportService.Resolve(snapshot,firstFloor,new(2026,10,1))[0];Check(oldDay.Vital?.TemperatureC==0&&oldDay.Vital.PulseRate==0,"Zero retained in historic occupant");
var service=new VitalReportService(memory,new());
var first=await service.ExportAsync(new(){Floor=1,Year=2026,Month=10,Dates=["2026-10-01","2026-10-12"]},default);
using(var z=new ZipArchive(new MemoryStream(first.Content)))foreach(var e in z.Entries){using var input=e.Open();using var output=File.Create("verification/vital-reports/output/"+e.Name);input.CopyTo(output);}
using(var z=new ZipArchive(new MemoryStream(first.Content)))using(var stream=z.Entries[1].Open())using(var book=new XLWorkbook(stream))Check(book.Worksheet(1).Cell(23,1).GetString()=="VIP"&&!book.Worksheet(1).Cell(23,2).HasFormula&&book.Worksheet(1).Cell(23,2).GetString()=="=1+1","VIP literal formula-like name");
var maximum=TenantRooms.Ordered.Skip(19).SelectMany(room=>new[]{"1","2"}.Select(serial=>new VitalReportRow(room,new string('長',20),new ReportVital{TemperatureC=36.5m,SystolicBloodPressure=125,DiastolicBloodPressure=78,PulseRate=72,Spo2Percent=98.5m}))).ToList();
using(var output=File.Create("verification/vital-reports/output/最大46名_2F.xlsx"))new VitalReportExcelBuilder().Write(output,2,new(2026,10,12),maximum);
Console.WriteLine($"TOTAL {passed} checks passed");
}finally{await app.StopAsync();}
