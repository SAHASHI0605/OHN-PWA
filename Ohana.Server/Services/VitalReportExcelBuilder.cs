using ClosedXML.Excel;
using Ohana.Server.DTOs.VitalReports;
namespace Ohana.Server.Services;

public sealed class VitalReportExcelBuilder {
    public void Write(Stream output, int floor, DateTime date, IReadOnlyList<VitalReportRow> rows) {
        using var workbook = new XLWorkbook();
        var sheet = workbook.AddWorksheet("バイタル記録表");
        sheet.ShowGridLines = false;
        var lastRow = rows.Count + 4;
        var area = sheet.Range(1, 1, lastRow, 14);
        area.Style.Font.FontName = "Meiryo";
        area.Style.Font.FontSize = 10;
        area.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        area.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        double[] widths = [6, 36, 8, 5, 2, 5, 5, 7, 9, 5, 2, 5, 5, 7];
        for (var column = 1; column <= widths.Length; column++) sheet.Column(column).Width = widths[column - 1];
        sheet.Range("A1:N1").Merge().Value = $"バイタル記録表（{floor}F）";
        sheet.Cell("A1").Style.Font.FontSize = 16;
        sheet.Row(1).Height = 30;
        sheet.Range("I2:N2").Merge().Value = date.ToString("yyyy年M月d日", System.Globalization.CultureInfo.InvariantCulture) + $"（{"日月火水木金土"[(int)date.DayOfWeek]}）";
        sheet.Cell("I2").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        sheet.Row(2).Height = 24;
        sheet.Range("A3:N3").Merge().Value = "バイタルチェック";
        sheet.Cell("A3").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
        sheet.Row(3).Height = 22;
        string[] headers = ["部屋", "名前", "体温\n（℃）", "血圧", "", "", "脈", "酸素濃度\n（%）", "体温再検\n（℃）", "血圧再検", "", "", "脈", "酸素濃度\n（%）"];
        for (var column = 1; column <= 14; column++) sheet.Cell(4, column).Value = headers[column - 1];
        sheet.Range("D4:F4").Merge(); sheet.Range("J4:L4").Merge();
        sheet.Row(4).Height = 32;
        sheet.Range("A4:N4").Style.Alignment.WrapText = true;
        sheet.Range("A4:N4").Style.Font.FontSize = 9;
        var table = sheet.Range(4, 1, lastRow, 14);
        table.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        table.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        sheet.Cell("I4").Style.Border.LeftBorder = XLBorderStyleValues.Medium;
        var rowHeight = Math.Min(28, 688d / rows.Count);
        for (var index = 0; index < rows.Count; index++) {
            var number = index + 5; var row = rows[index];
            sheet.Row(number).Height = rowHeight;
            // Assigning Value (never FormulaA1) keeps formula-like names literal and safe.
            sheet.Cell(number, 1).Value = row.RoomNo;
            if (row.TenantName is not null) sheet.Cell(number, 2).Value = row.TenantName;
            sheet.Cell(number, 2).Style.Font.FontSize = 9.5;
            sheet.Cell(number, 2).Style.Alignment.ShrinkToFit = true;
            if (row.Vital is { } vital) {
                SetNumber(sheet.Cell(number, 3), vital.TemperatureC, "0.0");
                SetNumber(sheet.Cell(number, 4), vital.SystolicBloodPressure, "0");
                SetNumber(sheet.Cell(number, 6), vital.DiastolicBloodPressure, "0");
                if (vital.SystolicBloodPressure is not null || vital.DiastolicBloodPressure is not null) sheet.Cell(number, 5).Value = "/";
                SetNumber(sheet.Cell(number, 7), vital.PulseRate, "0");
                SetNumber(sheet.Cell(number, 8), vital.Spo2Percent, "0.0");
            }
            // BP halves are typed numbers in a single visual column; all recheck cells remain blank.
            sheet.Range(number, 4, number, 6).Style.Border.InsideBorder = XLBorderStyleValues.None;
            sheet.Range(number, 9, number, 9).Style.Border.LeftBorder = XLBorderStyleValues.Medium;
            sheet.Range(number, 10, number, 12).Merge();
        }
        sheet.PageSetup.PaperSize = XLPaperSize.A4Paper;
        sheet.PageSetup.PageOrientation = XLPageOrientation.Portrait;
        sheet.PageSetup.FitToPages(1, 1);
        sheet.PageSetup.Margins.Top = 0.25; sheet.PageSetup.Margins.Bottom = 0.25;
        sheet.PageSetup.Margins.Left = 0.25; sheet.PageSetup.Margins.Right = 0.25;
        sheet.PageSetup.Margins.Header = 0; sheet.PageSetup.Margins.Footer = 0;
        sheet.PageSetup.CenterHorizontally = true;
        sheet.PageSetup.PrintAreas.Add($"A1:N{lastRow}");
        workbook.SaveAs(output);
    }
    private static void SetNumber(IXLCell cell, decimal? value, string format) {
        if (value is not null) cell.Value = (double)value.Value;
        cell.Style.NumberFormat.Format = format;
    }
}
