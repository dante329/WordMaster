
export const speakText = (text: string, accent: 'US' | 'UK' = 'US') => {
  if (!text) return;

  // Youdao API parameters:
  // type=1: UK (British)
  // type=2: US (American)
  const type = accent === 'US' ? 2 : 1;
  const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type}`;

  const audio = new Audio(audioUrl);
  
  audio.play().catch(error => {
    console.warn("Audio playback failed:", error);
    // Fallback to browser synthesis if network fails
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = accent === 'US' ? 'en-US' : 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  });
};
