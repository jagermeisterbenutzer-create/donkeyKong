type OscillatorKind = "sine" | "square" | "triangle" | "sawtooth";

interface MusicNote {
  freq: number;
  duration: number;
  type?: OscillatorKind;
  pause?: number;
  volume?: number;
}

interface EffectStep {
  freq: number;
  duration: number;
  type?: OscillatorKind;
  delay?: number;
  volume?: number;
}

let audioContext: AudioContext | null = null;
let musicTimer: number | null = null;
let musicPlaying = false;

const MUSIC_PATTERN: MusicNote[] = [
  { freq: 523.25, duration: 0.22, type: "square", pause: 0.12, volume: 0.12 },
  { freq: 659.25, duration: 0.18, type: "square", pause: 0.08, volume: 0.08 },
  { freq: 587.33, duration: 0.18, type: "triangle", pause: 0.1, volume: 0.1 },
  { freq: 698.46, duration: 0.2, type: "triangle", pause: 0.12, volume: 0.09 },
  { freq: 523.25, duration: 0.16, type: "sawtooth", pause: 0.14, volume: 0.1 },
];

export type ArcadeEffect = "start" | "resume" | "barrel" | "levelComplete" | "lifeLost";

const EFFECT_PATTERNS: Record<ArcadeEffect, EffectStep[]> = {
  start: [
    { freq: 392, duration: 0.16, delay: 0, type: "triangle", volume: 0.18 },
    { freq: 523.25, duration: 0.14, delay: 0.16, type: "triangle", volume: 0.16 },
    { freq: 659.25, duration: 0.12, delay: 0.32, type: "sawtooth", volume: 0.12 },
  ],
  resume: [
    { freq: 523.25, duration: 0.12, delay: 0, type: "sawtooth", volume: 0.14 },
    { freq: 440, duration: 0.14, delay: 0.18, type: "square", volume: 0.12 },
  ],
  barrel: [
    { freq: 784, duration: 0.08, delay: 0, type: "square", volume: 0.18 },
    { freq: 880, duration: 0.1, delay: 0.08, type: "triangle", volume: 0.12 },
  ],
  levelComplete: [
    { freq: 659.25, duration: 0.18, delay: 0, type: "triangle", volume: 0.18 },
    { freq: 784, duration: 0.2, delay: 0.18, type: "triangle", volume: 0.16 },
    { freq: 987.77, duration: 0.14, delay: 0.38, type: "sawtooth", volume: 0.1 },
  ],
  lifeLost: [
    { freq: 220, duration: 0.28, delay: 0, type: "sine", volume: 0.16 },
    { freq: 180, duration: 0.24, delay: 0.14, type: "sine", volume: 0.12 },
  ],
};

function ensureAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const globalContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  audioContext = globalContext;
  return audioContext;
}

function playTone(freq: number, duration: number, type: OscillatorKind = "square", delay = 0, volume = 0.12) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const startTime = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = freq;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function scheduleMusicStep(index: number) {
  if (!musicPlaying || MUSIC_PATTERN.length === 0) {
    return;
  }

  const note = MUSIC_PATTERN[index];
  playTone(note.freq, note.duration, note.type, 0, note.volume);

  const delay = (note.duration + (note.pause ?? 0)) * 1000;
  const nextIndex = (index + 1) % MUSIC_PATTERN.length;

  if (typeof window !== "undefined") {
    musicTimer = window.setTimeout(() => scheduleMusicStep(nextIndex), delay);
  }
}

export function startArcadeMusic() {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  if (musicPlaying) {
    return;
  }

  context.resume().catch(() => undefined);
  musicPlaying = true;
  scheduleMusicStep(0);
}

export function stopArcadeMusic() {
  musicPlaying = false;
  if (musicTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(musicTimer);
    musicTimer = null;
  }
}

export function playArcadeEffect(effect: ArcadeEffect) {
  const steps = EFFECT_PATTERNS[effect];
  steps.forEach((step) => {
    playTone(step.freq, step.duration, step.type, step.delay ?? 0, step.volume ?? 0.12);
  });
}
