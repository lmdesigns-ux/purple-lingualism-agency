import { translator } from './i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import base from './data/vocabulary.json';
import { loadState, saveState, effectiveVocabulary, shuffle, resetRatings, buildQuiz, answerAttempt, newId, saveSubdeck, deleteSubdeck, subdeckEntries, rateCard } from './lib';
import Manager from './Manager';
import SubdeckEditor from './SubdeckEditor';

const palette = ['#ffdc00','#ff4141','#35b744','#a58bfa','#36c8d3'];
export default function App() {
  const [initial] = useState(() => loadState());
  const blocked = useRef(initial.blocked);
  const [data, setData] = useState(() => ({ ...initial.state, attempts: initial.state.attempts.map(a => a.status === 'active' ? { ...a, status: 'incomplete' } : a) }));
  const [storageError, setStorageError] = useState(initial.error);
  const [mode, setMode] = useState('Flash Cards');
  const [failedImages, setFailedImages] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editor, setEditor] = useState(null);
  const deckSelector = useRef(null), wasEditing = useRef(false);
  const [order, setOrder] = useState([]), [position, setPosition] = useState(0), [flipped, setFlipped] = useState(false);
  const [quizId, setQuizId] = useState(null), [questionIndex, setQuestionIndex] = useState(0), [quizNotice, setQuizNotice] = useState('');
  const entries = useMemo(() => effectiveVocabulary(base, data), [data.overrides, data.deleted]);
  const categories = [...new Set(entries.map(e => e.category))];
  const p = data.preferences;
  const language = p.language || 'en';
  const t = translator(language);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const mainSelection = entries.filter(e => p.categories === null || p.categories.includes(e.category));
  const deck = data.subdecks.find(d => d.id === p.deckId);
  const ratings = deck ? deck.ratings : data.ratings;
  const selected = deck ? subdeckEntries(entries, deck) : mainSelection;
  const selectedCategoryCount = categories.filter(c => p.categories === null || p.categories.includes(c)).length;
  const categorySummary = selectedCategoryCount === categories.length ? t('All categories') : selectedCategoryCount === 1 ? categories.find(c => p.categories?.includes(c)) : `${selectedCategoryCount} of ${categories.length} categories`;
  const signature = `${deck?.id ?? 'main'}:${selected.map(e => e.id).join('|')}`;
  useEffect(() => { setOrder(selected.map(e => e.id)); setPosition(0); setFlipped(false); }, [signature]);
  useEffect(() => {
    if (!editor && wasEditing.current) deckSelector.current?.focus();
    wasEditing.current = !!editor;
  }, [editor]);
  useEffect(() => {
    if (blocked.current) return;
    try { saveState(data); setStorageError(''); }
    catch (e) { setStorageError(`Progress is only in memory: ${e.message}. Export a full backup before closing this tab.`); }
  }, [data]);
  const selectedIds = new Set(selected.map(e => e.id));
  const remaining = order.filter(id => selectedIds.has(id) && ratings[id]?.status !== 'got');
  const card = entries.find(e => e.id === remaining[position]);
  const quiz = data.attempts.find(a => a.id === quizId);
  const active = quiz?.status === 'active';
  function allowChange() {
    if (active && !window.confirm(t('Leave this quiz? Answered questions will be kept as an incomplete attempt.'))) return false;
    if (active) setData(s => ({ ...s, attempts: s.attempts.map(a => a.id === quizId ? { ...a, status: 'incomplete' } : a) }));
    setQuizId(null); return true;
  }
  function preference(key, value) {
    if (key !== 'pronunciation' && !allowChange()) return;
    setData(s => ({ ...s, preferences: { ...s.preferences, [key]: value } })); setFlipped(false);
  }
  function toggleCategory(c) {
    const current = p.categories ?? categories;
    preference('categories', current.includes(c) ? current.filter(x => x !== c) : [...current, c]);
  }
  function navigate(step) { setPosition(i => remaining.length ? (i + step + remaining.length) % remaining.length : 0); setFlipped(false); }
  function rate(status) {
    setData(s => rateCard(s, card.id, status, deck?.id ?? null));
    if (status === 'got') { setPosition(i => remaining.length > 1 ? i % (remaining.length - 1) : 0); setFlipped(false); }
    else navigate(1);
  }
  function startQuiz(missed) {
    if (!allowChange()) return;
    const pool = missed ? selected.filter(e => missed.includes(e.id)) : selected;
    const result = buildQuiz(pool, entries, p.englishFirst);
    setQuizNotice([result.ambiguous ? `${result.ambiguous} ambiguous item(s) skipped because the same prompt has conflicting translations.` : '', result.insufficient ? `${result.insufficient} item(s) need another distinct translation for a distractor.` : '', 'Choices come from your whole collection; same-category choices are preferred.'].filter(Boolean).join(' '));
    if (!result.questions.length) { setQuizId(null); return; }
    const attempt = { id: newId(), startedAt: new Date().toISOString(), status: 'active', englishFirst: p.englishFirst, deckId: deck?.id ?? null, deckName: deck?.name ?? 'Main deck', questions: result.questions, answers: [] };
    setData(s => ({ ...s, attempts: [...s.attempts, attempt] })); setQuizId(attempt.id); setQuestionIndex(0);
  }
  function restore(state) { blocked.current = false; setData({ ...state, attempts: state.attempts.map(a => a.status === 'active' ? { ...a, status: 'incomplete' } : a) }); setQuizId(null); setEditor(null); setPosition(0); setFlipped(false); }
  function openEditor(edit) {
    if (allowChange()) setEditor({ deck: edit ? deck : null });
  }
  function commitSubdeck(draft) {
    // Validate before closing the editor so errors leave its draft intact.
    const next = saveSubdeck(data, draft);
    setData(next); setEditor(null); setPosition(0); setFlipped(false);
  }
  function removeSubdeck() {
    if (!window.confirm(t('Delete this subdeck and its progress? Your vocabulary and other decks will stay.')) || !allowChange()) return;
    setData(s => deleteSubdeck(s, deck.id)); setPosition(0); setFlipped(false);
  }
  function resetDeck() {
    const message = deck ? t('Reset all progress in this subdeck? All available assigned cards will return. Other decks and quizzes will stay.') : t(`Clear flashcard ratings for ${selected.length} selected items? Vocabulary and quiz results will stay.`);
    if (!window.confirm(message)) return;
    setData(s => resetRatings(s, deck ? deck.cardIds : selected.map(e => e.id), deck?.id ?? null));
    setPosition(0); setFlipped(false);
  }
  const learned = selected.filter(e => ratings[e.id]?.status === 'got').length;
  const unavailable = deck ? deck.cardIds.length - selected.length : 0;
  const showSpanish = p.englishFirst ? flipped : !flipped;
  const imageMode = mode === 'Flash Cards' && p.images;
  const showImage = imageMode && !showSpanish && card?.image && !failedImages.includes(card.image);
  return <main>
    <header><div className="eyebrow">{t("A LITTLE PRACTICE, EVERY DAY")} <span className="language-switch" role="group" aria-label={t("Interface language")}>{["es", "en"].map(lang => <button key={lang} lang={lang} aria-label={lang === "es" ? "Español" : "English"} aria-pressed={language === lang} onClick={() => setData(s => ({ ...s, preferences: { ...s.preferences, language: lang } }))}>{lang.toUpperCase()}</button>)}</span></div><h1>{t("My vocabulary")}<span className="period">.</span></h1><p className="subtitle">{t("Words for your world. Start at home.")}</p></header>
    {storageError && <aside className="warning" role="alert">{t(storageError)} <button onClick={() => { if (allowChange()) { setEditor(null); setMode('Manage Vocabulary'); } }}>{t("Open backups")}</button></aside>}
    <nav className="tabs" aria-label={t("Practice modes")}>{['Flash Cards','Quiz','Manage Vocabulary'].map(m => <button key={m} disabled={!!editor} className={mode === m ? 'active' : ''} aria-pressed={mode === m} onClick={() => { if (mode === m || allowChange()) setMode(m); }}>{t(m)}</button>)}</nav>
    {editor && <SubdeckEditor deck={editor.deck} entries={entries} knownEntries={effectiveVocabulary(base, { ...data, deleted: [] })} seedIds={mainSelection.map(e => e.id)} visibleMainIds={mainSelection.filter(e => data.ratings[e.id]?.status !== 'got').map(e => e.id)} language={language} onSave={commitSubdeck} onCancel={() => setEditor(null)}/>}
    {mode !== 'Manage Vocabulary' && !editor && <>
      <div className="deck-picker">
        <label>{t('Practice deck')}<select ref={deckSelector} value={deck?.id ?? ''} onChange={event => { preference('deckId', event.target.value || null); setPosition(0); }}>{/* Controlled value restores selection if quiz exit is canceled. */}
          <option value="">{t('Main deck')}</option>{data.subdecks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select></label>
        <div className="toolbar"><button onClick={() => openEditor(false)}>{t('Create subdeck')}</button>{deck && <><button onClick={() => openEditor(true)}>{t('Edit subdeck')}</button><button onClick={removeSubdeck}>{t('Delete subdeck')}</button></>}</div>
      </div>
      {deck && <p className="deck-counts">{t('Assigned')}: {deck.cardIds.length} · {t('Learned')}: {learned} · {t('Remaining')}: {selected.length - learned} · {t('Unavailable')}: {unavailable}</p>}
      {!deck &&
      <div className="category-picker">
        <button className="category-toggle" aria-label={t("Choose categories")} aria-expanded={categoriesOpen} aria-controls="category-options" onClick={() => setCategoriesOpen(open => !open)}><span className="category-title"><i className="all-swatch"/>{t("Categories")}</span><span className="category-summary">{t(categorySummary)} · {t(`${selected.length} words`)}<span aria-hidden="true">{categoriesOpen ? ' −' : ' +'}</span></span></button>
        {categoriesOpen && <div id="category-options" className="category-options"><p className="hint">{t("Choose one or more categories.")}</p><div className="filters" aria-label={t("Vocabulary categories")}><button className={p.categories === null ? 'selected' : ''} aria-pressed={p.categories === null} onClick={() => preference('categories', null)}><i className="all-swatch"/>{t("All cards")}</button>{categories.map((c,i) => <button key={c} className={p.categories === null || p.categories.includes(c) ? 'selected' : ''} aria-pressed={p.categories === null || p.categories.includes(c)} onClick={() => toggleCategory(c)}><i style={{ background: palette[i % palette.length] }}/>{t(c)}</button>)}</div><div className="toolbar"><button onClick={() => preference('categories', [])}>{t("Clear selection")}</button><button className="black" onClick={() => setCategoriesOpen(false)}>{t("Done")}</button></div></div>}
      </div>}
      <div className="settings" role="group" aria-label={t("Card display")}>{mode === 'Flash Cards' && <label><input type="checkbox" checked={!!p.images} onChange={e => preference('images', e.target.checked)}/>{t("Show images")}</label>}<label><input type="checkbox" checked={p.englishFirst} onChange={e => preference('englishFirst', e.target.checked)}/>{imageMode ? t('Show image first') : t('Show English first')}</label><label><input type="checkbox" checked={p.pronunciation} onChange={e => preference('pronunciation', e.target.checked)}/>{t("Show pronunciation")}</label></div>
      {imageMode && <p className="hint image-hint">{t("Images replace English where available. Other cards use English.")}</p>}
      {p.pronunciation && <p className="hint">{t("Pronunciation is approximate. CAPITAL letters mark the stressed syllable.")}</p>}
    </>}
    {mode === 'Flash Cards' && !editor && <section aria-label={t("Flashcards")}>
      <div className="section-line"><strong>{t(`${learned} of ${selected.length} marked Got it`)}</strong><span>{card ? `${position + 1} / ${remaining.length}` : '0 / 0'}</span></div>
      <progress value={learned} max={selected.length || 1} aria-label={t("Self-rated flashcard progress")}/><p className="hint small">{t("Your self-rating, not a test of lasting mastery.")}</p>
      {card ? <><button className="flashcard offset" onClick={() => setFlipped(v => !v)} aria-label={t(`Flip card: ${showImage ? t('image prompt') : showSpanish ? card.spanish : card.english}`)}><span className="card-top"><span>{t(card.category)}</span>{card.region && <span className="region">{card.region}</span>}</span><span className="card-middle">{showImage ? <img className="card-image" src={card.image} alt={t("Vocabulary image \u2014 flip to reveal the Spanish word")} onError={() => setFailedImages(previous => [...previous, card.image])}/> : <span className="word" lang={showSpanish ? 'es' : 'en'}>{showSpanish ? card.spanish : card.english}</span>}{showSpanish && p.pronunciation && card.pronunciation && <span className="pronunciation">{card.pronunciation}</span>}{flipped && !showImage && card.notes && <span className="notes">{card.notes}</span>}</span><span className="card-bottom">{flipped ? t('Tap to return') : t('Tap to flip')}{ratings[card.id]?.status !== 'learning' && <span>{ratings[card.id]?.status === 'got' ? t('✓ Got it') : t('Not rated')}</span>}</span></button>
      <div className="rating-buttons"><button className="yellow" onClick={() => rate('learning')}>{t("Still learning")}</button><button className="green" onClick={() => rate('got')}>{t("Got it")}</button></div></> : <div className="empty" role="status"><h2>{selected.length ? t('All done for this deck!') : t(deck ? (deck.cardIds.length ? 'No assigned cards are available.' : 'This subdeck is empty.') : 'No cards selected.')}</h2><p>{selected.length ? t('Every selected card is marked Got it. Reset this deck to practice them again.') : t(deck ? 'Use Edit subdeck to add or remove cards. Unavailable cards return when restored to your vocabulary.' : 'Choose a category, select All cards, or add vocabulary.')}</p></div>}
      <div className="toolbar"><button disabled={!card} onClick={() => navigate(-1)}>{t("\u2190 Previous")}</button><button disabled={!card} onClick={() => navigate(1)}>{t("Next \u2192")}</button><button disabled={!card} onClick={() => { setOrder(shuffle(order)); setPosition(0); setFlipped(false); }}>{t("Shuffle")}</button><button disabled={deck ? !deck.cardIds.length : !selected.length} onClick={resetDeck}>{t(deck ? 'Reset subdeck' : 'Reset this deck')}</button></div>
    </section>}
    {mode === 'Quiz' && !editor && <section aria-label={t("Vocabulary quiz")}>
      {quizNotice && <p className="hint" role="status">{t(quizNotice)}</p>}
      {deck && !selected.length && <p role="status">{t(deck.cardIds.length ? 'No assigned cards are available.' : 'This subdeck is empty.')} {t('Use Edit subdeck to add or remove cards. Unavailable cards return when restored to your vocabulary.')}</p>}
      {!quiz ? <div className="empty"><div className="eyebrow">{t("RECOGNIZE. RECALL. REPEAT.")}</div><h2>{t("A little quiz.")}<br/>{t("A stronger memory.")}</h2><p>{t("Up to 10 questions from your selected cards. Quiz scores stay separate from your flashcard ratings.")}</p><button className="black" onClick={() => startQuiz()} disabled={!selected.length}>{t("Start quiz \u2192")}</button><p className="hint small">{data.attempts.filter(a => a.status === 'complete').length} {t("completed")} · {data.attempts.filter(a => a.status === 'incomplete').length} {t("incomplete attempts saved")}</p></div>
      : questionIndex >= quiz.questions.length ? <QuizResults language={language} quiz={quiz} retry={ids => startQuiz(ids)} restart={() => startQuiz()}/>
      : <QuizQuestion language={language} quiz={quiz} index={questionIndex} pronunciation={p.pronunciation} answer={choice => setData(s => answerAttempt(s, quiz.id, questionIndex, choice))} next={() => setQuestionIndex(i => i + 1)}/>}
    </section>}
    {mode === 'Manage Vocabulary' && <Manager language={language} entries={entries} data={data} setData={setData} allowChange={allowChange} restore={restore}/>}
    <footer><strong>POCO A POCO.</strong><span>{t("Personal practice. Saved in this browser.")}</span></footer>
  </main>;
}

