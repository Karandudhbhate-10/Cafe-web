// Web Audio API chime synthesizer for incoming cafe orders
let audioCtx: AudioContext | null = null;
let isMuted = false;

export const setAudioMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getAudioMuted = () => isMuted;

export const playNewOrderChime = () => {
  if (isMuted) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Pleasant two-tone chime (E5 -> G#5 -> B5)
    const playNote = (freq: number, start: number, duration: number) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(659.25, now, 0.25); // E5
    playNote(830.61, now + 0.12, 0.35); // G#5
    playNote(987.77, now + 0.24, 0.45); // B5
  } catch (err) {
    // console.log('Audio chime error:', err);
  }
};
