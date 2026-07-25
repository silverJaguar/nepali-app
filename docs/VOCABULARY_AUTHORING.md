# Vocabulary Authoring Reference

Adding a word to `src/lessons.json` is **not** enough for it to behave correctly in sentence construction, quizzes, fill-in-the-blank, Unit 5 plurals, or English prompts. This document is the checklist and schema for every new flashcard.

**Related docs:** `VARIANT_SYSTEM.md`, `POSTPOSITION_SYSTEM.md`, `CONTENT_FILTER.md`, `docs/NEPALI_GRAMMAR_REFERENCE_LLM.md`

---

## How vocabulary flows through the app

```
lessons.json (flashcards)
  ├─ Flashcards / Matching UI
  │     └─ filterVisibleVocabulary (hides visible_in_vocab: false)
  │
  └─ getAvailableVocabulary (SentenceConstruction + generators)
        ├─ contentFilter (NSFW on term + gloss/definition)
        ├─ isNonChipVocab (phrases / interjections / ? / multi-word phrases)
        ├─ unit_min + negation filters (units 1–2)
        └─ buildSentence / grammarPluralExercises / quiz / fill-blank / identify
              ├─ can_be          → which sentence slot the word can fill
              ├─ category        → semantic pairing & location/existence filters
              ├─ semantic_type   → verb–object & adjective–subject rules
              ├─ can_plural      → Unit 5 हरू / English plurals
              ├─ possessable     → possession sentences
              ├─ gender_variants → dropdown + accepted answers
              └─ gloss           → English prompts (primary sense before "/")
```

If any of those fields are missing or wrong, the word may:

- Never appear in exercises (wrong `can_be` / filters)
- Appear in nonsense sentences ("stomachs are in the company")
- Get wrong English ("The mothers goe school")
- Fail Unit 5 chip joining or agreement
- Show up as a useless phrase distractor in the word bank

---

## Master field template

Copy this into a new entry, then **delete every field that does not apply**. Marked:

- **REQUIRED** — omit only if the note says so
- **RECOMMENDED** — strongly preferred for sentence-ready words
- **OPTIONAL** — use when the case applies
- **RUNTIME ONLY** — never put these in `lessons.json`; the app generates them

