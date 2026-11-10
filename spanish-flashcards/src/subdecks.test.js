import { describe, it, expect } from 'vitest';
import base from './data/vocabulary.json';
import { freshState, saveSubdeck, deleteSubdeck, rateCard, resetRatings, subdeckEntries, effectiveVocabulary, removeEntry, upsert, validateState, loadState, STORAGE_KEY, buildQuiz, answerAttempt } from './lib';

function add(state, name, cardIds) {
  return saveSubdeck(state, { name, cardIds });
}

describe('saved subdecks', () => {
  it('preserves ordered membership and independent ratings in overlapping decks, including reset and re-addition', () => {
    const kitchen = base[0].id, bathroom = base[1].id;
    let state = rateCard(freshState(), kitchen, 'got');
    state = add(state, 'Morning', [bathroom, kitchen, kitchen]);
    const firstId = state.preferences.deckId;
    expect(state.subdecks[0].cardIds).toEqual([bathroom, kitchen]);
    expect(state.subdecks[0].ratings).toEqual({});
    state = add(state, 'Evening', [kitchen]);
    const secondId = state.preferences.deckId;
    state = rateCard(state, kitchen, 'got', firstId);
    state = rateCard(state, bathroom, 'learning', firstId);
    expect(state.subdecks[1].ratings).toEqual({});
    state = rateCard(state, kitchen, 'learning', secondId);
    const otherRatings = structuredClone(state.subdecks[1].ratings);
    state = resetRatings(state, [kitchen], firstId);
    expect(state.subdecks[0].ratings).toEqual({});
    expect(state.subdecks[0].cardIds).toEqual([bathroom, kitchen]);
    expect(state.ratings[kitchen].status).toBe('got');
    expect(state.subdecks[1].ratings).toEqual(otherRatings);
    state = rateCard(state, kitchen, 'got', firstId);
    state = saveSubdeck(state, { id: firstId, name: 'Morning renamed', cardIds: [bathroom] });
    expect(state.subdecks[0].ratings[kitchen]).toBeUndefined();
    state = saveSubdeck(state, { id: firstId, name: 'Morning renamed', cardIds: [bathroom, kitchen] });
    expect(state.subdecks[0].ratings[kitchen]).toBeUndefined();
    expect(validateState(state)).toEqual(state);
  });

  it('rejects blank, duplicate and reserved names without changing the state', () => {
    const state = add(freshState(), 'My words', []), before = structuredClone(state);
    for (const name of ['', '  ', ' my   WORDS ', 'Main deck', 'Mazo principal']) {
      expect(() => add(state, name, [])).toThrow();
    }
    expect(() => saveSubdeck(state, { id: 'missing', name: 'Other', cardIds: [] })).toThrow();
    expect(state).toEqual(before);
    const renamed = saveSubdeck(state, { ...state.subdecks[0], name: '  My words  ' });
    expect(renamed.subdecks[0].name).toBe('My words');
  });

  it('references live vocabulary and retains unavailable membership until explicitly removed', () => {
    const ids = [base[1].id, base[0].id, 'missing-word'];
    let state = add(freshState(), 'Focused', ids);
    const id = state.preferences.deckId;
    state = rateCard(state, base[0].id, 'got', id);
    state = upsert(state, [{ ...base[0], spanish: 'mi cocina' }]);
    expect(subdeckEntries(effectiveVocabulary(base, state), state.subdecks[0]).map(e=>e.spanish)).toEqual([base[1].spanish, 'mi cocina']);
    state = removeEntry(state, base[0].id);
    expect(subdeckEntries(effectiveVocabulary(base, state), state.subdecks[0]).map(e=>e.id)).toEqual([base[1].id]);
    expect(state.subdecks[0].cardIds).toEqual(ids);
    state = resetRatings(state, [], id);
    state = upsert(state, [base[0]]);
    expect(subdeckEntries(effectiveVocabulary(base, state), state.subdecks[0]).map(e=>e.id)).toEqual(ids.slice(0,2));
    expect(state.subdecks[0].ratings).toEqual({});
    const before = structuredClone(state);
    const removed = deleteSubdeck(state, id);
    expect(removed.subdecks).toEqual([]);
    expect(removed.preferences.deckId).toBeNull();
    expect(removed.overrides).toEqual(before.overrides);
    expect(removed.ratings).toEqual(before.ratings);
    expect(removed.attempts).toEqual(before.attempts);
  });

  it('includes learned members in quizzes and draws distractors from the full collection without changing any deck ratings', () => {
    let state = add(freshState(), 'One word', [base[0].id]);
    const deck = state.subdecks[0];
    state = rateCard(state, base[0].id, 'got', deck.id);
    const questions = buildQuiz(subdeckEntries(base, deck), base, false).questions;
    expect(questions).toHaveLength(1);
    expect(questions[0].itemId).toBe(base[0].id);
    expect(questions[0].choices).toHaveLength(4);
    state.attempts = [{ id: 'subdeck-quiz', status: 'active', startedAt: 'today', englishFirst: false, deckId: deck.id, deckName: deck.name, questions, answers: [] }];
    const next = answerAttempt(state, 'subdeck-quiz', 0, questions[0].correct);
    expect(next.subdecks).toEqual(state.subdecks);
    expect(next.ratings).toEqual(state.ratings);
    const deleted = deleteSubdeck(next, deck.id);
    expect(validateState(deleted).attempts[0]).toMatchObject({ deckId: deck.id, deckName: 'One word', status: 'complete' });
  });
});

