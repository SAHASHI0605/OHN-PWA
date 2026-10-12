using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/verification/records")]
public class VerificationRecordsController(MemoryRecordRepository repository) : ControllerBase
{
    [HttpPost]
    public IActionResult State(bool fail=false,bool readFail=false,bool refreshFail=false,int readDelay=0,int saveDelay=0) {
        repository.FailSaves=fail;repository.FailReads=readFail;repository.FailRefreshAfterSave=refreshFail;
        repository.ReadDelay=Math.Clamp(readDelay,0,5000);repository.SaveDelay=Math.Clamp(saveDelay,0,5000);return Ok();
    }
    [HttpGet]
    public IActionResult Status()=>Ok(new{repository.SaveCount,repository.LastMutation});
}
