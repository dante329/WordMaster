import { Word, Settings, UserStats, Proficiency } from '../types';
import { DEFAULT_SETTINGS, INITIAL_STATS } from '../constants';

const KEYS = {
  WORDS: 'wordmaster_words',
  SETTINGS: 'wordmaster_settings',
  STATS: 'wordmaster_stats',
};

// --- Storage Helpers ---

export const getWords = (): Word[] => {
  const data = localStorage.getItem(KEYS.WORDS);
  return data ? JSON.parse(data) : [];
};

export const saveWords = (words: Word[]) => {
  localStorage.setItem(KEYS.WORDS, JSON.stringify(words));
};

export const getSettings = (): Settings => {
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const getStats = (): UserStats => {
  const data = localStorage.getItem(KEYS.STATS);
  return data ? { ...INITIAL_STATS, ...JSON.parse(data) } : INITIAL_STATS;
};

export const saveStats = (stats: UserStats) => {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
};

// --- SRS Logic (SuperMemo-2 Simplified) ---

export const calculateNextReview = (word: Word, quality: number): Word => {
  // Quality: 0 (Don't Know), 3 (Blurry), 5 (Know)
  
  let { easinessFactor, repetitions, interval } = word;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
    // SM-2 EF update formula
    easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }

  if (easinessFactor < 1.3) easinessFactor = 1.3;

  const now = new Date();
  const nextReview = new Date();
  nextReview.setDate(now.getDate() + interval);

  let newProficiency = Proficiency.Learning;
  if (repetitions > 5) newProficiency = Proficiency.Mastered;
  else if (repetitions > 2) newProficiency = Proficiency.Review;

  return {
    ...word,
    easinessFactor,
    repetitions,
    interval,
    proficiency: newProficiency,
    lastReviewDate: now.getTime(),
    nextReviewDate: nextReview.getTime(),
  };
};

export const getDueWords = (words: Word[]): Word[] => {
  const now = Date.now();
  return words.filter(w => w.nextReviewDate <= now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
};