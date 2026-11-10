import Papa from 'papaparse';

// Keep the existing key so upgrading does not strand saved version 1 data.
export const STORAGE_KEY = 'spanish-flashcards:v1';
export const fields = ['id','spanish','english','category','pronunciation','notes','region','image'];
export const normalize = value => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase().normalize('NFC');
export const newId = () => `user-${crypto.randomUUID()}`;
export const freshState = () => ({ version: 2, overrides: {}, deleted: [], ratings: {}, subdecks: [], attempts: [], quizStats: {}, preferences: { language: 'en', englishFirst: false, images: false, pronunciation: true, categories: null, deckId: null } });
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const safeId = id => typeof id === 'string' && id.trim() && id !== 'prototype' && !Object.hasOwn(Object.prototype, id);

export function validateVocabulary(input, generateIds = false) {
  if (!Array.isArray(input)) throw new Error('Vocabulary must be an array of entries.');
  const seen = new Set();
  return input.map((row, i) => {
    if (!object(row)) throw new Error(`Row ${i + 1}: expected an object.`);
    const entry = {};
    for (const key of fields) {
      if (row[key] != null && typeof row[key] !== 'string') throw new Error(`Row ${i + 1}: ${key} must be text.`);
      entry[key] = (row[key] ?? '').trim();
    }
    if (entry.image && !/^(https?:\/\/|\/(?!\/))/.test(entry.image)) throw new Error(`Row ${i + 1}: image must be an HTTP(S) URL or local path starting with /.`);
    if (!entry.id && generateIds) entry.id = newId();
    if (!safeId(entry.id)) throw new Error(`Row ${i + 1}: missing or invalid ID.`);
    if (seen.has(entry.id)) throw new Error(`Row ${i + 1}: duplicate ID ${entry.id}.`);
    seen.add(entry.id);
    for (const key of ['spanish','english','category']) if (!entry[key]) throw new Error(`Row ${i + 1}: ${key} is required.`);
    return entry;
  });
}

export function validateState(s) {
  if (!object(s) || ![1, 2].includes(s.version)) throw new Error('Unsupported or missing backup version.');
  if (s.version === 1) s = { ...s, version: 2, subdecks: [], preferences: { ...s.preferences, deckId: null } };
  for (const key of ['overrides','ratings','quizStats','preferences']) if (!object(s[key])) throw new Error(`Invalid ${key} in backup.`);
  if (!Array.isArray(s.deleted) || !s.deleted.every(safeId) || !Array.isArray(s.attempts)) throw new Error('Invalid deletion list or quiz history.');
  const entries = validateVocabulary(Object.values(s.overrides));
  if (entries.some(e => !Object.hasOwn(s.overrides, e.id)) || Object.keys(s.overrides).some(id => !safeId(id) || s.overrides[id].id !== id)) throw new Error('Vocabulary IDs must match their storage keys.');
  validateRatings(s.ratings);
  if (!Array.isArray(s.subdecks)) throw new Error('Invalid subdecks.');
  const deckIds = new Set(), deckNames = new Set();
  for (const deck of s.subdecks) {
    if (!object(deck) || !safeId(deck.id) || deckIds.has(deck.id)) throw new Error('Invalid subdeck ID.');
    validateDeckName(deck.name, deckNames);
    if (!Array.isArray(deck.cardIds) || !deck.cardIds.every(safeId) || new Set(deck.cardIds).size !== deck.cardIds.length) throw new Error('Invalid subdeck membership.');
    validateRatings(deck.ratings);
    if (Object.keys(deck.ratings).some(id => !deck.cardIds.includes(id))) throw new Error('Invalid subdeck rating membership.');
    deckIds.add(deck.id); deckNames.add(normalize(deck.name));
  }
  const p = s.preferences;
  if (p.language != null && !['en', 'es'].includes(p.language)) throw new Error('Invalid interface language.');
  if (p.images != null && typeof p.images !== 'boolean') throw new Error('Invalid image preference.');
  if (typeof p.englishFirst !== 'boolean' || typeof p.pronunciation !== 'boolean' || !(p.categories === null || (Array.isArray(p.categories) && p.categories.every(c => typeof c === 'string')))) throw new Error('Invalid preferences.');
  if (p.deckId !== null && (!safeId(p.deckId) || !deckIds.has(p.deckId))) throw new Error('Invalid selected subdeck.');
  const ids = new Set();
  for (const a of s.attempts) {
    if (!object(a) || !safeId(a.id) || ids.has(a.id) || !['active','complete','incomplete'].includes(a.status) || typeof a.englishFirst !== 'boolean' || typeof a.startedAt !== 'string' || !Array.isArray(a.questions) || !Array.isArray(a.answers) || !a.questions.length || a.questions.length > 10 || a.answers.length > a.questions.length) throw new Error('Invalid quiz attempt.');
    ids.add(a.id);
    if (a.deckId !== undefined && (a.deckId !== null && !safeId(a.deckId) || typeof a.deckName !== 'string' || !a.deckName.trim())) throw new Error('Invalid quiz deck.');
    for (const q of a.questions) {
      if (!object(q) || !safeId(q.itemId) || typeof q.prompt !== 'string' || typeof q.correct !== 'string' || typeof q.category !== 'string' || typeof q.pronunciation !== 'string' || (q.region != null && typeof q.region !== 'string') || !Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4 || !q.choices.every(c => typeof c === 'string' && c.trim()) || new Set(q.choices.map(normalize)).size !== q.choices.length || q.choices.filter(c => c === q.correct).length !== 1) throw new Error('Invalid quiz question.');
    }
    a.answers.forEach((answer, i) => { if (!object(answer) || !a.questions[i].choices.includes(answer.choice) || answer.correct !== (answer.choice === a.questions[i].correct)) throw new Error('Invalid quiz answer.'); });
    if (a.status === 'complete' && a.answers.length !== a.questions.length) throw new Error('Incomplete answers in completed quiz.');
  }
  for (const [id, stat] of Object.entries(s.quizStats)) if (!safeId(id) || !object(stat) || !Number.isInteger(stat.answered) || !Number.isInteger(stat.correct) || stat.answered < 0 || stat.correct < 0 || stat.correct > stat.answered) throw new Error('Invalid quiz statistics.');
  return structuredClone(s);
}

