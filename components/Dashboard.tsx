import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Word, UserStats, Settings, ParsedWord, Proficiency } from '../types';
import { getDueWords } from '../services/storageService';
import { quickLookup, getSearchSuggestions } from '../services/geminiService';
import { speakText } from '../services/ttsService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, Clock, Target, Play, Search, Loader2, Volume2, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  words: Word[];
  stats: UserStats;
  settings: Settings;
  onStartLearning: () => void;
  onAddWord: (word: Word) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ words, stats, settings, onStartLearning, onAddWord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ParsedWord | null>(null);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<{term: string, definition: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [showModal, setShowModal] = useState(false);

  const dueWords = useMemo(() => getDueWords(words), [words]);
  
  const proficiencyData = useMemo(() => {
    const counts = { New: 0, Learning: 0, Review: 0, Mastered: 0 };
    words.forEach(w => { counts[w.proficiency]++ });
    return [
      { name: '新词', value: counts.New, color: '#94a3b8' },
      { name: '学习中', value: counts.Learning, color: '#6366f1' },
      { name: '复习', value: counts.Review, color: '#f59e0b' },
      { name: '已掌握', value: counts.Mastered, color: '#10b981' },
    ].filter(d => d.value > 0);
  }, [words]);

  const progressPercent = Math.min(100, Math.round((stats.totalLearned % settings.dailyGoal) / settings.dailyGoal * 100));

  // Debounced Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        const results = await getSearchSuggestions(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (term: string) => {
     if (!term.trim()) return;

     setShowSuggestions(false); // Hide dropdown
     setIsSearching(true);
     setSuggestions([]);

     // Check local library first
     const localWord = words.find(w => w.term.toLowerCase() === term.toLowerCase().trim());
     if (localWord) {
       alert(`"${localWord.term}" 已经在你的词库中了！\n释义: ${localWord.definition}`);
       setSearchQuery('');
       setIsSearching(false);
       return;
     }

     try {
       const result = await quickLookup(term);
       if (result) {
         setSearchResult(result);
         setShowModal(true);
         speakText(result.term, settings.accent);
       } else {
         // Fallback failed logic
         alert(`未能找到单词 "${term}"。\n\n可能原因：\n1. 单词拼写错误\n2. AI Key 未配置或失效 (Vercel请检查环境变量)\n3. 网络连接问题`);
       }
     } catch (err) {
       console.error(err);
       alert("查询过程中发生未知错误，请重试。");
     } finally {
       setIsSearching(false);
     }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const saveSearchedWord = () => {
    if (!searchResult) return;
    const newWord: Word = {
      id: crypto.randomUUID(),
      term: searchResult.term,
      definition: searchResult.definition,
      example: searchResult.example || '',
      exampleTranslation: searchResult.exampleTranslation || '',
      phonetic: searchResult.phonetic || '',
      tags: ['searched'],
      proficiency: Proficiency.New,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: Date.now(),
      isFavorite: false
    };
    onAddWord(newWord);
    setShowModal(false);
    setSearchQuery('');
    setSearchResult(null);
    alert("成功添加到词库！");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      
      {/* Search Result Modal */}
      <AnimatePresence>
        {showModal && searchResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              {/* Header / Basic Info */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-end gap-3 flex-wrap">
                      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {searchResult.term}
                      </h3>
                      <button 
                          onClick={() => speakText(searchResult.term, settings.accent)}
                          className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                        >
                          <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    {searchResult.phonetic && (
                      <span className="text-gray-500 font-mono text-base">[{searchResult.phonetic}]</span>
                    )}
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                    ✕
                  </button>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">释义</h4>
                  <p className="text-gray-800 text-lg font-medium leading-relaxed">{searchResult.definition}</p>
                </div>

                <div className="mt-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                   <h4 className="text-xs font-bold text-indigo-400 uppercase mb-1.5">例句</h4>
                   <p className="text-gray-800 italic text-sm leading-relaxed">"{searchResult.example}"</p>
                   {searchResult.exampleTranslation && (
                     <p className="text-gray-500 text-xs mt-1">{searchResult.exampleTranslation}</p>
                   )}
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  关闭
                </button>
                <button 
                  onClick={saveSearchedWord}
                  className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> 加入生词本
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来!</h1>
          <p className="text-gray-500 mt-1">今天有 <span className="text-indigo-600 font-bold">{dueWords.length}</span> 个单词需要复习。</p>
        </div>
        <button 
          onClick={onStartLearning}
          disabled={dueWords.length === 0 && words.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5 fill-current" />
          开始背单词
        </button>
      </div>

      {/* Search Bar with Autocomplete */}
      <div className="relative z-10 w-full">
        <form onSubmit={handleSearchSubmit} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" /> : <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />}
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="输入单词快速查询..."
            className="block w-full pl-11 pr-24 py-4 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm shadow-sm transition-shadow"
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <button 
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="bg-gray-900 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              查询
            </button>
          </div>
        </form>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 max-h-80 overflow-y-auto custom-scrollbar"
            >
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion.term);
                      performSearch(suggestion.term);
                    }}
                    className="px-6 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{suggestion.term}</span>
                      <span className="ml-3 text-sm text-gray-500 truncate max-w-xs inline-block align-bottom">{suggestion.definition}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400" />
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">今日目标</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stats.totalLearned % settings.dailyGoal}</span>
              <span className="text-sm text-gray-400">/ {settings.dailyGoal} 词</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
               <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">坚持天数</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{stats.streakDays}</span>
              <span className="text-sm text-gray-400">天</span>
            </div>
            <p className="text-xs text-orange-600 mt-1 font-medium">继续保持!</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">学习时长</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">{Math.round(stats.studyTimeSeconds / 60)}</span>
              <span className="text-sm text-gray-400">分钟</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">熟练度分布</h3>
          <div className="h-64">
            {words.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proficiencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {proficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                暂无单词，请先导入。
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {proficiencyData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ebbinghaus Illustration (Static for Visual) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">记忆遗忘曲线</h3>
          <p className="text-sm text-gray-500 mb-6">
            WordMaster 根据艾宾浩斯曲线科学安排复习时间，用最少的时间达到最好的记忆效果。
          </p>
          <div className="h-48 flex items-end justify-between gap-1 px-4">
             {[100, 45, 30, 25, 20, 18, 15].map((h, i) => (
               <div key={i} className="w-full bg-indigo-100 rounded-t-md relative group">
                 <div 
                  className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-1000" 
                  style={{ height: `${h}%` }}
                 ></div>
                 <div className="absolute -bottom-6 text-xs text-gray-400 w-full text-center">第{i}天</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};