```json
{
  // ─── ALWAYS REQUIRED ───────────────────────────────────────────
  "term": "नेपाली",                    // REQUIRED — Nepali surface form
  "definition": "English gloss",       // REQUIRED — human-facing (flashcards)
  "transliteration": "romanization",   // REQUIRED
  "part_of_speech": "noun",            // REQUIRED — see POS list below
  "can_be": ["subject", "object"],     // REQUIRED for almost all cards
                                       //   (rare exception: को)

  // ─── STRONGLY RECOMMENDED ──────────────────────────────────────
  "gloss": "english",                  // RECOMMENDED — short primary sense
                                       //   used in generated English prompts.
                                       //   Verbs MUST be 3sg: "goes", "eats"
                                       //   (not "go" / "to go"). Primary sense
                                       //   is taken before " / " if present.
  "phoneme": "IPA-ish",                // RECOMMENDED — pronunciation display
  "category": "person",                // REQUIRED for nouns; common on adj /
                                       //   copula / postposition. See categories.
  "unit_min": 4,                       // OPTIONAL — earliest grammar unit this
                                       //   word may appear (enforced in units 1–2)
  "visible_in_vocab": true,            // OPTIONAL — false = flashcard-hidden
                                       //   (and excluded from unit 1–2 pools)
  "used_in": ["existence"],            // OPTIONAL — documentation only

  // ─── NOUNS ─────────────────────────────────────────────────────
  "can_plural": true,                  // REQUIRED for nouns — true/false
                                       //   Explicitly set; do not omit.
  "animacy": "animate",                // RECOMMENDED — "animate" | "inanimate"
  "possessable": false,                // OPTIONAL — must be true for "X has Y"
                                       //   Omitting ≠ true; omission excludes it.
  "gender": "masculine",               // OPTIONAL — with gender_variants
  "gender_variants": [                 // OPTIONAL — accepted as correct answers
    {
      "term": "feminine form",
      "transliteration": "...",
      "definition": "... (female)",
      "gender": "feminine"
    }
  ],
  "relative_age": "older",             // OPTIONAL — "older" | "younger"
                                       //   (siblings; honorific-feminine heuristics)
  "requires_possession": true,         // OPTIONAL — body parts needing a possessor
  "requires_genitive_link": true,      // OPTIONAL — time-of-day nouns (को)
  "plural": true,                      // OPTIONAL — inherently plural English
                                       //   (clothes/shoes); pair with can_plural: false
  "mass_noun": true,                   // OPTIONAL — supported in code but unused
                                       //   in data; prefer can_plural: false

  // ─── VERBS ─────────────────────────────────────────────────────
  "verb_type": "action",               // REQUIRED for verbs —
                                       //   action | copula | communication |
                                       //   process | modal
  "semantic_type": "eat_action",       // REQUIRED for action verbs (and quality adjs)
  "requires_object_type": [            // REQUIRED for transitive / motion verbs
    "food", "liquid"                   //   matched against object category OR
  ],                                   //   object semantic_type
  "transitive": false,                 // OPTIONAL — false = no ले (motion)
  "default_postposition": "मा",        // OPTIONAL — destination PP for motion
  "negative_present": "खाँदैन",        // RECOMMENDED on positive action lemmas
  "negative_past": "खाएन",             // OPTIONAL
  "negative_of": "खान्छ",              // REQUIRED on standalone negative cards
  "copula_type": "existence",          // OPTIONAL — modal | existence | identity |
                                       //   honorific_feminine
  "verb_forms": {                      // OPTIONAL — infinitive teaching cards
    "Present": [
      { "term": "...", "transliteration": "...", "definition": "..." }
    ],
    "Past": [],
    "Future / Intent": []
  },

  // ─── ADJECTIVES ────────────────────────────────────────────────
  // Use category + semantic_type (*_quality / emotional_state)
  // can_be: ["modifier"]

  // ─── PRONOUNS / POSSESSIVES ─────────────────────────────────────
  "person": "first",                   // OPTIONAL — first | second
  "number": "singular",                // OPTIONAL
  "formality": "polite",               // OPTIONAL — informal | polite | neutral
  "possessive": true,                  // OPTIONAL — possessive pronouns

  // ─── LEGACY / RARE (avoid unless matching existing cards) ───────
  "requires_subject": ["person"],      // RARE — legacy SentenceConstruction path
  "requires_object": true,             // RARE — legacy

  // ─── DO NOT AUTHOR (runtime only) ──────────────────────────────
  // "agreement_variants": [...]       // generated by agreementVariants.js
  // "agreement_required": true
  // "display_default": "छ"
  // "honorific": true                 // code-supported; not in lessons.json yet
  // "definite": true                  // article helper only
}
```

---

## Valid enums (current data)

### `part_of_speech`

| Value | Sentence chips? | Notes |
|-------|-----------------|-------|
| `noun` | Yes | Most common |
| `verb` | Yes | Prefer finite lemma (`जान्छ`), not only infinitive |
| `adjective` | Yes | `can_be: ["modifier"]` |
| `copula` | Yes | हो / छ / हुन् / … |
| `postposition` | Yes | ले, मा, सङ्ग, को, … |
| `particle` | Yes | के |
| `adverb` | Yes | कहाँ, etc. |
| `pronoun` | Yes | म, तिमी, तपाईं |
| `possessive_pronoun` | Yes | मेरो, … |
| `phrase` | **No** | Flashcards only — filtered from word banks |
| `interjection` | **No** | Same as phrases |

### `can_be` roles

| Role | Typical POS | Purpose |
|------|-------------|---------|
| `subject` | noun, pronoun | Sentence subject |
| `object` | noun | Direct / destination object |
| `identity_noun` | noun (profession/role) | Predicate after हो/हुन् |
| `possessor` | noun, possessive_pronoun | Possession sentences |
| `modifier` | adjective | Identity-adj sentences |
| `predicate` / `verb` | verb | Action head |
| `verb_negative_present` / `verb_negative_past` | verb | Hidden negative forms |
| `copula` | verb/copula | Existence छ |
| `identity_copula` / `identity_copula_negative` | copula | हो / होइन |
| `copula_negative` | copula | छैन |
| `plural_copula` / `plural_identity_copula` (+ `_negative`) | copula | छन् / हुन् (Unit 5) |
| `honorific_copula` / `honorific_feminine_copula` | copula | हुनुहुन्छ / छिन् |
| `possession_postposition` | postposition | सङ्ग |
| `location_postposition` | postposition | मा |
| `ergative_marker` | postposition | ले |
| `dative_marker` | postposition | लाई |
| `location_word` | adverb | कहाँ |
| `question_particle` / `question_word` | particle/adverb | के / कहाँ |
| `greeting` / `farewell` / `gratitude` / `apology` / `polite_request` / `statement` / `question` | phrase | Flashcard roles only |

