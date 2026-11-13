import { describe, it, expect } from 'vitest';
import base from './data/vocabulary.json';
import { freshState, validateState, validateVocabulary, effectiveVocabulary, upsert, removeEntry, resetRatings, toCSV, parseImport, loadState, saveState, STORAGE_KEY, buildQuiz, answerAttempt, normalize } from './lib';
import { spanish, translator } from './i18n';

describe('vocabulary and persistence', () => {
  it('contains 627 valid vocabulary entries with unambiguous prompts and translated categories', () => {
    expect(validateVocabulary(base)).toHaveLength(627);
    const categories = new Set(base.map(e=>e.category));
    expect(categories.size).toBe(34);
    for (const category of categories) {
      expect(spanish[category]).toBeTruthy();
      expect(translator('es')(category)).toBe(spanish[category]);
      expect(translator('en')(category)).toBe(category);
    }
    for (const field of ['spanish', 'english']) expect(new Set(base.map(e=>normalize(e[field]))).size).toBe(base.length);
    for (const entry of base.slice(151).filter(e => !e.id.startsWith('custom-'))) {
      expect(entry.pronunciation).toBeTruthy();
      expect(entry.notes).toMatch(/Source: .+, (slide|p\.) \d+\./);
      expect(entry.spanish).not.toMatch(/[¿?¡!_@]/);
    }
    const phrases = base.map(e=>e.spanish);
    expect(phrases).toEqual(expect.arrayContaining(['ahorrar', 'el nombre', 'dormirse', 'a rayas', 'hacer la cama']));
    for (const sentence of ['Me llamo', 'Tengo años', 'Estoy trabajando.', '¿Qué llevas puesto?', 'Todo está delicioso.']) expect(phrases).not.toContain(sentence);
  });
  it('adds the actual Nido/Huevo collection to old saved state without changing learning records', () => {
    const oldBundle = base.slice(0,151);
    let state = upsert(freshState(), [{...oldBundle[0],spanish:'mi cocina',notes:'My own notes'}]);
    state = removeEntry(state, oldBundle[1].id);
    state.ratings[oldBundle[0].id] = {status:'got',updatedAt:'2026-11-01'};
    state.quizStats[oldBundle[0].id] = {answered:2,correct:1};
    state.attempts = [{id:'old-quiz',status:'complete',startedAt:'2026-11-01',englishFirst:false,
      questions:[{itemId:oldBundle[0].id,prompt:'la cocina',correct:'the kitchen',category:'Rooms',pronunciation:'',choices:['the kitchen','the bathroom']}],
      answers:[{choice:'the kitchen',correct:true}]}];
    const before = structuredClone(state);
    const merged = effectiveVocabulary(base, state);
    expect(merged.find(e=>e.id===oldBundle[0].id)).toMatchObject({spanish:'mi cocina',notes:'My own notes'});
    expect(merged.some(e=>e.id===oldBundle[1].id)).toBe(false);
    for (const entry of base.slice(151)) {
      expect(merged.find(e=>e.id===entry.id)).toBeDefined();
      expect(state.ratings[entry.id]).toBeUndefined();
    }
    expect(state).toEqual(before);
    expect(validateState(state)).toEqual(before);
  });
  it('preserves edits, custom entries and deletions through bundled updates', () => {
    let s = upsert(freshState(), [{...base[0],spanish:'mi cocina'}, {...base[1],id:'personal',spanish:'custom'}]);
    s = removeEntry(s, base[2].id);
    const merged = effectiveVocabulary([...base.map(e=>({...e,notes:'updated'})), {...base[3],id:'new-bundle'}], s);
    expect(merged.find(e=>e.id===base[0].id).spanish).toBe('mi cocina'); expect(merged.some(e=>e.id==='personal')).toBe(true); expect(merged.some(e=>e.id===base[2].id)).toBe(false); expect(merged.some(e=>e.id==='new-bundle')).toBe(true);
  });
  it('restores a deleted entry by importing its ID', () => { const s=upsert(removeEntry(freshState(),base[0].id),[base[0]]); expect(s.deleted).toEqual([]); });
  it('roundtrips multiline quoted Unicode CSV and JSON and supplies missing IDs', () => {
    const entries=[{...base[0], notes:'"Hola", café\nline two'}];
    expect(parseImport(toCSV(entries),'csv')).toEqual(validateVocabulary(entries));
    expect(parseImport(JSON.stringify(entries),'json')).toEqual(validateVocabulary(entries));
    const withoutID={...base[0]};delete withoutID.id;expect(parseImport(JSON.stringify([withoutID]),'json')[0].id).toMatch(/^user-/);
  });
  it('rejects malformed, duplicate and unsafe entries', () => {
    expect(()=>validateVocabulary([base[0],base[0]])).toThrow(/duplicate/);
    expect(()=>parseImport('[{}]','json')).toThrow(/spanish/);
    expect(()=>validateVocabulary([{...base[0],id:'__proto__'}])).toThrow(/invalid ID/);
    expect(()=>validateVocabulary([{...base[0],id:'toString'}])).toThrow(/invalid ID/);
    expect(()=>parseImport('spanish,english,category\n"broken','csv')).toThrow(/CSV/);
  });
  it('persists and restores full state, rejecting corrupt backups without overwriting them', () => {
    const s=upsert(freshState(),[base[0]]);s.ratings[base[0].id]={status:'got',updatedAt:'today'};saveState(s);expect(loadState().state).toEqual(s);expect(validateState(JSON.parse(JSON.stringify(s)))).toEqual(s);
    localStorage.setItem(STORAGE_KEY,'broken');const loaded=loadState();expect(loaded.blocked).toBe(true);expect(localStorage.getItem(STORAGE_KEY)).toBe('broken');
    expect(()=>validateState({...s,version:3})).toThrow();expect(()=>validateState({...s,ratings:{x:{status:'mastered'}}})).toThrow();localStorage.clear();
  });
  it('resets only selected ratings, leaving quiz records and other ratings alone', () => {
    const s=freshState();s.ratings={one:{status:'got'},two:{status:'learning'}};s.quizStats={one:{answered:1,correct:1}};
    const result=resetRatings(s,['one']);expect(result.ratings).toEqual({two:{status:'learning'}});expect(result.quizStats).toEqual(s.quizStats);expect(result.overrides).toEqual(s.overrides);
  });
});

