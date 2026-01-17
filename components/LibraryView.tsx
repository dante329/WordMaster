import React, { useState } from 'react';
import { Word, Example } from '../types';
import { Search, Star, Trash2, Edit2, Check, X, Plus, MinusCircle, Volume2, AlertCircle } from 'lucide-react';
import { speakText } from '../services/ttsService';

interface LibraryViewProps {
  words: Word[];
  title?: string;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll?: () => void; // Optional, only for main library
  onUpdate: (updatedWord: Word) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ words, title = "单词本", onToggleFavorite, onDelete, onDeleteAll, onUpdate }) => {
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const filteredWords = words.filter(w => 
    w.term.toLowerCase().includes(search.toLowerCase()) || 
    w.definition.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWord) {
      // Filter out empty additional examples
      const cleanExamples = (editingWord.additionalExamples || []).filter(ex => ex.sentence.trim() !== '');
      onUpdate({ ...editingWord, additionalExamples: cleanExamples });
      setEditingWord(null);
    }
  };

  const addExample = () => {
    if (!editingWord) return;
    const currentExamples = editingWord.additionalExamples || [];
    setEditingWord({
      ...editingWord,
      additionalExamples: [...currentExamples, { sentence: '', translation: '' }]
    });
  };

  const removeExample = (index: number) => {
    if (!editingWord) return;
    const currentExamples = [...(editingWord.additionalExamples || [])];
    currentExamples.splice(index, 1);
    setEditingWord({
      ...editingWord,
      additionalExamples: currentExamples
    });
  };

  const updateExample = (index: number, field: keyof Example, value: string) => {
    if (!editingWord) return;
    const currentExamples = [...(editingWord.additionalExamples || [])];
    currentExamples[index] = { ...currentExamples[index], [field]: value };
    setEditingWord({
      ...editingWord,
      additionalExamples: currentExamples
    });
  };

  return (
    <div className="p-8 h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{title} <span className="text-sm font-normal text-gray-500 ml-2">({words.length} 词)</span></h2>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索单词或释义..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full md:w-64"
            />
          </div>
          
          {/* 只有在主词库页面且有单词时才显示清空按钮 */}
          {onDeleteAll && words.length > 0 && title === "词库管理" && (
            <button 
              onClick={onDeleteAll}
              className="flex items-center gap-1 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              title="清空所有单词"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {filteredWords.map((word) => (
                <div key={word.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                     <div className="flex items-center gap-3 flex-wrap">
                       <span className="font-bold text-lg text-gray-900 break-words">{word.term}</span>
                       {word.phonetic && (
                         <span className="text-sm text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">[{word.phonetic}]</span>
                       )}
                       <button onClick={() => speakText(word.term)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                         <Volume2 className="w-4 h-4" />
                       </button>
                       {/* 显示熟练度标签 */}
                       <span className={`text-xs px-2 py-0.5 rounded-full ${
                         word.proficiency === 'Mastered' ? 'bg-green-100 text-green-700' :
                         word.proficiency === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                         word.proficiency === 'Learning' ? 'bg-blue-100 text-blue-700' :
                         'bg-gray-100 text-gray-500'
                       }`}>
                         {word.proficiency === 'New' ? '新词' : 
                          word.proficiency === 'Learning' ? '学习中' :
                          word.proficiency === 'Review' ? '复习' : '已掌握'}
                       </span>
                     </div>
                     <p className="text-gray-600 mt-1 break-words">{word.definition}</p>
                     <p className="text-xs text-gray-400 mt-1 italic truncate">{word.example}</p>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button 
                      onClick={() => setEditingWord(word)}
                      className="p-2 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onToggleFavorite(word.id)}
                      className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${word.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`}
                      title="收藏"
                    >
                      <Star className={`w-4 h-4 ${word.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={() => onDelete(word.id)}
                      className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>未找到单词。</p>
              {words.length === 0 && (
                <p className="text-sm mt-2 text-indigo-500">去导入一些单词或者添加新词吧！</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (保持不变) */}
      {editingWord && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 rounded-2xl">
           <form onSubmit={handleEditSave} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
               <h3 className="font-bold text-gray-900">编辑单词</h3>
               <button type="button" onClick={() => setEditingWord(null)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">单词 (Term)</label>
                 <div className="flex items-center gap-2">
                    <input 
                        type="text" 
                        value={editingWord.term}
                        onChange={(e) => setEditingWord({...editingWord, term: e.target.value})}
                        className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        required
                    />
                    {editingWord.phonetic && (
                         <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-500 font-mono text-sm">
                             [{editingWord.phonetic}]
                         </div>
                    )}
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">释义 (Definition)</label>
                 <textarea 
                    value={editingWord.definition}
                    onChange={(e) => setEditingWord({...editingWord, definition: e.target.value})}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                    required
                 />
               </div>

               <div className="border-t border-gray-100 pt-4">
                 <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-gray-900">例句</label>
                 </div>
                 
                 <div className="space-y-4">
                    {/* Primary Example */}
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                        <input 
                            type="text" 
                            placeholder="英文例句"
                            value={editingWord.example}
                            onChange={(e) => setEditingWord({...editingWord, example: e.target.value})}
                            className="w-full p-2 mb-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                        <input 
                            type="text" 
                            placeholder="中文翻译"
                            value={editingWord.exampleTranslation || ''}
                            onChange={(e) => setEditingWord({...editingWord, exampleTranslation: e.target.value})}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-600"
                        />
                    </div>

                    {/* Additional Examples */}
                    {editingWord.additionalExamples?.map((ex, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 relative group">
                            <button 
                                type="button"
                                onClick={() => removeExample(idx)}
                                className="absolute -top-2 -right-2 bg-white text-red-400 hover:text-red-600 rounded-full p-0.5 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MinusCircle className="w-5 h-5 fill-current" />
                            </button>
                            <input 
                                type="text" 
                                placeholder="补充例句 (英文)"
                                value={ex.sentence}
                                onChange={(e) => updateExample(idx, 'sentence', e.target.value)}
                                className="w-full p-2 mb-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                            <input 
                                type="text" 
                                placeholder="例句翻译 (中文)"
                                value={ex.translation}
                                onChange={(e) => updateExample(idx, 'translation', e.target.value)}
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-600"
                            />
                        </div>
                    ))}

                    <button 
                        type="button" 
                        onClick={addExample}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> 添加例句
                    </button>
                 </div>
               </div>
             </div>

             <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
               <button 
                 type="button" 
                 onClick={() => setEditingWord(null)}
                 className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
               >
                 取消
               </button>
               <button 
                 type="submit"
                 className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2"
               >
                 <Check className="w-4 h-4" /> 保存修改
               </button>
             </div>
           </form>
        </div>
      )}
    </div>
  );
};