// Quests (DESIGN-v2 §8): always 3 active, progress from game events, a reward when claimed.
// Events (see main.js): race, win, collect, boss, upgrade, paint, buy, pet, hatch, mini, build, pack.

import { getState, update } from "../core/state.js";
import { emit } from "../core/events.js";
import { QUESTS, QUEST_SLOTS } from "../data/quests.js";
import { addCoins } from "./economy.js";
import { isBossReady } from "./progress.js";
import { TRACKS } from "../data/tracks.js";

export const questDef = (id) => QUESTS.find((q) => q.id === id) || null;

export function defaultQuests() {
  return { active: [], done: 0 };
}

function needMet(need, s) {
  if (need === "buddy") return !!s.crew?.active;
  if (need === "egg") return (s.eggs || []).length > 0;
  if (need === "bossReady") return TRACKS.some((t) => isBossReady(t.id, s));
  return true;
}

/** Fill up to 3 active quests (never two of the same event). */
export function ensureQuests(rng) {
  const s = getState();
  // keep known quests, one per id (old or hand-edited saves may have duplicates)
  const active = s.quests.active.filter((q, i, all) => questDef(q.id) && all.findIndex((x) => x.id === q.id) === i);
  if (active.length >= QUEST_SLOTS && active.length === s.quests.active.length) return active;
  const events = new Set(active.map((q) => questDef(q.id).event));
  const pool = QUESTS.filter((q) => !events.has(q.event) && needMet(q.need, s));
  const added = [];
  while (active.length + added.length < QUEST_SLOTS && pool.length) {
    const i = Math.floor(rng.random() * pool.length);
    const q = pool.splice(i, 1)[0];
    for (let j = pool.length - 1; j >= 0; j--) if (pool[j].event === q.event) pool.splice(j, 1);
    added.push({ id: q.id, progress: 0 });
  }
  update((st) => (st.quests.active = [...active, ...added]));
  return getState().quests.active;
}

export const isDone = (q) => q.progress >= (questDef(q.id)?.target || Infinity);

/** Count an event for every active quest that listens to it. */
export function questEvent(event, amount = 1) {
  if (!(amount > 0)) return;
  const s = getState();
  const hits = s.quests.active.filter((q) => questDef(q.id)?.event === event && !isDone(q));
  if (!hits.length) return;
  update(() => {
    for (const q of hits) q.progress = Math.min(questDef(q.id).target, q.progress + amount);
  });
  for (const q of hits) if (isDone(q)) emit("questDone", { id: q.id });
}

/** Take the reward of a finished quest; a new quest takes its place. */
export function claimQuest(id, rng) {
  const s = getState();
  const q = s.quests.active.find((x) => x.id === id);
  if (!q || !isDone(q)) return null;
  const reward = questDef(id).reward;
  update((st) => {
    st.quests.active = st.quests.active.filter((x) => x.id !== id);
    st.quests.done += 1;
    if (reward.scrap) st.scrap += reward.scrap;
    if (reward.candy) st.crew.candy += reward.candy;
  });
  addCoins(reward.coins);
  emit("questClaimed", { id });
  // the new quest must not be the same one again
  const replaced = ensureQuests(rng);
  if (replaced.some((x) => x.id === id) && QUESTS.length > QUEST_SLOTS) {
    update((st) => (st.quests.active = st.quests.active.filter((x) => x.id !== id)));
    ensureQuests(rng);
  }
  return reward;
}

/** Test menu: finish all active quests. */
export function finishAllQuests() {
  update((s) => s.quests.active.forEach((q) => (q.progress = questDef(q.id)?.target || 1)));
}
