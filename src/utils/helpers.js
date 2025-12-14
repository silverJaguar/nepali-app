// Common utility functions used across the app

export function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getUnitNumber(unitName) {
  const unitMap = {
    'Greetings & Basic Expressions': 1,
    'People & Family': 1,
    'Food & Dining': 1,
    'Numbers, Time & Money': 1,
    'Travel & Directions': 2,
    'Health & Body': 2,
    'Jobs & Workplace': 2,
    'Days, Months & Calendar Words': 2,
    'Clothing & Appearance': 2,
    'Postpositions': 2,
    'Copulas': 2,
    'Music & Activities': 2,
    'Senses': 2
  };
  return unitMap[unitName] || 1;
}

export function isValidVerbObjectPair(verb, object) {
  const verbSemanticType = verb.semantic_type || '';
  const objectCategory = object.category || '';
  const objectSemanticType = object.semantic_type || '';
  const objectAnimacy = object.animacy || '';
  const verbRequiresObjectType = verb.requires_object_type || [];
  
  // Category hierarchy: family_member is a subset of person
  const isFamilyMember = objectCategory === 'family_member';
  const isPerson = objectCategory === 'person' || isFamilyMember;
  const isAnimate = objectAnimacy === 'animate' || isPerson;
  
  // Check verb-specific object requirements first
  if (verbRequiresObjectType.length > 0) {
    const objectMatches = verbRequiresObjectType.some(requiredType => 
      objectCategory === requiredType || objectSemanticType === requiredType
    );
    if (!objectMatches) {
      return false;
    }
  }
  
  // FAMILY MEMBER PROTECTION - strictest rules
  if (isFamilyMember) {
    // Family members can only be objects for perception verbs
    const allowedForFamily = ['see_action', 'hear_action'];
    if (!allowedForFamily.includes(verbSemanticType)) {
      return false;
    }
  }
  
  // GENERAL PERSON PROTECTION
  if (isPerson && !isFamilyMember) {
    // Non-family people can be objects for perception and helping verbs
    const allowedForPeople = ['see_action', 'hear_action', 'help_action'];
    if (!allowedForPeople.includes(verbSemanticType)) {
      return false;
    }
  }
  
  // CONSUMPTION VERB RULES (eat, drink)
  if (['eat_action', 'drink_action'].includes(verbSemanticType)) {
    // Block all animate objects
    if (isAnimate) {
      return false;
    }
    // Only allow food-related categories
    const foodCategories = ['food', 'liquid', 'solid'];
    return foodCategories.includes(objectCategory);
  }
  
  // EMOTION VERB RULES (feel)
  if (verbSemanticType === 'feel_action') {
    // Block people/family - already handled above
    // Only allow emotions and abstract feelings/sensations
    // Do NOT allow physical body objects (body, skin, etc.) - only emotions and sensations
    const emotionCategories = ['emotion', 'health'];
    // Also check semantic_type for sensations (pain, cold, heat, etc.)
    const isSensation = objectSemanticType === 'sensation' || objectSemanticType === 'emotion';
    // Block physical body parts/categories
    if (objectCategory === 'body' || objectCategory === 'body_part') {
      return false;
    }
    return emotionCategories.includes(objectCategory) || isSensation;
  }
  
  // PERCEPTION VERB RULES (see, hear)
  if (['see_action', 'hear_action'].includes(verbSemanticType)) {
    // Can see/hear most physical things, but not abstract concepts
    const blockedForPerception = ['concept', 'time', 'currency', 'number'];
    return !blockedForPerception.includes(objectCategory);
  }
  
  // MUSIC/PERFORMANCE VERB RULES (sing, play instrument, dance)
  if (['song_action', 'play_instrument_action', 'dance_action'].includes(verbSemanticType)) {
    const musicCategories = ['music', 'instrument'];
    return musicCategories.includes(objectCategory);
  }
  
  // MOVEMENT VERB RULES (go, come)
  if (['go_action', 'come_action'].includes(verbSemanticType)) {
    const placeCategories = ['place', 'accommodation'];
    return placeCategories.includes(objectCategory);
  }
  
  // BUYING VERB RULES
  if (verbSemanticType === 'buy_action') {
    // Can buy physical items but not people or abstract concepts
    if (isAnimate) {
      return false;
    }
    const buyableCategories = ['item', 'food', 'liquid', 'clothing', 'instrument'];
    return buyableCategories.includes(objectCategory);
  }
  
  // GENERAL WORK/DO VERB RULES
  if (verbSemanticType === 'do_action') {
    const workCategories = ['work'];
    return workCategories.includes(objectCategory);
  }
  
  // BLOCK ABSTRACT CONCEPTS FOR MOST ACTION VERBS
  const abstractCategories = ['concept', 'time', 'currency', 'number'];
  if (abstractCategories.includes(objectCategory)) {
    return false;
  }
  
  // BLOCK ANIMATE OBJECTS BY DEFAULT (unless allowed above)
  if (isAnimate) {
    return false;
  }
  
  // Allow most other combinations
  return true;
}

