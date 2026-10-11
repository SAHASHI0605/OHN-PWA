# 1階・2階 利用者選択画面 入居者マスタ連携 実装報告

## 実装内容
2階は従来の居室配置・設備・ヘッダー・フッター・配色を維持し、固定氏名・仮IDを廃止しました。居室の配置定義のみ固定です。23室について入居中（move_out_date IS NULL）、連番1/2だけを取得します。1名・2名・空室を実データから表示し、氏名は縦書き＋様、長い氏名は省略表示と全文のtitleを使用します。氏名ごとの選択、選択中ハイライト、解除、従来の2名選択ダイアログを維持します。

1階と2階は同一のuseResidentSelection・ResidentRoomCard・Service・DTO・API・Repositoryを使用します。初回と再表示時に再取得し、読み込み中と取得失敗を空室と区別します。再取得で選択を解除し、古い応答は無視します。

## API
既存の1階専用GETを最小限の変更で GET /api/residents/floors/{floor}（1/2のみ）に拡張しました。/api/residents/floors/1は維持され、2階は同じ処理を使用します。JWT認証、現在のスタッフ有効性確認、管理者専用APIの制限を維持します。SQLはSELECTのみです。対象室・連番はパラメーター化し、キャッシュを無効化。同じ部屋・連番に複数の入居中履歴がある場合は409で誤選択を防止します。

## 記録入力への引き継ぎ
roomNo・serialNo・moveInDateの実際の複合キーを既存 /records/:residentId のパラメーターにエンコードし、氏名・部屋番号・連番・入居日時・元の階をルートstateで引き継ぎます。2階から進んだ後は2階へ戻ります。201/連番2/2026-05-01T12:30:00の遷移を確認しました。入居日時の時刻を切り捨てず、UTC変換もしません。

## 検証
- ohana.client: npm run build 成功。
- Ohana.Server: 分離出力先へのbuild成功、警告0・エラー0。稼働中の既存サーバーが通常の出力ファイルを使用しているため、既存プロセスは停止せず検証用出力を使用しました。
- 変更したTS/TSXファイルのLint成功。全体Lintは既存LoginPage.tsx:152のreact-hooks/set-state-in-effectで1件失敗（今回変更なし）。
- メモリ内Repositoryを使用した実コントローラー/APIの自動検証39項目成功。1階/2階の取得範囲、退居除外、連番、同姓同名、複合キー、非午前0時の日時、空室、再取得、無効スタッフJWT、未認証401、管理者API403、管理者一覧取得、エラー秘匿、読取専用405等。
- 実MySQLは読み取り専用検証。2階11件・1階20件、対象室/連番/一意な入居中スロット/タイムゾーン未指定がすべて正常。管理者側の実SQL検索・退居条件・ページング・正確な複合キー照会も正常。
- ブラウザー（模擬API・架空の氏名）: 23室と従来の順序、1名/2名/空室、長い氏名、様、選択ハイライト、1名選択、同姓同名の個別選択、解除、2名ダイアログ、フッター、記録入力への情報引継ぎ、戻り先2階、取得中操作不可、失敗時23室未取得/空室0、復旧、直接URL/再読み込み、1階19室とVIP/個別選択/記録遷移の回帰、ログアウト後の2階URLからログインへのリダイレクトを確認。
- 2階既存CSSの居室・設備グリッド定義は変更していません。表示調整は共有CSSに配置。
- git diff --check 成功。依存関係・ロックファイル変更なし。コミット・Push・PR作成なし。

## 未確認事項・制約
- 既存DBの更新は行っていません。管理者側の実DB登録・編集・更新競合を今回の検証では実行していません。
- 実利用端末のタッチ操作、本番配置後の確認は未実施です。
- 記録入力画面の実DB保存は既存の未実装部分を含み、今回の対象外です。情報引継ぎまでを確認しています。
- 既存の狭い画面での見取り図最小幅・横方向の制約は維持しています。

## 変更ファイル
- `Ohana.Server/Controllers/ResidentSelectionController.cs`
- `Ohana.Server/DTOs/Residents/ResidentSelectionDto.cs`
- `Ohana.Server/Repositories/Interfaces/IResidentSelectionRepository.cs`
- `Ohana.Server/Repositories/ResidentSelectionRepository.cs`
- `Ohana.Server/Services/Interfaces/IResidentSelectionService.cs`
- `Ohana.Server/Services/ResidentSelectionService.cs`
- `ohana.client/src/components/ResidentRoomCard.tsx`
- `ohana.client/src/hooks/useResidentSelection.ts`
- `ohana.client/src/services/residentSelectionService.ts`
- `ohana.client/src/styles/ResidentSelection.css`
- `ohana.client/src/types/residentSelection.ts`
- `verification/first-floor/.gitignore`
- `verification/first-floor/FirstFloor.Verification.csproj`
- `verification/first-floor/FirstFloorSchemaCheck.cs`
- `verification/first-floor/IMPLEMENTATION.md`
- `verification/first-floor/MemoryResidentSelectionRepository.cs`
- `verification/first-floor/Program.cs`
- `verification/first-floor/VerificationStateController.cs`
- `verification/first-floor/ui-server.mjs`
- `Ohana.Server/Program.cs`
- `ohana.client/src/pages/FirstFloorResidentSelectPage.tsx`
- `ohana.client/src/pages/RecordInputPage.tsx`
- `ohana.client/src/pages/SecondFloorResidentSelectPage.tsx`
- `ohana.client/src/styles/FirstFloorResidentSelectPage.css`
