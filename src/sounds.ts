let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playCardMove = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

export const playCardFlip = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) {}
};

export const playButtonClick = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {}
};

export const playVictory = () => {
  try {
    const ctx = getCtx();
    // C Major Arpeggio: C4, E4, G4, C5
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch (e) {}
};

let bgMusicOscillators: OscillatorNode[] = [];
let bgMusicGain: GainNode | null = null;

export const toggleBackgroundMusic = (play: boolean) => {
  try {
    const ctx = getCtx();
    if (play) {
      if (bgMusicGain) return; // Already playing
      
      bgMusicGain = ctx.createGain();
      bgMusicGain.gain.setValueAtTime(0.001, ctx.currentTime);
      bgMusicGain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2); // Fade in
      bgMusicGain.connect(ctx.destination);
      
      // Create a soothing ambient drone (C major chord: C3, E3, G3)
      const frequencies = [130.81, 164.81, 196.00]; 
      
      frequencies.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Add a slow LFO to the frequency for a "breathing" effect
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + Math.random() * 0.1; // Slow breathing
        
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 2; // Slight pitch variation
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(bgMusicGain!);
        
        osc.start();
        lfo.start();
        
        bgMusicOscillators.push(osc, lfo);
      });
    } else {
      if (bgMusicGain) {
        // Fade out
        bgMusicGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
        setTimeout(() => {
          bgMusicOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
          });
          bgMusicOscillators = [];
          if (bgMusicGain) {
            bgMusicGain.disconnect();
            bgMusicGain = null;
          }
        }, 1000);
      }
    }
  } catch (e) {
    console.error("Audio context failed", e);
  }
};
