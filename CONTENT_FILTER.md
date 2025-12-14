# Content Filter Documentation

## Overview

The content filter system automatically detects and blocks inappropriate or NSFW (Not Safe For Work) content in the Nepali learning app. This ensures that all generated exercises and vocabulary remain appropriate for educational use.

## Features

### 1. Automatic Content Detection
- **High-severity content**: Sexual, violent, drug-related, profanity
- **Medium-severity content**: War, politics, religion, money-related topics
- **Vocabulary filtering**: Checks both Nepali terms and English definitions
- **Exercise filtering**: Validates complete sentences before display

### 2. Multi-level Filtering
- **Vocabulary level**: Filters inappropriate words from the vocabulary pool
- **Exercise level**: Removes exercises with inappropriate content
- **Sentence level**: Validates generated English sentences
- **Real-time filtering**: Checks content as it's generated

## Usage

### Basic Content Check
```javascript
import { checkContentSafety } from './utils/contentFilter';

const result = checkContentSafety("The student reads a book");
// Returns: { isNSFW: false, severity: 'low' }

const result2 = checkContentSafety("The engineer does not have pants");
// Returns: { isNSFW: true, reason: 'Contains inappropriate content', severity: 'high' }
```

### Exercise Filtering
```javascript
import { filterSafeExercises } from './utils/contentFilter';

const safeExercises = filterSafeExercises(exercises);
// Automatically removes inappropriate exercises
```

## Filtered Content Categories

### High Severity (Blocked)
- **Sexual content**: underwear, naked, sexual, intimate
- **Violence**: kill, murder, weapon, attack
- **Drugs**: drug, alcohol, smoking, marijuana
- **Profanity**: fuck, shit, damn, bitch
- **Adult content**: porn, explicit, mature

### Medium Severity (Blocked)
- **War/Conflict**: war, battle, fighting, conflict
- **Legal issues**: police, arrest, jail, crime
- **Sensitive topics**: money, politics, religion

## Implementation Details

### Integration Points
1. **Vocabulary loading**: Filters words during vocabulary initialization
2. **Exercise generation**: Removes inappropriate exercises from the pool
3. **Sentence building**: Validates generated English sentences
4. **Real-time checking**: Validates content as it's displayed

### Logging
The system logs all blocked content to the console:
```
[CONTENT FILTER] Blocked vocabulary word: "inappropriate_term" - Contains inappropriate content
[CONTENT FILTER] Blocked exercise: "inappropriate sentence" - Contains inappropriate content
```

## Customization

### Adding New Patterns
To add new inappropriate content patterns, edit `src/utils/contentFilter.js`:

```javascript
const NSFW_PATTERNS = [
  // Add your custom patterns here
  /\b(your_pattern_here)\b/i,
];
```

### Adjusting Severity
Modify the severity levels by updating the pattern arrays:
- `NSFW_PATTERNS`: High severity (always blocked)
- `QUESTIONABLE_PATTERNS`: Medium severity (blocked with warning)

## Testing

Run the test file to verify the content filter:
```bash
node src/utils/contentFilter.test.js
```

## Benefits

1. **Educational safety**: Ensures all content is appropriate for learning
2. **Automatic filtering**: No manual content review needed
3. **Comprehensive coverage**: Filters at multiple levels
4. **Easy maintenance**: Simple pattern-based system
5. **Performance**: Fast regex-based filtering

## Maintenance

- **Regular updates**: Review and update patterns as needed
- **User feedback**: Monitor for false positives/negatives
- **Content review**: Periodically check filtered content logs
- **Pattern optimization**: Refine patterns based on usage

The content filter ensures that the Nepali learning app remains a safe, educational environment for all users while maintaining the quality and effectiveness of the learning experience.

