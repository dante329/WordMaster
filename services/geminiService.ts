import { ParsedWord } from "../types";

// --- DeepSeek 配置 ---
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export const quickLookup = async (term: string): Promise<ParsedWord | null> => {
  if (!term.trim()) return null;

  // 确保这里只声明一次 apiKey
  const apiKey = (import.meta as any).env.VITE_DEEPSEEK_API_KEY;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful English dictionary. Return ONLY a JSON object."
          },
          {
            role: "user",
            content: `Explain "${term}" in Chinese. Format: {"term": "${term}", "definition": "...", "phonetic": "...", "example": "...", "exampleTranslation": "..."}`
          }
        ]
      })
    });

    const result: any = await response.json();
    if (!result.choices || result.choices.length === 0) return null;
    
    const content = result.choices[0].message.content;
    // 兼容可能带有 Markdown 代码块包裹的情况
    const cleanJson = content.replace(/```json|```/g, "");
    const data = JSON.parse(cleanJson);
    
    return { ...data, selected: true };
  } catch (error) {
    console.error("DeepSeek lookup failed:", error);
    return null;
  }
};

export const parseContentWithGemini = async (text: string): Promise<ParsedWord[]> => {
  const apiKey = (import.meta as any).env.VITE_DEEPSEEK_API_KEY;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Extract key English vocabulary. Return JSON: {\"words\": [{\"term\": \"...\", \"definition\": \"...\", \"example\": \"...\", \"exampleTranslation\": \"...\", \"phonetic\": \"...\"}]}"
          },
          {
            role: "user",
            content: `Analyze this text: ${text.slice(0, 2000)}`
          }
        ]
      })
    });

    const result: any = await response.json();
    const content = result.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "");
    const data = JSON.parse(cleanJson);
    
    return data.words.map((w: any) => ({ ...w, selected: true }));
  } catch (error) {
    console.error("DeepSeek parsing failed:", error);
    return [];
  }
};