describe('subdeck backup compatibility', () => {
  it('migrates version 1 state and backups without changing original records or corrupt-data protection', () => {
    const legacy = upsert(freshState(), [{ ...base[0], notes: 'Personal note' }]);
    legacy.version = 1; delete legacy.subdecks; delete legacy.preferences.deckId;
    legacy.deleted = [base[1].id]; legacy.preferences.categories = ['Rooms'];
    legacy.ratings[base[0].id] = { status: 'got', updatedAt: 'yesterday' };
    legacy.quizStats[base[0].id] = { answered: 1, correct: 1 };
    legacy.attempts = [{ id: 'legacy-quiz', status: 'complete', startedAt: 'yesterday', englishFirst: false,
      questions: buildQuiz([base[0]], base, false).questions, answers: [{ choice: base[0].english, correct: true }] }];
    const raw = JSON.stringify(legacy);
    const migrated = validateState(JSON.parse(raw));
    expect(migrated).toEqual({ ...legacy, version: 2, subdecks: [], preferences: { ...legacy.preferences, deckId: null } });
    expect(JSON.stringify(legacy)).toBe(raw);
    const storage = { getItem: key => key === STORAGE_KEY ? raw : null };
    expect(loadState(storage).state).toEqual(migrated);
    expect(loadState({ getItem: () => JSON.stringify({ ...legacy, version: 99 }) }).blocked).toBe(true);
  });

  it('roundtrips version 2 and rejects invalid memberships, ratings, names, and selected decks', () => {
    let state = add(freshState(), 'Saved', [base[0].id, 'not-in-current-bundle']);
    state = rateCard(state, base[0].id, 'got', state.preferences.deckId);
    expect(validateState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    const invalidDecks = [
      { ...state.subdecks[0], cardIds: [base[0].id, base[0].id] },
      { ...state.subdecks[0], cardIds: ['__proto__'] },
      { ...state.subdecks[0], ratings: { outside: { status: 'got', updatedAt: 'today' } } },
      { ...state.subdecks[0], ratings: { [base[0].id]: { status: 'invalid', updatedAt: 'today' } } },
      { ...state.subdecks[0], name: ' ' }
    ];
    for (const deck of invalidDecks) expect(() => validateState({ ...state, subdecks: [deck] })).toThrow();
    expect(() => validateState({ ...state, subdecks: [...state.subdecks, { ...state.subdecks[0], id: 'another' }] })).toThrow(/unique/);
    expect(() => validateState({ ...state, preferences: { ...state.preferences, deckId: 'missing' } })).toThrow(/selected/);
  });
});
