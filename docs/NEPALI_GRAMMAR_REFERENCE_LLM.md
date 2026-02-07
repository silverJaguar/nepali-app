# Nepali Grammar Reference (for LLM / Cursor use)

**Purpose**: This document is a *grammar-correctness reference*, not a teaching guide. It preserves **all core Nepali grammar rules**, while explicitly marking **frequency, naturalness, and spoken vs. formal usage** so generated output does not drift into rare, stiff, or Hindi-influenced forms.

**Legend**

* ✅ = high-frequency / default / safe
* ⚠️ = grammatical but limited, formal, or context-dependent
* ❌ = avoid unless explicitly required

---

## 1. Morphology: Nouns

### Gender

* Nepali has an **attenuated gender system**.
* Gender marking is **primarily relevant for female animates**.

**Patterns**:

* Masculine/neutral: **-o** (default citation form) ✅
* Feminine animate: **-ī** ⚠️
* Feminine derivation: **-nī** ⚠️ (lexical, not productive)

**Key constraint**:

* Inanimate nouns and most animates are **not overtly gender-marked** ✅
* Agreement with gender is **optional or loose**, especially in speech ✅

❌ Do NOT force feminine agreement on adjectives or verbs unless the noun is a clearly female animate *and* the register is careful/formal.

---

### Number (Plural)

* Singular is unmarked ✅
* Plural suffix: **-harū** ⚠️

**Usage rules**:

* Plural marking is **optional** when plurality is clear from context, numerals, or agreement ✅
* **-harū** often implies "and others / group" rather than simple plurality ⚠️

❌ Do NOT pluralize every noun English-style.

---

## 2. Adjectives

### Types

#### Declinable adjectives

* End in **-o** (neutral/masculine), **-ī** (feminine), **-ā** (plural)
* Citation form: **-o** ✅

**Important constraint**:

* Agreement is **mostly restricted to female animates**
* Masculine/neutral **-o** is the default in most contexts, including speech ✅

⚠️ Feminine adjective agreement outside female animates is **formal, stylistic, or Hindi-influenced**.

#### Indeclinable adjectives

* Do not change form
* Very common in everyday Nepali ✅

---

## 3. Postpositions (Case System)

Nepali uses **postpositions**, not prepositions.

### Core high-frequency postpositions

* **ko / kī / kā** – genitive (agrees with possessed noun) ✅
* **lāī** – indirect object; definite direct object ✅
* **le** – instrumental; ergative in perfective transitive clauses ✅
* **mā** – locative (in/at/on) ✅
* **bhandā** – comparative / ablative ✅

### Other common postpositions

* tala, muni, dekhi, bāṭa, sãga, sita, pachi, samma, bittikai ⚠️

### Compound postpositions

* Structure: **(ko / bhandā) + adverb**
* Examples: ko lāgi, ko pachāṛī, bhandā māthi ⚠️

---

## 4. Pronouns

### Core properties

* No gender distinction ✅
* Strong sociolinguistic stratification: **low / middle / high** ✅

### First person

* Singular: **ma** ✅
* Plural: **hāmī** (also used for emphasis) ✅

### Second person

* **tã** – low (intimate, rude if misused) ⚠️
* **timī** – neutral/default ✅
* **tapāī̃** – honorific/formal ✅

### Third person

* Demonstrative origin (proximal vs. distal)
* Plural often marked with **-harū** ⚠️

### Oblique forms

* Required before postpositions
* Exception: **-sãga** does NOT require oblique form ⚠️

---

## 5. Verbs

### Agreement

Verbs agree with:

* Person
* Number
* Honorific level
* (Limited) gender

⚠️ Gender agreement is **mostly relevant in third person feminine forms**.

---

### The verb **hunu** (“to be / become”)

Three present-tense systems:

1. **ho** – definitional / equational (X is Y) ✅
2. **cha** – descriptive / locational ✅
3. **huncha** – habitual, future, becoming ✅

Past stems:

* **thi-** → ho / cha system
* **bha-** → huncha system; participles

⚠️ Correct selection of these systems is crucial; misuse is a common LLM error.

---

### Regular verb conjugation (example: garnu)

All standard finite categories exist:

* Present/Future
* Probable future
* Simple past
* Past habitual
* Injunctive
* Imperative

⚠️ **Priority rule**:

* Present/Future + Simple Past are most frequent ✅
* Probable future and injunctive are context-specific ⚠️

---

### Participial forms

* **-eko** (perfective participle)
* **-ne** (non-past / relative / future participle)

Usage:

* Extremely common in spoken Nepali ✅
* Used in periphrastic tenses with **hunu**

⚠️ Overuse by non-native speakers sounds stiff. Use when syntactically motivated.

---

## 6. Infinitives

### Nu-infinitive (-nu)

* Citation form of verb
* Used in obligation constructions with **parnu** ✅
* Used with postpositions (e.g., aghi)

### Na-infinitive (-na)

* Purpose, intention, complement clauses ✅
* Rough English equivalent of "to VERB"

---

## 7. Ergative Alignment (Critical Constraint)

* In **perfective transitive clauses**, the subject takes **-le**
* Verb agreement aligns with the object, not the agent

⚠️ This rule is essential and frequently mishandled by generators.

---

## 8. Register & Naturalness Rules (Global)

* Neutral/middle honorific forms are safest by default ✅
* Masculine/neutral adjective and verb forms are default ✅
* Avoid unnecessary gender marking ❌
* Avoid over-pluralization ❌
* Prefer simple finite verbs over stacked participles unless required

---

## 9. Safe Defaults for Generation

If uncertain:

* Use **timī** level
* Use **neutral -o** forms
* Use **singular nouns unless plurality is explicit**
* Use **cha / garcha** present system

These defaults minimize unnatural output while remaining grammatically valid.
