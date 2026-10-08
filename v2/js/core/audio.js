// Sound effects (Web Audio, generated, no files) and the reading voice
// (speechSynthesis in the game's language, part 19). Both respect the settings in state.

import { getState } from "./state.js";
import { auto, getLang, langDef } from "./i18n.js";
import { emit } from "./events.js";

let ctx = null;
let master = null;
let lastSpoken = "";
let voice = null;

const soundOn = () => getState().settings.sound !== false;
const voiceOn = () => getState().settings.voice !== false;

function audioCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

/** Browsers only allow audio after a user gesture: call from the first tap. */
export function unlock() {
  const c = audioCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

/** One tone: frequency glide from `from` to `to` Hz. */
export function tone(from, duration = 0.12, { type = "sine", to = from, volume = 0.3, delay = 0 } = {}) {
  if (!soundOn()) return;
  const c = audioCtx();
  if (!c || c.state !== "running") return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, from), t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const notes = (list, step, opts) => list.forEach((f, i) => tone(f, step * 1.6, { ...opts, delay: i * step }));

export const sfx = {
  tap: () => tone(660, 0.06, { type: "triangle", volume: 0.15 }),
  back: () => tone(520, 0.08, { type: "triangle", to: 380, volume: 0.15 }),
  coin: () => notes([988, 1319], 0.06, { type: "square", volume: 0.08 }),
  win: () => notes([523, 659, 784, 1047], 0.11, { type: "triangle", volume: 0.2 }),
  levelUp: () => notes([392, 523, 659, 784, 1047, 1319], 0.08, { type: "square", volume: 0.08 }),
  open: () => tone(300, 0.3, { type: "sawtooth", to: 900, volume: 0.08 }),
  oops: () => tone(330, 0.25, { type: "triangle", to: 196, volume: 0.15 }),
  horn: () => {
    tone(392, 0.35, { type: "square", volume: 0.12 });
    tone(494, 0.35, { type: "square", volume: 0.1 });
  },
};

/** Play [frequency, seconds, wave] notes one after another (car horns). */
export function playNotes(notes = [[440, 0.3, "square"]]) {
  let t = 0;
  for (const [f, d, type] of notes) {
    tone(Number(f) || 440, Number(d) || 0.2, { type: type || "square", volume: 0.12, delay: t });
    t += (Number(d) || 0.2) + 0.03;
  }
}

function pickVoice() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const voices = synth.getVoices();
  const is = (re) => voices.find((v) => re.test(v.lang));
  voice = getLang() === "en" ? is(/^en(-|_)GB/i) || is(/^en(-|_|$)/i) || null : is(/^sk(-|_|$)/i) || is(/^cs(-|_|$)/i) || null;
}

/** The language changed: pick a voice for it. */
export function refreshVoice() {
  pickVoice();
}

export function initVoice() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  pickVoice();
  synth.addEventListener?.("voiceschanged", pickVoice);
}

/** Read a Slovak sentence aloud (if the voice is on). Interrupts what is being said. */
export function speak(text, { interrupt = true } = {}) {
  if (!text) return;
  text = auto(text);
  lastSpoken = text;
  emit("spoke", { text }); // 💬 captions show it, also with the voice off (part 20)
  const synth = window.speechSynthesis;
  if (!voiceOn() || !synth) return;
  try {
    if (interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || langDef().voice;
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1.1;
    synth.speak(u);
  } catch (err) {
    console.warn("[audio] speech failed", err);
  }
}

/** Repeat the last instruction (🔊 button). */
export function repeat() {
  if (lastSpoken) speak(lastSpoken);
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

/** True when the browser has a voice in the game's language (else it reads with another one). */
export function hasLangVoice() {
  return !!voice && voice.lang.toLowerCase().startsWith(getLang());
}
