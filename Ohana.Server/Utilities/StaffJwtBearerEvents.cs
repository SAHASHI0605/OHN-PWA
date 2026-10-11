using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Ohana.Server.Repositories.Interfaces;
using System.Security.Claims;

namespace Ohana.Server.Utilities;

public class StaffJwtBearerEvents(IStaffRepository repository) : JwtBearerEvents
{
    public override async Task TokenValidated(TokenValidatedContext context)
    {
        var endpoint = context.HttpContext.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() is not null ||
            endpoint?.Metadata.GetMetadata<IAuthorizeData>() is null) return;
        var code = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(code)) { context.Fail("Invalid staff identity."); return; }
        try
        {
            var staff = await repository.GetByStaffCodeAsync(code);
            if (staff is null || !staff.IsActive) { context.Fail("Staff is inactive or missing."); return; }
            var identity = (ClaimsIdentity)context.Principal!.Identity!;
            foreach (var claim in identity.FindAll(identity.RoleClaimType).ToList()) identity.RemoveClaim(claim);
            identity.AddClaim(new Claim(identity.RoleClaimType, staff.Role.ToString()));
        }
        catch (Exception)
        {
            context.Fail("Staff authentication could not be verified.");
        }
    }
}
