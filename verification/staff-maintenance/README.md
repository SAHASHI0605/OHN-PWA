# スタッフメンテナンス検証

本番・既存MySQLには接続しません。既存ServerのController、Service、BCrypt、JWT生成・認証イベントを、インメモリRepositoryで検証します。追加のテストライブラリは不要です。

```
dotnet build Ohana.Server/Ohana.Server.csproj --no-restore -p:BuildProjectReferences=false
dotnet run --project verification/staff-maintenance/StaffMaintenance.Verification.csproj
```

`-- --serve` を付けると画面確認用APIを `http://127.0.0.1:7198/api` に起動します。ダミー管理者は `ADMIN01`、パスワードは `test-password`。実環境の認証情報ではありません。

別の端末で `node verification/staff-maintenance/ui-server.mjs` を実行すると、検証用画面を `http://127.0.0.1:5176/admin/login` に起動します。API接続先の上書きはそのプロセス内のみです。

SQL・LIKEの実際の照合順序、InnoDBの排他・デッドロック、実DBでのページング・更新は専用テストDBで確認が必要です。既存テーブル変更・マイグレーションは行いません。