// --- 3. 获取搜索建议 (修正后的版本，匹配 Dashboard 的类型要求) ---
export const getSearchSuggestions = async (text: string): Promise<{ term: string; definition: string }[]> => {
  if (!text.trim()) return [];

  const apiKey = (import.meta as any).env.VITE_DEEPSEEK_API_KEY;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a vocabulary assistant. Return ONLY a JSON object with a 'suggestions' key containing an array of objects with 'term' and 'definition' (in Chinese)."
          },
          {
            role: "user",
            content: `Provide 5 word suggestions starting with "${text}". Format: {"suggestions": [{"term": "...", "definition": "..."}]}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const result: any = await response.json();
    const content = result.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "");
    const data = JSON.parse(cleanJson);
    
    // 返回 Dashboard 需要的 [{term, definition}] 格式
    return data.suggestions || [];
  } catch (error) {
    console.error("Suggestions failed:", error);
    return [];
  }
};

// import { ParsedWord } from "../types";

// import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// // --- Utility: JSONP for Youdao (Bypasses CORS for speed) ---
// const fetchJsonp = (url: string, callbackName: string = 'jsonp_callback'): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     const uniqueCallback = `${callbackName}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
//     const script = document.createElement('script');
//     const separator = url.includes('?') ? '&' : '?';
//     script.src = `${url}${separator}callback=${uniqueCallback}`;
//     script.onerror = () => {
//       cleanup();
//       reject(new Error(`JSONP request failed for ${url}`));
//     };
//     (window as any)[uniqueCallback] = (data: any) => {
//       cleanup();
//       resolve(data);
//     };
//     const cleanup = () => {
//       if ((window as any)[uniqueCallback]) delete (window as any)[uniqueCallback];
//       if (document.body.contains(script)) document.body.removeChild(script);
//     };
//     document.body.appendChild(script);
//   });
// };

// // --- 0. Search Suggestions (Autocomplete) ---
// export const getSearchSuggestions = async (query: string): Promise<{term: string, definition: string}[]> => {
//   if (!query || query.trim().length === 0) return [];
//   try {
//     const url = `https://dict.youdao.com/suggest?num=5&ver=3.0&doctype=json&cache=false&le=en&q=${encodeURIComponent(query)}`;
//     const data = await fetchJsonp(url);
//     if (data && data.result && data.result.msg === "success" && data.result.entries) {
//       return data.result.entries.map((entry: any) => ({
//         term: entry.entry,
//         definition: entry.explain
//       }));
//     }
//     return [];
//   } catch (error) {
//     console.warn("Suggestion fetch failed", error);
//     return [];
//   }
// };

// // --- Internal Helper: Youdao Lookup (Fallback Strategy) ---
// const youdaoLookup = async (term: string): Promise<ParsedWord | null> => {
//   if (!term.trim()) return null;
//   console.log(`Trying fallback lookup for: ${term}`);
//   try {
//     const suggestUrl = `https://dict.youdao.com/suggest?num=1&ver=3.0&doctype=json&cache=false&le=en&q=${encodeURIComponent(term)}`;
//     const suggestData = await fetchJsonp(suggestUrl);
//     if (suggestData?.result?.entries?.length > 0) {
//        const match = suggestData.result.entries.find((e: any) => e.entry.toLowerCase() === term.toLowerCase()) || suggestData.result.entries[0];
//        if (match) {
//          return {
//            term: match.entry,
//            definition: match.explain,
//            phonetic: '', 
//            example: `Example sentence for ${match.entry}`,
//            exampleTranslation: ''
//          };
//        }
//     }
//     return null;
//   } catch (error) {
//     console.warn("Youdao lookup failed", error);
//     return null;
//   }
// };

// // --- 1. Quick Lookup (Gemini Primary -> Youdao Fallback) ---
// export const quickLookup = async (term: string): Promise<ParsedWord | null> => {
//   if (!term.trim()) return null;

//   // 使用 as any 强制避开 TypeScript 对 import.meta 的检查
//   const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

//   if (apiKey) {
//     try {
//       console.log("Calling Gemini API for:", term);
//       const genAI = new GoogleGenerativeAI(apiKey);
      
//       const model = genAI.getGenerativeModel({
//         model: "gemini-1.5-flash",
//         generationConfig: {
//           responseMimeType: "application/json",
//           responseSchema: {
//             type: SchemaType.OBJECT,
//             properties: {
//               term: { type: SchemaType.STRING },
//               definition: { type: SchemaType.STRING },
//               example: { type: SchemaType.STRING },
//               exampleTranslation: { type: SchemaType.STRING },
//               phonetic: { type: SchemaType.STRING }
//             },
//             required: ['term', 'definition', 'example']
//           }
//         }
//       });
      
//       const prompt = `Explain the English word "${term}" for a vocabulary learning app.
//         Return a valid JSON object with the following fields: term, definition, example, exampleTranslation, phonetic. 
//         Use Simplified Chinese for definitions and translations.`;

//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       if (text) {
//         const data = JSON.parse(text);
//         return {
//           term: data.term,
//           definition: data.definition,
//           example: data.example,
//           exampleTranslation: data.exampleTranslation,
//           phonetic: data.phonetic,
//           selected: true
//         };
//       }
//     } catch (error: any) {
//       console.error("Gemini lookup failed. Error details:", error);
//     }
//   }
//   return youdaoLookup(term);
// };

// // --- Helper: Fallback Extraction Strategy ---
// const simpleExtractAndLookup = async (text: string): Promise<ParsedWord[]> => {
//   const rawWords = text.match(/[a-zA-Z]{3,}/g) || [];
//   const stopWords = new Set(['the','and','that','have','for','not','with','you','this','but','his','from','they','we','say','her','she','will','an','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us']);
  
//   const uniqueWords = Array.from(new Set(rawWords.map(w => w.toLowerCase())))
//     .filter(w => !stopWords.has(w))
//     .slice(0, 15);

//   const results: ParsedWord[] = [];
//   for (const term of uniqueWords) {
//     try {
//       await new Promise(resolve => setTimeout(resolve, 100));
//       const wordInfo = await youdaoLookup(term);
//       if (wordInfo) {
//         results.push({
//           ...wordInfo,
//           selected: true,
//           example: `Found in text: "${term}"`, 
//           exampleTranslation: '（自动提取单词，请手动补充例句）'
//         });
//       }
//     } catch (e) {
//       console.warn(`Fallback lookup failed for ${term}`);
//     }
//   }
//   return results;
// };

// // --- Google Gemini Implementation for Document Parsing ---
// export const parseContentWithGemini = async (text: string): Promise<ParsedWord[]> => {
//   const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

//   if (!apiKey) {
//     return simpleExtractAndLookup(text);
//   }

//   try {
//     const genAI = new GoogleGenerativeAI(apiKey);
    
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       generationConfig: {
//         responseMimeType: "application/json",
//         responseSchema: {
//           type: SchemaType.OBJECT,
//           properties: {
//             words: {
//               type: SchemaType.ARRAY,
//               items: {
//                 type: SchemaType.OBJECT,
//                 properties: {
//                   term: { type: SchemaType.STRING },
//                   definition: { type: SchemaType.STRING },
//                   example: { type: SchemaType.STRING },
//                   exampleTranslation: { type: SchemaType.STRING },
//                   phonetic: { type: SchemaType.STRING }
//                 },
//                 required: ['term', 'definition', 'example']
//               }
//             }
//           }
//         }
//       }
//     });
    
//     const prompt = `Analyze the following text and extract key English vocabulary words: "${text.slice(0, 5000)}"`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const jsonText = response.text();

//     if (!jsonText) throw new Error("Empty response from AI");

//     const data = JSON.parse(jsonText);
    
//     return (data.words || []).map((w: any) => ({
//       ...w,
//       selected: true,
//       term: w.term || '',
//       definition: w.definition || '',
//       example: w.example || '',
//       exampleTranslation: w.exampleTranslation || '',
//       phonetic: w.phonetic || ''
//     }));

//   } catch (error: any) {
//     console.error("Gemini Parsing Error:", error);
//     return simpleExtractAndLookup(text);
//   }
// };