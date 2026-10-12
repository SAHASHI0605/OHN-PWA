export const adminMenu = [
    { path: '/staff', label: 'スタッフメンテナンス', description: 'スタッフ情報の検索・登録・編集を行います。', scope: '', symbol: '01', available: true },
    { path: '/residents', label: '入居者情報メンテナンス', description: '入居者情報の検索・登録・編集を行います。', scope: '', symbol: '02', available: true },
    { path: '/vital-reports', label: 'バイタル記録表出力', description: '階と年月を指定し、日ごとのバイタル記録表をExcel・ZIPで出力します。', scope: '', symbol: '03', available: true },
] as const;
