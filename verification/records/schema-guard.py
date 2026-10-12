from pathlib import Path
p=Path('verification/records/RecordSchemaCheck.cs');s=p.read_text(encoding='utf-8').replace('"C:/D/Oha/Ohana.Server"','Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../Ohana.Server"))')
s=s.replace('} }\n', '''foreach(var kind in new[]{"vital","bath"}) {
 try {
  var request = kind=="vital" ? (RecordSaveDto)new VitalSaveDto() : new BathSaveDto();
  await repository.SaveAsync("NO_SUCH_STAFF_CODE",new RecordMutation(kind,new RecordKey(sample.RoomNo,sample.SerialNo,sample.MoveInDate,new DateTime(2026,10,12)),new DateTime(2026,10,12,9,0,0),request));
  throw new Exception("Unexpected schema guard result");
 } catch(Ohana.Server.Services.RecordOperationException error) when(error.StatusCode==409 && error.Message.Contains("UNIQUE")) {
  Console.WriteLine("REAL_SCHEMA_GUARD_READ_ONLY: " + kind + " missing unique blocked before transaction/write");
 }
}
} }\n''')
p.write_text(s,encoding='utf-8')
