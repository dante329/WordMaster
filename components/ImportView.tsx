import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedWord, Word, Proficiency } from '../types';
import { parseContentWithGemini } from '../services/geminiService';
import { Loader2, Plus, Download, RefreshCw, FileText, CheckCircle, RotateCw, Trash2 } from 'lucide-react';
import { SAMPLE_TEXTS } from '../constants';
import mammoth from 'mammoth';

interface ImportViewProps {
  onAddWords: (words: Word[]) => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onAddWords }) => {
  // Initialize state from localStorage to persist data across view changes
  const [inputText, setInputText] = useState(() => localStorage.getItem('wordmaster_import_text') || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>(() => {
    const saved = localStorage.getItem('wordmaster_import_parsed');
    return saved ? JSON.parse(saved) : [];
  });
  const [step, setStep] = useState<'input' | 'preview'>(() => {
    return (localStorage.getItem('wordmaster_import_step') as 'input' | 'preview') || 'input';
  });
  const [error, setError] = useState<string | null>(null);
  
  // Track sample text index locally (no need to persist this strictly, but we can)
  const [sampleIndex, setSampleIndex] = useState(0);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('wordmaster_import_text', inputText);
  }, [inputText]);

  useEffect(() => {
    localStorage.setItem('wordmaster_import_parsed', JSON.stringify(parsedWords));
  }, [parsedWords]);

  useEffect(() => {
    localStorage.setItem('wordmaster_import_step', step);
  }, [step]);

  const clearImportState = () => {
    setInputText('');
    setParsedWords([]);
    setStep('input');
    setError(null);
    // LocalStorage updates will happen automatically via useEffects
  };

  const handleSampleText = () => {
    const nextIndex = (sampleIndex + 1) % SAMPLE_TEXTS.length;
    setSampleIndex(nextIndex);
    setInputText(SAMPLE_TEXTS[sampleIndex]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          setInputText(result.value);
          if (result.messages.length > 0) {
            console.warn("Mammoth warning:", result.messages);
          }
        } catch (err) {
          console.error(err);
          setError("无法解析 .docx 文件，请确保文件未损坏。");
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileName.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    } else if (fileName.endsWith('.doc')) {
      setError("暂不支持旧版 .doc 文件，请先转换为 .docx 或 .txt 格式。");
    } else {
      setError("不支持该文件格式，请上传 .txt 或 .docx 文件。");
    }
  };

  const processText = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const results = await parseContentWithGemini(inputText);
      setParsedWords(results);
      setStep('preview');
    } catch (err) {
      setError("AI 解析失败。请检查您的 API Key 配置或网络连接。");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelection = (index: number) => {
    const updated = [...parsedWords];
    updated[index].selected = !updated[index].selected;
    setParsedWords(updated);
  };

  const toggleAll = () => {
    const allSelected = parsedWords.every(w => w.selected);
    setParsedWords(parsedWords.map(w => ({ ...w, selected: !allSelected })));
  };

  const exportCSV = () => {
    const headers = ["Term", "Definition", "Example", "Translation", "Phonetic"];
    const rows = parsedWords.filter(w => w.selected).map(w => 
      `"${w.term}","${w.definition}","${w.example}","${w.exampleTranslation || ''}","${w.phonetic || ''}"`
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'wordmaster_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addToLibrary = (shuffle: boolean) => {
    const selected = parsedWords.filter(w => w.selected);
    if (selected.length === 0) {
      alert("请至少选择一个单词。");
      return;
    }

    if (shuffle) {
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
    }

    const newWords: Word[] = selected.map(pw => ({
      id: crypto.randomUUID(),
      term: pw.term,
      definition: pw.definition,
      example: pw.example,
      exampleTranslation: pw.exampleTranslation,
      phonetic: pw.phonetic,
      tags: ['imported'],
      proficiency: Proficiency.New,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: Date.now(),
      isFavorite: false
    }));

    onAddWords(newWords);
    clearImportState(); // Clear stored state on success
    alert(`成功添加 ${newWords.length} 个单词到词库！`);
  };

  const handleReset = () => {
    if (confirm("确定要清空当前内容吗？")) {
      clearImportState();
    }
  };

  if (step === 'input') {
    return (
      <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">导入学习素材</h2>
        <p className="text-gray-500 mb-6">粘贴文章文本，或者上传 .txt / .docx 文档。AI 将自动提取词汇并生成例句。</p>

        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">加载文件 (.txt, .docx)</span>
                <input type="file" accept=".txt,.docx,.doc" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={handleSampleText} className="text-sm flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:underline px-2 py-2">
                <RotateCw className="w-4 h-4" />
                <span>换一篇示例</span>
              </button>
            </div>
            {inputText && (
              <button onClick={handleReset} className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> 清空
              </button>
            )}
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请在此粘贴文本，或导入文档内容..."
            className="flex-1 w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-700 leading-relaxed custom-scrollbar"
          />

          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

          <div className="flex justify-end">
            <button
              onClick={processText}
              disabled={isProcessing || !inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {isProcessing ? '正在分析...' : 'AI 智能提取'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">确认单词列表</h2>
          <p className="text-gray-500">共识别出 {parsedWords.length} 个单词。请勾选需要学习的单词。</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep('input')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">返回编辑</button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
            <Download className="w-4 h-4" /> 导出表格
          </button>
          <button onClick={() => addToLibrary(false)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
            <Plus className="w-4 h-4" /> 添加选中
          </button>
          <button onClick={() => addToLibrary(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm">
             打乱添加
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 border-b w-12 text-center">
                  <input type="checkbox" checked={parsedWords.every(w => w.selected)} onChange={toggleAll} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="p-4 border-b font-semibold text-gray-600 w-48">单词</th>
                <th className="p-4 border-b font-semibold text-gray-600">释义</th>
                <th className="p-4 border-b font-semibold text-gray-600">例句</th>
              </tr>
            </thead>
            <tbody>
              {parsedWords.map((word, idx) => (
                <tr key={idx} className={`border-b hover:bg-gray-50 transition-colors ${word.selected ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={word.selected} onChange={() => toggleSelection(idx)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    {word.term}
                    {word.phonetic && <span className="block text-xs text-gray-400 font-mono mt-1">{word.phonetic}</span>}
                  </td>
                  <td className="p-4 text-gray-600">{word.definition}</td>
                  <td className="p-4">
                    <p className="text-gray-800">{word.example}</p>
                    {word.exampleTranslation && <p className="text-xs text-gray-400 mt-1">{word.exampleTranslation}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};