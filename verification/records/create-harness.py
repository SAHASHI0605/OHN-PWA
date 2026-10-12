from pathlib import Path
p=Path('verification/records/Program.cs');s=p.read_text(encoding='utf-8-sig');a=s.index('var configuration =');p.with_name('RecordSchemaCheck.cs').write_text(s[:a]+'using Ohana.Server.Repositories;\nusing Ohana.Server.DTOs.Records;\nusing Ohana.Server.Utilities;\n\npublic static class RecordSchemaCheck { public static async Task Run() {\n'+s[a:]+'''var sample = await connection.QuerySingleOrDefaultAsync<(string RoomNo,string SerialNo,DateTime MoveInDate)>("SELECT room_no,serial_no,move_in_date FROM mst_tenant ORDER BY room_no,serial_no,move_in_date LIMIT 1");
var repository = new RecordRepository(new Ohana.Server.Infrastructure.Database.DbConnectionFactory(configuration), new RecordVersion(configuration));
var result = await repository.GetAsync(new RecordKey(sample.RoomNo,sample.SerialNo,sample.MoveInDate,new DateTime(2026,10,12)));
Console.WriteLine($"REAL_RECORD_READ_ONLY: meals={result.Meals.Count}; vital={result.Vital is not null}; bath={result.Bath is not null}; exactKey={result.MoveInDate==sample.MoveInDate}");
} }\n''',encoding='utf-8')
s=Path('verification/first-floor/Program.cs').read_text(encoding='utf-8-sig');s=s[:s.index('var passed = 0;')];s=s.replace('if (args.Contains("--schema")) { await SchemaCheck.Run(); await FirstFloorSchemaCheck.Run(); return; }','if (args.Contains("--schema")) { await RecordSchemaCheck.Run(); return; }')
s='using Ohana.Server.DTOs.Records;\n'+s
s=s.replace('builder.Services.AddAuthorization();','''builder.Services.AddScoped<RecordVersion>();
builder.Services.AddSingleton<MemoryRecordRepository>();
builder.Services.AddSingleton<IRecordRepository>(services=>services.GetRequiredService<MemoryRecordRepository>());
builder.Services.AddScoped<IRecordService,RecordService>();
builder.Services.AddAuthorization();''')
s=s.replace('builder.Services.AddScoped<RecordVersion>();','builder.Services.AddSingleton<RecordVersion>();')
s=s.replace('"http://127.0.0.1:5180"','"http://127.0.0.1:5180", "http://localhost:5180"')
s=s.replace('var residents = new MemoryResidentRepository(repository);','var residents = new MemoryResidentRepository(repository);\nbuilder.Services.AddSingleton(residents);')
p.write_text(s,encoding='utf-8')
p=Path('verification/records/Records.Verification.csproj');s=p.read_text(encoding='utf-8-sig');s=s.replace('</ItemGroup>','''<Compile Include="../staff-maintenance/MemoryStaffRepository.cs" Link="MemoryStaffRepository.cs" />
<Compile Include="../resident-maintenance/MemoryResidentRepository.cs" Link="MemoryResidentRepository.cs" />
<Compile Include="../first-floor/MemoryResidentSelectionRepository.cs" Link="MemoryResidentSelectionRepository.cs" />
</ItemGroup>''');p.write_text(s,encoding='utf-8')
