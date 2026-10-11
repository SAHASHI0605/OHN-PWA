using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;
using Ohana.Server.Models;
using Ohana.Server.DTOs.Residents;
using Ohana.Server.Infrastructure.Database;
using Ohana.Server.Repositories;
using Ohana.Server.Repositories.Interfaces;
using Ohana.Server.Utilities;

public static class SchemaCheck
{
    public static async Task Run()
    {
        // Read metadata only. Do not emit credentials, hostnames, or resident data.
        var configuration = new ConfigurationBuilder().SetBasePath(Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../Ohana.Server")))
            .AddJsonFile("appsettings.json", optional: true).AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets(typeof(Staff).Assembly, optional: true).AddEnvironmentVariables().Build();
        try {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString)) { Console.WriteLine("SCHEMA_UNCONFIRMED: connection setting unavailable."); return; }
            var options = new MySqlConnectionStringBuilder(connectionString) { ConnectionTimeout = 5 };
            await using var connection = new MySqlConnection(options.ConnectionString);
            await connection.OpenAsync();
            var columns = await connection.QueryAsync("SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mst_tenant' ORDER BY ORDINAL_POSITION");
            foreach (var column in columns) Console.WriteLine(System.Text.Json.JsonSerializer.Serialize((IDictionary<string, object>)column));
            Console.WriteLine("SCHEMA_READ_ONLY_COMPLETE");
            var repository = new ResidentMaintenanceRepository(new DbConnectionFactory(configuration));
            var page = await repository.SearchAsync(new ResidentSearchDto { Status = "all" });
            var sorted = page.Items.Zip(page.Items.Skip(1)).All(pair => {
                var first = TenantRooms.Ordered.IndexOf(pair.First.RoomNo);
                var second = TenantRooms.Ordered.IndexOf(pair.Second.RoomNo);
                return first < second || (first == second && (string.CompareOrdinal(pair.First.SerialNo, pair.Second.SerialNo) < 0
                    || (pair.First.SerialNo == pair.Second.SerialNo && pair.First.MoveInDate >= pair.Second.MoveInDate)));
            });
            Console.WriteLine($"REAL_SQL_READ_ONLY: paged={page.Items.Count <= 20}; sorted={sorted}; timezoneUnspecified={page.Items.All(value => value.MoveInDate.Kind == DateTimeKind.Unspecified)}");
            var current = await repository.SearchAsync(new ResidentSearchDto());
            Console.WriteLine($"REAL_SQL_READ_ONLY: currentFilter={current.Items.All(value => value.MoveOutDate is null)}");
            var departed = await repository.SearchAsync(new ResidentSearchDto { Status = "departed" });
            Console.WriteLine($"REAL_SQL_READ_ONLY: departedFilter={departed.Items.All(value => value.MoveOutDate is not null)}");
            await repository.SearchAsync(new ResidentSearchDto { Name = "%_!", RoomNo = "VIP", Status = "all", Page = 999 });
            Console.WriteLine("REAL_SQL_READ_ONLY: escapedLikeAndRoomFilter=completed");
            if (page.Items.FirstOrDefault() is { } item) {
                var detail = await repository.GetDetailAsync(new ResidentKey(item.RoomNo, item.SerialNo, item.MoveInDate));
                Console.WriteLine($"REAL_SQL_READ_ONLY: exactCompositeKeyLookup={detail?.MoveInDate == item.MoveInDate}");
            }
        } catch (Exception error) { Console.WriteLine("SCHEMA_UNCONFIRMED: " + error.GetType().Name + "; no DB changes executed."); }
    }
}
