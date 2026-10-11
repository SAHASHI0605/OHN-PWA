using Microsoft.Extensions.Configuration;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Models;
using Ohana.Server.Repositories;
using Ohana.Server.Utilities;

public static class FirstFloorSchemaCheck
{
    public static async Task Run()
    {
        var configuration = new ConfigurationBuilder().SetBasePath(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../Ohana.Server")))
            .AddJsonFile("appsettings.json", optional: true).AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets(typeof(Staff).Assembly, optional: true).AddEnvironmentVariables().Build();
        try {
            var repository = new ResidentSelectionRepository(new DbConnectionFactory(configuration));
            var second = await repository.GetByFloorAsync(2);
            Console.WriteLine($"REAL_SECOND_FLOOR_SQL_READ_ONLY: rows={second.Count}; allowedRooms={second.All(value => TenantRooms.Ordered.Skip(19).Contains(value.RoomNo))}; allowedSerials={second.All(value => value.SerialNo is "1" or "2")}; uniqueSlots={second.GroupBy(value => (value.RoomNo, value.SerialNo)).All(group => group.Count() == 1)}; timezoneUnspecified={second.All(value => value.MoveInDate.Kind == DateTimeKind.Unspecified)}");
            var values = await repository.GetByFloorAsync(1);
            Console.WriteLine($"REAL_FIRST_FLOOR_SQL_READ_ONLY: rows={values.Count}; allowedRooms={values.All(value => TenantRooms.Ordered.Take(19).Contains(value.RoomNo, StringComparer.OrdinalIgnoreCase))}; allowedSerials={values.All(value => value.SerialNo is "1" or "2")}; uniqueSlots={values.GroupBy(value => (value.RoomNo.ToUpperInvariant(), value.SerialNo)).All(group => group.Count() == 1)}; timezoneUnspecified={values.All(value => value.MoveInDate.Kind == DateTimeKind.Unspecified)}");
        } catch (Exception error) { Console.WriteLine("REAL_FIRST_FLOOR_SQL_UNCONFIRMED: " + error.GetType().Name); }
    }
}
