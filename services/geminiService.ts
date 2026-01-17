import { ParsedWord } from "../types";

// --- DeepSeek 配置 ---
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// Helper: 延时函数，防止请求过快
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const quickLookup = async (term: string): Promise<ParsedWord | null> => {
  if (!term.trim()) return null;

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
            content: "你是一个专业的英汉词典助手。请返回纯 JSON 格式。"
          },
          {
            role: "user",
            content: `请解释单词或短语 "${term}"。
            要求：
            1. partOfSpeech: 词性缩写 (如 n., v., adj., adv.)。**如果是短语 (Phrase)，请务必返回空字符串 ""**。**如果是单词，必须返回词性**。
            2. definition: 必须是中文简练释义。
            3. example: 一个地道的英文例句。
            4. exampleTranslation: 例句的中文翻译。
            5. phonetic: 音标（如果是短语则留空）。
            
            返回格式: {"term": "${term}", "partOfSpeech": "...", "definition": "...", "phonetic": "...", "example": "...", "exampleTranslation": "..."}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const result: any = await response.json();
    if (!result.choices || result.choices.length === 0) return null;
    
    const content = result.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    return { ...data, selected: true };
  } catch (error) {
    console.error("DeepSeek lookup failed:", error);
    return null;
  }
};

export const parseContentWithGemini = async (text: string): Promise<ParsedWord[]> => {
  const apiKey = (import.meta as any).env.VITE_DEEPSEEK_API_KEY;

  // 动态计算目标词汇量
  // 逻辑：大约每 150 个字符包含一个有价值的生词。
  // 下限：至少提取 5 个。
  // 上限：为了保证 JSON 格式不被截断和 API 响应稳定性，限制在 120 个左右。
  const textLen = text.length;
  const estimatedCount = Math.floor(textLen / 150); 
  
  // 范围：最少 5 个，最多 120 个 (对于超长文本，单次请求 120 个 JSON 对象已是 DeepSeek/LLM 的稳定极限)
  const minWords = Math.max(5, Math.min(100, Math.floor(estimatedCount * 0.8)));
  const maxWords = Math.max(10, Math.min(120, estimatedCount));

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
            content: `你是一个英语学习助手。请分析用户提供的文本，提取其中的重点单词、固定搭配、短语或习语。
            
            重要规则：
            1. 如果文本本身就是"单词-释义"的列表（例如："apple: 苹果"），请严格保留原文的释义。
            2. 如果文本是文章，请根据文章长度提取尽可能多的生词（Word）和短语（Phrase）。
            3. **所有释义 (definition) 必须是中文**。
            4. **标注词性 (partOfSpeech)**: 对于单词，请务必提供标准缩写 (n., v., adj., etc.)。**对于短语 (Phrase)，该字段必须为空字符串 ""**。
            5. 返回格式必须是合法的 JSON 对象。`
          },
          {
            role: "user",
            content: `请分析以下文本。
            
            **数量要求**：根据文本长度，请提取大约 **${minWords} 到 ${maxWords} 个** 有价值的单词或短语。
            (检测到文本长度为 ${textLen} 字符，请确保提取数量覆盖文中的主要生词，不要遗漏)。
            
            文本内容: 
            """
            ${text.slice(0, 30000)}
            """
            
            返回 JSON 格式: 
            {
              "words": [
                {
                  "term": "单词或短语", 
                  "partOfSpeech": "词性缩写 (短语留空)",
                  "definition": "中文释义 (如果原文有上下文，请结合上下文)", 
                  "example": "包含该词的英文例句 (优先使用原文句子)", 
                  "exampleTranslation": "例句中文翻译", 
                  "phonetic": "音标 (可选)"
                }
              ]
            }`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const result: any = await response.json();
    if (!result.choices || !result.choices[0]) throw new Error("API returned empty choices");

    const content = result.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    return (data.words || []).map((w: any) => ({ ...w, selected: true }));
  } catch (error) {
    console.error("DeepSeek parsing failed:", error);
    throw error;
  }
};

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
            content: "You are a vocabulary assistant. Return ONLY a JSON object."
          },
          {
            role: "user",
            content: `Provide up to 5 English word suggestions starting with "${text}". 
            Definition MUST be in Chinese.
            Format: {"suggestions": [{"term": "word", "definition": "中文释义"}]}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const result: any = await response.json();
    const content = result.choices[0].message.content;
    const cleanJson = content.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    return data.suggestions || [];
  } catch (error) {
    console.error("Suggestions failed:", error);
    return [];
  }
};

// 使用Gemini打开以下这一部分，注释上面的DeepSeek实现

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