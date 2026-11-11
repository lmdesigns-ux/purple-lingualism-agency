# Mi vocabulario

A personal Spanish vocabulary app built with React, Vite, and plain CSS. The 550-entry collection covers vocabulary from all eight Nido and Huevo slide decks, including individual words extracted from their Spanish examples, plus the two learner-requested bookshelf/shelf cards. It runs locally and does not connect to tutoring records or external programs.

## Nido and Huevo vocabulary

This expansion adds 399 cards to the previous 151, across 31 categories in total. Each new card includes a translation, approximate pronunciation, and a source slide/page in its notes. Slide/page numbers are one-based; repeated animation/build slides are counted in the original numbering but their vocabulary is included once.

Sources are under `../Spanish Programs/The Spanish Challenge Community x Blacklingual/`:

| Folder and source | Pages/slides reviewed | New cards primarily sourced here |
| --- | --- | ---: |
| Nido — Describing Yourself in Spanish | 1–92, including the relationship-status image | 87 |
| Nido — Introducing yourself in Spanish | 1–10 | 34 |
| Nido — Daily Routine + Reflexive Verbs | 1–38 | 99 |
| Nido — The “-ing” ending in Spanish | 1–40 | 17 |
| Huevo — Clothing Vocabulary | 1–72 | 45 |
| Huevo — Ordering Food in Spanish | 1–23 | 106 |
| Huevo — Housing in Spanish | 1–36 | 1 |
| Huevo — Describe Things in Spanish | 1–8 | 10 |

The housing and Describe Things vocabulary was already present; this pass adds the Spanish heading vocabulary and checks the existing coverage. Words shared across decks are represented once, so the table attributes each new card to its primary source. Related fixed phrases may have their own cards: **la cama**, **hacer**, and **hacer la cama** teach different retrieval units.

New categories: Personality; Identity & relationships; Diet & beliefs; Appearance & body; Feelings & manners; Everyday verbs; Everyday nouns; Connecting words & pronouns; Time & frequency; Daily routines; Clothing; Clothing descriptions; Food & drinks; Dining & utensils; Cooking & taste. Category labels are available in both interface languages.

Only vocabulary goes in this collection. Individual words from Spanish examples are included, with conjugated verbs converted to infinitives and reflexive meanings preserved: **dormir** (sleep) and **dormirse** (fall asleep) stay separate. Nouns carry articles; adjective forms such as **tímid@** become **tímido/a**. Fixed lexical phrases such as **a menudo**, **a rayas**, **hacer la cama**, and **por favor** are included. Full sentences, questions, dialogues, and open sentence frames such as **me llamo ___**, **tengo ___ años**, and **me podría dar ___** are excluded. Single words such as **hola** and **gracias** are retained as vocabulary; longer greeting/farewell utterances are excluded. Sentence/template practice remains separate and is not implemented here.

The audit excludes English-only explanatory prose, off-slide linked resources (including the careers list and videos), incidental proper names/brands, unrelated screenshot navigation, grammatical suffixes, and deliberately incorrect spellings used as warnings. It does not invent careers absent from the slides or make **-ando/-iendo** conjugation cards. The embedded relationship-status image supplies **separado/a**, **viudo/a**, **pareja de hecho**, and **unión civil**, among other relationship words.

Source corrections include **riquísimo/a** (not ricísimo), **quedan** (not quendan), **enseguida** (not en seguido), feminine **la orden** for a food order and **la hamburguesa**, and the accents in **centímetro**, **televisión**, and **súper**. **A la plancha** specifies a griddle; regional terms such as **medias**, **tenis**, **papitas**, and **cuchilla** have contextual notes. **Liso/a** keeps its existing card and gains a note about its plain/unpatterned clothing meaning.

Refresh the app to load the expanded collection. If you previously selected categories, choose **All cards** or select the new categories. Existing IDs, personal edits, deletion markers, ratings, and quiz history are preserved; new cards begin unrated. Personal overrides continue to take precedence over bundled notes and translations. No import or reset is required.

## Describe Things collection

