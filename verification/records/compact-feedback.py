from pathlib import Path
p=Path('ohana.client/src/pages/RecordInputPage.tsx');s=p.read_text(encoding='utf-8');s=s.replace("?loadError:caregiverError?", "?loadError:phase==='loading'?'記録を取得しています…':caregiverError?");p.write_text(s,encoding='utf-8')
p=Path('ohana.client/src/hooks/useRecordInput.ts');s=p.read_text(encoding='utf-8');s=s.replace('    },[]);\n    const meal=', '    },[key]);\n    const meal=');p.write_text(s,encoding='utf-8')
