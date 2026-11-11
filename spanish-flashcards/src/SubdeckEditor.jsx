import { useState } from 'react';
import { normalize } from './lib';
import { translator } from './i18n';

const PAGE_SIZE = 25;

export default function SubdeckEditor({ deck, entries, knownEntries, seedIds, visibleMainIds = [], language, onSave, onCancel }) {
  const t = translator(language);
  const [name, setName] = useState(deck?.name ?? '');
  const [cardIds, setCardIds] = useState(deck?.cardIds ?? []);
  const [seed, setSeed] = useState('empty');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [show, setShow] = useState(deck ? 'assigned' : 'all');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const membership = new Set(cardIds);
  const availableIds = new Set(entries.map(entry => entry.id));
  const known = new Map(knownEntries.map(entry => [entry.id, entry]));
  const unavailableIds = cardIds.filter(id => !availableIds.has(id));
  const categories = [...new Set(entries.map(entry => entry.category))];
  const filtered = entries.filter(entry => (!category || entry.category === category)
    && (show === 'all' || membership.has(entry.id))
    && normalize(`${entry.spanish} ${entry.english} ${entry.category} ${t(entry.category)}`).includes(normalize(search)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  function toggle(id) {
    setCardIds(ids => ids.includes(id) ? ids.filter(member => member !== id) : [...ids, id]);
  }
  function save(event) {
    event.preventDefault();
    try { onSave({ id: deck?.id, name, cardIds }); }
    catch (e) { setError(e.message); }
  }
  return <section className="subdeck-editor" aria-labelledby="subdeck-editor-title">
    <h2 id="subdeck-editor-title">{t(deck ? 'Edit subdeck' : 'Create subdeck')}</h2>
    <p className="hint">{t('Choose membership here. Marking a card Got it only hides it during practice.')}</p>
    <form onSubmit={save}>
      <label className="deck-name">{t('Subdeck name')}<input autoFocus required value={name} onChange={event => { setName(event.target.value); setError(''); }}/></label>
      {!deck && <fieldset className="deck-seed"><legend>{t('Start with')}</legend>
        <label><input type="radio" name="deck-seed" checked={seed === 'empty'} onChange={() => { setSeed('empty'); setCardIds([]); }}/>{t('An empty subdeck')}</label>
        <label><input type="radio" name="deck-seed" checked={seed === 'categories'} onChange={() => { setSeed('categories'); setCardIds(seedIds); }}/>{t('Main deck’s selected categories')} ({seedIds.length})</label>
        <label><input type="radio" name="deck-seed" checked={seed === 'visible'} onChange={() => { setSeed('visible'); setCardIds(visibleMainIds); }}/>{t('Main deck’s visible cards')} ({visibleMainIds.length})</label>
      </fieldset>}
      <p className="deck-counts" role="status">{t('Assigned')}: {cardIds.length} · {t('Unavailable')}: {unavailableIds.length}</p>
      <div className="editor-filters">
        <label>{t('Find cards')}<input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}/></label>
        <label>{t('Category')}<select value={category} onChange={event => { setCategory(event.target.value); setPage(0); }}><option value="">{t('All categories')}</option>{categories.map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label>
        <label>{t('Show cards')}<select value={show} onChange={event => { setShow(event.target.value); setPage(0); }}><option value="all">{t('All vocabulary')}</option><option value="assigned">{t('Assigned cards')}</option></select></label>
      </div>
      <div className="toolbar">
        <button type="button" disabled={!filtered.some(entry => !membership.has(entry.id))} onClick={() => setCardIds(ids => [...new Set([...ids, ...filtered.map(entry => entry.id)])])}>{t('Add filtered cards')}</button>
        <button type="button" disabled={!filtered.some(entry => membership.has(entry.id))} onClick={() => { const removed = new Set(filtered.map(entry => entry.id)); setCardIds(ids => ids.filter(id => !removed.has(id))); }}>{t('Remove filtered cards')}</button>
      </div>
      <p className="hint small">{t('Bulk changes apply to all matching cards, across pages. Save to apply your changes.')}</p>
      <div className="membership-list">
        {visible.map(entry => <label className="membership-row" key={entry.id}>
          <input type="checkbox" aria-label={`${t('Include card')}: ${entry.spanish}`} checked={membership.has(entry.id)} onChange={() => toggle(entry.id)}/>
          <span><strong lang="es">{entry.spanish}</strong><span>{entry.english}</span><small>{t(entry.category)} · {t(deck?.ratings[entry.id]?.status === 'got' ? 'Got it' : deck?.ratings[entry.id] ? 'Still learning' : 'Not rated')}</small></span>
        </label>)}
        {!visible.length && <p>{t('No matching cards.')}</p>}
      </div>
      <div className="toolbar result-pages">
        <button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>{t('Previous results')}</button>
        <span>{currentPage + 1} / {pages} · {t('Matches')}: {filtered.length}</span>
        <button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>{t('Next results')}</button>
      </div>
      {!!unavailableIds.length && <details className="unavailable-members"><summary>{t('Unavailable assigned cards')} ({unavailableIds.length})</summary>
        <p className="hint">{t('Unavailable cards stay assigned and return if restored to your vocabulary. Uncheck to remove their membership.')}</p>
        {unavailableIds.map(id => <label className="membership-row" key={id}><input type="checkbox" aria-label={`${t('Include unavailable card')}: ${id}`} checked onChange={() => toggle(id)}/><span>{known.get(id)?.spanish ?? id}</span></label>)}
      </details>}
      {error && <p className="warning" role="alert">{t(error)}</p>}
      <div className="toolbar editor-actions"><button className="green" type="submit">{t('Save subdeck')}</button><button type="button" onClick={onCancel}>{t('Cancel')}</button></div>
    </form>
  </section>;
}