function validateRatings(ratings) {
  if (!object(ratings)) throw new Error('Invalid flashcard rating.');
  for (const [id, rating] of Object.entries(ratings)) if (!safeId(id) || !object(rating) || !['learning','got'].includes(rating.status) || typeof rating.updatedAt !== 'string') throw new Error('Invalid flashcard rating.');
}

function validateDeckName(name, existingNames) {
  if (typeof name !== 'string' || !name.trim()) throw new Error('Enter a subdeck name.');
  if (existingNames.has(normalize(name)) || ['main deck', 'mazo principal'].includes(normalize(name))) throw new Error('Choose a unique subdeck name.');
}

export function saveSubdeck(state, { id, name, cardIds }) {
  const old = id == null ? null : state.subdecks.find(deck => deck.id === id);
  if (id != null && !old) throw new Error('Subdeck not found.');
  validateDeckName(name, new Set(state.subdecks.filter(deck => deck.id !== id).map(deck => normalize(deck.name))));
  if (!Array.isArray(cardIds) || !cardIds.every(safeId)) throw new Error('Invalid subdeck membership.');
  const members = [...new Set(cardIds)];
  const deck = { id: old?.id ?? newId(), name: name.trim(), cardIds: members,
    ratings: Object.fromEntries(Object.entries(old?.ratings ?? {}).filter(([key]) => members.includes(key))) };
  return { ...state, subdecks: old ? state.subdecks.map(d => d.id === old.id ? deck : d) : [...state.subdecks, deck], preferences: { ...state.preferences, deckId: deck.id } };
}

export function deleteSubdeck(state, id) {
  return { ...state, subdecks: state.subdecks.filter(deck => deck.id !== id), preferences: { ...state.preferences, deckId: state.preferences.deckId === id ? null : state.preferences.deckId } };
}

export function subdeckEntries(entries, deck) {
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  return deck.cardIds.map(id => byId.get(id)).filter(Boolean);
}

export function rateCard(state, cardId, status, deckId = null) {
  if (!['learning', 'got'].includes(status)) throw new Error('Invalid flashcard rating.');
  const rating = { status, updatedAt: new Date().toISOString() };
  if (deckId === null) return { ...state, ratings: { ...state.ratings, [cardId]: rating } };
  return { ...state, subdecks: state.subdecks.map(deck => deck.id === deckId && deck.cardIds.includes(cardId) ? { ...deck, ratings: { ...deck.ratings, [cardId]: rating } } : deck) };
}

