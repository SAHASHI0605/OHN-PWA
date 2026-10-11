export const adminMenu = [
    { path: '/staff', label: 'スタッフメンテナンス', description: 'スタッフ情報の検索・登録・編集を行います。', scope: '', symbol: '01', available: true },
    { path: '/residents', label: '入居者情報メンテナンス', description: '入居者情報の検索・登録・編集を行います。', scope: '', symbol: '02', available: true },
    { path: '/vital-reports', label: 'バイタル記録表出力', description: 'バイタル記録を帳票として出力する機能です。', scope: 'バイタル記録表の出力機能は準備中です。', symbol: '03', available: false },
] as const;
