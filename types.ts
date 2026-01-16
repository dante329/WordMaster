
export enum Proficiency {
  New = 'New',
  Learning = 'Learning',
  Review = 'Review',
  Mastered = 'Mastered'
}

export interface Example {
  sentence: string;
  translation: string;
}

export interface Word {
  id: string;
  term: string;
  definition: string;
  phonetic?: string;
  example: string;
  exampleTranslation?: string;
  tags: string[]; // System tags like 'imported', 'searched'
  
  // SRS Data
  proficiency: Proficiency;
  easinessFactor: number; // SM-2 parameter (default 2.5)
  interval: number; // Days until next review
  repetitions: number; // Consecutive successful reviews
  nextReviewDate: number; // Timestamp
  lastReviewDate?: number; // Timestamp
  isFavorite: boolean;
  
  // Expanded Data
  additionalExamples?: Example[];
}

export interface Settings {
  dailyGoal: number;
  autoPronounce: boolean;
  enableSoundEffects: boolean;
  accent: 'US' | 'UK';
  theme: 'light' | 'dark';
}

export interface UserStats {
  totalLearned: number;
  studyTimeSeconds: number; // Total seconds studied
  streakDays: number;
  lastStudyDate: number; // Timestamp
}

export interface ParsedWord {
  term: string;
  definition: string;
  example: string;
  exampleTranslation?: string;
  phonetic?: string;
  selected?: boolean;
  
  // Extended fields
  additionalExamples?: Example[];
}
