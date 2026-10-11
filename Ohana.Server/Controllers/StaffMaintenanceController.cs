using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using Ohana.Server.DTOs.Staff;
using Ohana.Server.Services;
using Ohana.Server.Services.Interfaces;

namespace Ohana.Server.Controllers;

[ApiController]
[Route("api/admin/staff")]
[Authorize(Roles = "0")]
public class StaffMaintenanceController(IStaffMaintenanceService service, ILogger<StaffMaintenanceController> logger) : ControllerBase
{
    private string ActorCode => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (StaffOperationException error) { return StatusCode(error.StatusCode, new { message = error.Message }); }
        catch (MySqlException error) when (error.Number == 1062)
        { return Conflict(new { message = "スタッフコードは既に登録されています。" }); }
        catch (MySqlException error) when (error.Number is 1213 or 1205)
        { return Conflict(new { message = "他の更新操作と競合しました。最新情報を確認して再実行してください。" }); }
        catch (Exception error)
        {
            // Do not log request DTOs or password/hash values.
            logger.LogError("Staff operation failed: {Type}", error.GetType().Name);
            return StatusCode(500, new { message = "スタッフ情報の処理に失敗しました。時間をおいて再度お試しください。" });
        }
    }

    [HttpGet]
    public Task<IActionResult> Search([FromQuery] StaffSearchDto search) => Execute(async () => Ok(await service.SearchAsync(search)));

    [HttpGet("{staffCode}")]
    public Task<IActionResult> Detail(string staffCode) => Execute(async () => Ok(await service.GetDetailAsync(staffCode)));

    [HttpPost]
    public Task<IActionResult> Create(CreateStaffDto request) => Execute(async () =>
    {
        await service.CreateAsync(ActorCode, request);
        return StatusCode(201, new { message = "スタッフを登録しました。" });
    });

    [HttpPut("{staffCode}")]
    public Task<IActionResult> Update(string staffCode, UpdateStaffDto request) => Execute(async () =>
    {
        await service.UpdateAsync(ActorCode, staffCode, request);
        return Ok(new { message = "スタッフ情報を更新しました。" });
    });

    [HttpPut("{staffCode}/password")]
    public Task<IActionResult> ResetPassword(string staffCode, ResetStaffPasswordDto request) => Execute(async () =>
    {
        await service.ResetPasswordAsync(ActorCode, staffCode, request);
        return Ok(new { message = "パスワードを再設定しました。" });
    });
}
