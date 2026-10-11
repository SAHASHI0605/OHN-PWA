export const adminMenu = [
    { path: '/staff', label: 'スタッフメンテナンス', description: 'スタッフ情報の検索・登録・編集を行います。', scope: '', symbol: '01', available: true },
    { path: '/residents', label: '入居者情報メンテナンス', description: '入居者情報の確認・管理を行う機能です。', scope: '一覧取得・登録・編集機能は準備中です。', symbol: '02', available: false },
    { path: '/vital-reports', label: 'バイタル記録表出力', description: 'バイタル記録を帳票として出力する機能です。', scope: 'バイタル記録表の出力機能は準備中です。', symbol: '03', available: false },
] as const;
