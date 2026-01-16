
// Web Audio API wrapper for generating rich, game-like feedback sounds.
// Uses multiple oscillators to create chords and textured sounds.

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Helper to play a single tone
const playTone = (
  ctx: AudioContext, 
  freq: number, 
  type: OscillatorType, 
  startTime: number, 
  duration: number, 
  vol: number = 0.1
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.02); // Fast attack
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Decay

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playFeedbackSound = (type: 'correct' | 'blur' | 'wrong') => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    if (type === 'correct') {
      // Major Chord (C Major: C, E, G) - Crisp and Rewarding
      // High pitch for positive reinforcement
      playTone(ctx, 880.00, 'sine', now, 0.4, 0.1);      // A5
      playTone(ctx, 1108.73, 'sine', now, 0.4, 0.08);    // C#6
      playTone(ctx, 1318.51, 'triangle', now, 0.4, 0.05); // E6 (adds texture)
      
    } else if (type === 'blur') {
      // Neutral "Bubble" sound
      // Sine wave with a quick pitch bend up
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1); // Pitch up
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

    } else if (type === 'wrong') {
      // Negative "Buzz" - Low frequency Sawtooth
      // Sounds like a classic "Error" buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth'; // Sawtooth is buzzier
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3); // Pitch down slightly
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn("Audio playback failed", e);
  }
};