Source: `../Spanish Programs/The Spanish Challenge Community x Blacklingual/Huevo/Blacklingual Discor_  Describe Things in Spanish.pdf`, pages 2–7. Adds 47 cards in Size & measure, Shapes, Texture & material, Quality & condition, Quantity, and Sensory descriptions. The repeated **suave** appears once; **viejo/a** and **antiguo/a** have separate cards to practice their different meanings. Cards include adjective agreement guidance, approximate pronunciation, and source pages.

Refresh the app, open **Categories**, and select these six categories to practice for Huevo. Existing cards, edits, and progress are preserved.

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

### Saved subdecks

Use **Create subdeck** above practice to name a focused collection. Start empty, or choose **Main deck’s selected categories** to copy the main deck's current category selection, including learned cards. Choose **Main deck’s visible cards** to copy only unhidden cards in that same selection: unrated and Still learning cards are included, while Got it cards are excluded. This always uses main-deck progress, even when creating from another subdeck, and the option shows the number of cards it will copy. Names must be nonblank and unique (ignoring case and extra spaces); Main deck/Mazo principal are reserved. Save selects the new subdeck. Use **Practice deck** to return to any saved subdeck or the main deck; that choice is remembered after refresh.

**Edit subdeck** lets you rename it or change its membership. Search Spanish, English, or category; filter by category; switch between all vocabulary and assigned cards. Check/uncheck individual cards or use **Add filtered cards / Remove filtered cards** for every matching result, including results on other pages. Lists show 25 cards per page. Learned cards remain available in the editor. **Save subdeck** applies changes; **Cancel** discards the draft. **Delete subdeck** confirms before removing that subdeck and its ratings, while leaving vocabulary, other decks, and quiz history intact.

Each subdeck has independent flashcard progress. **Got it** hides a card from practice while keeping it assigned; **Still learning** advances but keeps it in practice. **Reset subdeck** clears all of that subdeck's ratings and brings back every available assigned card. It never resets the main deck, other subdecks, or quizzes. Removing a card from a subdeck clears its rating there; adding it back starts unrated. A new subdeck starts unrated even if its words are learned in the main deck.

Saved subdecks practice their full membership; main-deck category choices remain separate. Counts show assigned, learned, remaining, and unavailable cards. Globally deleted or missing vocabulary stays assigned but is unavailable for practice. Its reference appears in the editor and it returns if the same vocabulary ID is restored; it can also be explicitly unassigned. Vocabulary edits apply everywhere because subdecks reference the original cards.

In **Quiz**, questions come from the selected deck's available cards, including learned cards; answer choices still come from the whole collection. Quiz answers never change flashcard ratings. Switching decks during an active quiz requires confirmation and saves answered questions as an incomplete attempt. New quiz records retain their deck's ID and name at the time of creation, even if the subdeck is later renamed or deleted. The vocabulary management list continues to show main-deck ratings.

Full backups include every subdeck, ordered membership, independent progress, and selected deck. Version 1 saved data/backups migrate automatically to version 2 with existing records preserved and no initial subdecks. Restoring an older backup replaces current state, including removing subdecks absent from that backup. Version 2 backups require this updated app; vocabulary-only JSON/CSV files still contain words only. Save or Cancel an open subdeck editor before navigating to another practice mode.

Use **ES / EN** at the top to switch the interface between Spanish and English. The selected language is saved in this browser and included in full backups. Switching languages keeps your current card, quiz, and progress. **Show English first** controls the practice direction independently. Vocabulary text and personal notes retain their original language.

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

Full backups use a versioned state format (`version: 2`) containing `overrides`, `deleted`, main-deck `ratings`, `subdecks`, `quizStats`, `attempts`, and `preferences`. Each subdeck contains `id`, `name`, ordered `cardIds`, and its own `ratings`; `preferences.deckId` is its selected ID or `null` for the main deck. The existing browser storage key `spanish-flashcards:v1` is retained so existing data can be migrated in place. Vocabulary-only JSON is not a full backup and must be imported through Import JSON / CSV instead.

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

Flashcards support **Show images** alongside pronunciation and card order. This replaces the English side with the optional `image` URL; words without an image (or with a failed image) use English. Image mode relabels card order to **Show image first** and does not change quizzes. Housing pictures are extracted from the supplied slides. Add an Image URL when editing vocabulary, or include `image` in JSON/CSV imports; use an HTTP(S) URL or a path beginning with `/`. Images and the display preference survive vocabulary exports and full backups respectively.
