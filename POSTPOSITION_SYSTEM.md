# Postposition Mapping System

## Overview

This system handles the conversion between Nepali postpositions and English prepositions to generate grammatically correct English prompts in the grammar section.

## The Problem

Nepali encodes spatial and relational information using **postpositions** (particles that come after nouns), while English uses **prepositions** (particles that come before nouns). This structural difference was causing ungrammatical English sentences like:

- ❌ "The seller comes company"
- ✅ "The seller comes **to the** company"

The Nepali sentence "बेच्ने मान्छे कम्पनीमा आउँछ" is grammatically perfect because "मा" (the postposition meaning "to/at/in") is attached to "कम्पनी" (company). However, the English generation was only using the base gloss "company" without considering the postposition.

## The Solution

### 1. Postposition Mapping Table (`postpositionMapper.js`)

A comprehensive mapping table that connects Nepali postpositions to their English preposition equivalents:

```javascript
{
  'मा': {
    english_prepositions: {
      motion: 'to',      // for motion verbs (go, come)
      location: 'at',    // for location/static (is, sits)
      default: 'in'      // fallback
    }
  },
  'बाट': {
    english_prepositions: {
      default: 'from'
    }
  },
  'सँग': {
    english_prepositions: {
      default: 'with'
    }
  },
  // ... and more
}
```

### 2. Verb Metadata (`lessons.json`)

Verbs now have a `default_postposition` field to indicate what postposition they expect:

```json
{
  "term": "आउँछ",
  "definition": "comes",
  "semantic_type": "come_action",
  "default_postposition": "मा"
}
```

This tells the system: "When generating English for this verb, objects should be preceded by the English equivalent of 'मा' (which is 'to' for motion verbs)."

### 3. Automatic English Generation

The `buildEnglishSentence()` function now uses these utilities:

- **`buildEnglishSubjectPhrase()`** - Adds appropriate articles ("the", "a", "an") to subjects
- **`buildEnglishObjectPhrase()`** - Adds prepositions and articles to objects based on:
  - Postpositions extracted from the Nepali term
  - Verb's `default_postposition` metadata
  - Context (motion vs. static verbs)

## Supported Postpositions

| Nepali | Transliteration | English Meaning | English Preposition |
|--------|----------------|-----------------|---------------------|
| मा | mā | in, at, to (location) | to (motion), at (location), in (default) |
| बाट | bāṭa | from (source/origin) | from |
| सँग | sanga | with (accompaniment) | with |
| लाई | lāī | to, for (dative) | to |
| को | ko | of, 's (possessive) | of |
| बिना | binā | without | without |
| अघि | aghi | before | before |
| पछि | pachi | after | after |
| माथि | māthi | on, above | on |
| तल | tala | under, below | under |
| भित्र | bhitra | inside | inside |
| बाहिर | bāhira | outside | outside |

## How to Add Postposition Metadata to Verbs

For any verb that requires objects with specific postpositions:

1. Add `default_postposition` field to the verb in `lessons.json`:

```json
{
  "term": "जान्छ",
  "definition": "goes",
  "semantic_type": "go_action",
  "default_postposition": "मा"
}
```

2. The system will automatically:
   - Extract the postposition from the Nepali object (if present)
   - Or use the verb's default postposition
   - Convert it to the appropriate English preposition
   - Generate correct English like "goes **to** the school"

## Examples

### Motion Verbs

**Nepali:** बेच्ने मान्छे कम्पनीमा आउँछ  
**Generated English:** The seller comes to the company

**Nepali:** विद्यार्थी स्कूलमा जान्छ  
**Generated English:** The student goes to the school

### With Postposition (सँग)

**Nepali:** केटा साथीसँग खेल्छ  
**Generated English:** The boy plays with a friend

### From Postposition (बाट)

**Nepali:** आमा घरबाट आउँछ  
**Generated English:** The mother comes from home

## Article Logic

The system also automatically adds appropriate English articles:

- **"the"** for:
  - Family members ("the mother", "the father")
  - Definite contexts

- **"a/an"** for:
  - Singular countable nouns ("a book", "an apple")
  - Vowel-initial words get "an"

- **No article** for:
  - Proper nouns (names)
  - Plural nouns
  - Mass nouns (water, rice)
  - Abstract concepts (love, happiness)

## Files Modified

1. **`src/utils/postpositionMapper.js`** (NEW)
   - Postposition mapping table
   - Helper functions for extraction and conversion

2. **`src/SentenceConstruction.js`**
   - Updated `buildEnglishSentence()` to use postposition logic
   - Handles all sentence types (action, possession, identity, etc.)

3. **`src/lessons.json`**
   - Added `default_postposition` to motion verbs:
     - जान्छ (goes)
     - आउँछ (comes)

## Future Enhancements

1. **Add more verb metadata**: Other verbs that require specific postpositions
2. **Location phrases**: Pre-built location phrases with postpositions (e.g., "टेबलमा" = "on the table")
3. **Case frames**: Advanced verb structures with multiple postpositional requirements
4. **Context-sensitive prepositions**: More nuanced preposition selection based on semantic context

## Testing

To test the postposition system:

1. Go to Grammar Section → Unit 2 (Action Sentences)
2. Look for exercises with motion verbs (goes, comes)
3. Verify English prompts have correct prepositions:
   - "goes **to** [place]"
   - "comes **to** [place]"

The system should now generate grammatically correct, natural English prompts while maintaining accurate Nepali sentence structure! 🎉


