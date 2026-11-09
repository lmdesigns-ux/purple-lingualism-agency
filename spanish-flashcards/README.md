# Mi vocabulario

A personal Spanish vocabulary app built with React, Vite, and plain CSS. The 104-entry collection includes the original 16-word Mi Casa starter deck, the remaining vocabulary from your Housing in Spanish slides, and two learner-requested bookshelf/shelf cards. It runs locally and does not connect to tutoring records or external programs.

## Housing collection

Source: `../Spanish Programs/The Spanish Challenge Community x Blacklingual/Huevo/Housing in Spanish.pdf`, vocabulary on pages 3–35. The collection adds 86 entries covering building features, rooms, furniture, household items, appliances, office/entertainment items, outdoor spaces, utilities, bills, and verbs. New entries include source-page references, articles where appropriate, notes, and approximate pronunciation.

Synonyms are grouped on one card or included in the existing card's notes (for example, nevera/refri/refrigerador and dormitorio/habitación) rather than making equivalent translations compete in a quiz. The source's `cochón` is corrected to **colchón**, and its noun **alquiler** is retained alongside the proper verb **alquilar**. **Lámpara** includes its written accent.

Learner-requested additions in Furniture: **la estantería / el librero** (bookcase/shelving unit) and **el estante** (shelf). Their notes explain regional usage, the bookseller sense of librero, and the library/bookcase senses of biblioteca. Estante can also name a whole shelving unit; it is not restricted to a single shelf. These additions were checked against the RAE/ASALE entries for [estantería](https://dle.rae.es/estanter%C3%ADa), [librero](https://dle.rae.es/librero), [estante](https://dle.rae.es/estante), and [biblioteca](https://dle.rae.es/biblioteca).

The original 16 IDs are preserved. Refresh the app to load the expanded collection; no import or reset is needed. Existing user edits, deletions, and Got it ratings still apply. If you previously selected particular categories, select **All cards** to include the new categories. A user-edited entry overrides bundled notes as well as translations, so its existing edits are kept.

## Install and launch

Prerequisites: Node.js 22.12+ within Node 22, or Node 24+ (LTS recommended), and npm. Node 23 is outside the test runner’s supported engine range. From the repository root:

```bash
cd spanish-flashcards
npm install
npm run dev
```

Open **http://localhost:5173**. Leave the terminal running; press **Control+C** there to stop. The port is strict: if 5173 is busy, stop the existing process rather than changing ports accidentally.

For checks and a production preview:

```bash
npm test
npm run build
npm run preview
```

Stop the development server before running preview, which intentionally uses the same hostname and port. Both commands use the same browser storage origin. The built files are in `dist/`.

## Practice

Category choices start collapsed to leave more space for practice. Click **Categories** to open the panel; its compact summary shows the current selection and word count. Toggle individual categories, use **All cards** or **Clear selection**, then click **Done** (or Categories again) to collapse it. Selections are saved even when the panel is closed and apply to both flashcards and quizzes.

- **Flash Cards:** select any combination of categories or All cards. Tap the card, or focus it and press Enter/Space, to reveal the other language. Use Previous/Next to revisit remaining words. Still learning saves your self-rating and advances while keeping the card in practice. Got it removes the card from flashcard practice until you reset its deck, including after refresh, shuffle, or category changes. It stays in your vocabulary collection and remains available for quizzes. When all selected cards are Got it, the completion screen still offers Reset this deck.
- **Direction:** Show English first reverses both cards and quiz questions. Spanish pronunciation appears only when Spanish is visible, preventing English-first quiz answer leakage.
- **Pronunciation:** optional approximate English-based guide; capital letters mark stress. These are reading aids, not audio or precise phonetic transcriptions.
- **Shuffle:** changes order without changing progress. **Reset this deck:** confirms before clearing flashcard ratings for selected items only; words and quiz statistics remain.
- **Quiz:** up to ten unique prompts from selected categories. Distractors come from the whole active collection, preferring the same category. Collections with fewer translations get fewer choices; at least two unique choices are required. Ambiguous prompts with conflicting translations are skipped and explained. Answer once, inspect feedback, then choose Next. Final results review misses, and Retry missed questions uses only those items.
- Quiz results never change flashcard ratings. Multiple choice and Got it are not proof of durable mastery. Revisit unfamiliar examples after a delay.
- Leaving an active quiz requires confirmation. Answered questions are saved immediately; reopening after refresh records an interrupted quiz as incomplete. The app keeps a snapshot of question text, choices, answers, and direction, so later vocabulary edits do not rewrite history.

## Manage vocabulary

Open **Manage Vocabulary** to search, add, edit, or delete words. Spanish, English, and category are required; pronunciation, notes, and region are optional. New categories appear automatically. Create generates an ID; edit preserves it. Changing translations with saved progress prompts a warning because progress remains attached to that ID.

Starter entries live in `src/data/vocabulary.json`. They have these fields:

```json
{
  "id": "personal-key",
  "spanish": "la llave",
  "english": "the key",
  "category": "Everyday objects",
  "pronunciation": "lah YAH-beh",
  "notes": "Learn the article together with the noun.",
  "region": ""
}
```

IDs must be unique, stable, nonempty strings. Do not reuse an ID for an unrelated word. The bundled JSON is a vocabulary array, not a full backup. Use UTF-8 so accents survive.

### Import and export words

1. Export vocabulary JSON or CSV from Manage Vocabulary. These exports contain all current active words, not just the category/search selection. **They do not include progress, deleted entries, preferences, or quiz history.**
2. For JSON, import an array with the fields above. CSV headers are `id,spanish,english,category,pronunciation,notes,region`; quoted commas and multiline notes are supported. Optional columns may be omitted, and missing IDs are generated.
3. Click Import JSON / CSV, choose the file, inspect the preview, then Confirm import. Invalid rows and duplicate IDs reject the entire file without applying partial changes. Cancel leaves everything unchanged.
4. Matching IDs update entries; other IDs add entries. Importing a previously deleted ID restores it. Imports do not delete unrelated words. Translation changes with progress are identified in the preview and confirmation.

The app combines bundled data with saved user entries, edits, and deletion markers. App updates do not overwrite user changes. Deleting a word hides it from practice, but historical quiz snapshots and its ID-based progress remain. Reimporting its ID restores the same identity.

## Full backup and restoration

**Export regularly, especially before updating the app, deleting browser data, or restoring another backup.**

1. Go to Manage Vocabulary → **Export full backup**.
2. Save `spanish-flashcards-backup.json` somewhere durable, such as your Documents folder. Consider a dated copy.
3. To restore, open this app in the intended browser at **http://localhost:5173**.
4. Go to Manage Vocabulary → **Restore full backup**, select the full-backup JSON, inspect its entry/rating/quiz counts, and choose **Confirm restore**.
5. Confirm replacement. This replaces saved user changes, deletion markers, ratings, quiz records, and preferences. Current bundled starter data is combined with the restored overrides. Previously active quizzes become incomplete.
6. Refresh and verify your words and ratings. Keep the backup file until satisfied.

Full backups use a versioned state format (`version: 1`) containing `overrides`, `deleted`, `ratings`, `quizStats`, `attempts`, and `preferences`. Vocabulary-only JSON is not a full backup and must be imported through Import JSON / CSV instead.

Browser storage is tied to **browser profile + hostname + port + protocol**. `localhost:5173`, `127.0.0.1:5173`, a different port, another browser, and private browsing do not share data. There is no cloud sync, account, automatic backup, or synchronization with files on disk. Clearing site data removes progress unless you exported it. Never rely on private browsing for durable records.

If storage fills up or becomes unavailable, a persistent warning appears and the current session remains usable in memory. Export a full backup before closing. If saved data is corrupt or an unsupported version, the app preserves the original stored text rather than overwriting it; start a temporary session or restore a valid backup. To recover the original text manually, browser developer tools → Application/Storage → Local Storage → this origin → `spanish-flashcards:v1`.

## Verification

`npm test` covers vocabulary validation, update-safe merges, CRUD, JSON/CSV round trips, backup restoration, storage failures, keyboard flipping, reset isolation, quiz scoring/deduplication/direction, and separate flashcard progress.

For desktop/mobile browser checks:

```bash
npx playwright install chromium
npm run test:browser
```

The browser tests start a development server automatically if needed and cover keyboard flipping, refresh persistence, narrow-screen overflow, complete quiz scoring/retries, and full-backup download/restore. Screenshots are written under ignored `test-results/`.

No backend, API keys, audio service, or hosted deployment is required.
