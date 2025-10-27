// /src/services/ai/safety/rules/profanityRules.ts

/**
 * Custom profanity and offensive language detection rules
 * Extended beyond bad-words library for domain-specific content
 */

export const customProfanityList = [
  // Additional profanity not covered by bad-words
  'scam',
  'fraud',
  'cheat',
  'steal',
  // Common profanity for testing
  'fucking',
  'fuck',
  'shit',
  'damn',
  'hell',
];

export const harassmentPatterns = [
  // Patterns indicating harassment or bullying
  /you\s+(are|r)\s+(stupid|dumb|idiot|moron)/i,
  /kill\s+yourself/i,
  /nobody\s+likes\s+you/i,
  /worthless/i,
  /waste\s+of\s+space/i,
  /(fucking|completely)\s+(terrible|stupid|worthless)/i,
  /trash/i,
];

export const selfHarmIndicators = [
  // Self-harm and suicide-related terms
  /suicid(e|al)/i,
  /kill\s+myself/i,
  /(want|going)\s+to\s+kill\s+myself/i,
  /end\s+(it|my\s+life)/i,
  /cut\s+myself/i,
  /self\s*harm/i,
];

export const spamPatterns = [
  // Common spam indicators
  /click\s+here/i,
  /free\s+money/i,
  /limited\s+time/i,
  /act\s+now/i,
  /\$\$\$/,
  /make\s+money\s+fast/i,
];
