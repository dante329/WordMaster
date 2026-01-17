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
    // 查重逻辑
    const existingTerms = new Set(words.map(w => w.term.toLowerCase().trim()));
    const uniqueNewWords = newWords.filter(w => !existingTerms.has(w.term.toLowerCase().trim()));

    if (uniqueNewWords.length === 0) {
      alert("这些单词都已经存在于你的词库中了！");
      return;
    }

    if (uniqueNewWords.length < newWords.length) {
      const duplicateCount = newWords.length - uniqueNewWords.length;
      alert(`已自动过滤 ${duplicateCount} 个重复单词，成功添加 ${uniqueNewWords.length} 个新词。`);
    } else {
      // 只有在没有重复时才不弹窗（或者根据你的需求，也可以不弹）
      // 这里不做额外提示，交给 ImportView 处理成功提示
    }

    const updated = [...words, ...uniqueNewWords];
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

  // 新增：清空所有单词
  const handleDeleteAllWords = () => {
    if (confirm('⚠️ 高危操作：确定要清空所有单词吗？此操作无法撤销！')) {
      if (confirm('请再次确认：真的要删除全部吗？')) {
        setWords([]);
        saveWords([]);
        alert('词库已清空');
      }
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
          onDeleteAll={handleDeleteAllWords}
          onUpdate={handleUpdateWord}
        />
      )}
      {view === 'favorites' && (
        <LibraryView 
          words={words.filter(w => w.isFavorite)} 
          title="我的收藏"
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteWord}
          // 收藏页面不需要清空所有功能，传入空或者 undefined 处理
          onDeleteAll={() => {}} 
          onUpdate={handleUpdateWord}
        />
      )}
      {view === 'settings' && (
        <SettingsView 
          settings={settings} 
          onUpdate={updateSettings} 
          apiKey={(import.meta as any).env.VITE_DEEPSEEK_API_KEY || ''}
        />
      )}
    </Layout>
  );
};

export default App;