describe('quiz selection and recording', () => {
  it('samples ten unique questions and four unique answers containing correct exactly once', () => {
    const result=buildQuiz(base,base,false);expect(result.questions).toHaveLength(10);expect(new Set(result.questions.map(q=>q.itemId)).size).toBe(10);
    result.questions.forEach(q=>{expect(q.choices).toHaveLength(4);expect(new Set(q.choices.map(normalize)).size).toBe(4);expect(q.choices.filter(c=>c===q.correct)).toHaveLength(1);});
  });
  it('respects category pool, uses distractors across categories, and reverses direction', () => {
    const result=buildQuiz(base.slice(0,1),base,true);expect(result.questions[0].prompt).toBe(base[0].english);expect(result.questions[0].correct).toBe(base[0].spanish);expect(result.questions[0].choices).toHaveLength(4);
  });
  it('reduces choices in small collections, and excludes unanswerable single translations', () => {
    expect(buildQuiz(base.slice(0,2),base.slice(0,2),false).questions[0].choices).toHaveLength(2);
    expect(buildQuiz(base.slice(0,1),base.slice(0,1),false).questions).toHaveLength(0);
  });
  it('deduplicates whitespace/case, preserves accents and skips conflicting prompts', () => {
    const all=[base[0],{...base[1],spanish:base[0].spanish.toUpperCase()},base[2]];
    const r=buildQuiz(all,all,false);expect(r.ambiguous).toBe(2);expect(r.questions).toHaveLength(1);
    const sameAnswers=[base[0],{...base[1],english:'  THE   KITCHEN '},base[2]];
    expect(buildQuiz(sameAnswers,sameAnswers,false).questions[0].choices).toHaveLength(2);expect(normalize('sí')).not.toBe(normalize('si'));
  });
  it('scores exactly once, keeps flashcard ratings separate, retries only missed IDs', () => {
    const s=freshState();const questions=buildQuiz(base.slice(0,2),base,false).questions;s.attempts=[{id:'quiz-test',status:'active',startedAt:'today',englishFirst:false,questions,answers:[]}];
    let updated=answerAttempt(s,'quiz-test',0,questions[0].choices.find(c=>c!==questions[0].correct));
    expect(answerAttempt(updated,'quiz-test',0,questions[0].correct)).toBe(updated);expect(updated.ratings).toEqual({});
    updated=answerAttempt(updated,'quiz-test',1,questions[1].correct);expect(updated.attempts[0].status).toBe('complete');
    const missed=questions.filter((q,i)=>!updated.attempts[0].answers[i].correct).map(q=>q.itemId);expect(buildQuiz(base.filter(e=>missed.includes(e.id)),base,false).questions).toHaveLength(1);
    expect(validateState(updated)).toEqual(updated);
  });
});
