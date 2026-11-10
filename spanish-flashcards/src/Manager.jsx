import { translator } from './i18n';
import { useRef, useState } from 'react';
import { fields, newId, validateVocabulary, parseImport, toCSV, download, upsert, removeEntry, validateState } from './lib';

const blank = () => Object.fromEntries(fields.map(k => [k, '']));
export default function Manager({ language, entries, data, setData, allowChange, restore }) {
  const t = translator(language);
  const [search,setSearch] = useState(''), [form,setForm] = useState(null), [error,setError] = useState(''), [notice,setNotice] = useState(''), [preview,setPreview] = useState(null);
  const fileRef = useRef(null), restoreRef = useRef(null);
  const filtered = entries.filter(e => `${e.spanish} ${e.english} ${e.category}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const hasProgress = id => data.ratings[id] || data.quizStats[id];
  function warningFor(entriesToSave) {
    return entriesToSave.some(e => { const old = entries.find(x => x.id === e.id); return old && hasProgress(e.id) && (old.spanish !== e.spanish || old.english !== e.english); });
  }
  function save(e) {
    e.preventDefault(); setError('');
    try {
      const [entry] = validateVocabulary([{ ...form, id: form.id || newId() }]);
      if (warningFor([entry]) && !window.confirm(t('This changes a translation with saved progress. Keep its stable ID and existing progress?'))) return;
      if (!allowChange()) return;
      setData(s => upsert(s, [entry])); setForm(null); setNotice('Word saved.');
    } catch (e) { setError(e.message); }
  }
  async function readFile(event, backup = false) {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    setError(''); setNotice(''); setPreview(null);
    try {
      const text = await file.text();
      if (backup) {
        const state = validateState(JSON.parse(text)); setPreview({ type: 'backup', state });
      } else {
        const words = parseImport(text, file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json');
        if (!words.length) throw new Error(t('The import contains no words.'));
        setPreview({ type: 'vocabulary', words });
      }
    } catch(e) { setError(e.message); }
  }
  function applyPreview() {
    if (preview.type === 'backup') {
      if (!window.confirm(t('Replace this browser’s saved vocabulary changes, progress, preferences and quiz history with this backup? Export a full backup first if you want to keep the current data.'))) return;
      if (!allowChange()) return;
      restore(preview.state); setForm(null); setNotice('Full backup restored. Any previously active quiz was saved as incomplete.');
    } else {
      if (!window.confirm(t(`Import ${preview.words.length} words? Matching IDs update existing entries.${warningFor(preview.words) ? t(' WARNING: some translations with progress will change; their existing progress will be retained.') : ''}`))) return;
      if (!allowChange()) return;
      setData(s => upsert(s, preview.words)); setNotice('Vocabulary imported.');
    }
    setPreview(null);
  }
  return <section className="manager"><div className="section-line"><h2>{t("Your collection.")}</h2><strong>{t(`${entries.length} words`)}</strong></div><p className="hint">{t("Make it personal. Your edits and added words survive app updates.")}</p>
    {error && <div className="warning" role="alert">{t(error)}</div>}{notice && <p role="status">{t(notice)}</p>}
    <div className="toolbar"><button className="black" onClick={() => { setForm(blank()); setError(''); }}>{t("+ Add word")}</button><button onClick={() => fileRef.current.click()}>{t("Import JSON / CSV")}</button><button onClick={() => download('spanish-vocabulary.json', JSON.stringify(entries,null,2))}>{t("Export vocabulary JSON")}</button><button onClick={() => download('spanish-vocabulary.csv', toCSV(entries), 'text/csv;charset=utf-8')}>{t("Export vocabulary CSV")}</button></div>
    <input ref={fileRef} hidden type="file" accept=".json,.csv" aria-label={t("Import vocabulary file")} onChange={e => readFile(e)}/><input ref={restoreRef} hidden type="file" accept=".json" aria-label={t("Restore full backup file")} onChange={e => readFile(e,true)}/>
    <div className="backup-panel"><div><strong>{t("Your words. Your backup.")}</strong><p>{t("Vocabulary exports contain words only. A full backup includes ratings, settings, edits, deletions, and quiz history.")}</p></div><div className="toolbar"><button onClick={() => download('spanish-flashcards-backup.json', JSON.stringify(data,null,2))}>{t("Export full backup")}</button><button onClick={() => restoreRef.current.click()}>{t("Restore full backup")}</button></div></div>
    {preview && <div className="import-preview" role="region" aria-label={t("Import preview")}><h3>{preview.type === 'backup' ? t('Full backup preview') : t('Vocabulary import preview')}</h3>{preview.type === 'backup' ? <p>{Object.keys(preview.state.overrides).length} {t("saved vocabulary entries")} · {preview.state.deleted.length} {t("deletions")} · {Object.keys(preview.state.ratings).length} {t("ratings")} · {preview.state.attempts.length} {t("quizzes. This replaces current browser state; current bundled sample words are combined with its saved changes.")}</p> : <><p>{preview.words.length} {t("entries")} · {preview.words.filter(e => entries.some(old => old.id === e.id)).length} {t("matching IDs will update.")}</p>{warningFor(preview.words) && <p className="warning">{t("Translations with existing progress will change. Progress stays attached to their IDs.")}</p>}<ul>{preview.words.slice(0,8).map(e => <li key={e.id}>{e.spanish} — {e.english} ({e.category})</li>)}</ul>{preview.words.length > 8 && <p>{t("And")} {preview.words.length - 8} {t("more.")}</p>}</>}<div className="toolbar"><button className="green" onClick={applyPreview}>{t(preview.type === 'backup' ? 'Confirm restore' : 'Confirm import')}</button><button onClick={() => setPreview(null)}>{t("Cancel")}</button></div></div>}
    {form && <form className="word-form" onSubmit={save}><h3>{form.id ? t('Edit word') : t('Add a word')}</h3>{form.id && <p className="hint small">{t("Stable ID:")} {form.id}</p>}<div className="form-grid">{fields.filter(k => k !== 'id').map(key => <label key={key}>{key === 'image' ? t('Image URL (optional)') : t(key[0].toUpperCase()+key.slice(1))}{['spanish','english','category'].includes(key) ? ' *' : ''}{key === 'notes' ? <textarea value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}/> : <input value={form[key] || ''} required={['spanish','english','category'].includes(key)} onChange={e => setForm({ ...form, [key]: e.target.value })} list={key === 'category' ? 'category-list' : undefined}/>}</label>)}</div><datalist id="category-list">{[...new Set(entries.map(e=>e.category))].map(c=><option key={c}>{c}</option>)}</datalist><div className="toolbar"><button className="green" type="submit">{t("Save word")}</button><button type="button" onClick={() => setForm(null)}>{t("Cancel")}</button></div></form>}
    <label className="search">{t("Search your vocabulary")}<input type="search" placeholder={t("Spanish, English, or category\u2026")} value={search} onChange={e => setSearch(e.target.value)}/></label>
    <div className="word-list">{filtered.length ? filtered.map(entry => <article key={entry.id}><div><span className="eyebrow">{t(entry.category)}</span><h3 lang="es">{entry.spanish}</h3><p>{entry.english}</p><small>{data.ratings[entry.id]?.status === 'got' ? t('Got it') : data.ratings[entry.id] ? t('Still learning') : t('Not rated')} · {t("Quiz")}: {data.quizStats[entry.id]?.correct || 0}/{data.quizStats[entry.id]?.answered || 0} {t("correct")}</small></div><div className="toolbar"><button aria-label={t(`Edit ${entry.spanish}`)} onClick={() => { setForm({ ...entry }); setError(''); }}>{t("Edit")}</button><button aria-label={t(`Delete ${entry.spanish}`)} onClick={() => { if (window.confirm(t(`Delete ${entry.spanish}? Historical quiz records will remain.`)) && allowChange()) { setData(s => removeEntry(s, entry.id)); setNotice('Word deleted.'); } }}>{t("Delete")}</button></div></article>) : <p>{t("No matching words. Add one or adjust your search.")}</p>}</div>
  </section>;
}
