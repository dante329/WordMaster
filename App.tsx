import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ImportView } from './components/ImportView';
import { LearnView } from './components/LearnView';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { Word, Settings, UserStats } from './types';
import { 
  getWords, saveWords, getSettings, saveSettings, 
  getStats, saveStats, calculateNextReview, getDueWords 
} from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState('home');
  const [words, setWords] = useState<Word[]>([]);
  const [settings, setSettingsState] = useState<Settings>(getSettings());
  const [stats, setStatsState] = useState<UserStats>(getStats());
  
  // Learning Session State
  const [learnQueue, setLearnQueue] = useState<Word[]>([]);

  useEffect(() => {
    setWords(getWords());
  }, []);

  const updateSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const handleAddWords = (newWords: Word[]) => {
    const updated = [...words, ...newWords];
    setWords(updated);
    saveWords(updated);
    setView('library');
  };

  const handleUpdateWord = (updatedWord: Word) => {
    const updated = words.map(w => w.id === updatedWord.id ? updatedWord : w);
    setWords(updated);
    saveWords(updated);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = words.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w);
    setWords(updated);
    saveWords(updated);
  };

  const handleDeleteWord = (id: string) => {
    if (confirm('确定要删除这个单词吗？')) {
      const updated = words.filter(w => w.id !== id);
      setWords(updated);
      saveWords(updated);
    }
  };

  const startLearning = () => {
    const due = getDueWords(words);
    // If no due words but we have words, review oldest
    const queue = due.length > 0 ? due : [...words].sort((a,b) => a.lastReviewDate! - b.lastReviewDate!).slice(0, 10);
    setLearnQueue(queue);
    setView('learn-mode');
  };

  const handleReview = (word: Word, quality: number, duration: number) => {
    // SRS Update
    const updatedWord = calculateNextReview(word, quality);
    
    // State Update
    const updatedWords = words.map(w => w.id === word.id ? updatedWord : w);
    setWords(updatedWords);
    saveWords(updatedWords);

    // Stats Update
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastDate = new Date(stats.lastStudyDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();

    let newStreak = stats.streakDays;
    if (today > lastDay) {
        // New day
        if (today - lastDay === 86400000) { // Consecutive day (ms)
            newStreak++;
        } else if (today !== lastDay) {
            newStreak = 1; 
        }
    }

    const newStats = {
      ...stats,
      totalLearned: stats.totalLearned + (quality >= 3 ? 1 : 0),
      studyTimeSeconds: stats.studyTimeSeconds + duration,
      lastStudyDate: now.getTime(),
      streakDays: newStreak === 0 ? 1 : newStreak
    };
    setStatsState(newStats);
    saveStats(newStats);
  };

  if (view === 'learn-mode') {
    return (
      <LearnView 
        queue={learnQueue}
        settings={settings}
        onReview={handleReview}
        onExit={() => setView('home')}
      />
    );
  }

  return (
    <Layout activeView={view} onChangeView={setView}>
      {view === 'home' && (
        <Dashboard 
          words={words} 
          stats={stats} 
          settings={settings}
          onStartLearning={startLearning}
          onAddWord={(word) => handleAddWords([word])}
        />
      )}
      {view === 'import' && (
        <ImportView onAddWords={handleAddWords} />
      )}
      {view === 'library' && (
        <LibraryView 
          words={words} 
          title="词库管理"
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteWord}
          onUpdate={handleUpdateWord}
        />
      )}
      {view === 'favorites' && (
        <LibraryView 
          words={words.filter(w => w.isFavorite)} 
          title="我的收藏"
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteWord}
          onUpdate={handleUpdateWord}
        />
      )}
      {view === 'settings' && (
        <SettingsView 
          settings={settings} 
          onUpdate={updateSettings} 
          apiKey={process.env.API_KEY || ''}
        />
      )}
    </Layout>
  );
};

export default App;