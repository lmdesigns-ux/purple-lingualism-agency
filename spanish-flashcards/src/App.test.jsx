import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import base from './data/vocabulary.json';
import { freshState, STORAGE_KEY, saveState } from './lib';

beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();vi.spyOn(window,'confirm').mockReturnValue(true);});
describe('practice interface',()=>{
  it('replaces English with slide images, persists the setting, and falls back on image errors',async()=>{
    const user=userEvent.setup();const {unmount}=render(<App/>);
    await user.click(screen.getByLabelText('Show images'));
    await user.click(screen.getByLabelText('Show image first'));
    const image=screen.getByRole('img');
    expect(image).toHaveAttribute('src','/images/housing/casa-kitchen.jpg');
    expect(screen.queryByText('the kitchen',{exact:true})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Flip card: image prompt'}));
    expect(screen.getByText('la cocina',{exact:true})).toBeInTheDocument();
    unmount();render(<App/>);
    expect(screen.getByLabelText('Show images')).toBeChecked();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('button',{name:'Flip card: the kitchen'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Quiz',exact:true}));
    expect(screen.queryByLabelText('Show images')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Show English first')).toBeInTheDocument();
  });
  it('starts categories collapsed, summarizes selections, and keeps filters after closing and refresh',async()=>{
    const user=userEvent.setup();const {unmount}=render(<App/>);
    expect(screen.getByRole('button',{name:'Choose categories'})).toHaveAttribute('aria-expanded','false');
    expect(screen.queryByRole('button',{name:'Rooms',exact:true})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Choose categories'}));
    await user.click(screen.getByRole('button',{name:'Clear selection'}));
    await user.click(screen.getByRole('button',{name:'Rooms',exact:true}));
    const count=base.filter(e=>e.category==='Rooms').length;
    expect(screen.getByText(`Rooms · ${count} words`)).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Done'}));
    expect(screen.queryByRole('button',{name:'Rooms',exact:true})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Flip card: la cocina'})).toBeInTheDocument();
    unmount();render(<App/>);
    expect(screen.getByRole('button',{name:'Choose categories'})).toHaveAttribute('aria-expanded','false');
    expect(screen.getByText(`Rooms · ${count} words`)).toBeInTheDocument();
  });
  it('flips via compassboard, removes Got it cards without skipping the next card, and persists until reset',async()=>{
    const user=userEvent.setup();const {unmount}=render(<App/>);
    const card=screen.getByRole('button',{name:'Flip card: la cocina'});card.focus();await user.keyboard('{Enter}');expect(screen.getByRole('button',{name:'Flip card: the kitchen'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Got it',exact:true}));expect(screen.getByText(`1 of ${base.length} marked Got it`)).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Flip card: el baño'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'← Previous'}));expect(screen.getByRole('button',{name:`Flip card: ${base.at(-1).spanish}`})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Next →',exact:true}));expect(screen.getByRole('button',{name:'Flip card: el baño'})).toBeInTheDocument();
    unmount();render(<App/>);expect(screen.getByText(`1 of ${base.length} marked Got it`)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Flip card: el baño'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Shuffle'}));expect(screen.queryByRole('button',{name:'Flip card: la cocina'})).not.toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Reset this deck'}));expect(screen.getByText(`0 of ${base.length} marked Got it`)).toBeInTheDocument();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).ratings).toEqual({});
  });
  it('offers reset when every selected card is Got it, and respects cancellation',async()=>{
    const state=freshState();base.forEach(e=>{state.ratings[e.id]={status:'got',updatedAt:'today'};});saveState(state);
    const user=userEvent.setup();render(<App/>);expect(screen.getByText('All done for this deck!')).toBeInTheDocument();
    window.confirm.mockReturnValueOnce(false);await user.click(screen.getByRole('button',{name:'Reset this deck'}));expect(screen.getByText('All done for this deck!')).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Reset this deck'}));expect(screen.getByRole('button',{name:'Flip card: la cocina'})).toBeInTheDocument();
  });
  it('keeps Still learning in the deck and hides existing Got it ratings through filter changes',async()=>{
    const state=freshState();state.ratings[base[0].id]={status:'got',updatedAt:'today'};saveState(state);
    const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Still learning'}));await user.click(screen.getByRole('button',{name:'← Previous'}));expect(screen.getByRole('button',{name:'Flip card: el baño'})).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Choose categories'}));
    await user.click(screen.getByRole('button',{name:'Rooms',exact:true}));await user.click(screen.getByRole('button',{name:'Reset this deck'}));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).ratings[base[0].id].status).toBe('got');
    await user.click(screen.getByRole('button',{name:'All cards'}));expect(screen.getByRole('button',{name:'Flip card: el baño'})).toBeInTheDocument();
  });
  it('hides Spanish pronunciation on an English-first question until answered',async()=>{
    const user=userEvent.setup();render(<App/>);await user.click(screen.getByLabelText('Show English first'));await user.click(screen.getByRole('button',{name:'Quiz',exact:true}));await user.click(screen.getByRole('button',{name:'Start quiz →'}));
    expect(document.querySelector('.question-card .pronunciation')).toBeNull();const choices=document.querySelector('.choices');await user.click(within(choices).getAllByRole('button')[0]);expect(screen.getByText(/Spanish pronunciation:/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Next question →'})).toBeInTheDocument();
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));expect(saved.ratings).toEqual({});expect(saved.attempts[0].answers).toHaveLength(1);
  });
  it('confirms before discarding active quiz and supports empty category selections',async()=>{
    const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Quiz',exact:true}));await user.click(screen.getByRole('button',{name:'Start quiz →'}));
    window.confirm.mockReturnValueOnce(false);await user.click(screen.getByLabelText('Show English first'));expect(screen.getByLabelText('Show English first')).not.toBeChecked();
    await user.click(screen.getByRole('button',{name:'Flash Cards',exact:true}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).attempts[0].status).toBe('incomplete');
    await user.click(screen.getByRole('button',{name:'Choose categories'}));
    for (const category of new Set(base.map(e=>e.category))) await user.click(screen.getByRole('button',{name:category,exact:true}));
    expect(screen.getByText('No cards selected.')).toBeInTheDocument();
  });
  it('creates, edits and deletes a word without changing its ID',async()=>{
    const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Manage Vocabulary'}));await user.click(screen.getByRole('button',{name:'+ Add word'}));
    await user.type(screen.getByLabelText('Spanish *'),'la brújula');await user.type(screen.getByLabelText('English *'),'the compass');await user.type(screen.getByLabelText('Category *'),'Personal');await user.click(screen.getByRole('button',{name:'Save word'}));
    let saved=JSON.parse(localStorage.getItem(STORAGE_KEY));const id=Object.keys(saved.overrides)[0];expect(id).toMatch(/^user-/);
    await user.click(screen.getByRole('button',{name:'Edit la brújula'}));await user.clear(screen.getByLabelText('English *'));await user.type(screen.getByLabelText('English *'),'a compass');await user.click(screen.getByRole('button',{name:'Save word'}));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).overrides[id].english).toBe('a compass');await user.click(screen.getByRole('button',{name:'Delete la brújula'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).deleted).toContain(id);
  });
  it('previews vocabulary import and restores a validated full backup',async()=>{
    const user=userEvent.setup();render(<App/>);await user.click(screen.getByRole('button',{name:'Manage Vocabulary'}));
    const file={name:'words.json',text:async()=>JSON.stringify([{...base[0],id:'import-word',spanish:'el patio'}])};fireEvent.change(screen.getByLabelText('Import vocabulary file'),{target:{files:[file]}});
    await screen.findByRole('region',{name:'Import preview'});expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).overrides['import-word']).toBeUndefined();await user.click(screen.getByRole('button',{name:'Confirm import'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).overrides['import-word'].spanish).toBe('el patio');
    const backup=freshState();backup.ratings['casa-kitchen']={status:'got',updatedAt:'today'};fireEvent.change(screen.getByLabelText('Restore full backup file'),{target:{files:[{name:'backup.json',text:async()=>JSON.stringify(backup)}]}});await screen.findByText('Full backup preview');await user.click(screen.getByRole('button',{name:'Confirm restore'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).ratings['casa-kitchen'].status).toBe('got');
  });
  it('keeps memory usable on storage write failure',()=>{
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota exceeded');});render(<App/>);expect(screen.getByRole('alert')).toHaveTextContent('only in memory');expect(screen.getByRole('button',{name:'Flip card: la cocina'})).toBeInTheDocument();
  });
  it('preserves corrupt storage without auto-overwriting it',()=>{
    localStorage.setItem(STORAGE_KEY,'invalid');render(<App/>);expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');expect(localStorage.getItem(STORAGE_KEY)).toBe('invalid');
  });
  it('marks interrupted quizzes incomplete when reopened',()=>{
    const state=freshState();state.attempts=[{id:'interrupted',status:'active',startedAt:'today',englishFirst:false,answers:[],questions:[{itemId:base[0].id,prompt:'la cocina',correct:'the kitchen',category:'Rooms',pronunciation:'',choices:['the kitchen','the oven']}]}];saveState(state);render(<App/>);expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).attempts[0].status).toBe('incomplete');
  });
});

it('switches the entire interface language, persists it, and keeps an active quiz and card direction', async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App/>);
  await user.click(screen.getByRole('button', { name: 'Español' }));
  expect(document.documentElement.lang).toBe('es');
  expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Girar tarjeta: la cocina' })).toBeInTheDocument();
  expect(screen.getByLabelText('Mostrar inglés primero')).not.toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Gestionar vocabulario' }));
  await user.click(screen.getByRole('button', { name: '+ Añadir palabra' }));
  expect(screen.getByLabelText('Español *')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Guardar palabra' })).toBeInTheDocument();
  unmount(); render(<App/>);
  expect(screen.getByRole('button', { name: 'Tarjetas' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Prueba', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Iniciar prueba →' }));
  expect(screen.getByText('Pregunta 1 de 10')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'English', exact: true }));
  expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  expect(window.confirm).not.toHaveBeenCalled();
  expect(document.documentElement.lang).toBe('en');
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).preferences.language).toBe('en');
});
