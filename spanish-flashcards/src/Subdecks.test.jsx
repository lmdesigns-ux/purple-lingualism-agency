import { beforeEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import SubdeckEditor from './SubdeckEditor';
import base from './data/vocabulary.json';
import { freshState, saveState, saveSubdeck, rateCard, STORAGE_KEY } from './lib';

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); vi.spyOn(window, 'confirm').mockReturnValue(true); });
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY));

it('creates from main categories, independently rates, resets all members, and persists deck selection', async () => {
  const state = rateCard(freshState(), base[0].id, 'got');
  state.preferences.categories = ['Rooms']; saveState(state);
  const user = userEvent.setup(), { unmount } = render(<App/>);
  await user.click(screen.getByRole('button', { name: 'Create subdeck' }));
  await user.type(screen.getByLabelText('Subdeck name'), 'Rooms to review');
  await user.click(screen.getByRole('radio', { name: /Main deck’s selected categories/ }));
  await user.click(screen.getByRole('button', { name: 'Save subdeck' }));
  const id = stored().preferences.deckId;
  expect(stored().subdecks[0].cardIds).toEqual(base.filter(e=>e.category==='Rooms').map(e=>e.id));
  expect(screen.getByRole('button', { name: 'Flip card: la cocina' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Got it', exact: true }));
  expect(screen.getByRole('button', { name: 'Flip card: el baño' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Still learning', exact: true }));
  expect(stored().subdecks[0].ratings[base[1].id].status).toBe('learning');
  unmount(); render(<App/>);
  expect(screen.getByLabelText('Practice deck')).toHaveValue(id);
  expect(screen.queryByRole('button', { name: 'Flip card: la cocina' })).not.toBeInTheDocument();
  window.confirm.mockReturnValueOnce(false);
  await user.click(screen.getByRole('button', { name: 'Reset subdeck' }));
  expect(stored().subdecks[0].ratings[base[0].id].status).toBe('got');
  await user.click(screen.getByRole('button', { name: 'Reset subdeck' }));
  expect(screen.getByRole('button', { name: 'Flip card: la cocina' })).toBeInTheDocument();
  expect(stored().subdecks[0].ratings).toEqual({});
  await user.selectOptions(screen.getByLabelText('Practice deck'), '');
  expect(stored().ratings[base[0].id].status).toBe('got');
  expect(stored().preferences.categories).toEqual(['Rooms']);
  expect(screen.getByRole('button', { name: 'Flip card: el baño' })).toBeInTheDocument();
});

it('keeps learned membership editable, cancels drafts, and starts removed/re-added cards unrated', async () => {
  let state = saveSubdeck(freshState(), { name: 'Tiny', cardIds: [base[0].id] });
  state = rateCard(state, base[0].id, 'got', state.preferences.deckId); saveState(state);
  const user = userEvent.setup(); render(<App/>);
  expect(screen.getByText('All done for this deck!')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit subdeck' }));
  expect(screen.getByRole('checkbox', { name: 'Include card: la cocina' })).toBeChecked();
  await user.clear(screen.getByLabelText('Subdeck name')); await user.type(screen.getByLabelText('Subdeck name'), 'Changed');
  await user.click(screen.getByRole('checkbox', { name: 'Include card: la cocina' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(stored().subdecks[0]).toMatchObject({ name: 'Tiny', cardIds: [base[0].id] });
  await user.click(screen.getByRole('button', { name: 'Edit subdeck' }));
  await user.click(screen.getByRole('checkbox', { name: 'Include card: la cocina' }));
  await user.click(screen.getByRole('button', { name: 'Save subdeck' }));
  expect(screen.getByText('This subdeck is empty.')).toBeInTheDocument();
  expect(stored().subdecks[0].ratings).toEqual({});
  await user.click(screen.getByRole('button', { name: 'Edit subdeck' }));
  await user.selectOptions(screen.getByLabelText('Show cards'), 'all');
  await user.click(screen.getByText('Unavailable assigned cards (1)'));
  await user.type(screen.getByLabelText('Find cards'), 'la cocina');
  await user.click(screen.getByRole('checkbox', { name: 'Include card: la cocina' }));
  await user.click(screen.getByRole('button', { name: 'Save subdeck' }));
  expect(screen.getByRole('button', { name: 'Flip card: la cocina' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Delete subdeck' }));
  expect(stored().subdecks).toEqual([]);
  expect(stored().deleted).toEqual([]);
});

it('keeps subdeck quizzes focused, uses outside choices, and confirms switching away from an active quiz', async () => {
  let state = saveSubdeck(freshState(), { name: 'Pair', cardIds: [base[0].id, base[1].id] });
  state = rateCard(state, base[0].id, 'got', state.preferences.deckId); saveState(state);
  const user = userEvent.setup(); render(<App/>);
  await user.click(screen.getByRole('button', { name: 'Quiz', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Start quiz →' }));
  const quiz = stored().attempts[0];
  expect(quiz.questions.map(q=>q.itemId).sort()).toEqual([base[0].id, base[1].id].sort());
  expect(quiz.questions[0].choices).toHaveLength(4);
  await user.click(within(document.querySelector('.choices')).getByRole('button', { name: quiz.questions[0].correct, exact: true }));
  window.confirm.mockReturnValueOnce(false);
  await user.selectOptions(screen.getByLabelText('Practice deck'), '');
  expect(screen.getByLabelText('Practice deck')).toHaveValue(state.preferences.deckId);
  expect(stored().attempts[0].status).toBe('active');
  await user.selectOptions(screen.getByLabelText('Practice deck'), '');
  expect(stored().attempts[0]).toMatchObject({ status: 'incomplete', deckName: 'Pair', deckId: state.preferences.deckId });
  expect(stored().attempts[0].answers).toHaveLength(1);
  expect(stored().subdecks[0].ratings[base[0].id].status).toBe('got');
});

it('edits all filtered results across pages and can unassign unavailable members without changing vocabulary', async () => {
  const entries = Array.from({ length: 30 }, (_, i) => ({ id: `word-${i}`, spanish: `palabra ${i}`, english: `word ${i}`, category: 'Rooms' }));
  const save = vi.fn(), user = userEvent.setup();
  render(<SubdeckEditor deck={{ id: 'deck', name: 'Thirty', cardIds: ['missing'], ratings: {} }} entries={entries} knownEntries={entries} seedIds={[]} language="en" onSave={save} onCancel={vi.fn()}/>);
  expect(screen.getByText('Assigned: 1 · Unavailable: 1')).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Show cards'), 'all');
  expect(screen.getAllByRole('checkbox')).toHaveLength(26); // 25 visible plus the unavailable member.
  await user.click(screen.getByRole('button', { name: 'Add filtered cards' }));
  await user.click(screen.getByRole('button', { name: 'Next results' }));
  expect(screen.getByRole('checkbox', { name: 'Include card: palabra 29' })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Include unavailable card: missing' }));
  await user.click(screen.getByRole('button', { name: 'Save subdeck' }));
  expect(save.mock.calls[0][0].cardIds).toEqual(entries.map(e=>e.id));
  await user.click(screen.getByRole('button', { name: 'Remove filtered cards' }));
  await user.click(screen.getByRole('button', { name: 'Save subdeck' }));
  expect(save.mock.calls[1][0].cardIds).toEqual([]);
});

it('shows unavailable membership separately from an empty or completed deck and translates subdeck controls', async () => {
  const state = saveSubdeck(freshState(), { name: 'Missing', cardIds: ['unknown'] });
  state.preferences.language = 'es'; saveState(state);
  const user = userEvent.setup(); render(<App/>);
  expect(screen.getByText('No hay tarjetas asignadas disponibles.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reiniciar submazo' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Editar submazo' }));
  expect(screen.getByLabelText('Nombre del submazo')).toHaveValue('Missing');
  expect(screen.getByRole('button', { name: 'Guardar submazo' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByLabelText('Mazo de práctica')).toHaveFocus();
});
