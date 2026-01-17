// Audio service using Web Audio API to generate high-quality UI sounds procedurally.
// This ensures sound works 100% of the time without external files or broken Base64 strings.

let audioContext: AudioContext | null = null;

// Initialize AudioContext lazily to comply with browser autoplay policies
const getContext = () => {
  if (!audioContext) {
    // Cross-browser support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

export const playFeedbackSound = (type: 'correct' | 'blur' | 'wrong') => {
  try {
    const ctx = getContext();
    
    // Ensure context is running (browser might suspend it until user interaction)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    if (type === 'correct') {
      // Classic "Success" Chime: C5 -> E5 -> G5 (Major Chord Arpeggio)
      // Creates a pleasant, positive "Ding" sound
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine'; // Sine wave is soft and clean
        osc.frequency.value = freq;
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        
        // Staggered start for arpeggio effect
        const startTime = t + (i * 0.04);
        
        // Envelope: Attack -> Decay
        oscGain.gain.setValueAtTime(0, startTime);
        oscGain.gain.linearRampToValueAtTime(0.1, startTime + 0.02); // Quick attack
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5); // Smooth decay
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });

    } else if (type === 'wrong') {
      // "Error" Thud: Low frequency triangle wave sliding down
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'triangle'; // Triangle has a bit more "buzz" than sine
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2); // Pitch drop
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      
      oscGain.gain.setValueAtTime(0.15, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      
      osc.start(t);
      osc.stop(t + 0.2);

    } else { // blur
      // "Pop" / Select sound: Short high-pitch blip
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      
      oscGain.gain.setValueAtTime(0.05, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      
      osc.start(t);
      osc.stop(t + 0.1);
    }

  } catch (e) {
    console.warn("Audio playback failed", e);
  }
};