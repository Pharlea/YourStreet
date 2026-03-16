using Microsoft.AspNetCore.Mvc;

namespace your_street_server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthStatus> Get()
    {
        return Ok(new HealthStatus { Status = "Healthy" });
    }
}

public class HealthStatus
{
    public string Status { get; set; } = "Healthy";
}
