using BCrypt.Net;

Console.WriteLine("Ohana Password Hash Generator");
Console.WriteLine();

Console.Write("パスワードを入力してください：");

var password = Console.ReadLine();

if (string.IsNullOrWhiteSpace(password))
{
    Console.WriteLine("パスワードが入力されていません。");
    return;
}

var hash = BCrypt.Net.BCrypt.HashPassword(password);

Console.WriteLine();
Console.WriteLine("========== Hash ==========");
Console.WriteLine(hash);
Console.WriteLine("==========================");
