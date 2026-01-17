import React, { useState, useEffect, useCallback } from 'react';
import { Word, Settings } from '../types';
import { speakText } from '../services/ttsService';
import { playFeedbackSound } from '../services/audioService';
import { Volume2, ChevronRight, Check, X, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LearnViewProps {
  queue: Word[];
  settings: Settings;
  onReview: (word: Word, quality: number, duration: number) => void;
  onExit: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({ queue, settings, onReview, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{word: string, quality: number}[]>([]);
  const [startTime, setStartTime] = useState(Date.now());

  const currentWord = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  useEffect(() => {
    if (currentWord && !isFlipped && !isFinished && settings.autoPronounce) {
      // Small delay to allow transition
      const timer = setTimeout(() => {
        speakText(currentWord.term, settings.accent);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentWord, isFlipped, isFinished, settings.autoPronounce, settings.accent]);

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  const handleRate = (quality: number) => {
    // Play sound effect
    if (settings.enableSoundEffects) {
      if (quality === 5) playFeedbackSound('correct');
      else if (quality === 3) playFeedbackSound('blur');
      else playFeedbackSound('wrong');
    }

    const duration = (Date.now() - startTime) / 1000;
    onReview(currentWord, quality, duration);
    setSessionResults([...sessionResults, { word: currentWord.term, quality }]);
    
    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (!currentWord || isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">学习完成！</h2>
          <p className="text-gray-500 mb-8">本次复习了 {sessionResults.length} 个单词。</p>
          
          <button 
            onClick={onExit}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 text-white/80">
        <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-sm font-medium tracking-widest">
          {currentIndex + 1} / {queue.length}
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id + (isFlipped ? '-flipped' : '-front')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl text-center"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <div className="cursor-pointer">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                {currentWord.term}
              </h2>
              
              <div className="flex items-center justify-center gap-3 mb-8">
                {currentWord.phonetic && (
                  <span className="text-indigo-200 font-mono text-xl">[{currentWord.phonetic}]</span>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(currentWord.term, settings.accent);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              {isFlipped ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl"
                >
                  <div className="text-2xl text-white font-medium mb-6 leading-relaxed flex items-center justify-center gap-2">
                    {currentWord.partOfSpeech && (
                        <span className="text-lg italic text-indigo-300 font-serif self-start mt-1">
                            {currentWord.partOfSpeech}
                        </span>
                    )}
                    <span>{currentWord.definition}</span>
                  </div>
                  
                  <div className="bg-black/20 rounded-xl p-6 text-left space-y-4">
                    {/* Main Example */}
                    <div>
                      <p className="text-lg text-indigo-100 italic mb-2">"{currentWord.example}"</p>
                      {currentWord.exampleTranslation && (
                        <p className="text-sm text-gray-400">{currentWord.exampleTranslation}</p>
                      )}
                    </div>
                    
                    {/* Additional Examples */}
                    {currentWord.additionalExamples && currentWord.additionalExamples.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-xs font-bold text-white/50 uppercase mb-2">更多例句</p>
                        <div className="space-y-3">
                          {currentWord.additionalExamples.map((ex, idx) => (
                             <div key={idx}>
                               <p className="text-sm text-indigo-100/80 italic">"{ex.sentence}"</p>
                               <p className="text-xs text-gray-500">{ex.translation}</p>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <p className="text-white/40 mt-12 animate-pulse">点击查看释义</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="h-32 p-6 max-w-4xl mx-auto w-full">
        {isFlipped ? (
          <div className="grid grid-cols-3 gap-4 h-full">
            <button 
              onClick={() => handleRate(1)}
              className="flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20"
            >
              <X className="w-6 h-6 mb-1" />
              <span className="font-semibold">不认识</span>
            </button>
            <button 
              onClick={() => handleRate(3)}
              className="flex flex-col items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-900/20"
            >
              <HelpCircle className="w-6 h-6 mb-1" />
              <span className="font-semibold">模糊</span>
            </button>
            <button 
              onClick={() => handleRate(5)}
              className="flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-green-900/20"
            >
              <Check className="w-6 h-6 mb-1" />
              <span className="font-semibold">认识</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsFlipped(true)}
            className="w-full h-full bg-white text-gray-900 text-xl font-bold rounded-2xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            查看答案
          </button>
        )}
      </div>
    </div>
  );
};