### `category` (nouns & related)

In use today:

`accommodation`, `appearance`, `beauty`, `body`, `body_part`, `clothing`, `concept`, `copula`, `currency`, `direction`, `education`, `emotion`, `family`, `family_member`, `food`, `furniture`, `health`, `household_activity`, `household_object`, `household_space`, `instrument`, `item`, `learning_material`, `liquid`, `location`, `music`, `nature`, `number`, `person`, `place`, `postposition`, `price`, `quality`, `size`, `solid`, `taste`, `time`, `time_management`, `time_state`, `transportation`, `work`, `work_activity`, `work_material`, `work_process`

**Pick carefully — category drives:**

- What can be a **location subject** (buildings/places/body/time/abstracts are blocked)
- What can **exist** alone ("Are there noses?" blocked for body, etc.)
- What can sit **on furniture** (people/cars/buildings cannot)
- Verb–object and adjective–subject pairing
- Whether Unit 5 will try to pluralize (some categories are non-plural by default)

### `semantic_type`

**Action verbs:**  
`eat_action`, `drink_action`, `go_action`, `come_action`, `do_action`, `see_action`, `hear_action`, `smell_action`, `taste_action`, `feel_action`, `buy_action`, `wash_action`, `cook_action`, `write_action`, `read_action`, `learn_action`, `ask_action`, `work_action`, `start_action`, `finish_action`, `send_action`, `ability_modal`

**Adjectives:**  
`taste_quality`, `beauty_quality`, `size_quality`, `price_quality`, `emotional_state`, `time_quality`

**Nouns (sparse):**  
`food`, `body_part`, `person`, `condition`, `medicine`, `clothing`, `identity`, `possession`

### `requires_object_type` tokens

Matched against the object's **`category` OR `semantic_type`**. Common values:

`food`, `liquid`, `solid`, `place`, `accommodation`, `person`, `emotion`, `health`, `clothing`, `instrument`, `music`, `item`, `thing`, `learning_material`, `document`, `text`, `edible`, `beverage`, `visible`, `audible`, `smellable`, `tasteable`, `activity`, `task`, `work`, `skill`, `message`, `event`, `question`, `concept`, `body_part`, `dishware`

---

## Checklist: adding ANY new word

### 1. Decide the word's job

- [ ] Is this **flashcard-only** (greeting, phrase), or must it participate in **sentence exercises**?
- [ ] Which grammar units introduce it? Set `unit_min` if it should not appear early.
- [ ] Which lesson / thematic unit in `lessons.json` does it belong under?

### 2. Core fields (always)

- [ ] `term` — correct Nepali spelling; do **not** bake `मा` / `ले` / `सँग` / `हरू` into the noun for Unit 5 chip exercises
- [ ] `definition` — clear English for flashcards
- [ ] `gloss` — short primary sense for prompts (see English rules below)
- [ ] `transliteration`
- [ ] `part_of_speech`
- [ ] `can_be` — every role this word should fill
- [ ] Content-safe (run mental check against `CONTENT_FILTER.md`; no NSFW in term/gloss)

### 3. English gloss rules (easy to get wrong)

- [ ] Put the **primary** sense first. Text after ` / ` is ignored in prompts (`"House / Home"` → `"House"`).
- [ ] Verb glosses are **3rd-person singular**: `"goes"`, `"eats"`, `"listens"` — never `"go"` / `"to go"`. Plural English is derived automatically (`goes` → `go`).
- [ ] Keep glosses short. Long slashy definitions leak into prompts if `gloss` is missing.

### 4. POS-specific fields

Follow the section for your POS below.

### 5. After saving to `lessons.json`

- [ ] Reload the app; confirm the word appears (or is correctly hidden) in Vocab / flashcards
- [ ] If sentence-relevant, generate exercises in the relevant unit(s) and spot-check:
  - [ ] Nepali surface form
  - [ ] English prompt (no `goe`, no "shop / store", no nonsense locations)
  - [ ] Word bank chips (no whole phrases as distractors)
  - [ ] Unit 5: separate `हरू` / `मा` / `सँग` / `ले` chips; answer joins correctly
  - [ ] Gender variants accepted if applicable
