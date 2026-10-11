using System.ComponentModel.DataAnnotations;

namespace Ohana.Server.DTOs.Staff;

public class StaffSearchDto
{
    [StringLength(100, ErrorMessage = "検索語は100文字以内で入力してください。")]
    public string? Keyword { get; set; }
    [Range(0, 1, ErrorMessage = "権限の指定が不正です。")]
    public int? Role { get; set; }
    public bool? IsActive { get; set; } = true;
    [Range(1, int.MaxValue, ErrorMessage = "ページ番号は1以上で指定してください。")]
    public int Page { get; set; } = 1;
}

public record StaffDetailDto(string StaffCode, string StaffName, int Role, bool IsActive,
    DateTime? LastLoginAt, string Version);
public record StaffPageDto(IReadOnlyList<StaffDetailDto> Items, int TotalCount, int Page, int PageSize);

public class CreateStaffDto
{
    [Required(ErrorMessage = "スタッフコードを入力してください。")]
    [StringLength(8, ErrorMessage = "スタッフコードは8文字以内で入力してください。")]
    public string StaffCode { get; set; } = "";
    [Required(ErrorMessage = "スタッフ名を入力してください。")]
    [StringLength(20, ErrorMessage = "スタッフ名は20文字以内で入力してください。")]
    public string StaffName { get; set; } = "";
    [Range(0, 1, ErrorMessage = "権限の指定が不正です。")]
    public int Role { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    [Required(AllowEmptyStrings = true, ErrorMessage = "パスワードを入力してください。")]
    [StringLength(64, MinimumLength = 8, ErrorMessage = "パスワードは8～64文字で入力してください。")]
    public string Password { get; set; } = "";
    [Compare(nameof(Password), ErrorMessage = "パスワードが一致しません。")]
    [Required(AllowEmptyStrings = true, ErrorMessage = "確認用パスワードを入力してください。")]
    public string PasswordConfirmation { get; set; } = "";
}

public class UpdateStaffDto
{
    [Required(ErrorMessage = "スタッフ名を入力してください。")]
    [StringLength(20, ErrorMessage = "スタッフ名は20文字以内で入力してください。")]
    public string StaffName { get; set; } = "";
    [Range(0, 1, ErrorMessage = "権限の指定が不正です。")]
    public int Role { get; set; }
    public bool IsActive { get; set; }
    [Required(ErrorMessage = "最新のスタッフ情報を取得してください。")]
    public string Version { get; set; } = "";
}

public class ResetStaffPasswordDto
{
    [Required(AllowEmptyStrings = true, ErrorMessage = "パスワードを入力してください。")]
    [StringLength(64, MinimumLength = 8, ErrorMessage = "パスワードは8～64文字で入力してください。")]
    public string Password { get; set; } = "";
    [Required(AllowEmptyStrings = true, ErrorMessage = "確認用パスワードを入力してください。")]
    [Compare(nameof(Password), ErrorMessage = "パスワードが一致しません。")]
    public string PasswordConfirmation { get; set; } = "";
    [Required(ErrorMessage = "最新のスタッフ情報を取得してください。")]
    public string Version { get; set; } = "";
}