export function loadState(storage) {
  try {
    storage ??= globalThis.localStorage;
    const raw = storage.getItem(STORAGE_KEY);
    return { state: raw ? validateState(JSON.parse(raw)) : freshState(), error: '' };
  } catch (e) { return { state: freshState(), error: `Saved data could not be loaded: ${e.message}. Export this session before closing; the original saved data has not been replaced.`, blocked: true }; }
}
export function saveState(state, storage = localStorage) { storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function effectiveVocabulary(base, state) {
  const map = new Map(base.map(e => [e.id, e]));
  Object.values(state.overrides).forEach(e => map.set(e.id, e));
  state.deleted.forEach(id => map.delete(id));
  return [...map.values()];
}
export function upsert(state, entries) {
  const next = structuredClone(state);
  entries.forEach(e => { next.overrides[e.id] = e; });
  next.deleted = next.deleted.filter(id => !entries.some(e => e.id === id));
  return next;
}
export function removeEntry(state, id) {
  return { ...state, deleted: [...new Set([...state.deleted, id])] };
}
export function resetRatings(state, ids, deckId = null) {
  if (deckId !== null) return { ...state, subdecks: state.subdecks.map(deck => deck.id === deckId ? { ...deck, ratings: {} } : deck) };
  const ratings = { ...state.ratings }; ids.forEach(id => delete ratings[id]); return { ...state, ratings };
}
export function parseImport(text, format) {
  if (format === 'json') return validateVocabulary(JSON.parse(text), true);
  const parsed = Papa.parse(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy' });
  if (parsed.errors.length) throw new Error(`CSV: ${parsed.errors[0].message}`);
  if (new Set(parsed.meta.fields).size !== parsed.meta.fields.length || parsed.meta.renamedHeaders && Object.keys(parsed.meta.renamedHeaders).length) throw new Error('CSV headers must be unique.');
  return validateVocabulary(parsed.data, true);
}
export const toCSV = entries => Papa.unparse({ fields, data: entries.map(e => fields.map(f => e[f] ?? '')) });
export function download(name, content, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i],result[j]] = [result[j],result[i]]; }
  return result;
}
export function buildQuiz(selected, all, englishFirst, limit = 10) {
  const source = englishFirst ? 'english' : 'spanish', target = englishFirst ? 'spanish' : 'english';
  const meanings = new Map();
  all.forEach(e => { const key = normalize(e[source]); if (!meanings.has(key)) meanings.set(key, new Set()); meanings.get(key).add(normalize(e[target])); });
  const used = new Set(), questions = []; let ambiguous = 0, insufficient = 0;
  for (const entry of shuffle(selected)) {
    const key = normalize(entry[source]);
    if (meanings.get(key)?.size > 1) { ambiguous++; continue; }
    if (used.has(key)) continue;
    used.add(key);
    const choices = [entry[target]], targets = new Set([normalize(entry[target])]);
    const candidates = [...shuffle(all.filter(e => e.category === entry.category)), ...shuffle(all.filter(e => e.category !== entry.category))];
    for (const other of candidates) if (!targets.has(normalize(other[target])) && choices.length < 4) { choices.push(other[target]); targets.add(normalize(other[target])); }
    if (choices.length < 2) { insufficient++; continue; }
    questions.push({ itemId: entry.id, prompt: entry[source], correct: entry[target], choices: shuffle(choices), category: entry.category, pronunciation: entry.pronunciation || '', region: entry.region || '' });
  }
  return { questions: questions.slice(0, limit), ambiguous, insufficient };
}
export function answerAttempt(state, attemptId, index, choice) {
  const a = state.attempts.find(a => a.id === attemptId);
  if (!a || a.status !== 'active' || a.answers.length !== index || !a.questions[index]?.choices.includes(choice)) return state;
  const q = a.questions[index], correct = choice === q.correct;
  const updated = { ...a, answers: [...a.answers, { choice, correct } ] };
  if (updated.answers.length === a.questions.length) { updated.status = 'complete'; updated.finishedAt = new Date().toISOString(); }
  const stat = state.quizStats[q.itemId] ?? { answered: 0, correct: 0 };
  return { ...state, attempts: state.attempts.map(x => x.id === a.id ? updated : x), quizStats: { ...state.quizStats, [q.itemId]: { answered: stat.answered + 1, correct: stat.correct + Number(correct) } } };
}
