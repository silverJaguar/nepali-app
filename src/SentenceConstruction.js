import React, { useState, useEffect } from 'react';
import lessons from './lessons.json';
import sentenceTemplates from './sentence_templates.json';
import { FiVolume2, FiRotateCw, FiCheck, FiX } from 'react-icons/fi';
import { useVoiceManager } from './hooks/useVoiceManager';
import { getUnitNumber, isValidVerbObjectPair, isValidAdjectiveSubjectPair, generatePossessiveConstruction, generateGenitiveConstruction, selectCopulaByGender } from './utils/helpers';
import { buildEnglishObjectPhrase, buildEnglishSubjectPhrase, getEnglishArticle } from './utils/postpositionMapper';
import { filterSafeExercises, checkContentSafety } from './utils/contentFilter';
import WordVariantDropdown from './components/WordVariantDropdown';

const SentenceConstruction = ({ currentUnit, onComplete }) => {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [selectedWords, setSelectedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [userProgress, setUserProgress] = useState({}); // Track completed units
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({}); // Track selected variants: { wordTerm: variantTerm }
  const { speakText } = useVoiceManager();

  // DEV: Use all vocabulary for now for testing, but filter negation in Unit 1
  const getAvailableVocabulary = (currentUnit = 1) => {
    // Get all vocabulary from lessons.json
    // lessons.json structure: { "Unit Name": [{ "title": "...", "flashcards": [...] }] }
    const allVocabulary = Object.values(lessons).flatMap(unitLessons => 
      unitLessons.flatMap(lesson => lesson.flashcards)
    );
    
    // Apply content filtering to vocabulary
    const safeVocabulary = allVocabulary.filter(word => {
      const safetyCheck = checkContentSafety(word.term || '');
      if (safetyCheck.isNSFW) {
        console.log(`[CONTENT FILTER] Blocked vocabulary word: "${word.term}" - ${safetyCheck.reason}`);
        return false;
      }
      
      // Also check definitions and glosses
      const definitionCheck = checkContentSafety(word.definition || word.gloss || '');
      if (definitionCheck.isNSFW) {
        console.log(`[CONTENT FILTER] Blocked vocabulary word due to definition: "${word.term}" - ${definitionCheck.reason}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`[DEBUG] Content filtering: ${allVocabulary.length} → ${safeVocabulary.length} vocabulary words`);
    
    // DEBUG: Show all verbs before filtering
    const allVerbs = allVocabulary.filter(v => v.part_of_speech === 'verb');
    console.log('[DEBUG] All verbs in lessons.json:', allVerbs.map(v => v.term));
    
    // Filter vocabulary based on current unit
    let filteredVocabulary = safeVocabulary;
    
    // For Units 1 and 2, filter out negation verbs (Unit 3 will include them)
    if (currentUnit === 1 || currentUnit === 2) {
      filteredVocabulary = safeVocabulary.filter(word => {
        // Filter out words that should not appear in Unit 1
        if (word.unit_min && word.unit_min > currentUnit) {
          console.log(`[DEBUG] Filtering out word ${word.term} (unit_min: ${word.unit_min} > currentUnit: ${currentUnit})`);
          return false;
          // unit_min is the minimum unit that the word should appear in
        }
        
        // Filter out words explicitly hidden from vocabulary
        if (word.visible_in_vocab === false) {
          console.log(`[DEBUG] Filtering out hidden word: ${word.term}`);
          return false;
        }
        
        // Filter out negation verbs for Units 1 and 2
        if (word.part_of_speech === 'verb') {
          const term = word.term || '';
          const isNegation = term.includes('दैन') || term.includes('छैन') || term.includes('होइन') || term.includes('हैन') || term.includes('हुँदैन');
          const hasNegativeProperty = word.can_be && word.can_be.some(type => type.includes('negative') || type.includes('verb_negative'));
          
          // Only filter out if it's explicitly a negative verb
          if (isNegation || hasNegativeProperty) {
            console.log(`[DEBUG] Filtering out negation verb: ${term} (isNegation: ${isNegation}, hasNegativeProperty: ${hasNegativeProperty})`);
            return false;
          }
        }
        return true;
      });
    }
    
    // DEBUG: Show verbs after unit filtering
    const filteredVerbs = filteredVocabulary.filter(v => v.part_of_speech === 'verb');
    console.log('[DEBUG] Verbs after unit filtering:', filteredVerbs.map(v => v.term));
    
    // DEV: Use all vocabulary for now for testing
    // filteredVocabulary = safeVocabulary;
    
    return filteredVocabulary;
  };



  // --- FUTURE: Restrict vocabulary to what the user has learned ---
  // const getAvailableVocabulary = (userProgress) => {
  //   const vocabulary = [];
  //   Object.entries(lessons).forEach(([unitName, unitLessons]) => {
  //     if (unitName === 'sentence_templates') return;
  //     // Only include units/lessons the user has completed
  //     if (!userProgress[unitName]) return;
  //     unitLessons.forEach(lesson => {
  //       if (!userProgress[unitName].includes(lesson.title)) return;
  //       lesson.flashcards.forEach(card => {
  //         vocabulary.push({
  //           ...card,
  //           unit: unitName,
  //           lesson: lesson.title
  //         });
  //       });
  //     });
  //   });
  //   return vocabulary;
  // };

  // Helper to get templates for the current unit (add 'unit' property to templates for more control)
  const getTemplatesForCurrentUnit = (currentUnit) => {
    return sentenceTemplates.filter(tmpl => tmpl.unit === currentUnit);
  };

  const generateExercises = (currentUnit) => {
    const vocabulary = getAvailableVocabulary(currentUnit); // Filter by unit
    
    // DEBUG: Show all verbs in vocabulary
    const allVerbs = vocabulary.filter(v => v.part_of_speech === 'verb');
    console.log('[DEBUG] All verbs in vocabulary:', allVerbs.map(v => v.term));
    
    // Group vocabulary by part of speech
    const filteredParts = {};
    vocabulary.forEach(word => {
      if (!filteredParts[word.part_of_speech]) {
        filteredParts[word.part_of_speech] = [];
      }
      filteredParts[word.part_of_speech].push(word);
    });
    
    // DEBUG: Show verbs after grouping
    console.log('[DEBUG] Verbs after grouping:', filteredParts['verb']?.map(v => v.term) || []);
    
    const templates = getTemplatesForCurrentUnit(currentUnit);
    
    // Debug logging
    console.log('[DEBUG] getTemplatesForCurrentUnit returned:', templates);
    console.log('[DEBUG] Current unit:', currentUnit);
    
    // Safety check for undefined templates
    if (!templates || !Array.isArray(templates)) {
      console.error('[ERROR] Templates is undefined or not an array for unit:', currentUnit);
      return [];
    }
    
    // Additional safety check for empty templates
    if (templates.length === 0) {
      console.error('[ERROR] No templates found for unit:', currentUnit);
      return [];
    }
    
    // Determine target exercise count based on number of templates
    let targetExercises, maxExercises;
    if (templates.length < 3) {
      // Units with fewer templates: 10-12 exercises total
      targetExercises = 10;
      maxExercises = 12;
    } else {
      // Units with 3+ templates: 11-15 exercises total  
      targetExercises = 11;
      maxExercises = 15;
    }
    
    console.log(`[DEBUG] Unit ${currentUnit} has ${templates.length} templates, targeting ${targetExercises}-${maxExercises} exercises`);
    
    // Find the 'सङ्ग' postposition in the vocabulary
    const sangaWord = vocabulary.find(w => w.term === 'सङ्ग');
    // Find ergative marker
    const leErgative = vocabulary.find(w => w.term === 'ले' && w.can_be && w.can_be.includes('ergative_marker'));
    // Find copulas by type
    const hoCopula = vocabulary.find(w => w.term === 'हो' && w.copula_type === 'identity');
    const chanCopula = vocabulary.find(w => w.term === 'छन्');
    const chhinCopula = vocabulary.find(w => w.term === 'छिन्');
    const hunuhunchhaCopula = vocabulary.find(w => w.term === 'हुनुहुन्छ');
    const chaCopula = vocabulary.find(w => w.term === 'छ' && w.copula_type === 'existence');
    const modalCopula = vocabulary.find(w => w.term === 'हुन्छ' && w.copula_type === 'modal');
    let exercises = [];
    // Get sentence templates from lessons.json
    const shuffledTemplates = templates.slice().sort(() => Math.random() - 0.5);
    // Generate more exercises per template, then shuffle all
    for (const template of shuffledTemplates) {
      let filteredParts = {};
      let skipTemplate = false;
      template.required_parts.forEach(part => {
        if (template.type === 'possession') {
          if (part === 'possessor') {
            filteredParts[part] = vocabulary.filter(w => w.animacy === 'animate');
          } else if (part === 'object') {
            filteredParts[part] = vocabulary.filter(w => w.possessable === true);
          } else if (part === 'copula') {
            filteredParts[part] = vocabulary.filter(w => w.verb_type === 'copula');
          } else if (part === 'possession_postposition') {
            filteredParts[part] = [sangaWord].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'action') {
          if (part === 'verb') {
            filteredParts[part] = vocabulary.filter(word => {
              if (word.verb_type !== 'action') return false;
              // Block infinitive verbs (ending with नु) - sentences must use finite forms
              // Exception: "हुनुहुन्छ" is a copula, not an infinitive verb
              const term = word.term || '';
              const isInfinitive = term.endsWith('नु') && !term.includes('हुन्छ');
              return !isInfinitive;
            });
          } else if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject') && (word.animacy === 'animate' || word.category === 'person' || word.category === 'family_member'));
          } else if (part === 'object') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('object'));
          } else if (part === 'ergative_marker') {
            filteredParts[part] = leErgative ? [leErgative] : [];
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'identity_noun') {
          if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          } else if (part === 'identity_noun') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('identity_noun'));
          } else if (part === 'identity_copula') {
            filteredParts[part] = [hoCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'identity_adj') {
          if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          } else if (part === 'adjective') {
            // Filter adjectives based on semantic compatibility with subjects
            const subjects = filteredParts['subject'] || [];
            if (subjects.length > 0) {
              const allAdjectives = vocabulary.filter(word => word.part_of_speech === 'adjective');
              filteredParts[part] = allAdjectives.filter(adj => {
                // Check if this adjective can be used with at least one subject
                return subjects.some(subject => isValidAdjectiveSubjectPair(adj, subject));
              });
            } else {
              // Fallback if no subjects yet
              filteredParts[part] = vocabulary.filter(word => word.part_of_speech === 'adjective');
            }
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'identity_location') {
          if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          } else if (part === 'location_phrase') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('object'));
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'existence') {
          if (part === 'object') {
            // For simple existence, only allow inanimate objects and plants
            // Filter out animate nouns (people and animals)
            filteredParts[part] = vocabulary.filter(word => {
              if (!word.can_be || !word.can_be.includes('object')) return false;
              // Exclude animate nouns
              const isPerson = word.category === 'person' || word.category === 'family_member';
              const isAnimate = word.animacy === 'animate' || isPerson;
              // Also check if it's an animal category if that exists
              const isAnimal = word.category === 'animal';
              // Block body-whole nouns (grammatically correct but semantically disturbing)
              const bodyWholeTerms = ['शरीर', 'छाल', 'रगत', 'हड्डी']; // body, skin, blood, bone
              const isBodyWhole = bodyWholeTerms.includes(word.term);
              // Block numbers (pedagogically weird - "seven exists" doesn't make sense)
              const isNumber = word.category === 'number';
              return !isAnimate && !isAnimal && !isBodyWhole && !isNumber;
            });
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'existence_animate') {
          if (part === 'animate_object') {
            // Only allow animate nouns (people and animals)
            filteredParts[part] = vocabulary.filter(word => {
              if (!word.can_be || !word.can_be.includes('object')) return false;
              const isPerson = word.category === 'person' || word.category === 'family_member';
              const isAnimate = word.animacy === 'animate' || isPerson;
              const isAnimal = word.category === 'animal';
              return isAnimate || isAnimal;
            });
          } else if (part === 'location_word') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('location_word'));
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else {
          filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
        }
        
        // Skip template if any required part has no available words
        if (filteredParts[part].length === 0) {
          skipTemplate = true;
        }
      });
      
      if (skipTemplate) continue;
      
      // Additional filtering to prevent weird combinations
      if (template.type === 'action' && filteredParts.verb && filteredParts.object) {
        // Filter out verbs that don't make sense with certain objects
        const validVerbObjectPairs = [];
        
        for (const verb of filteredParts.verb) {
          for (const object of filteredParts.object) {
            // Check if this verb-object combination makes sense
            if (isValidVerbObjectPair(verb, object)) {
              validVerbObjectPairs.push({ verb, object });
            }
          }
        }
        
        // If no valid combinations found, skip this template
        if (validVerbObjectPairs.length === 0) {
          continue;
        }
      }
      
      // Generate exercises for this template
      const templateExercises = generateExercisesForTemplate(template, filteredParts, currentUnit);
      exercises.push(...templateExercises);
      
      // Stop when we have enough exercises
      if (exercises.length >= maxExercises) {
        break;
      }
    }
    
    // Ensure balanced distribution for Unit 1 (which has 5 sentence types)
    let finalExercises = exercises;
    if (currentUnit === 1 && templates.length >= 5) {
      // Group exercises by type
      const exercisesByType = {};
      exercises.forEach(ex => {
        if (!exercisesByType[ex.template.type]) {
          exercisesByType[ex.template.type] = [];
        }
        exercisesByType[ex.template.type].push(ex);
      });
      
      console.log('[DEBUG] Exercises by type:', Object.keys(exercisesByType).map(type => 
        `${type}: ${exercisesByType[type].length}`
      ));
      
      // Ensure at least 2 of each type
      finalExercises = [];
      Object.keys(exercisesByType).forEach(type => {
        const typeExercises = exercisesByType[type];
        // Take at least 2, up to 3 of each type
        const count = Math.min(Math.max(2, typeExercises.length), 3);
        finalExercises.push(...typeExercises.slice(0, count));
      });
      
      console.log(`[DEBUG] After balancing: ${finalExercises.length} exercises for Unit 1`);
    }
    
    // If we don't have enough exercises, try to generate more with relaxed filtering
    if (finalExercises.length < targetExercises) {
      console.log(`[DEBUG] Only generated ${finalExercises.length} exercises, need at least ${targetExercises}. Trying relaxed generation...`);
      
      // Try generating more exercises with relaxed filtering
      for (const template of templates) {
        if (finalExercises.length >= targetExercises) break;
        
        const additionalExercises = generateExercisesForTemplate(template, filteredParts, currentUnit);
        finalExercises.push(...additionalExercises);
        console.log(`[DEBUG] Added ${additionalExercises.length} more exercises from ${template.type}`);
      }
    }
    
    // Apply content filtering to remove inappropriate exercises
    const safeExercises = filterSafeExercises(finalExercises);
    console.log(`[DEBUG] Content filtering: ${finalExercises.length} → ${safeExercises.length} exercises`);
    
    // Cap at max exercises and shuffle
    const finalSafeExercises = safeExercises.slice(0, maxExercises).sort(() => Math.random() - 0.5);
    console.log(`[DEBUG] Final result: ${finalSafeExercises.length} safe exercises for Unit ${currentUnit}`);
    return finalSafeExercises;
  };



  // Helper to generate exercises for a single template
  const generateExercisesForTemplate = (template, filteredParts, currentUnit) => {
    const vocabulary = getAvailableVocabulary(currentUnit); // For now, all vocab
    const templates = getTemplatesForCurrentUnit(currentUnit); // Get templates for fallback
    
    // Safety check for template
    if (!template) {
      console.error('[ERROR] Template is undefined');
      return [];
    }
    
    // Safety check for filteredParts
    if (!filteredParts) {
      console.error('[ERROR] filteredParts is undefined');
      return [];
    }
    
    // Determine exercises per template based on total templates
    let exercisesPerTemplate;
    if (templates.length < 3) {
      // Units with fewer templates: generate more per template (4-8)
      exercisesPerTemplate = 8;
    } else {
      // Units with 3+ templates: standard amount (4-5)
      exercisesPerTemplate = 5;
    }
    
    console.log(`[DEBUG] Generating ${exercisesPerTemplate} exercises for template ${template.type} in Unit ${currentUnit}`);
    
    // Find the 'सङ्ग' postposition in the vocabulary
    const sangaWord = vocabulary.find(w => w.term === 'सङ्ग');
    // Find ergative marker
    const leErgative = vocabulary.find(w => w.term === 'ले' && w.can_be && w.can_be.includes('ergative_marker'));
    // Find copulas by type
    const hoCopula = vocabulary.find(w => w.term === 'हो' && w.copula_type === 'identity');
    const chanCopula = vocabulary.find(w => w.term === 'छन्');
    const chhinCopula = vocabulary.find(w => w.term === 'छिन्');
    const hunuhunchhaCopula = vocabulary.find(w => w.term === 'हुनुहुन्छ');
    const chaCopula = vocabulary.find(w => w.term === 'छ' && w.copula_type === 'existence');
    const modalCopula = vocabulary.find(w => w.term === 'हुन्छ' && w.copula_type === 'modal');
    let exercises = [];
    
    // Generate exercises for this single template
    {
      let filteredParts = {};
      let skipTemplate = false;
      template.required_parts.forEach(part => {
        // Handle special parts that apply to all templates
        if (part === 'copula_negative') {
          filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes('copula_negative'));
        } else if (part === 'identity_copula_negative') {
          filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes('identity_copula_negative'));
        } else if (part === 'verb_negative_present') {
          filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes('verb_negative_present'));
        } else if (part === 'ergative_marker') {
          filteredParts[part] = leErgative ? [leErgative] : [];
        } else if (part === 'possession_postposition') {
          filteredParts[part] = [sangaWord].filter(Boolean);
        } else if (template.type === 'possession') {
          if (part === 'possessor') {
            filteredParts[part] = vocabulary.filter(w => w.animacy === 'animate');
          } else if (part === 'object') {
            filteredParts[part] = vocabulary.filter(w => w.possessable === true);
          } else if (part === 'copula') {
            filteredParts[part] = vocabulary.filter(w => w.verb_type === 'copula');
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'action') {
          if (part === 'verb') {
            filteredParts[part] = vocabulary.filter(word => {
              if (word.verb_type !== 'action') return false;
              // Block infinitive verbs (ending with नु) - sentences must use finite forms
              // Exception: "हुनुहुन्छ" is a copula, not an infinitive verb
              const term = word.term || '';
              const isInfinitive = term.endsWith('नु') && !term.includes('हुन्छ');
              return !isInfinitive;
            });
          } else if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject') && (word.animacy === 'animate' || word.category === 'person' || word.category === 'family_member'));
          } else if (part === 'object') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('object'));
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'identity_noun') {
          if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          } else if (part === 'identity_noun') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('identity_noun'));
          } else if (part === 'identity_copula') {
            filteredParts[part] = [hoCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'identity_adj') {
          if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          } else if (part === 'adjective') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('modifier'));
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'identity_location') {
          if (part === 'subject') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          } else if (part === 'location_phrase') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('location_phrase'));
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'existence') {
          if (part === 'object') {
            // For simple existence, only allow inanimate objects and plants
            // Filter out animate nouns (people and animals)
            filteredParts[part] = vocabulary.filter(word => {
              if (!word.can_be || !word.can_be.includes('object')) return false;
              // Exclude animate nouns
              const isPerson = word.category === 'person' || word.category === 'family_member';
              const isAnimate = word.animacy === 'animate' || isPerson;
              // Also check if it's an animal category if that exists
              const isAnimal = word.category === 'animal';
              // Block body-whole nouns (grammatically correct but semantically disturbing)
              const bodyWholeTerms = ['शरीर', 'छाल', 'रगत', 'हड्डी']; // body, skin, blood, bone
              const isBodyWhole = bodyWholeTerms.includes(word.term);
              // Block numbers (pedagogically weird - "seven exists" doesn't make sense)
              const isNumber = word.category === 'number';
              return !isAnimate && !isAnimal && !isBodyWhole && !isNumber;
            });
          } else if (part === 'copula') {
            filteredParts[part] = [chaCopula].filter(Boolean);
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (template.type === 'existence_animate') {
          if (part === 'animate_object') {
            // Only allow animate nouns (people and animals)
            filteredParts[part] = vocabulary.filter(word => {
              if (!word.can_be || !word.can_be.includes('object')) return false;
              const isPerson = word.category === 'person' || word.category === 'family_member';
              const isAnimate = word.animacy === 'animate' || isPerson;
              const isAnimal = word.category === 'animal';
              return isAnimate || isAnimal;
            });
          } else if (part === 'location_word') {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('location_word'));
          } else if (part === 'copula') {
            // Include all copulas that could be used: छ, छिन्, छन्, and optionally हुनुहुन्छ (Unit 2+)
            const copulaList = [chaCopula, chhinCopula, chanCopula].filter(Boolean);
            if (currentUnit > 1 && hunuhunchhaCopula) {
              copulaList.push(hunuhunchhaCopula);
            }
            filteredParts[part] = copulaList;
          } else {
            filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
          }
        } else if (part === 'verb') {
          filteredParts[part] = vocabulary.filter(word => word.verb_type === template.type);
        } else if (part === 'copula') {
          // handled above
        } else if (part === 'possessor') {
          filteredParts[part] = vocabulary.filter(word => (word.category === 'family_member' || word.category === 'person' || word.category === 'animate' || (word.can_be && word.can_be.includes('subject'))));
        } else if (part === 'subject') {
          if (template.type === 'action') {
            filteredParts[part] = vocabulary.filter(word => (word.category === 'family_member' || word.category === 'person' || word.category === 'animate' || (word.can_be && word.can_be.includes('subject'))));
          } else {
            filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
          }
        } else if (part === 'object') {
          filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('object'));
        } else {
          filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes(part));
        }
        if (!filteredParts[part] || filteredParts[part].length === 0) skipTemplate = true;
      });
      if (skipTemplate) {
        return []; // return empty array if template should be skipped
      }
      for (let i = 0; i < exercisesPerTemplate; i++) {
        let requiredWords = [];
        let valid = true;
        if (template.type === 'action') {
          console.log('[DEBUG] Action sentence generation:');
          const verbs = filteredParts['verb'];
          console.log('  All available verbs:', verbs ? verbs.map(v => v.term) : 'undefined');
          if (!verbs || verbs.length === 0) {
            console.log('  Skipping: No action verbs available');
            continue;
          }
          
          // Test each verb to see which ones have compatible objects
          console.log('  Testing verb-object compatibility:');
          const compatibleVerbs = [];
          for (const testVerb of verbs) {
            const compatibleObjects = filteredParts['object'].filter(o => isValidVerbObjectPair(testVerb, o));
            console.log(`    ${testVerb.term}: ${compatibleObjects.length} compatible objects`);
            if (compatibleObjects.length > 0) {
              compatibleVerbs.push(testVerb);
            }
          }
          console.log('  Verbs with compatible objects:', compatibleVerbs.map(v => v.term));
          
          if (compatibleVerbs.length === 0) {
            console.log('  Skipping: No verbs have compatible objects');
            continue;
          }
          
          const verb = compatibleVerbs[Math.floor(Math.random() * compatibleVerbs.length)];
          // DEBUG: Log available subjects
          const subjects = filteredParts['subject'].filter(s => {
            if (!verb.requires_subject) return true;
            return verb.requires_subject.includes(s.category) || verb.requires_subject.includes('animate');
          });
          console.log('  Subjects:', subjects);
          if (!subjects || subjects.length === 0) {
            console.log('  Skipping: No valid subjects for verb', verb.term);
            continue;
          }
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          // DEBUG: Log available objects
          const objects = filteredParts['object'].filter(o => {
            // Use the isValidVerbObjectPair function for proper semantic filtering
            return isValidVerbObjectPair(verb, o);
          });
          console.log('  Objects:', objects);
          if (!objects || objects.length === 0) {
            console.log('  Skipping: No valid objects for verb', verb.term);
            continue;
          }
          const object = objects[Math.floor(Math.random() * objects.length)];
          if (!leErgative) {
            console.log('  Skipping: No ergative marker (ले) in vocab');
            continue; // require 'ले' in vocab
          }
          console.log('  SUCCESS: Adding action sentence:', {subject, leErgative, object, verb});
          requiredWords = [subject, leErgative, object, verb];
        } else if (template.type === 'identity_noun') {
          // subject, identity_noun, ho
          const subjects = filteredParts['subject'];
          const nouns = filteredParts['identity_noun'];
          const copulas = filteredParts['identity_copula'];
          if (!subjects || !nouns || !copulas || subjects.length === 0 || nouns.length === 0 || copulas.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const noun = nouns[Math.floor(Math.random() * nouns.length)];
          const copula = copulas[0];
          requiredWords = [subject, noun, copula];
        } else if (template.type === 'identity_adj') {
          // subject, adjective, copula (choose correct copula)
          const subjects = filteredParts['subject'];
          const adjs = filteredParts['adjective'];
          const copulas = filteredParts['copula'];
          if (!subjects || !adjs || !copulas || subjects.length === 0 || adjs.length === 0 || copulas.length === 0) continue;
          
          // Pick a subject first, then filter adjectives that work with it
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const compatibleAdjs = adjs.filter(adj => isValidAdjectiveSubjectPair(adj, subject));
          
          if (compatibleAdjs.length === 0) continue; // Skip if no compatible adjectives
          
          const adj = compatibleAdjs[Math.floor(Math.random() * compatibleAdjs.length)];
          // Pick copula based on subject (honorific/plural/gender)
          let availableCopulas = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
          let copula = selectCopulaByGender(subject, availableCopulas);
          if (subject.honorific) copula = hunuhunchhaCopula;
          else if (subject.plural) copula = chanCopula;
          requiredWords = [subject, adj, copula];
        } else if (template.type === 'identity_location') {
          // subject, location_phrase, copula (choose correct copula)
          const subjects = filteredParts['subject'];
          const locs = filteredParts['location_phrase'];
          const copulas = filteredParts['copula'];
          if (!subjects || !locs || !copulas || subjects.length === 0 || locs.length === 0 || copulas.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const loc = locs[Math.floor(Math.random() * locs.length)];
          // Pick copula based on subject (honorific/plural/gender)
          let availableCopulas = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
          let copula = selectCopulaByGender(subject, availableCopulas);
          if (subject.honorific) copula = hunuhunchhaCopula;
          else if (subject.plural) copula = chanCopula;
          requiredWords = [subject, loc, copula];
        } else if (template.type === 'existence_animate') {
          // animate_object, location_word, copula (choose correct copula)
          const animateObjects = filteredParts['animate_object'];
          const locations = filteredParts['location_word'];
          const copulas = filteredParts['copula'];
          if (!animateObjects || !locations || !copulas || animateObjects.length === 0 || locations.length === 0 || copulas.length === 0) continue;
          const animateObject = animateObjects[Math.floor(Math.random() * animateObjects.length)];
          const location = locations[Math.floor(Math.random() * locations.length)];
          // Pick copula based on animate object (honorific/plural/gender)
          // छिन् (chhin) for singular honorific feminine (दिदी, आमा)
          // छन् (chan) for plural
          // छ (chha) for singular non-honorific
          // हुनुहुन्छ (hunuhunchha) for honorific (but not in Unit 1)
          let copula = chaCopula; // default
          
          // Check for honorific feminine (like दिदी, आमा)
          const isHonorificFeminine = (animateObject.category === 'family_member' && 
                                       (animateObject.relative_age === 'older' || 
                                        animateObject.term === 'आमा' || 
                                        animateObject.term === 'दिदी')) ||
                                     (animateObject.category === 'person' && animateObject.gender === 'feminine' && animateObject.honorific);
          
          if (isHonorificFeminine && chhinCopula) {
            copula = chhinCopula; // Use छिन् for honorific feminine
          } else if (animateObject.plural && chanCopula) {
            copula = chanCopula; // Use छन् for plural
          } else if (animateObject.honorific && hunuhunchhaCopula && currentUnit > 1) {
            copula = hunuhunchhaCopula; // Use हुनुहुन्छ for honorific (Unit 2+)
          }
          
          // Randomly choose word order: PERSON+LOCATION or LOCATION+PERSON (both are grammatically correct)
          const useLocationFirst = Math.random() > 0.5;
          requiredWords = useLocationFirst ? [location, animateObject, copula] : [animateObject, location, copula];
        } else if (template.type === 'ergative_past_transitive') {
          // subject, ले, object, verb_past
          const subjects = filteredParts['subject'];
          const ergatives = filteredParts['ergative_marker'];
          const objects = filteredParts['object'];
          const verbs = filteredParts['verb_past'];
          if (!subjects || !ergatives || !objects || !verbs || subjects.length === 0 || ergatives.length === 0 || objects.length === 0 || verbs.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const ergative = ergatives[0];
          const object = objects[Math.floor(Math.random() * objects.length)];
          const verb = verbs[Math.floor(Math.random() * verbs.length)];
          requiredWords = [subject, ergative, object, verb];
        } else if (template.type === 'dative_animate_object') {
          // subject, ले, object, लाई, verb_past
          const subjects = filteredParts['subject'];
          const ergatives = filteredParts['ergative_marker'];
          const objects = filteredParts['object'];
          const datives = filteredParts['dative_marker'];
          const verbs = filteredParts['verb_past'];
          if (!subjects || !ergatives || !objects || !datives || !verbs || subjects.length === 0 || ergatives.length === 0 || objects.length === 0 || datives.length === 0 || verbs.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const ergative = ergatives[0];
          const object = objects[Math.floor(Math.random() * objects.length)];
          const dative = datives[0];
          const verb = verbs[Math.floor(Math.random() * verbs.length)];
          requiredWords = [subject, ergative, object, dative, verb];
        } else if (template.type === 'existence' && template.negation_type) {
          // object, छैन (negative existence)
          const objects = filteredParts['object'];
          const copulas = filteredParts['copula_negative'];
          if (!objects || !copulas || objects.length === 0 || copulas.length === 0) continue;
          const object = objects[Math.floor(Math.random() * objects.length)];
          const copula = copulas[0];
          requiredWords = [object, copula];
        } else if (template.type === 'possession' && template.negation_type) {
          // possessor, सङ्ग, object, छैन (negative possession)
          const possessors = filteredParts['possessor'];
          const postpositions = filteredParts['possession_postposition'];
          const objects = filteredParts['object'];
          const copulas = filteredParts['copula_negative'];
          if (!possessors || !postpositions || !objects || !copulas || possessors.length === 0 || postpositions.length === 0 || objects.length === 0 || copulas.length === 0) continue;
          const possessor = possessors[Math.floor(Math.random() * possessors.length)];
          const postposition = postpositions[0];
          const object = objects[Math.floor(Math.random() * objects.length)];
          const copula = copulas[0];
          requiredWords = [possessor, postposition, object, copula];
        } else if (template.type === 'identity_noun' && template.negation_type) {
          // subject, identity_noun, होइन (negative identity)
          const subjects = filteredParts['subject'];
          const nouns = filteredParts['identity_noun'];
          const copulas = filteredParts['identity_copula_negative'];
          if (!subjects || !nouns || !copulas || subjects.length === 0 || nouns.length === 0 || copulas.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const noun = nouns[Math.floor(Math.random() * nouns.length)];
          const copula = copulas[0];
          requiredWords = [subject, noun, copula];
        } else if (template.type === 'identity_adj' && template.negation_type) {
          // subject, adjective, छैन (negative adjective)
          const subjects = filteredParts['subject'];
          const adjs = filteredParts['adjective'];
          const copulas = filteredParts['copula_negative'];
          if (!subjects || !adjs || !copulas || subjects.length === 0 || adjs.length === 0 || copulas.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const compatibleAdjs = adjs.filter(adj => isValidAdjectiveSubjectPair(adj, subject));
          if (compatibleAdjs.length === 0) continue;
          const adj = compatibleAdjs[Math.floor(Math.random() * compatibleAdjs.length)];
          const copula = copulas[0];
          requiredWords = [subject, adj, copula];
        } else if (template.type === 'identity_location' && template.negation_type) {
          // subject, location_phrase, छैन (negative location)
          const subjects = filteredParts['subject'];
          const locs = filteredParts['location_phrase'];
          const copulas = filteredParts['copula_negative'];
          if (!subjects || !locs || !copulas || subjects.length === 0 || locs.length === 0 || copulas.length === 0) continue;
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          const loc = locs[Math.floor(Math.random() * locs.length)];
          const copula = copulas[0];
          requiredWords = [subject, loc, copula];
        } else if (template.type === 'action' && template.negation_type) {
          // subject, ले, object, negative_verb (negative action)
          const subjects = filteredParts['subject'];
          const ergatives = filteredParts['ergative_marker'];
          const objects = filteredParts['object'];
          const verbs = filteredParts['verb_negative_present'];
          if (!subjects || !ergatives || !objects || !verbs || subjects.length === 0 || ergatives.length === 0 || objects.length === 0 || verbs.length === 0) continue;
          const verb = verbs[Math.floor(Math.random() * verbs.length)];
          const subject = subjects[Math.floor(Math.random() * subjects.length)];
          // For negative verbs, we don't need semantic filtering since they should work with any object
          const object = objects[Math.floor(Math.random() * objects.length)];
          const ergative = ergatives[0];
          requiredWords = [subject, ergative, object, verb];
        } else {
          for (let j = 0; j < template.required_parts.length; j++) {
            const part = template.required_parts[j];
            const options = filteredParts[part];
            if (!options || options.length === 0) { valid = false; break; }
            requiredWords.push(options[Math.floor(Math.random() * options.length)]);
          }
        }
        if (!valid || requiredWords.length !== template.required_parts.length) continue;
        // Add distractors
        const distractors = vocabulary.filter(word => !requiredWords.some(req => req.term === word.term));
        const numDistractors = Math.min(4, distractors.length);
        let distractorWords = [];
        for (let j = 0; j < numDistractors; j++) {
          const randomIndex = Math.floor(Math.random() * distractors.length);
          distractorWords.push(distractors[randomIndex]);
          distractors.splice(randomIndex, 1);
        }
        // Build Nepali sentence for possession
        let targetNepali = '';
        let targetTransliteration = '';
        if (template.type === 'possession' && !template.negation_type) {
          const possessor = requiredWords[0];
          const sanga = requiredWords[1];
          const object = requiredWords[2];
          const copula = requiredWords[3];
          targetNepali = `${possessor.term} ${sanga.term} ${object.term} ${copula.term}`;
          targetTransliteration = `${possessor.transliteration} ${sanga.transliteration} ${object.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'possession' && template.negation_type) {
          const possessor = requiredWords[0];
          const sanga = requiredWords[1];
          const object = requiredWords[2];
          const copula = requiredWords[3];
          targetNepali = `${possessor.term} ${sanga.term} ${object.term} ${copula.term}`;
          targetTransliteration = `${possessor.transliteration} ${sanga.transliteration} ${object.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'action' && !template.negation_type) {
          const subject = requiredWords[0];
          const ergative = requiredWords[1];
          const object = requiredWords[2];
          const verb = requiredWords[3];
          
          // Check if object requires possession (e.g., body parts)
          const objectTerm = object.requires_possession ? 
            generatePossessiveConstruction(object, subject) : object.term;
          
          targetNepali = `${subject.term} ${ergative.term} ${objectTerm} ${verb.term}`;
          targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${verb.transliteration}`;
        } else if (template.type === 'action' && template.negation_type) {
          const subject = requiredWords[0];
          const ergative = requiredWords[1];
          const object = requiredWords[2];
          const verb = requiredWords[3];
          targetNepali = `${subject.term} ${ergative.term} ${object.term} ${verb.term}`;
          targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${verb.transliteration}`;
        } else if (template.type === 'existence' && !template.negation_type) {
          // Simple positive existence: object + copula
          const object = requiredWords[0];
          const copula = requiredWords[1];
          targetNepali = `${object.term} ${copula.term}`;
          targetTransliteration = `${object.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'existence' && template.negation_type) {
          const object = requiredWords[0];
          const copula = requiredWords[1];
          targetNepali = `${object.term} ${copula.term}`;
          targetTransliteration = `${object.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'existence_animate') {
          // Handle flexible word order: either PERSON+LOCATION+COPULA or LOCATION+PERSON+COPULA
          // Determine order by checking if first word is a location word
          const firstWord = requiredWords[0];
          const isLocationFirst = firstWord.can_be && firstWord.can_be.includes('location_word');
          
          let animateObject, location, copula;
          if (isLocationFirst) {
            // LOCATION + PERSON + COPULA order
            location = requiredWords[0];
            animateObject = requiredWords[1];
            copula = requiredWords[2];
            // Build in LOCATION + PERSON + COPULA order
            targetNepali = `${location.term} ${animateObject.term} ${copula.term}`;
            targetTransliteration = `${location.transliteration} ${animateObject.transliteration} ${copula.transliteration}`;
          } else {
            // PERSON + LOCATION + COPULA order (default)
            animateObject = requiredWords[0];
            location = requiredWords[1];
            copula = requiredWords[2];
            // Build in PERSON + LOCATION + COPULA order
            targetNepali = `${animateObject.term} ${location.term} ${copula.term}`;
            targetTransliteration = `${animateObject.transliteration} ${location.transliteration} ${copula.transliteration}`;
          }
        } else if (template.type === 'identity_noun' && !template.negation_type) {
          const subject = requiredWords[0];
          const noun = requiredWords[1];
          const copula = requiredWords[2];
          targetNepali = `${subject.term} ${noun.term} ${copula.term}`;
          targetTransliteration = `${subject.transliteration} ${noun.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'identity_noun' && template.negation_type) {
          const subject = requiredWords[0];
          const noun = requiredWords[1];
          const copula = requiredWords[2];
          targetNepali = `${subject.term} ${noun.term} ${copula.term}`;
          targetTransliteration = `${subject.transliteration} ${noun.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'identity_adj' && !template.negation_type) {
          const subject = requiredWords[0];
          const adj = requiredWords[1];
          const copula = requiredWords[2];
          targetNepali = `${subject.term} ${adj.term} ${copula.term}`;
          targetTransliteration = `${subject.transliteration} ${adj.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'identity_adj' && template.negation_type) {
          const subject = requiredWords[0];
          const adj = requiredWords[1];
          const copula = requiredWords[2];
          targetNepali = `${subject.term} ${adj.term} ${copula.term}`;
          targetTransliteration = `${subject.transliteration} ${adj.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'identity_location' && !template.negation_type) {
          const subject = requiredWords[0];
          const loc = requiredWords[1];
          const copula = requiredWords[2];
          
          // Check if location requires genitive construction (e.g., time-of-day)
          const locationTerm = loc.requires_genitive_link ? 
            generateGenitiveConstruction(loc, subject) : loc.term;
          
          targetNepali = `${subject.term} ${locationTerm} ${copula.term}`;
          targetTransliteration = `${subject.transliteration} ${loc.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'identity_location' && template.negation_type) {
          const subject = requiredWords[0];
          const loc = requiredWords[1];
          const copula = requiredWords[2];
          targetNepali = `${subject.term} ${loc.term} ${copula.term}`;
          targetTransliteration = `${subject.transliteration} ${loc.transliteration} ${copula.transliteration}`;
        } else if (template.type === 'ergative_past_transitive') {
          const subject = requiredWords[0];
          const ergative = requiredWords[1];
          const object = requiredWords[2];
          const verb = requiredWords[3];
          targetNepali = `${subject.term} ${ergative.term} ${object.term} ${verb.term}`;
          targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${verb.transliteration}`;
        } else if (template.type === 'dative_animate_object') {
          const subject = requiredWords[0];
          const ergative = requiredWords[1];
          const object = requiredWords[2];
          const dative = requiredWords[3];
          const verb = requiredWords[4];
          targetNepali = `${subject.term} ${ergative.term} ${object.term} ${dative.term} ${verb.term}`;
          targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${dative.transliteration} ${verb.transliteration}`;
        }
        exercises.push({
          id: `${template.id}_${i}`,
          template: template,
          requiredWords: requiredWords,
          distractors: distractorWords,
          ...(template.type === 'possession' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'existence' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'existence_animate' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'action' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'identity_noun' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'identity_adj' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'identity_location' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'ergative_past_transitive' ? { targetNepali, targetTransliteration } : {}),
          ...(template.type === 'dative_animate_object' ? { targetNepali, targetTransliteration } : {})
        });
        
        // DEBUG: Log when action exercises are added to the main list
        if (template.type === 'action') {
          console.log('[DEBUG] Added action exercise to main list:', {
            id: `${template.id}_${i}`,
            requiredWords: requiredWords.map(w => w.term)
          });
          console.log('[DEBUG] Current exercises array length after adding action:', exercises.length);
        }
      }
    }
    // After generating all exercises, guarantee at least one of each sentence type (action, possession, existence, identity_noun, identity_adj, identity_location, etc.)
    console.log('[DEBUG] Exercises array before fallback check:', exercises.map(ex => ({ type: ex.template.type, id: ex.id })));
    
    // Filter types based on unit to avoid negatives in Unit 2
    let types = [];
    if (currentUnit === 1) {
      types = ["possession", "existence", "existence_animate", "identity_noun", "identity_adj", "identity_location"];
    } else if (currentUnit === 2) {
      types = ["action"];
    } else if (currentUnit === 3) {
      types = ["action", "possession", "existence", "existence_animate", "identity_noun", "identity_adj", "identity_location"];
    }
    
    const typePresent = {};
    exercises.forEach(ex => { typePresent[ex.template.type] = true; });
    
    console.log('[DEBUG] Types present before fallback:', typePresent);
    console.log('[DEBUG] Total exercises before fallback:', exercises.length);
    
    // Create a separate array for fallback exercises
    let fallbackExercises = [];
    
    types.forEach(type => {
      if (!typePresent[type]) {
        console.log('[DEBUG] Attempting to generate fallback exercise for type:', type);
        // Try to generate one exercise of this type
        const template = templates.find(tmpl => tmpl.type === type);
        if (template) {
          // Use the same logic as above to generate one exercise for this template
          // (copy the relevant code block for generating requiredWords and distractors)
          // Only add if valid
          let filteredParts = {};
          let skipTemplate = false;
          template.required_parts.forEach(part => {
            // Handle special parts that apply to all templates
            if (part === 'copula_negative') {
              filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes('copula_negative'));
            } else if (part === 'identity_copula_negative') {
              filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes('identity_copula_negative'));
            } else if (part === 'verb_negative_present') {
              filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes('verb_negative_present'));
            } else if (part === 'ergative_marker') {
              filteredParts[part] = leErgative ? [leErgative] : [];
            } else if (part === 'possession_postposition') {
              filteredParts[part] = [sangaWord].filter(Boolean);
            } else if (template.type === 'possession') {
              if (part === 'possessor') {
                filteredParts[part] = vocabulary.filter(w => w.animacy === 'animate');
              } else if (part === 'object') {
                filteredParts[part] = vocabulary.filter(w => w.possessable === true);
              } else if (part === 'copula') {
                filteredParts[part] = vocabulary.filter(w => w.verb_type === 'copula');
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (template.type === 'action') {
              if (part === 'verb') {
                filteredParts[part] = vocabulary.filter(word => word.verb_type === 'action');
              } else if (part === 'subject') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject') && (word.animacy === 'animate' || word.category === 'person' || word.category === 'family_member'));
              } else if (part === 'object') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('object'));
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (template.type === 'identity_noun') {
              if (part === 'subject') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
              } else if (part === 'identity_noun') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('identity_noun'));
              } else if (part === 'identity_copula') {
                filteredParts[part] = [hoCopula].filter(Boolean);
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (template.type === 'identity_adj') {
              if (part === 'subject') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
              } else if (part === 'adjective') {
                // Filter adjectives based on semantic compatibility with subjects
                const subjects = filteredParts['subject'] || [];
                if (subjects.length > 0) {
                  const allAdjectives = vocabulary.filter(word => word.can_be && word.can_be.includes('modifier'));
                  filteredParts[part] = allAdjectives.filter(adj => {
                    // Check if this adjective can be used with at least one subject
                    return subjects.some(subject => isValidAdjectiveSubjectPair(adj, subject));
                  });
                } else {
                  // Fallback if no subjects yet
                  filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('modifier'));
                }
              } else if (part === 'copula') {
                filteredParts[part] = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (template.type === 'identity_location') {
              if (part === 'subject') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
              } else if (part === 'location_phrase') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('location_phrase'));
              } else if (part === 'copula') {
                filteredParts[part] = [chaCopula, chanCopula, hunuhunchhaCopula].filter(Boolean);
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (template.type === 'existence') {
              if (part === 'object') {
                // For simple existence, only allow inanimate objects and plants
                // Filter out animate nouns (people and animals)
                filteredParts[part] = vocabulary.filter(word => {
                  if (!word.can_be || !word.can_be.includes('object')) return false;
                  // Exclude animate nouns
                  const isPerson = word.category === 'person' || word.category === 'family_member';
                  const isAnimate = word.animacy === 'animate' || isPerson;
                  // Also check if it's an animal category if that exists
                  const isAnimal = word.category === 'animal';
                  return !isAnimate && !isAnimal;
                });
              } else if (part === 'copula') {
                filteredParts[part] = [chaCopula].filter(Boolean);
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (template.type === 'existence_animate') {
              if (part === 'animate_object') {
                // Only allow animate nouns (people and animals)
                filteredParts[part] = vocabulary.filter(word => {
                  if (!word.can_be || !word.can_be.includes('object')) return false;
                  const isPerson = word.category === 'person' || word.category === 'family_member';
                  const isAnimate = word.animacy === 'animate' || isPerson;
                  const isAnimal = word.category === 'animal';
                  return isAnimate || isAnimal;
                });
              } else if (part === 'location_word') {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('location_word'));
              } else if (part === 'copula') {
                // Include all copulas that could be used: छ, छिन्, छन्, and optionally हुनुहुन्छ (Unit 2+)
                const copulaList = [chaCopula, chhinCopula, chanCopula].filter(Boolean);
                if (currentUnit > 1 && hunuhunchhaCopula) {
                  copulaList.push(hunuhunchhaCopula);
                }
                filteredParts[part] = copulaList;
              } else {
                filteredParts[part] = vocabulary.filter(w => w.can_be && w.can_be.includes(part));
              }
            } else if (part === 'verb') {
              filteredParts[part] = vocabulary.filter(word => word.verb_type === template.type);
            } else if (part === 'copula') {
              // handled above
            } else if (part === 'possessor') {
              filteredParts[part] = vocabulary.filter(word => (word.category === 'family_member' || word.category === 'person' || word.category === 'animate' || (word.can_be && word.can_be.includes('subject'))));
            } else if (part === 'subject') {
              if (template.type === 'action') {
                filteredParts[part] = vocabulary.filter(word => (word.category === 'family_member' || word.category === 'person' || word.category === 'animate' || (word.can_be && word.can_be.includes('subject'))));
              } else {
                filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('subject'));
              }
            } else if (part === 'object') {
              filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes('object'));
            } else {
              filteredParts[part] = vocabulary.filter(word => word.can_be && word.can_be.includes(part));
            }
            if (!filteredParts[part] || filteredParts[part].length === 0) skipTemplate = true;
          });
          if (!skipTemplate) {
            for (let i = 0; i < 5; i++) {
              let requiredWords = [];
              let valid = true;
              if (template.type === 'action') {
                // Always include 'ले' after subject for present tense (for now)
                const verbs = filteredParts['verb'];
                if (!verbs || verbs.length === 0) continue;
                const verb = verbs[Math.floor(Math.random() * verbs.length)];
                const subjects = filteredParts['subject'].filter(s => {
                  if (!verb.requires_subject) return true;
                  return verb.requires_subject.includes(s.category) || verb.requires_subject.includes('animate');
                });
                if (!subjects || subjects.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const objects = filteredParts['object'].filter(o => {
                  // Use the isValidVerbObjectPair function for proper semantic filtering
                  return isValidVerbObjectPair(verb, o);
                });
                if (!objects || objects.length === 0) continue;
                console.log(`  Filtered objects for "${verb.term}":`, objects.map(o => o.term));
                const object = objects[Math.floor(Math.random() * objects.length)];
                if (!leErgative) continue; // require 'ले' in vocab
                requiredWords = [subject, leErgative, object, verb];
              } else if (template.type === 'identity_noun') {
                // subject, identity_noun, ho
                const subjects = filteredParts['subject'];
                const nouns = filteredParts['identity_noun'];
                const copulas = filteredParts['identity_copula'];
                if (!subjects || !nouns || !copulas || subjects.length === 0 || nouns.length === 0 || copulas.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const noun = nouns[Math.floor(Math.random() * nouns.length)];
                const copula = copulas[0];
                requiredWords = [subject, noun, copula];
              } else if (template.type === 'identity_adj') {
                // subject, adjective, copula (choose correct copula)
                const subjects = filteredParts['subject'];
                const adjs = filteredParts['adjective'];
                const copulas = filteredParts['copula'];
                if (!subjects || !adjs || !copulas || subjects.length === 0 || adjs.length === 0 || copulas.length === 0) continue;
                
                // Pick a subject first, then filter adjectives that work with it
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const compatibleAdjs = adjs.filter(adj => isValidAdjectiveSubjectPair(adj, subject));
                
                if (compatibleAdjs.length === 0) continue; // Skip if no compatible adjectives
                
                const adj = compatibleAdjs[Math.floor(Math.random() * compatibleAdjs.length)];
                // Pick copula based on subject (honorific/plural)
                let copula = chaCopula;
                if (subject.honorific) copula = hunuhunchhaCopula;
                else if (subject.plural) copula = chanCopula;
                requiredWords = [subject, adj, copula];
              } else if (template.type === 'identity_location') {
                // subject, location_phrase, copula (choose correct copula)
                const subjects = filteredParts['subject'];
                const locs = filteredParts['location_phrase'];
                const copulas = filteredParts['copula'];
                if (!subjects || !locs || !copulas || subjects.length === 0 || locs.length === 0 || copulas.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const loc = locs[Math.floor(Math.random() * locs.length)];
                // Pick copula based on subject (honorific/plural)
                let copula = chaCopula;
                if (subject.honorific) copula = hunuhunchhaCopula;
                else if (subject.plural) copula = chanCopula;
                requiredWords = [subject, loc, copula];
              } else if (template.type === 'ergative_past_transitive') {
                // subject, ले, object, verb_past
                const subjects = filteredParts['subject'];
                const ergatives = filteredParts['ergative_marker'];
                const objects = filteredParts['object'];
                const verbs = filteredParts['verb_past'];
                if (!subjects || !ergatives || !objects || !verbs || subjects.length === 0 || ergatives.length === 0 || objects.length === 0 || verbs.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const ergative = ergatives[0];
                const verb = verbs[Math.floor(Math.random() * verbs.length)];
                
                // Filter objects based on semantic compatibility with the selected verb
                const validObjects = objects.filter(o => isValidVerbObjectPair(verb, o));
                if (validObjects.length === 0) continue;
                
                const object = validObjects[Math.floor(Math.random() * validObjects.length)];
                requiredWords = [subject, ergative, object, verb];
              } else if (template.type === 'dative_animate_object') {
                // subject, ले, object, लाई, verb_past
                const subjects = filteredParts['subject'];
                const ergatives = filteredParts['ergative_marker'];
                const objects = filteredParts['object'];
                const datives = filteredParts['dative_marker'];
                const verbs = filteredParts['verb_past'];
                if (!subjects || !ergatives || !objects || !datives || !verbs || subjects.length === 0 || ergatives.length === 0 || objects.length === 0 || datives.length === 0 || verbs.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const ergative = ergatives[0];
                const verb = verbs[Math.floor(Math.random() * verbs.length)];
                
                // Filter objects based on semantic compatibility with the selected verb
                const validObjects = objects.filter(o => isValidVerbObjectPair(verb, o));
                if (validObjects.length === 0) continue;
                
                const object = validObjects[Math.floor(Math.random() * validObjects.length)];
                const dative = datives[0];
                requiredWords = [subject, ergative, object, dative, verb];
              } else if (template.type === 'possession' && template.negation_type) {
                const possessors = filteredParts['possessor'];
                const postpositions = filteredParts['possession_postposition'];
                const objects = filteredParts['object'];
                const copulas = filteredParts['copula_negative'];
                if (!possessors || !postpositions || !objects || !copulas || possessors.length === 0 || postpositions.length === 0 || objects.length === 0 || copulas.length === 0) continue;
                const possessor = possessors[Math.floor(Math.random() * possessors.length)];
                const postposition = postpositions[0];
                const object = objects[Math.floor(Math.random() * objects.length)];
                const copula = copulas[0];
                requiredWords = [possessor, postposition, object, copula];
              } else if (template.type === 'existence' && template.negation_type) {
                const objects = filteredParts['object'];
                const copulas = filteredParts['copula_negative'];
                if (!objects || !copulas || objects.length === 0 || copulas.length === 0) continue;
                const object = objects[Math.floor(Math.random() * objects.length)];
                const copula = copulas[0];
                requiredWords = [object, copula];
              } else if (template.type === 'identity_noun' && template.negation_type) {
                const subjects = filteredParts['subject'];
                const nouns = filteredParts['identity_noun'];
                const copulas = filteredParts['identity_copula_negative'];
                if (!subjects || !nouns || !copulas || subjects.length === 0 || nouns.length === 0 || copulas.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const noun = nouns[Math.floor(Math.random() * nouns.length)];
                const copula = copulas[0];
                requiredWords = [subject, noun, copula];
              } else if (template.type === 'identity_adj' && template.negation_type) {
                const subjects = filteredParts['subject'];
                const adjs = filteredParts['adjective'];
                const copulas = filteredParts['copula_negative'];
                if (!subjects || !adjs || !copulas || subjects.length === 0 || adjs.length === 0 || copulas.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const compatibleAdjs = adjs.filter(adj => isValidAdjectiveSubjectPair(adj, subject));
                if (compatibleAdjs.length === 0) continue;
                const adj = compatibleAdjs[Math.floor(Math.random() * compatibleAdjs.length)];
                const copula = copulas[0];
                requiredWords = [subject, adj, copula];
              } else if (template.type === 'identity_location' && template.negation_type) {
                const subjects = filteredParts['subject'];
                const locs = filteredParts['location_phrase'];
                const copulas = filteredParts['copula_negative'];
                if (!subjects || !locs || !copulas || subjects.length === 0 || locs.length === 0 || copulas.length === 0) continue;
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const loc = locs[Math.floor(Math.random() * locs.length)];
                const copula = copulas[0];
                requiredWords = [subject, loc, copula];
              } else if (template.type === 'action' && template.negation_type) {
                const subjects = filteredParts['subject'];
                const ergatives = filteredParts['ergative_marker'];
                const objects = filteredParts['object'];
                const verbs = filteredParts['verb_negative_present'];
                if (!subjects || !ergatives || !objects || !verbs || subjects.length === 0 || ergatives.length === 0 || objects.length === 0 || verbs.length === 0) continue;
                const verb = verbs[Math.floor(Math.random() * verbs.length)];
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const object = objects[Math.floor(Math.random() * objects.length)];
                const ergative = ergatives[0];
                requiredWords = [subject, ergative, object, verb];
              } else {
                for (let j = 0; j < template.required_parts.length; j++) {
                  const part = template.required_parts[j];
                  const options = filteredParts[part];
                  if (!options || options.length === 0) { valid = false; break; }
                  requiredWords.push(options[Math.floor(Math.random() * options.length)]);
                }
              }
              if (!valid || requiredWords.length !== template.required_parts.length) continue;
              // Add distractors
              const distractors = vocabulary.filter(word => !requiredWords.some(req => req.term === word.term));
              const numDistractors = Math.min(4, distractors.length);
              let distractorWords = [];
              for (let j = 0; j < numDistractors; j++) {
                const randomIndex = Math.floor(Math.random() * distractors.length);
                distractorWords.push(distractors[randomIndex]);
                distractors.splice(randomIndex, 1);
              }
              // Build Nepali sentence for all types
              let targetNepali = '';
              let targetTransliteration = '';
              if (template.type === 'possession') {
                const possessor = requiredWords[0];
                const sanga = requiredWords[1];
                const object = requiredWords[2];
                const copula = requiredWords[3];
                targetNepali = `${possessor.term} ${sanga.term} ${object.term} ${copula.term}`;
                targetTransliteration = `${possessor.transliteration} ${sanga.transliteration} ${object.transliteration} ${copula.transliteration}`;
              } else if (template.type === 'existence') {
                const object = requiredWords[0];
                const copula = requiredWords[1];
                targetNepali = `${object.term} ${copula.term}`;
                targetTransliteration = `${object.transliteration} ${copula.transliteration}`;
              } else if (template.type === 'existence_animate') {
                // Handle flexible word order: either PERSON+LOCATION+COPULA or LOCATION+PERSON+COPULA
                const firstWord = requiredWords[0];
                const isLocationFirst = firstWord.can_be && firstWord.can_be.includes('location_word');
                
                let animateObject, location, copula;
                if (isLocationFirst) {
                  // LOCATION + PERSON + COPULA order
                  location = requiredWords[0];
                  animateObject = requiredWords[1];
                  copula = requiredWords[2];
                  targetNepali = `${location.term} ${animateObject.term} ${copula.term}`;
                  targetTransliteration = `${location.transliteration} ${animateObject.transliteration} ${copula.transliteration}`;
                } else {
                  // PERSON + LOCATION + COPULA order (default)
                  animateObject = requiredWords[0];
                  location = requiredWords[1];
                  copula = requiredWords[2];
                  targetNepali = `${animateObject.term} ${location.term} ${copula.term}`;
                  targetTransliteration = `${animateObject.transliteration} ${location.transliteration} ${copula.transliteration}`;
                }
              } else if (template.type === 'identity_noun') {
                const subject = requiredWords[0];
                const noun = requiredWords[1];
                const copula = requiredWords[2];
                targetNepali = `${subject.term} ${noun.term} ${copula.term}`;
                targetTransliteration = `${subject.transliteration} ${noun.transliteration} ${copula.transliteration}`;
              } else if (template.type === 'identity_adj') {
                const subject = requiredWords[0];
                const adj = requiredWords[1];
                const copula = requiredWords[2];
                targetNepali = `${subject.term} ${adj.term} ${copula.term}`;
                targetTransliteration = `${subject.transliteration} ${adj.transliteration} ${copula.transliteration}`;
              } else if (template.type === 'action') {
                const subject = requiredWords[0];
                const ergative = requiredWords[1];
                const object = requiredWords[2];
                const verb = requiredWords[3];
                targetNepali = `${subject.term} ${ergative.term} ${object.term} ${verb.term}`;
                targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${verb.transliteration}`;
              } else if (template.type === 'identity_location') {
                const subject = requiredWords[0];
                const loc = requiredWords[1];
                const copula = requiredWords[2];
                targetNepali = `${subject.term} ${loc.term} ${copula.term}`;
                targetTransliteration = `${subject.transliteration} ${loc.transliteration} ${copula.transliteration}`;
              } else if (template.type === 'ergative_past_transitive') {
                const subject = requiredWords[0];
                const ergative = requiredWords[1];
                const object = requiredWords[2];
                const verb = requiredWords[3];
                targetNepali = `${subject.term} ${ergative.term} ${object.term} ${verb.term}`;
                targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${verb.transliteration}`;
              } else if (template.type === 'dative_animate_object') {
                const subject = requiredWords[0];
                const ergative = requiredWords[1];
                const object = requiredWords[2];
                const dative = requiredWords[3];
                const verb = requiredWords[4];
                targetNepali = `${subject.term} ${ergative.term} ${object.term} ${dative.term} ${verb.term}`;
                targetTransliteration = `${subject.transliteration} ${ergative.transliteration} ${object.transliteration} ${dative.transliteration} ${verb.transliteration}`;
              }
              fallbackExercises.push({
                id: `${template.id}_${i}`,
                template: template,
                requiredWords: requiredWords,
                distractors: distractorWords,
                ...(template.type === 'possession' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'existence' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'existence_animate' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'action' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'identity_noun' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'identity_adj' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'identity_location' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'ergative_past_transitive' ? { targetNepali, targetTransliteration } : {}),
                ...(template.type === 'dative_animate_object' ? { targetNepali, targetTransliteration } : {})
              });
              
              // DEBUG: Log when fallback exercises are added
              console.log('[DEBUG] Added fallback exercise:', {
                type: template.type,
                id: `${template.id}_${i}`,
                requiredWords: requiredWords.map(w => w.term)
              });
            }
          }
        }
      }
    });
    
    // Add fallback exercises to the main exercises array
    exercises.push(...fallbackExercises);
    console.log('[DEBUG] Added fallback exercises to main array. Total exercises now:', exercises.length);
    
    // DEBUG: Log all exercises immediately after generation but before selection
    console.log('[DEBUG] ALL EXERCISES AFTER GENERATION:', exercises ? exercises.map(ex => ({
      type: ex.template.type,
      id: ex.id,
      requiredWords: ex.requiredWords.map(w => w.term)
    })) : 'exercises is undefined');
    
    // Ensure balanced representation of sentence types
    const typeCounts = {};
    exercises.forEach(ex => {
      typeCounts[ex.template.type] = (typeCounts[ex.template.type] || 0) + 1;
    });
    console.log('[DEBUG] Exercise type counts before selection:', typeCounts);
    console.log('[DEBUG] Total exercises generated:', exercises.length);
    
    // Prioritize action sentences and ensure diversity
    const actionExercises = exercises.filter(ex => ex.template.type === 'action');
    const otherExercises = exercises.filter(ex => ex.template.type !== 'action');
    
    console.log('[DEBUG] Action exercises found:', actionExercises.length);
    console.log('[DEBUG] Other exercises found:', otherExercises.length);
    
    // Take up to 3 action sentences, then fill with others
    let finalExercises = [];
    if (actionExercises.length > 0) {
      finalExercises.push(...actionExercises.slice(0, 3));
      console.log('[DEBUG] Added action exercises to final list');
    } else {
      console.log('[DEBUG] No action exercises available for final selection');
    }
    finalExercises.push(...otherExercises.slice(0, 10 - finalExercises.length));
    
    // Shuffle the final selection
    finalExercises = finalExercises.sort(() => Math.random() - 0.5);
    
    // DEBUG: Log what exercises were generated
    console.log('[DEBUG] Final exercises generated:', finalExercises.map(ex => ({
      type: ex.template.type,
      id: ex.id,
      requiredWords: ex.requiredWords.map(w => w.term)
    })));
    
    return finalExercises;
  };

  // Initialize exercises
  useEffect(() => {
    const exercises = generateExercises(currentUnit);
    setExercises(exercises);
    if (exercises.length > 0) {
      setCurrentExercise(exercises[0]);
      // Get all words to check for gender variants
      const allWordsForExercise = [...exercises[0].requiredWords, ...exercises[0].distractors];
      
      // Filter out words that are gender variants of other words
      const filteredAvailableWords = allWordsForExercise.filter(word => {
        // Don't filter out if this word has variants (it's a base word)
        if (hasVariants(word)) return true;
        
        // Check if this word is a gender variant of another word
        const isVariant = allWordsForExercise.some(w => {
          if (w.gender_variants) {
            return w.gender_variants.some(v => v.term === word.term);
          }
          return false;
        });
        
        // Only include if it's not a variant
        return !isVariant;
      });
      
      setAvailableWords(filteredAvailableWords.sort(() => Math.random() - 0.5)); // Shuffle
    }
  }, [currentUnit]);

  // Helper to check if word has variants
  const hasVariants = (word) => {
    const hasVerbForms = word.verb_forms && Object.keys(word.verb_forms).length > 0;
    const hasGenderVariants = word.gender_variants && word.gender_variants.length > 0;
    return hasVerbForms || hasGenderVariants;
  };

  // Helper to check if a word is a gender variant of another word
  const isGenderVariant = (word, allWords) => {
    return allWords.some(w => {
      if (w.gender_variants) {
        return w.gender_variants.some(v => v.term === word.term);
      }
      return false;
    });
  };

  // Helper to get all valid variant terms for a word
  const getAllValidVariants = (word) => {
    const variants = [word.term]; // Include the base term
    
    if (word.verb_forms) {
      Object.values(word.verb_forms).forEach(forms => {
        forms.forEach(form => variants.push(form.term));
      });
    }
    
    if (word.gender_variants) {
      word.gender_variants.forEach(variant => variants.push(variant.term));
    }
    
    return variants;
  };

  const handleWordSelect = (word) => {
    if (selectedWords.some(w => w.term === word.term)) {
      // Remove word if already selected
      setSelectedWords(selectedWords.filter(w => w.term !== word.term));
      // Also remove variant selection
      const newVariants = { ...selectedVariants };
      delete newVariants[word.term];
      setSelectedVariants(newVariants);
    } else {
      // Add word (use default term, variant can be selected via dropdown)
      setSelectedWords([...selectedWords, word]);
    }
    setIsCorrect(null);
    setShowHint(false);
  };

  const handleVariantSelect = (variantTerm, originalWord) => {
    // Update the selected variant for this word
    setSelectedVariants({
      ...selectedVariants,
      [originalWord.term]: variantTerm
    });
    setIsCorrect(null);
    setShowHint(false);
  };

  // 1. Generate English sentence from selected words for the prompt
  function buildEnglishSentence(exercise) {
    if (!exercise || !exercise.requiredWords) return '';
    
    const template = exercise.template;
    
    // Safety check: ensure the exercise is appropriate
    const safetyCheck = checkContentSafety(template.english || '');
    if (safetyCheck.isNSFW) {
      console.log(`[CONTENT FILTER] Blocked inappropriate exercise: "${template.english}"`);
      return 'Please select a different exercise.';
    }
    
    // For action sentences, use proper English SVO with prepositions
    if (template.type === 'action') {
      const [subject, ergative, object, verb] = exercise.requiredWords;
      
      // Build subject phrase with article
      const subjectPhrase = buildEnglishSubjectPhrase(subject);
      
      // Build verb phrase (check for negation)
      let verbGloss = verb?.gloss || verb?.definition || 'does';
      if (template.negation_type) {
        // For negative verbs, extract base verb from definition like "does not eat"
        if (verbGloss.includes('does not')) {
          verbGloss = verbGloss; // Already has "does not"
        } else {
          verbGloss = `does not ${verbGloss.replace(/s$/, '')}`; // Remove -s and add "does not"
        }
      }
      
      // Build object phrase with preposition and article
      const objectPhrase = buildEnglishObjectPhrase(object, verb);
      
      return `${subjectPhrase} ${verbGloss} ${objectPhrase}`;
    }
    
    // For possession sentences (A has B)
    if (template.type === 'possession') {
      const [possessor, sanga, object, copula] = exercise.requiredWords;
      const possessorPhrase = buildEnglishSubjectPhrase(possessor);
      const objectEnglish = object?.gloss || object?.definition || '';
      const article = getEnglishArticle(objectEnglish, object);
      const objectPhrase = article ? `${article} ${objectEnglish.toLowerCase()}` : objectEnglish.toLowerCase();
      const hasVerb = template.negation_type ? 'does not have' : 'has';
      return `${possessorPhrase} ${hasVerb} ${objectPhrase}`;
    }
    
    // For identity_noun sentences (A is B)
    if (template.type === 'identity_noun') {
      const [subject, identityNoun, copula] = exercise.requiredWords;
      const subjectPhrase = buildEnglishSubjectPhrase(subject);
      const nounEnglish = identityNoun?.gloss || identityNoun?.definition || '';
      const article = getEnglishArticle(nounEnglish, identityNoun);
      const nounPhrase = article ? `${article} ${nounEnglish}` : nounEnglish;
      const isVerb = template.negation_type ? 'is not' : 'is';
      return `${subjectPhrase} ${isVerb} ${nounPhrase}`;
    }
    
    // For identity_adj sentences (A is [adjective])
    if (template.type === 'identity_adj') {
      const [subject, adjective, copula] = exercise.requiredWords;
      const subjectPhrase = buildEnglishSubjectPhrase(subject);
      const adjEnglish = adjective?.gloss || adjective?.definition || '';
      const isVerb = template.negation_type ? 'is not' : 'is';
      return `${subjectPhrase} ${isVerb} ${adjEnglish}`;
    }
    
    // For identity_location sentences (A is in/on B)
    if (template.type === 'identity_location') {
      const [subject, location, copula] = exercise.requiredWords;
      const subjectPhrase = buildEnglishSubjectPhrase(subject);
      // Location phrases already have postpositions built in
      const locationPhrase = buildEnglishObjectPhrase(location);
      const isVerb = template.negation_type ? 'is not' : 'is';
      return `${subjectPhrase} ${isVerb} ${locationPhrase}`;
    }
    
    // For existence sentences (There is A)
    if (template.type === 'existence') {
      const [object, copula] = exercise.requiredWords;
      const objectEnglish = object?.gloss || object?.definition || '';
      
      if (template.negation_type) {
        // For negative existence, use proper grammar
        const isPlural = object?.plural || objectEnglish.toLowerCase().endsWith('s');
        if (isPlural) {
          return `There are no ${objectEnglish.toLowerCase()}`;
        } else {
          return `There is no ${objectEnglish.toLowerCase()}`;
        }
      } else {
        // For positive existence
        const isPlural = object?.plural || objectEnglish.toLowerCase().endsWith('s');
        if (isPlural) {
          return `There are ${objectEnglish.toLowerCase()}`;
        } else {
          const article = getEnglishArticle(objectEnglish, object);
          const objectPhrase = article ? `${article} ${objectEnglish.toLowerCase()}` : objectEnglish.toLowerCase();
          return `There is ${objectPhrase}`;
        }
      }
    }
    
    // For animate existence sentences ([animate_object] is [location])
    if (template.type === 'existence_animate') {
      // Handle flexible word order: either PERSON+LOCATION+COPULA or LOCATION+PERSON+COPULA
      const firstWord = exercise.requiredWords[0];
      const isLocationFirst = firstWord.can_be && firstWord.can_be.includes('location_word');
      
      let animateObject, location, copula;
      if (isLocationFirst) {
        // LOCATION + PERSON + COPULA order
        location = exercise.requiredWords[0];
        animateObject = exercise.requiredWords[1];
        copula = exercise.requiredWords[2];
      } else {
        // PERSON + LOCATION + COPULA order (default)
        animateObject = exercise.requiredWords[0];
        location = exercise.requiredWords[1];
        copula = exercise.requiredWords[2];
      }
      
      const objectEnglish = animateObject?.gloss || animateObject?.definition || '';
      const locationEnglish = location?.gloss || location?.definition || '';
      
      // Use "the" for animate beings (people, animals)
      const article = getEnglishArticle(objectEnglish, animateObject) || 'the';
      const objectPhrase = `${article} ${objectEnglish.toLowerCase()}`;
      
      // Both orders translate to the same English: "The [person] is [location]"
      return `${objectPhrase} is ${locationEnglish.toLowerCase()}`;
    }
    
    // Default: Replace all [part] with the gloss of the required word (fallback)
    let sentence = template.english || '';
    exercise.template.required_parts.forEach((part, idx) => {
      const word = exercise.requiredWords[idx];
      if (word && word.gloss) {
        sentence = sentence.replace(`[${part}]`, word.gloss);
      } else if (word && word.definition) {
        sentence = sentence.replace(`[${part}]`, word.definition);
      }
    });
    
    // Final safety check on the complete sentence
    const finalSafetyCheck = checkContentSafety(sentence);
    if (finalSafetyCheck.isNSFW) {
      console.log(`[CONTENT FILTER] Blocked inappropriate generated sentence: "${sentence}"`);
      return 'Please select a different exercise.';
    }
    
    return sentence;
  }

  // 2. Fix answer checking: require all required words in correct order (accept variants)
  const checkAnswer = () => {
    if (!currentExercise) return;
    
    // Get user terms using selected variants if available
    const userTerms = selectedWords.map(w => {
      const variantTerm = selectedVariants[w.term];
      return variantTerm || w.term;
    });
    
    // Get user sentence using selected variants if available
    const userSentence = userTerms.join(' ');
    
    let isAnswerCorrect = false;
    
    // For animate existence sentences, accept both word orders:
    // PERSON + LOCATION + COPULA or LOCATION + PERSON + COPULA
    // (The copula is always last in both orders)
    if (currentExercise.template.type === 'existence_animate') {
      const requiredTerms = currentExercise.requiredWords.map(w => w.term);
      
      // Get all valid variants for each required word
      const requiredWordsWithVariants = currentExercise.requiredWords.map(w => ({
        word: w,
        validTerms: getAllValidVariants(w)
      }));
      
      // Check if user has all required words (accepting any valid variant)
      const hasAllWords = requiredWordsWithVariants.every(({ validTerms }) => 
        userTerms.some(term => validTerms.includes(term))
      ) && userTerms.every(term => 
        requiredWordsWithVariants.some(({ validTerms }) => validTerms.includes(term))
      ) && userTerms.length === requiredWordsWithVariants.length;
      
      if (hasAllWords) {
        // Check both valid word orders with variant matching
        const order1Terms = requiredWordsWithVariants.map(({ word }) => word.term);
        const order2Terms = [
          requiredWordsWithVariants[1].word.term,
          requiredWordsWithVariants[0].word.term,
          requiredWordsWithVariants[2].word.term
        ];
        
        // Check if user's sentence matches either order (accepting variants)
        const matchesOrder1 = order1Terms.every((reqTerm, idx) => {
          const userTerm = userTerms[idx];
          const reqWord = requiredWordsWithVariants[idx];
          return reqWord.validTerms.includes(userTerm);
        });
        
        const matchesOrder2 = order2Terms.every((reqTerm, idx) => {
          const originalIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
          const userTerm = userTerms[idx];
          const reqWord = requiredWordsWithVariants[originalIdx];
          return reqWord.validTerms.includes(userTerm);
        });
        
        isAnswerCorrect = matchesOrder1 || matchesOrder2;
      }
    } else {
      // For other sentence types, check order and accept variants
      const requiredWordsWithVariants = currentExercise.requiredWords.map(w => ({
        word: w,
        validTerms: getAllValidVariants(w)
      }));
      
      const matchesOrder = requiredWordsWithVariants.every(({ validTerms }, idx) => {
        const userTerm = userTerms[idx];
        return validTerms.includes(userTerm);
      }) && userTerms.length === requiredWordsWithVariants.length;
      
      isAnswerCorrect = matchesOrder;
    }
    
    setIsCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      setTimeout(() => {
        nextExercise();
      }, 1500);
    }
  };

  const nextExercise = () => {
    const nextIndex = currentSentenceIndex + 1;
    if (nextIndex < exercises.length) {
      setCurrentSentenceIndex(nextIndex);
      const nextExercise = exercises[nextIndex];
      setCurrentExercise(nextExercise);
      setSelectedWords([]);
      setSelectedVariants({}); // Clear variant selections
      setAvailableWords([
        ...nextExercise.requiredWords,
        ...nextExercise.distractors
      ].sort(() => Math.random() - 0.5));
      setIsCorrect(null);
      setShowHint(false);
    } else {
      onComplete();
    }
  };

  const resetExercise = () => {
    setSelectedWords([]);
    setSelectedVariants({}); // Clear variant selections
    setIsCorrect(null);
    setShowHint(false);
  };

  if (!currentExercise) {
    // If there are no exercises, show a helpful message
    if (exercises.length === 0) {
      return (
        <div className="p-4 border rounded-lg shadow" style={{ maxWidth: 600, margin: '2em auto', background: '#fff8fa' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#b48bbd' }}>Sentence Construction</h2>
          <p className="text-center text-gray-600">Not enough vocabulary to generate grammar exercises.<br/>Complete more units or check your <code>lessons.json</code> file.</p>
        </div>
      );
    }
    // Otherwise, still loading
    return (
      <div className="p-4 border rounded-lg shadow" style={{ maxWidth: 600, margin: '2em auto', background: '#fff8fa' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#b48bbd' }}>Sentence Construction</h2>
        <p className="text-center text-gray-600">Loading exercises...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg shadow" style={{ maxWidth: 700, margin: '2em auto', background: '#fff8fa' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold" style={{ color: '#b48bbd' }}>Build the Sentence</h2>
        <p className="text-sm text-gray-600">
          Exercise {currentSentenceIndex + 1} of {exercises.length}
        </p>
      </div>

      {/* Target English Sentence */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold mb-2 text-blue-800">Translate this sentence:</h3>
        <p className="text-lg font-medium">{buildEnglishSentence(currentExercise)}</p>
      </div>

      {/* User's Built Sentence */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5em' }}>
          <h3 className="font-bold mb-2" style={{ marginBottom: 0, marginRight: '0.5em' }}>Your sentence:</h3>
          <button
            onClick={() => speakText(selectedWords.map(w => {
              const variantTerm = selectedVariants[w.term];
              return variantTerm || w.term;
            }).join(' '))}
            className="minimal-btn"
            style={{
              background: '#e0e7ff',
              border: '1.5px solid #a6c1ee',
              color: '#222',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '0.2em',
              minWidth: 32,
              minHeight: 32,
              maxWidth: 32,
              maxHeight: 32,
              boxShadow: '0 2px 8px rgba(166,193,238,0.08)',
            }}
            title="Play your sentence"
            aria-label="Play your sentence"
            disabled={selectedWords.length === 0}
          >
            <FiVolume2 size={18} color="#222" />
          </button>
        </div>
        <div className="min-h-[2.5rem] p-2 border rounded bg-white">
          {selectedWords.length === 0 ? (
            <span className="text-gray-400 italic">Select words to build your sentence...</span>
          ) : (
            <span className="text-lg">{selectedWords.map(w => {
              const variantTerm = selectedVariants[w.term];
              return variantTerm || w.term;
            }).join(' ')}</span>
          )}
        </div>
        
        {/* Feedback */}
        {isCorrect !== null && (
          <div className={`mt-2 p-2 rounded flex items-center gap-2 ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isCorrect ? <FiCheck /> : <FiX />}
            <span>
              {isCorrect ? 'Correct!' : 'Try again'}
            </span>
          </div>
        )}
      </div>

      {/* Available Words */}
      <div className="mb-6">
        <h3 className="font-bold mb-3">Available words:</h3>
        <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '0.7em', justifyContent: 'center' }}>
          {(availableWords.slice(0, Math.max(10, availableWords.length))).map((word, index) => {
            const isSelected = selectedWords.some(w => w.term === word.term);
            
            // Show dropdown if word has variants, otherwise show regular button
            if (hasVariants(word)) {
              return (
                <WordVariantDropdown
                  key={`${word.term}-${index}`}
                  word={word}
                  onSelectVariant={handleVariantSelect}
                  onSelectWord={handleWordSelect}
                  selectedVariant={selectedVariants[word.term]}
                  isSelected={isSelected}
                />
              );
            }
            
            // Regular button for words without variants
            return (
              <button
                key={`${word.term}-${index}`}
                onClick={() => handleWordSelect(word)}
                className={`p-3 border rounded text-sm transition-colors ${
                  isSelected
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                style={{
                  display: 'inline-block',
                  width: 'auto',
                  fontWeight: 600,
                  marginBottom: '0.5em',
                  padding: '0.42em 0.75em',
                  cursor: 'pointer',
                  transition: 'background 0.18s, border 0.18s, color 0.18s',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  whiteSpace: 'nowrap',
                }}
              >
                <div className="font-medium">{word.term}</div>
                <div className="text-xs text-gray-600">{word.transliteration}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7em', justifyContent: 'center', marginBottom: '1.2em' }}>
        <button
          onClick={checkAnswer}
          disabled={selectedWords.length === 0}
          className="pastel-button action-btn"
          style={{
            opacity: selectedWords.length === 0 ? 0.5 : 1,
            background: '#b7e4c7', // pastel green
            color: '#222',
            fontWeight: 700,
            padding: '0.55em 1.5em',
            borderRadius: '12px',
            fontSize: '1.13em',
            minWidth: 0,
            width: 'auto',
            boxShadow: '0 2px 8px rgba(166,193,238,0.08)',
            border: '2px solid #8fc89a', // darker green
          }}
        >
          Check Answer
        </button>
        <button
          onClick={resetExercise}
          className="pastel-button action-btn"
          style={{
            background: '#ffe066', // pastel yellow
            color: '#222',
            fontWeight: 700,
            padding: '0.55em 1.5em',
            borderRadius: '12px',
            fontSize: '1.13em',
            minWidth: 0,
            width: 'auto',
            boxShadow: '0 2px 8px rgba(166,193,238,0.08)',
            border: '2px solid rgb(239, 206, 70)', // darker yellow
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setShowHint(!showHint)}
          className="pastel-button action-btn"
          style={{
            background: '#f7c1e3', // pastel pink
            color: '#222',
            fontWeight: 700,
            padding: '0.55em 1.5em',
            borderRadius: '12px',
            fontSize: '1.13em',
            minWidth: 0,
            width: 'auto',
            boxShadow: '0 2px 8px rgba(166,193,238,0.08)',
            border: '2px solid #e09ac3', // darker pink
          }}
        >
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
        {/* Example: blue button for a future extra action
        <button className="pastel-button" style={{ background: '#a6c1ee', color: '#222', ... }}>Blue Action</button>
        */}
      </div>

      {/* Hint */}
      {showHint && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-bold mb-2 text-yellow-800">Hint:</h4>
          <p className="text-sm">
            Nepali sentence structure: <strong>{currentExercise.template.nepali_structure}</strong>
          </p>
          <p className="text-sm mt-1">
            You need: {currentExercise.template.required_parts.join(', ')}
          </p>
        </div>
      )}

      {/* Correct Answer (shown after wrong attempt) */}
      {isCorrect === false && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-bold mb-2 text-green-800">Correct answer:</h4>
          <p className="font-medium">{currentExercise.targetNepali}</p>
          <p className="text-sm text-gray-600">{currentExercise.targetTransliteration}</p>
        </div>
      )}
    </div>
  );
};

export default SentenceConstruction; 