function QuizQuestion({ language, quiz, index, pronunciation, answer, next }) {
  const t = translator(language);
  const q = quiz.questions[index], response = quiz.answers[index];
  const score = quiz.answers.filter(a => a.correct).length;
  return <div key={`${quiz.id}-${index}`}><div className="section-line"><strong>{t(`Question ${index + 1} of ${quiz.questions.length}`)}</strong><strong>{t(`Score: ${score}`)}</strong></div><div className="question-card offset"><div className="card-top"><span>{t(q.category)}{quiz.deckName && <small className="quiz-deck">{quiz.deckId ? quiz.deckName : t('Main deck')}</small>}</span>{q.region && <span>{q.region}</span>}</div><h2 lang={quiz.englishFirst ? 'en' : 'es'}>{q.prompt}</h2>{pronunciation && !quiz.englishFirst && q.pronunciation && <p className="pronunciation">{q.pronunciation}</p>}</div><div className="choices">{q.choices.map(choice => <button disabled={!!response} key={choice} className={response ? choice === q.correct ? 'correct' : choice === response.choice ? 'incorrect' : '' : ''} onClick={() => answer(choice)}>{choice}{response && choice === q.correct && <span>{t("\u2713 Correct answer")}</span>}{response && choice === response.choice && !response.correct && <span>{t("\u2715 Your answer")}</span>}</button>)}</div>{response && <div className="feedback" role="status"><strong>{response.correct ? t('Correct!') : t(`Not this time. Correct answer: ${q.correct}`)}</strong>{pronunciation && quiz.englishFirst && q.pronunciation && <p>{t("Spanish pronunciation:")} {q.pronunciation}</p>}<button className="black" onClick={next}>{index + 1 === quiz.questions.length ? t('See results →') : t('Next question →')}</button></div>}</div>;
}
function QuizResults({ language, quiz, retry, restart }) {
  const t = translator(language);
  const missed = quiz.questions.filter((q,i) => !quiz.answers[i]?.correct);
  return <div className="results"><div className="eyebrow">{t("QUIZ COMPLETE")}</div><h2>{quiz.answers.filter(a => a.correct).length} <span className="muted">/ {quiz.questions.length}</span></h2><p>{missed.length ? t('A few words to come back to.') : t('Every answer correct. Come back later to check what sticks.')}</p>{!!missed.length && <><h3>{t("Review missed questions")}</h3><ul className="review">{quiz.questions.map((q,i) => !quiz.answers[i]?.correct && <li key={q.itemId}><strong>{q.prompt}</strong><span>{t("Your answer:")} {quiz.answers[i]?.choice}</span><span>{t("Correct:")} {q.correct}</span></li>)}</ul></>}<div className="toolbar">{!!missed.length && <button className="yellow" onClick={() => retry(missed.map(q => q.itemId))}>{t("Retry missed questions")}</button>}<button className="black" onClick={restart}>{t("New quiz \u2192")}</button></div><p className="hint">{t("These results have not changed your flashcard ratings.")}</p></div>;
}
