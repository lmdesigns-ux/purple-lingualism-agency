import { useEffect, useMemo, useRef, useState } from 'react';
import base from './data/vocabulary.json';
import { loadState, saveState, effectiveVocabulary, shuffle, resetRatings, buildQuiz, answerAttempt, newId } from './lib';
import Manager from './Manager';

const palette = ['#ffdc00','#ff4141','#35b744','#a58bfa','#36c8d3'];
export default function App() {
  const [initial] = useState(() => loadState());
  const blocked = useRef(initial.blocked);
  const [data, setData] = useState(() => ({ ...initial.state, attempts: initial.state.attempts.map(a => a.status === 'active' ? { ...a, status: 'incomplete' } : a) }));
  const [storageError, setStorageError] = useState(initial.error);
  const [mode, setMode] = useState('Flash Cards');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [order, setOrder] = useState([]), [position, setPosition] = useState(0), [flipped, setFlipped] = useState(false);
  const [quizId, setQuizId] = useState(null), [questionIndex, setQuestionIndex] = useState(0), [quizNotice, setQuizNotice] = useState('');
  const entries = useMemo(() => effectiveVocabulary(base, data), [data.overrides, data.deleted]);
  const categories = [...new Set(entries.map(e => e.category))];
  const p = data.preferences;
  const selected = entries.filter(e => p.categories === null || p.categories.includes(e.category));
  const selectedCategoryCount = categories.filter(c => p.categories === null || p.categories.includes(c)).length;
  const categorySummary = selectedCategoryCount === categories.length ? 'All categories' : selectedCategoryCount === 1 ? categories.find(c => p.categories?.includes(c)) : `${selectedCategoryCount} of ${categories.length} categories`;
  const signature = selected.map(e => e.id).join('|');
  useEffect(() => { setOrder(selected.map(e => e.id)); setPosition(0); setFlipped(false); }, [signature]);
  useEffect(() => {
    if (blocked.current) return;
    try { saveState(data); setStorageError(''); }
    catch (e) { setStorageError(`Progress is only in memory: ${e.message}. Export a full backup before closing this tab.`); }
  }, [data]);
  const remaining = order.filter(id => data.ratings[id]?.status !== 'got');
  const card = entries.find(e => e.id === remaining[position]);
  const quiz = data.attempts.find(a => a.id === quizId);
  const active = quiz?.status === 'active';
  function allowChange() {
    if (active && !window.confirm('Leave this quiz? Answered questions will be kept as an incomplete attempt.')) return false;
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
    setData(s => ({ ...s, ratings: { ...s.ratings, [card.id]: { status, updatedAt: new Date().toISOString() } } }));
    if (status === 'got') { setPosition(i => remaining.length > 1 ? i % (remaining.length - 1) : 0); setFlipped(false); }
    else navigate(1);
  }
  function startQuiz(missed) {
    if (!allowChange()) return;
    const pool = missed ? entries.filter(e => missed.includes(e.id)) : selected;
    const result = buildQuiz(pool, entries, p.englishFirst);
    setQuizNotice([result.ambiguous ? `${result.ambiguous} ambiguous item(s) skipped because the same prompt has conflicting translations.` : '', result.insufficient ? `${result.insufficient} item(s) need another distinct translation for a distractor.` : '', 'Choices come from your whole collection; same-category choices are preferred.'].filter(Boolean).join(' '));
    if (!result.questions.length) { setQuizId(null); return; }
    const attempt = { id: newId(), startedAt: new Date().toISOString(), status: 'active', englishFirst: p.englishFirst, questions: result.questions, answers: [] };
    setData(s => ({ ...s, attempts: [...s.attempts, attempt] })); setQuizId(attempt.id); setQuestionIndex(0);
  }
  function restore(state) { blocked.current = false; setData({ ...state, attempts: state.attempts.map(a => a.status === 'active' ? { ...a, status: 'incomplete' } : a) }); setQuizId(null); setPosition(0); setFlipped(false); }
  const learned = selected.filter(e => data.ratings[e.id]?.status === 'got').length;
  const showSpanish = p.englishFirst ? flipped : !flipped;
  return <main>
    <header><div className="eyebrow">A LITTLE PRACTICE, EVERY DAY <span>ES / EN</span></div><h1>Mi vocabulario<span className="period">.</span></h1><p className="subtitle">Words for your world. Start at home.</p></header>
    {storageError && <aside className="warning" role="alert">{storageError} <button onClick={() => { if (allowChange()) setMode('Manage Vocabulary'); }}>Open backups</button></aside>}
    <nav className="tabs" aria-label="Practice modes">{['Flash Cards','Quiz','Manage Vocabulary'].map(m => <button key={m} className={mode === m ? 'active' : ''} aria-pressed={mode === m} onClick={() => { if (mode === m || allowChange()) setMode(m); }}>{m}</button>)}</nav>
    {mode !== 'Manage Vocabulary' && <>
      <div className="category-picker">
        <button className="category-toggle" aria-label="Choose categories" aria-expanded={categoriesOpen} aria-controls="category-options" onClick={() => setCategoriesOpen(open => !open)}><span className="category-title"><i className="all-swatch"/>Categories</span><span className="category-summary">{categorySummary} · {selected.length} words<span aria-hidden="true">{categoriesOpen ? ' −' : ' +'}</span></span></button>
        {categoriesOpen && <div id="category-options" className="category-options"><p className="hint">Choose one or more categories.</p><div className="filters" aria-label="Vocabulary categories"><button className={p.categories === null ? 'selected' : ''} aria-pressed={p.categories === null} onClick={() => preference('categories', null)}><i className="all-swatch"/>All cards</button>{categories.map((c,i) => <button key={c} className={p.categories === null || p.categories.includes(c) ? 'selected' : ''} aria-pressed={p.categories === null || p.categories.includes(c)} onClick={() => toggleCategory(c)}><i style={{ background: palette[i % palette.length] }}/>{c}</button>)}</div><div className="toolbar"><button onClick={() => preference('categories', [])}>Clear selection</button><button className="black" onClick={() => setCategoriesOpen(false)}>Done</button></div></div>}
      </div>
      <div className="settings"><label><input type="checkbox" checked={p.englishFirst} onChange={e => preference('englishFirst', e.target.checked)}/>Show English first</label><label><input type="checkbox" checked={p.pronunciation} onChange={e => preference('pronunciation', e.target.checked)}/>Show pronunciation</label></div>
      {p.pronunciation && <p className="hint">Pronunciation is approximate. CAPITAL letters mark the stressed syllable.</p>}
    </>}
    {mode === 'Flash Cards' && <section aria-label="Flashcards">
      <div className="section-line"><strong>{learned} of {selected.length} marked Got it</strong><span>{card ? `${position + 1} / ${remaining.length}` : '0 / 0'}</span></div>
      <progress value={learned} max={selected.length || 1} aria-label="Self-rated flashcard progress"/><p className="hint small">Your self-rating, not a test of lasting mastery.</p>
      {card ? <><button className="flashcard offset" onClick={() => setFlipped(v => !v)} aria-label={`Flip card: ${showSpanish ? card.spanish : card.english}`}><span className="card-top"><span>{card.category}</span>{card.region && <span className="region">{card.region}</span>}</span><span className="card-middle"><span className="word" lang={showSpanish ? 'es' : 'en'}>{showSpanish ? card.spanish : card.english}</span>{showSpanish && p.pronunciation && card.pronunciation && <span className="pronunciation">{card.pronunciation}</span>}{flipped && card.notes && <span className="notes">{card.notes}</span>}</span><span className="card-bottom">{flipped ? 'Tap to return' : 'Tap to flip'}<span>{data.ratings[card.id]?.status === 'got' ? '✓ Got it' : data.ratings[card.id] ? 'Still learning' : 'Not rated'}</span></span></button>
      <div className="rating-buttons"><button className="yellow" onClick={() => rate('learning')}>Still learning</button><button className="green" onClick={() => rate('got')}>Got it</button></div></> : <div className="empty" role="status"><h2>{selected.length ? 'All done for this deck!' : 'No cards selected.'}</h2><p>{selected.length ? 'Every selected card is marked Got it. Reset this deck to practice them again.' : 'Choose a category, select All cards, or add vocabulary.'}</p></div>}
      <div className="toolbar"><button disabled={!card} onClick={() => navigate(-1)}>← Previous</button><button disabled={!card} onClick={() => navigate(1)}>Next →</button><button disabled={!card} onClick={() => { setOrder(shuffle(order)); setPosition(0); setFlipped(false); }}>Shuffle</button><button disabled={!selected.length} onClick={() => { if (window.confirm(`Clear flashcard ratings for ${selected.length} selected items? Vocabulary and quiz results will stay.`)) { setData(s => resetRatings(s, selected.map(e => e.id))); setPosition(0); setFlipped(false); } }}>Reset this deck</button></div>
    </section>}
    {mode === 'Quiz' && <section aria-label="Vocabulary quiz">
      {quizNotice && <p className="hint" role="status">{quizNotice}</p>}
      {!quiz ? <div className="empty"><div className="eyebrow">RECOGNIZE. RECALL. REPEAT.</div><h2>A little quiz.<br/>A stronger memory.</h2><p>Up to 10 questions from your selected cards. Quiz scores stay separate from your flashcard ratings.</p><button className="black" onClick={() => startQuiz()} disabled={!selected.length}>Start quiz →</button><p className="hint small">{data.attempts.filter(a => a.status === 'complete').length} completed · {data.attempts.filter(a => a.status === 'incomplete').length} incomplete attempts saved</p></div>
      : questionIndex >= quiz.questions.length ? <QuizResults quiz={quiz} retry={ids => startQuiz(ids)} restart={() => startQuiz()}/>
      : <QuizQuestion quiz={quiz} index={questionIndex} pronunciation={p.pronunciation} answer={choice => setData(s => answerAttempt(s, quiz.id, questionIndex, choice))} next={() => setQuestionIndex(i => i + 1)}/>}
    </section>}
    {mode === 'Manage Vocabulary' && <Manager entries={entries} data={data} setData={setData} allowChange={allowChange} restore={restore}/>}
    <footer><strong>POCO A POCO.</strong><span>Personal practice. Saved in this browser.</span></footer>
  </main>;
}