// Generate possessive construction for body parts
export function generatePossessiveConstruction(noun, possessor) {
  if (!noun.requires_possession) {
    return noun.term; // Return noun as-is if no possession required
  }
  
  // For now, use simple possessive construction
  // In a full implementation, this would handle different possessive markers
  // based on the possessor's properties (gender, number, etc.)
  return `${possessor.term}को ${noun.term}`;
}

// Generate genitive construction for time-of-day nouns
export function generateGenitiveConstruction(noun, relatedNoun) {
  if (!noun.requires_genitive_link) {
    return noun.term; // Return noun as-is if no genitive required
  }
  
  // Generate genitive construction like "बिहानको कक्षा"
  return `${noun.term}को ${relatedNoun.term}`;
}

// Select appropriate copula based on subject gender and number
export function selectCopulaByGender(subject, availableCopulas) {
  if (!subject || !availableCopulas || availableCopulas.length === 0) {
    return availableCopulas[0]; // Fallback to first available
  }
  
  // For now, use basic gender agreement logic
  // In a full implementation, this would handle:
  // - Masculine vs feminine subjects
  // - Singular vs plural subjects
  // - Honorific vs non-honorific subjects
  
  const subjectGender = subject.gender;
  const subjectAnimacy = subject.animacy;
  
  // If subject is animate and has gender, prefer appropriate copula
  if (subjectAnimacy === 'animate' && subjectGender) {
    // For now, use the standard copula
    // Future enhancement: select masculine/feminine copula variants
    return availableCopulas.find(copula => copula.copula_type) || availableCopulas[0];
  }
  
  // Default selection
  return availableCopulas[0];
}

// Check if an adjective can be used with a specific subject
export function isValidAdjectiveSubjectPair(adjective, subject) {
  const adjCategory = adjective.category || '';
  const adjSemanticType = adjective.semantic_type || '';
  const subjectCategory = subject.category || '';
  const subjectAnimacy = subject.animacy || '';
  
  // Category hierarchy: family_member is a subset of person
  const isFamilyMember = subjectCategory === 'family_member';
  const isPerson = subjectCategory === 'person' || isFamilyMember;
  const isAnimate = subjectAnimacy === 'animate' || isPerson;
  
  // TASTE/SWEET adjectives - only for food/liquid items
  if (adjCategory === 'taste' || adjSemanticType === 'taste_quality') {
    const foodCategories = ['food', 'liquid', 'solid'];
    return foodCategories.includes(subjectCategory);
  }
  
  // PRICE adjectives - only for items that can have prices
  if (adjCategory === 'price' || adjSemanticType === 'price_quality') {
    const buyableCategories = ['item', 'food', 'liquid', 'clothing', 'instrument', 'thing'];
    return buyableCategories.includes(subjectCategory);
  }
  
  // EMOTION adjectives - only for people/animate beings
  if (adjCategory === 'emotion' || adjSemanticType === 'emotional_state') {
    return isAnimate;
  }
  
  // SIZE adjectives - can apply to most physical objects
  if (adjCategory === 'size' || adjSemanticType === 'size_quality') {
    const sizeApplicableCategories = ['item', 'food', 'liquid', 'clothing', 'instrument', 'thing', 'person', 'family_member', 'place', 'accommodation'];
    return sizeApplicableCategories.includes(subjectCategory);
  }
  
  // BEAUTY/QUALITY adjectives - can apply to people and some objects
  if (adjCategory === 'beauty' || adjCategory === 'quality' || adjSemanticType === 'beauty_quality') {
    const beautyApplicableCategories = ['person', 'family_member', 'item', 'clothing', 'place', 'accommodation'];
    return beautyApplicableCategories.includes(subjectCategory);
  }
  
  // COLOR adjectives - can apply to most physical objects
  if (adjCategory === 'color' || adjSemanticType === 'color_quality') {
    const colorApplicableCategories = ['item', 'food', 'liquid', 'clothing', 'instrument', 'thing', 'person', 'family_member', 'place', 'accommodation'];
    return colorApplicableCategories.includes(subjectCategory);
  }
  
  // BLOCK ABSTRACT CONCEPTS FOR MOST ADJECTIVES
  const abstractCategories = ['concept', 'time', 'currency', 'number', 'emotion'];
  if (abstractCategories.includes(subjectCategory)) {
    return false;
  }
  
  // BLOCK ANIMATE OBJECTS FOR MOST ADJECTIVES (unless explicitly allowed above)
  if (isAnimate && !['beauty', 'quality', 'size', 'color'].includes(adjCategory)) {
    return false;
  }
  
  // Allow most other combinations
  return true;
}

// Filter out words that have visible_in_vocab set to false
export function filterVisibleVocabulary(flashcards) {
  return flashcards.filter(word => {
    const isHidden = word.visible_in_vocab === false;

    if (isHidden) {
      console.log(`[DEBUG] Filtering out hidden word: ${word.term}`);
      return false;
    }

    return true;
  });
}
