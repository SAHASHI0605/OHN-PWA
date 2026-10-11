using Microsoft.AspNetCore.Mvc;

// This controller belongs only to the local memory verification executable.
[ApiController]
[Route("api/verification/selection-state")]
public class VerificationStateController(MemoryResidentSelectionRepository repository) : ControllerBase
{
    [HttpPost]
    public IActionResult Set([FromQuery] bool fail = false, [FromQuery] int delay = 0) {
        repository.FailReads = fail;
        repository.DelayMs = Math.Clamp(delay, 0, 3000);
        return Ok();
    }
}
