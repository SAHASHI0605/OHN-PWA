using System.ComponentModel.DataAnnotations;

namespace Ohana.Server.DTOs.Residents;

public class ResidentSearchDto
{
    [StringLength(3, ErrorMessage = "部屋番号の指定が不正です。")]
    public string? RoomNo { get; set; }
    [StringLength(100, ErrorMessage = "検索語は100文字以内で入力してください。")]
    public string? Name { get; set; }
    [RegularExpression("^(current|departed|all)$", ErrorMessage = "入居状況の指定が不正です。")]
    public string Status { get; set; } = "current";
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;
}

public record ResidentDetailDto(string RoomNo, string SerialNo, string TenantName,
    DateTime MoveInDate, DateTime? MoveOutDate, string Version);
public record ResidentPageDto(IReadOnlyList<ResidentDetailDto> Items, int TotalCount, int Page, int PageSize);

public class CreateResidentDto
{
    [Required(ErrorMessage = "部屋番号を選択してください。")]
    public string RoomNo { get; set; } = "";
    [Required(ErrorMessage = "連番を選択してください。")]
    public string SerialNo { get; set; } = "";
    [Required(ErrorMessage = "入居者名を入力してください。")]
    [StringLength(20, ErrorMessage = "入居者名は20文字以内で入力してください。")]
    public string TenantName { get; set; } = "";
    [Required(ErrorMessage = "入居日を入力してください。")]
    public DateOnly? MoveInDate { get; set; }
    public DateOnly? MoveOutDate { get; set; }
}

public class UpdateResidentDto
{
    [Required(ErrorMessage = "入居者名を入力してください。")]
    [StringLength(20, ErrorMessage = "入居者名は20文字以内で入力してください。")]
    public string TenantName { get; set; } = "";
    public DateOnly? MoveOutDate { get; set; }
    [Required(ErrorMessage = "最新の入居者情報を取得してください。")]
    public string Version { get; set; } = "";
}
