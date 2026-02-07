# Identify Feature — Phased Rollout

This document describes when and how the **Identify** grammar activity is introduced across units. The core principle:

> **Identify should never ask something the grammar hasn’t revealed yet.**  
> If the sentence doesn’t encode the information, the question feels unfair, confusing, or “guessy.” If it does, Identify teaches learners to read grammar as meaning, not just rules.

---

## Why phased?

Identify questions fall into three buckets:

1. **Social relationship / respect**
2. **Time (tense / aspect)**
3. **Place / situation**

Each requires specific grammar signals. If those signals aren’t taught yet, the feature becomes guessy or unfair. So the right question is:

**“Which identify dimensions are grammatically detectable at each stage?”**

---

## Units 1–3: No Identify

**Do not introduce Identify here.**

- No tense contrast
- No questions yet
- Respect forms aren’t introduced explicitly
- Learners don’t yet know what they’re supposed to be noticing

At this stage, grammar is still mechanical, not interpretive.

**Implementation:** Identify activity is omitted from the pathway for Units 1, 2, and 3.

---

## Unit 4 — Questions: Introduce Identify (very limited)

Earliest safe entry point.

**Allowed Identify prompts:**

- **“What is being talked about?”**  
  - a person  
  - an object  
  - a place  
- **“Is this a statement or a question?”**
- **“Is this about now or a general fact?”** (soft intro)

**Why this works:** Learners now understand sentence intent. You’re training attention, not inference.

**Do NOT ask about:** age, respect, or time depth yet.

---

## Unit 5 — Plural & agreement: Expand Identify (quantity & group)

**New Identify prompts:**

- “Is this about one person or many?”
- “How many things are being talked about?”
- “Is the speaker talking about a group?”

Low-risk, high-confidence identifications.

---

## Unit 6 — Location: Add “where” Identify

**Identify prompts:**

- “Where is this happening?”
- “Is the location known or unknown?”
- “Is this inside, on, under, or general?”

Pairs well with existence sentences, e.g. **किताब टेबलमा छ** (The book is on the table).

---

## Unit 7 — Past tense: Time-based Identify (big unlock)

**Identify prompts:**

- **“When did this happen?”**  
  - now  
  - already happened  
  - not happened yet  

Relative time awareness; no need for exact timelines.

Examples like “recently,” “a long time ago,” “now,” “it did not happen yet” become fair questions here.

---

## Unit 8 — Future / intention: Full Identify (time + intent)

**Identify prompts:**

- Distinguish **past / present / future**
- “Is this planned or completed?”
- “Did this already happen, or is it going to happen?”

---

## Social / respect-based Identify

**Special handling.** Introduce only when **तिमी / तपाईं** and **हौ / हुनुहुन्छ** are explicitly taught (likely after Unit 4 or 5, as its own mini-unit or unlock).

**Safe prompts:**

- “Is the speaker talking to someone respectfully?”
- “Is the speaker talking to a friend or elder?”

**Avoid until honorifics are explicit:**

- Guessing age
- Guessing status

---

## Implementation reference

| Location | What’s there |
|----------|----------------|
| `src/data/grammarPathwayData.js` | Top-of-file comment summarizing this rollout; Identify omitted from Units 1–3 `activities` arrays. |
| `src/components/IdentifyGrammar.js` | Top-of-file comment referencing this doc and phased content by unit. |
| `docs/IDENTIFY_PHASED_ROLLOUT.md` | This reference document. |

When adding Unit 4 (and later units), add the `identify_grammar` activity to that unit’s `activities` array and implement the corresponding exercise bank in `IdentifyGrammar.js` using the prompts above.
