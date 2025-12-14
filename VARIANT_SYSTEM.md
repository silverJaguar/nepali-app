# Word Variant System Documentation

This document explains how to use the variant system for verbs and gender variants in the vocabulary.

## Overview

The variant system allows you to:
- Combine multiple verb forms (different tenses/aspects) under one root verb entry
- Combine masculine/feminine word pairs into a single entry
- Show a dropdown when users select words with variants
- Accept any valid variant form as a correct answer

## Verb Forms Structure

For verbs with multiple forms, add a `verb_forms` property grouped by tense/aspect:

```json
{
  "term": "किन्नु",
  "definition": "To buy",
  "gloss": "buys",
  "transliteration": "kinnu",
  "part_of_speech": "verb",
  "verb_type": "action",
  "semantic_type": "buy_action",
  "verb_forms": {
    "Present": [
      {
        "term": "किन्छ",
        "transliteration": "kincha",
        "definition": "buys (present)"
      },
      {
        "term": "किन्छे",
        "transliteration": "kinche",
        "definition": "buy (present, 2nd person)"
      }
    ],
    "Past": [
      {
        "term": "किन्यो",
        "transliteration": "kinyo",
        "definition": "bought (past)"
      },
      {
        "term": "किने",
        "transliteration": "kine",
        "definition": "bought (past, 2nd person)"
      }
    ],
    "Future / Intent": [
      {
        "term": "किन्ने",
        "transliteration": "kinne",
        "definition": "will buy"
      }
    ]
  }
}
```

**Important Notes:**
- Group forms by semantic category (tense/aspect), not by person/number
- The root term (`किन्नु`) is the infinitive/base form shown in the dropdown
- Each form should have `term` and optionally `transliteration` and `definition`
- The system will accept any form from the dropdown as correct
- Forms are organized by lesson concepts, not grammatical person

## Gender Variants Structure

For masculine/feminine word pairs, add a `gender_variants` property:

```json
{
  "term": "गायक",
  "definition": "Singer (male)",
  "gloss": "singer",
  "transliteration": "gaayak",
  "part_of_speech": "noun",
  "category": "person",
  "gender": "masculine",
  "gender_variants": [
    {
      "term": "गायिका",
      "transliteration": "gaayika",
      "definition": "Singer (female)",
      "gender": "feminine"
    }
  ]
}
```

**Alternative approach** - You can also put the male version in variants:

```json
{
  "term": "गायिका",
  "definition": "Singer (female)",
  "gloss": "singer",
  "transliteration": "gaayika",
  "part_of_speech": "noun",
  "category": "person",
  "gender": "feminine",
  "gender_variants": [
    {
      "term": "गायक",
      "transliteration": "gaayak",
      "definition": "Singer (male)",
      "gender": "masculine"
    }
  ]
}
```

**Important Notes:**
- Only one entry is needed for the pair (use whichever is more common as the base term)
- The dropdown will show both options
- Users can select either gender variant
- Both variants will be accepted as correct answers

## Combined Example

A word can have both verb forms and gender variants if applicable, though this is rare.

## Usage in Sentence Construction

When a word has variants:
1. The word appears with a dropdown arrow (▸) in the available words list
2. Clicking the word selects it and opens the dropdown
3. Users can choose from available forms/variants
4. The selected variant is shown in the sentence
5. Any valid variant is accepted as correct

## Benefits

1. **Cleaner vocabulary**: One entry instead of many for the same root word
2. **Better organization**: Forms grouped by meaning/use, not grammar
3. **Retrieval practice**: Users recall the correct form, not just recognize it
4. **Flexible answers**: Multiple correct forms accepted automatically
5. **Progressive disclosure**: Only show what's relevant to the current lesson

## Example Updates Needed

To convert existing vocabulary:

**Before** (multiple entries):
```json
[
  { "term": "किन्छ", "definition": "buys", ... },
  { "term": "किन्यो", "definition": "bought", ... },
  { "term": "किने", "definition": "bought (2p)", ... }
]
```

**After** (single entry with variants):
```json
[
  {
    "term": "किन्नु",
    "definition": "To buy",
    "verb_forms": {
      "Present": [
        { "term": "किन्छ", "transliteration": "kincha" },
        { "term": "किन्छे", "transliteration": "kinche" }
      ],
      "Past": [
        { "term": "किन्यो", "transliteration": "kinyo" },
        { "term": "किने", "transliteration": "kine" }
      ]
    }
  }
]
```


