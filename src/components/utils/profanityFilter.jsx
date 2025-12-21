// Profanity word list
const PROFANITY_WORDS = [
  'asshole', 'bastard', 'bitch', 'blowjob', 'bollocks', 'boner', 'crap', 'cunt', 
  'damn', 'dick', 'dickhead', 'dildo', 'douche', 'dumbass', 'fag', 'faggot', 
  'fanny', 'fuck', 'fucked', 'fucker', 'fucking', 'goddamn', 'jackass', 'jerkoff', 
  'motherfucker', 'poes', 'piss', 'pissed', 'pisses', 'pissy', 'prick', 'pussy', 
  'queer', 'retarded', 'shit', 'sh1t', '5hit', 'shitting', 'shitty', 'slut', 
  'suck', 'titties', 'tits', 'twat', 'wank', 'whore', 'biatch', 'skank', 
  'bollock', 'cum', 'cock', 'dickwad'
];

/**
 * Filters profanity from text by replacing profane words with asterisks
 * @param {string} text - The text to filter
 * @param {boolean} isEnabled - Whether profanity filtering is enabled for the user
 * @returns {string} - The filtered text
 */
export function filterProfanity(text, isEnabled = false) {
  if (!isEnabled || !text) {
    return text;
  }

  let filteredText = text;

  PROFANITY_WORDS.forEach(word => {
    // Create a regex that matches the word with word boundaries, case-insensitive
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    
    // Replace each occurrence with asterisks of the same length
    filteredText = filteredText.replace(regex, (match) => {
      return '*'.repeat(match.length);
    });
  });

  return filteredText;
}