- [ ] Run tests when touching plural / agreement / sentence fields:

```bash
npm test -- --testPathPattern="grammarPluralExercises|agreementVariants" --watchAll=false
```

---

## Checklist by part of speech

### Noun

- [ ] `category` from the known set (do not invent silently — invent only if you also update filters in `sentenceBuilder.js` / `helpers.js`)
- [ ] `can_plural: true` **or** `false` — **never omit**
  - Use `false` for mass nouns (पैसा, भात), abstracts (काम), time, numbers, emotions, inherent plurals
- [ ] `can_be`:
  - `subject` if it can start sentences
  - `object` if it can be possessed / acted on / destination
  - `identity_noun` if it can be the B in "A is B" (teacher, student, …)
- [ ] `animacy` for anything that participates in action/identity sentences
- [ ] `possessable: true` **only** if "X has Y" should be allowed (strict equality — omitting excludes it)
- [ ] Body parts: `requires_possession: true`; usually `possessable: false`
- [ ] Time-of-day: `requires_genitive_link: true`, `can_plural: false`
- [ ] Places / destinations: `category: place` or `accommodation` (furniture for "on the table")
- [ ] Gendered professions: `gender` + `gender_variants[]`
- [ ] Sibling terms: `relative_age` (`older` / `younger`)
- [ ] Will this noun create nonsense as a **location subject**? Buildings, weather, body parts, abstracts should not be locatable subjects (filters already block many categories — don't fight them)

**Identity predicate note (Unit 5):** After हो/हुन्, Nepali does **not** add `हरू` to the predicate noun (`बहिनीहरू शिक्षक हुन्`). English still pluralizes ("are teachers"). You do not need a special flag for this — the generator handles it — but do not expect `शिक्षकहरू` as the chip for the predicate.

### Verb (finite action lemma)

Sentence heads must be **finite** forms (`जान्छ`, `खान्छ`), not only infinitives (`जानु`).

- [ ] `verb_type: "action"`
- [ ] `can_be: ["predicate", "verb"]`
- [ ] `semantic_type` (`*_action`)
- [ ] `requires_object_type: [...]` aligned with real noun `category` / `semantic_type` values
- [ ] `gloss` / `definition` in **3sg English**
- [ ] Motion (`go` / `come`):
  - [ ] `transitive: false`
  - [ ] `default_postposition: "मा"`
  - [ ] `requires_object_type` includes `place` / `accommodation`
- [ ] `negative_present` (and optionally `negative_past`) on the positive lemma
- [ ] Companion **negative cards** (if you teach them separately):
  - [ ] `visible_in_vocab: false`
  - [ ] `negative_of: "<positive term>"`
  - [ ] `can_be: ["verb_negative_present"]` (or past)
  - [ ] Same `semantic_type` / object requirements as the positive lemma (or rely on `negative_of` resolution)
- [ ] Optional infinitive teaching card with `verb_forms` — still keep a finite lemma for generation

### Adjective

- [ ] `can_be: ["modifier"]`
- [ ] `category` + `semantic_type` matching `isValidAdjectiveSubjectPair`
  - taste → food/liquid/solid
  - emotion → animate subjects
  - size / beauty / price → their allowed subject sets

### Copula

- [ ] `part_of_speech: "copula"`, usually `category: "copula"`
- [ ] Correct `can_be` (`identity_copula`, `copula`, negatives, `plural_*` for Unit 5)
- [ ] Plural forms: set `unit_min: 5` if they should be gated
- [ ] Avoid duplicate conflicting entries (note: `छ` also exists as a `verb` with `can_be: ["copula"]`)

### Postposition / particle / adverb (grammar words)

- [ ] Exact `can_be` role (`ergative_marker`, `location_postposition`, `question_particle`, …)
- [ ] `unit_min` if introduced mid-pathway (e.g. मा = 4, के = 4)
- [ ] Orthography note: lessons store **`सङ्ग`**; Unit 5 chips normalize display to **`सँग`**

### Phrase / interjection

- [ ] `part_of_speech: "phrase"` or `"interjection"`
- [ ] Flashcard / matching only — **will not** (and must not) appear as sentence-construction chips
- [ ] Do not give them sentence `can_be` roles expecting exercise use

### Pronoun / possessive pronoun

- [ ] `person`, `number`, `formality` as appropriate
- [ ] Possessives: `possessive: true`, `can_be: ["possessor"]`

---

## Decision trees (common mistakes)

### "Should this noun get `can_plural: true`?"

```
Is it countable in beginner Nepali exercises?
  NO  → can_plural: false
        (money, rice, work, time words, numbers, emotions, "clothes")
  YES → can_plural: true
        (people, books, rooms, shops, …)
```

If unsure, prefer `false`. Wrong `true` creates bad Unit 5 sentences ("There are works", "moneys").

### "Should this noun be `possessable: true`?"

Only if a natural sentence is **"X has Y"** (book, bag, money, room…).  
People, places, and abstract events usually stay `false` / omitted.

### "Should this noun be an `identity_noun`?"

Only roles/professions suitable after हो: teacher, student, singer, friend, engineer…  
Not: table, hospital, song.

### "Can this noun be a location subject?"

Ask: does "The ___ are in the shop" make sense for a beginner?

Blocked categories include (among others): `place`, `accommodation`, `body`, `body_part`, `nature`, `time`, `emotion`, `work`, music, abstracts.  
People, portable objects, furniture-as-subject-of-"on", etc. are the usual yes cases.

### "Do I need a separate negative verb card?"

If the positive lemma has `negative_present`, Unit 3+ can form negatives from that string.  
Add a separate card with `visible_in_vocab: false` when you want it as its own flashcard / distractor / explicit form.

---

## Worked examples

### Countable person (with gender variant)

```json
{
  "term": "शिक्षक",
  "definition": "Teacher",
  "gloss": "teacher",
  "transliteration": "shikshak",
  "phoneme": "ʃik.ʃʌk",
  "part_of_speech": "noun",
  "can_be": ["subject", "object", "identity_noun"],
  "category": "person",
  "gender": "masculine",
  "animacy": "animate",
  "possessable": false,
  "can_plural": true,
  "gender_variants": [
    {
      "term": "शिक्षिका",
      "transliteration": "shikshika",
      "definition": "Teacher (female)",
      "gender": "feminine"
    }
  ]
}
```

### Mass / non-plural noun

```json
{
  "term": "पैसा",
  "definition": "Money",
  "gloss": "money",
  "transliteration": "paisa",
  "part_of_speech": "noun",
  "can_be": ["object"],
  "category": "currency",
  "animacy": "inanimate",
  "possessable": true,
  "can_plural": false
}
```

### Place (destination / location predicate)

```json
{
  "term": "विद्यालय",
  "definition": "School",
  "gloss": "school",
  "transliteration": "vidyalaya",
  "part_of_speech": "noun",
  "can_be": ["object"],
  "category": "place",
  "animacy": "inanimate",
  "possessable": false,
  "can_plural": true
}
```

### Transitive action verb

```json
{
  "term": "खान्छ",
  "definition": "eats",
  "gloss": "eats",
  "transliteration": "khancha",
  "part_of_speech": "verb",
  "can_be": ["predicate", "verb"],
  "verb_type": "action",
  "semantic_type": "eat_action",
  "requires_object_type": ["food", "solid"],
  "negative_present": "खाँदैन",
  "visible_in_vocab": true
}
```

### Motion verb (no ergative; needs मा)

```json
{
  "term": "जान्छ",
  "definition": "goes",
  "gloss": "goes",
  "transliteration": "jancha",
  "part_of_speech": "verb",
  "can_be": ["predicate", "verb"],
  "verb_type": "action",
  "transitive": false,
  "semantic_type": "go_action",
  "requires_object_type": ["place", "accommodation"],
  "default_postposition": "मा",
  "negative_present": "जाँदैन",
  "visible_in_vocab": true
}
```

### Hidden negative companion

```json
{
  "term": "जाँदैन",
  "definition": "does not go",
  "gloss": "does not go",
  "transliteration": "jaadaina",
  "part_of_speech": "verb",
  "can_be": ["verb_negative_present"],
  "verb_type": "action",
  "semantic_type": "go_action",
  "negative_of": "जान्छ",
  "visible_in_vocab": false
}
```

### Flashcard-only phrase (not a chip)

```json
{
  "term": "हाल खबर के छ?",
  "definition": "How are you?",
  "transliteration": "haal khabar ke cha?",
  "part_of_speech": "phrase",
  "can_be": ["greeting"]
}
```

---

## Gotchas (Unit 5 era and beyond)

1. **Phrases are not chips.** `phrase` / `interjection` / terms with `?` or `।` / terms with more than two whitespace-separated tokens are stripped from sentence word banks.
2. **Predicate nouns stay singular in Nepali** after हो/हुन्; English still pluralizes.
3. **Mass nouns need `can_plural: false`.** Copula agreement in possession follows the **possessed object**, not the possessor (`आमाहरूसँग पैसा छ`).
4. **Location pairing is strict.** Houses are not "in hospitals"; body parts are not location subjects; large things are not "on" furniture.
5. **Separate postposition chips.** Unit 5 expects bare place + `मा`, bare noun + `हरू`, etc. Don't put `अस्पतालमा` as the only available form if learners must practice `मा`.
6. **Gender variants are accepted as correct** in Unit 5 if listed under `gender_variants` on the base card.
7. **`सङ्ग` vs `सँग`.** Data uses `सङ्ग`; chips may display `सँग`.
8. **`unit_min` is only enforced in units 1–2 today.** Still set it correctly for future-proofing and documentation.
9. **`category: profession` is checked in code but unused in data.** Prefer `identity_noun` + `category: person`.
10. **Duplicate POS traps.** Some copulas exist as both `verb` and `copula` entries — check before adding another `छ`/`हो`.

---

## When you must also change code

Adding a word is usually JSON-only **if** it reuses existing categories, `semantic_type`s, and roles.

You **must** update code if you:

| Change | Touch |
|--------|--------|
| New noun `category` that should/shouldn't locate, exist, or pluralize | `sentenceBuilder.js` (`NOT_LOCATABLE_*`, `NOT_EXISTABLE_*`, `TOO_BIG_FOR_FURNITURE`), `pluralForms.js` |
| New verb `semantic_type` or object pairing rule | `helpers.js` (`isValidVerbObjectPair`) |
| New adjective quality pairing | `helpers.js` (`isValidAdjectiveSubjectPair`) |
| New postposition / English preposition mapping | `postpositionMapper.js` |
| New content-safety pattern | `contentFilter.js` |
| New `can_be` role used by templates | `sentence_templates.json` + builders that read that slot |
| New Unit 5 morphology / chip join rule | `pluralForms.js`, `grammarPluralExercises.js` |

---

## Quick copy-paste skeletons

**Minimal noun**

```json
{
  "term": "",
  "definition": "",
  "gloss": "",
  "transliteration": "",
  "part_of_speech": "noun",
  "can_be": ["subject", "object"],
  "category": "",
  "animacy": "inanimate",
  "possessable": false,
  "can_plural": true
}
```

**Minimal verb**

```json
{
  "term": "",
  "definition": "",
  "gloss": "",
  "transliteration": "",
  "part_of_speech": "verb",
  "can_be": ["predicate", "verb"],
  "verb_type": "action",
  "semantic_type": "",
  "requires_object_type": [],
  "negative_present": "",
  "visible_in_vocab": true
}
```

**Minimal adjective**

```json
{
  "term": "",
  "definition": "",
  "gloss": "",
  "transliteration": "",
  "part_of_speech": "adjective",
  "can_be": ["modifier"],
  "category": "",
  "semantic_type": ""
}
```

---

## Key source files

| Concern | File |
|---------|------|
| Vocab data | `src/lessons.json` |
| Sentence templates | `src/sentence_templates.json` |
| Vocab load / unit filters | `src/SentenceConstruction.js`, `src/utils/grammarVocabulary.js` |
| Sentence generation | `src/utils/sentenceBuilder.js` |
| Verb / adj pairing | `src/utils/helpers.js` |
| Plural morphology & chip join | `src/utils/pluralForms.js` |
| Unit 5 chips / distractors | `src/utils/grammarPluralExercises.js` |
| Agreement dropdowns | `src/utils/agreementVariants.js` |
| English verb forms | `src/utils/englishVerbForms.js` |
| English articles / prepositions | `src/utils/postpositionMapper.js` |
| Content safety | `src/utils/contentFilter.js` |
| Flashcard visibility | `src/utils/helpers.js` (`filterVisibleVocabulary`) |

---

*Last updated to match Unit 5 plurals/agreement, separate मा/हरू chips, English verb bare-forms, and phrase exclusion from word banks.*