function QuizQuestion({ quiz, index, pronunciation, answer, next }) {
  const q = quiz.questions[index], response = quiz.answers[index];
  const score = quiz.answers.filter(a => a.correct).length;
  return <div key={`${quiz.id}-${index}`}><div className="section-line"><strong>Question {index + 1} of {quiz.questions.length}</strong><strong>Score: {score}</strong></div><div className="question-card offset"><div className="card-top"><span>{q.category}</span>{q.region && <span>{q.region}</span>}</div><h2 lang={quiz.englishFirst ? 'en' : 'es'}>{q.prompt}</h2>{pronunciation && !quiz.englishFirst && q.pronunciation && <p className="pronunciation">{q.pronunciation}</p>}</div><div className="choices">{q.choices.map(choice => <button disabled={!!response} key={choice} className={response ? choice === q.correct ? 'correct' : choice === response.choice ? 'incorrect' : '' : ''} onClick={() => answer(choice)}>{choice}{response && choice === q.correct && <span>✓ Correct answer</span>}{response && choice === response.choice && !response.correct && <span>✕ Your answer</span>}</button>)}</div>{response && <div className="feedback" role="status"><strong>{response.correct ? 'Correct!' : `Not this time. Correct answer: ${q.correct}`}</strong>{pronunciation && quiz.englishFirst && q.pronunciation && <p>Spanish pronunciation: {q.pronunciation}</p>}<button className="black" onClick={next}>{index + 1 === quiz.questions.length ? 'See results →' : 'Next question →'}</button></div>}</div>;
}
function QuizResults({ quiz, retry, restart }) {
  const missed = quiz.questions.filter((q,i) => !quiz.answers[i]?.correct);
  return <div className="results"><div className="eyebrow">QUIZ COMPLETE</div><h2>{quiz.answers.filter(a => a.correct).length} <span className="muted">/ {quiz.questions.length}</span></h2><p>{missed.length ? 'A few words to come back to.' : 'Every answer correct. Come back later to check what sticks.'}</p>{!!missed.length && <><h3>Review missed questions</h3><ul className="review">{quiz.questions.map((q,i) => !quiz.answers[i]?.correct && <li key={q.itemId}><strong>{q.prompt}</strong><span>Your answer: {quiz.answers[i]?.choice}</span><span>Correct: {q.correct}</span></li>)}</ul></>}<div className="toolbar">{!!missed.length && <button className="yellow" onClick={() => retry(missed.map(q => q.itemId))}>Retry missed questions</button>}<button className="black" onClick={restart}>New quiz →</button></div><p className="hint">These results have not changed your flashcard ratings.</p></div>;
}
