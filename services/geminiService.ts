import { ParsedWord } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

// --- Utility: JSONP for Youdao (Bypasses CORS for speed) ---
const fetchJsonp = (url: string, callbackName: string = 'jsonp_callback'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uniqueCallback = `${callbackName}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement('script');
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${uniqueCallback}`;
    script.onerror = () => {
      cleanup();
      reject(new Error(`JSONP request failed for ${url}`));
    };
    (window as any)[uniqueCallback] = (data: any) => {
      cleanup();
      resolve(data);
    };
    const cleanup = () => {
      if ((window as any)[uniqueCallback]) delete (window as any)[uniqueCallback];
      if (document.body.contains(script)) document.body.removeChild(script);
    };
    document.body.appendChild(script);
  });
};

// --- 0. Search Suggestions (Autocomplete) ---
export const getSearchSuggestions = async (query: string): Promise<{term: string, definition: string}[]> => {
  if (!query || query.trim().length === 0) return [];
  try {
    const url = `https://dict.youdao.com/suggest?num=5&ver=3.0&doctype=json&cache=false&le=en&q=${encodeURIComponent(query)}`;
    const data = await fetchJsonp(url);
    if (data && data.result && data.result.msg === "success" && data.result.entries) {
      return data.result.entries.map((entry: any) => ({
        term: entry.entry,
        definition: entry.explain
      }));
    }
    return [];
  } catch (error) {
    console.warn("Suggestion fetch failed", error);
    return [];
  }
};

// --- Internal Helper: Youdao Lookup (Fallback Strategy) ---
const youdaoLookup = async (term: string): Promise<ParsedWord | null> => {
  if (!term.trim()) return null;
  console.log(`Trying fallback lookup for: ${term}`);
  try {
    const suggestUrl = `https://dict.youdao.com/suggest?num=1&ver=3.0&doctype=json&cache=false&le=en&q=${encodeURIComponent(term)}`;
    const suggestData = await fetchJsonp(suggestUrl);
    if (suggestData?.result?.entries?.length > 0) {
       const match = suggestData.result.entries.find((e: any) => e.entry.toLowerCase() === term.toLowerCase()) || suggestData.result.entries[0];
       if (match) {
         return {
           term: match.entry,
           definition: match.explain,
           phonetic: '', 
           example: `Example sentence for ${match.entry}`,
           exampleTranslation: ''
         };
       }
    }
    return null;
  } catch (error) {
    console.warn("Youdao lookup failed", error);
    return null;
  }
};

// --- 1. Quick Lookup (Gemini Primary -> Youdao Fallback) ---
export const quickLookup = async (term: string): Promise<ParsedWord | null> => {
  if (!term.trim()) return null;

  const apiKey = process.env.API_KEY;

  if (apiKey) {
    try {
      console.log("Calling Gemini API for:", term);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Explain the English word "${term}" for a vocabulary learning app.
        Return a valid JSON object with the following fields:
        - term: The word itself
        - definition: Concise Chinese definition (Simplified Chinese)
        - example: A good English example sentence
        - exampleTranslation: Chinese translation of the example
        - phonetic: KK phonetic symbol (e.g. ˈæpəl)`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
              example: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING },
              phonetic: { type: Type.STRING }
            },
            required: ['term', 'definition', 'example']
          }
        }
      });
      
      const text = response.text;
      
      if (text) {
        const data = JSON.parse(text);
        return {
          term: data.term,
          definition: data.definition,
          example: data.example,
          exampleTranslation: data.exampleTranslation,
          phonetic: data.phonetic,
          selected: true
        };
      }
    } catch (error: any) {
      console.error("Gemini lookup failed. Error details:", error);
    }
  } else {
    console.warn("No API_KEY found. Skipping Gemini.");
  }
  return youdaoLookup(term);
};

// --- Helper: Fallback Extraction Strategy ---
const simpleExtractAndLookup = async (text: string): Promise<ParsedWord[]> => {
  console.warn("Using simple fallback extraction...");
  const rawWords = text.match(/[a-zA-Z]{3,}/g) || [];
  const stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','we','say','her','she','will','an','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
  
  const uniqueWords = Array.from(new Set(rawWords.map(w => w.toLowerCase())))
    .filter(w => !stopWords.has(w))
    .slice(0, 15);

  const results: ParsedWord[] = [];
  for (const term of uniqueWords) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const wordInfo = await youdaoLookup(term);
      if (wordInfo) {
        results.push({
          ...wordInfo,
          selected: true,
          example: `Found in text: "${term}"`, 
          exampleTranslation: '（自动提取单词，请手动补充例句）'
        });
      }
    } catch (e) {
      console.warn(`Fallback lookup failed for ${term}`);
    }
  }
  return results;
};

// --- Google Gemini Implementation for Document Parsing ---
export const parseContentWithGemini = async (text: string): Promise<ParsedWord[]> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("Parsing skipped: No API Key.");
    return simpleExtractAndLookup(text);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    Analyze the following text and extract key English vocabulary words that are valuable for a learner.
    Text to analyze:
    "${text.slice(0, 5000)}" 
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  example: { type: Type.STRING },
                  exampleTranslation: { type: Type.STRING },
                  phonetic: { type: Type.STRING }
                },
                required: ['term', 'definition', 'example']
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;

    if (!jsonText) throw new Error("Empty response from AI");

    const data = JSON.parse(jsonText);
    
    return (data.words || []).map((w: any) => ({
      ...w,
      selected: true,
      term: w.term || '',
      definition: w.definition || '',
      example: w.example || '',
      exampleTranslation: w.exampleTranslation || '',
      phonetic: w.phonetic || ''
    }));

  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    if (error.status === 403 || error.message?.includes('Region') || error.toString().includes('403')) {
        alert("Google AI 服务连接失败 (Error 403)。\n请确保您的网络环境支持访问 Google API。已切换到基础提取模式。");
        return simpleExtractAndLookup(text);
    }
    return simpleExtractAndLookup(text);
  }
};