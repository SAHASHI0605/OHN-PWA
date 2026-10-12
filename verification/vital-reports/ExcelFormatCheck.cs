using ClosedXML.Excel;
using Ohana.Server.DTOs.VitalReports;
using Ohana.Server.Services;
using Ohana.Server.Utilities;

public static class ExcelFormatCheck {
    public static void Run(bool baseline) {
        Directory.CreateDirectory("verification/vital-reports/output");
        foreach(var floor in new[]{1,2}) {
            var rooms=(floor==1?TenantRooms.Ordered.Take(19):TenantRooms.Ordered.Skip(19)).ToArray();
            decimal?[] values=[0,98,98.5m,null];
            var rows=rooms.Select((room,index)=>new VitalReportRow(room,$"確認利用者{room}",index<4?new ReportVital{Spo2Percent=values[index]}:null)).ToList();
            var prefix=$"verification/vital-reports/output/format-{floor}F";
            using(var stream=File.Create(prefix+(baseline?"-before.xlsx":"-after.xlsx")))new VitalReportExcelBuilder().Write(stream,floor,new(2026,10,12),rows);
            if(baseline)continue;
            using var before=new XLWorkbook(prefix+"-before.xlsx");using var after=new XLWorkbook(prefix+"-after.xlsx");
            var a=before.Worksheet(1);var b=after.Worksheet(1);
            void Check(bool pass,string name){if(!pass)throw new Exception($"FAILED {floor}F {name}");Console.WriteLine($"PASS {floor}F {name}");}
            Check(b.Cell("I4").Style.Border.LeftBorder==XLBorderStyleValues.Medium&&b.Cell("I4").Style.Border.LeftBorder==b.Cell("I5").Style.Border.LeftBorder,"Header boundary matches data rows");
            for(var i=0;i<4;i++) {
                var cell=b.Cell(i+5,8);
                Check(cell.Style.NumberFormat.Format=="0.0","SpO2 display format "+i);
                if(values[i] is {} number)Check(cell.DataType==XLDataType.Number&&cell.GetDouble()==(double)number&&cell.GetFormattedString()==number.ToString("0.0",System.Globalization.CultureInfo.InvariantCulture),"SpO2 number/display "+number);
                else Check(cell.IsEmpty(),"NULL remains blank");
            }
            Check(a.MergedRanges.Select(r=>r.RangeAddress.ToString()).SequenceEqual(b.MergedRanges.Select(r=>r.RangeAddress.ToString())),"Merged cells unchanged");
            Check(Enumerable.Range(1,14).All(c=>a.Column(c).Width==b.Column(c).Width)&&Enumerable.Range(1,rows.Count+4).All(r=>a.Row(r).Height==b.Row(r).Height),"Widths/heights unchanged");
            Check(a.PageSetup.PaperSize==b.PageSetup.PaperSize&&a.PageSetup.PageOrientation==b.PageSetup.PageOrientation&&a.PageSetup.PagesTall==b.PageSetup.PagesTall&&a.PageSetup.PagesWide==b.PageSetup.PagesWide&&a.PageSetup.PrintAreas.Select(r=>r.ToString()).SequenceEqual(b.PageSetup.PrintAreas.Select(r=>r.ToString())),"Print settings unchanged");
            using var scratch=new XLWorkbook();var comparison=scratch.AddWorksheet("check").Cell(1,1);
            foreach(var old in a.Range(1,1,rows.Count+4,14).Cells()) {
                var cell=b.Cell(old.Address);
                if(!old.Value.Equals(cell.Value))throw new Exception("Unexpected value change "+old.Address);
                var expected=old.Style;
                // Copy the original style so comparison can allow precisely the two requested changes.
                comparison.Style=expected;
                if(old.Address.RowNumber==4&&old.Address.ColumnNumber==9)comparison.Style.Border.LeftBorder=XLBorderStyleValues.Medium;
                if(old.Address.ColumnNumber==8&&old.Address.RowNumber is >=5 and <=8)comparison.Style.NumberFormat.Format="0.0";
                if(!comparison.Style.Equals(cell.Style))throw new Exception("Unexpected style change "+old.Address);
            }
            Console.WriteLine($"PASS {floor}F only requested cell styles changed");
        }
    }
}
