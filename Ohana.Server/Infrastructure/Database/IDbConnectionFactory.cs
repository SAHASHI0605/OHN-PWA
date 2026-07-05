using MySqlConnector;

namespace Ohana.Server.Infrastructure.Database;

public interface IDbConnectionFactory
{
    MySqlConnection CreateConnection();
}
