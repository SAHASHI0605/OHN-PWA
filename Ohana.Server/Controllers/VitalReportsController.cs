using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Ohana.Server.DTOs.VitalReports;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;
namespace Ohana.Server.Controllers;

[ApiController, Route("api/admin/vital-reports"), Authorize(Roles = "0"), VitalReportModelErrors]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class VitalReportsController(IVitalReportService service, ILogger<VitalReportsController> logger) : ControllerBase {
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action) {
        try { return await action(); }
        catch (VitalReportException error) { return StatusCode(error.StatusCode, new { message = error.Message }); }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested) { return new EmptyResult(); }
        catch (Exception error) {
            logger.LogError("Vital report failed: {Type}", error.GetType().Name);
            return StatusCode(500, new { message = "記録表の取得・出力に失敗しました。時間をおいて再度お試しください。" });
        }
    }
    [HttpGet("days")]
    public Task<IActionResult> Days([FromQuery] VitalReportQueryDto query, CancellationToken cancellationToken) =>
        Execute(async () => Ok(await service.DaysAsync(query, cancellationToken)));
    [HttpPost("export")]
    public Task<IActionResult> Export(VitalReportExportDto request, CancellationToken cancellationToken) => Execute(async () => {
        var archive = await service.ExportAsync(request, cancellationToken);
        Response.Headers.CacheControl = "no-store";
        return File(archive.Content, "application/zip", archive.FileName);
    });
}
public sealed class VitalReportModelErrorsAttribute : ActionFilterAttribute {
    public VitalReportModelErrorsAttribute() { Order = -3000; }
    public override void OnActionExecuting(ActionExecutingContext context) {
        if (!context.ModelState.IsValid) context.Result = new BadRequestObjectResult(new { message = "階・年月・出力日の入力形式が不正です。" });
    }
}
