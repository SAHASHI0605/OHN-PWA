using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MySqlConnector;
using Ohana.Server.DTOs.Records;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/records")]
[Authorize]
[RecordModelErrors]
public class RecordsController(IRecordService service, ILogger<RecordsController> logger) : ControllerBase
{
    private string ActorCode => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (RecordOperationException error) { return StatusCode(error.StatusCode, new { message = error.Message, field = error.Field }); }
        catch (MySqlException error) when (error.Number is 1062 or 1213 or 1205) {
            return Conflict(new { message = "他の保存操作と競合しました。最新情報を確認して再度お試しください。" });
        }
        catch (Exception error) {
            logger.LogError("Care record operation failed: {Type}", error.GetType().Name);
            return StatusCode(500, new { message = "記録の処理に失敗しました。時間をおいて再度お試しください。" });
        }
    }
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public Task<IActionResult> Get([FromQuery] RecordQueryDto query) => Execute(async () => Ok(await service.GetAsync(query)));
    [HttpGet("caregivers")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public Task<IActionResult> Caregivers() => Execute(async () => Ok(await service.GetCaregiversAsync()));
    [HttpPut("meals/{mealType}")]
    public Task<IActionResult> Meal(string mealType, MealSaveDto request) => Execute(async () => Ok(await service.SaveMealAsync(ActorCode, mealType, request)));
    [HttpPut("vital")]
    public Task<IActionResult> Vital(VitalSaveDto request) => Execute(async () => Ok(await service.SaveVitalAsync(ActorCode, request)));
    [HttpPut("bath")]
    public Task<IActionResult> Bath(BathSaveDto request) => Execute(async () => Ok(await service.SaveBathAsync(ActorCode, request)));
}

// Scope the existing {message} error convention to this controller only.
public class RecordModelErrorsAttribute : ActionFilterAttribute
{
    public RecordModelErrorsAttribute() { Order = -3000; }
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
            context.Result = new BadRequestObjectResult(new { message = "入力値の型や必須項目が不正です。", field = context.ModelState.FirstOrDefault(item => item.Value?.Errors.Count > 0).Key });
    }
}
