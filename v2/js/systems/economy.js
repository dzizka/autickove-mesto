// Coins: earning and spending. Pure state logic, no drawing.

import { update, getState } from "../core/state.js";
import { emit } from "../core/events.js";

const safe = (n) => (Number.isFinite(n) && n > 0 ? Math.round(n) : 0);

export function addCoins(amount) {
  const n = safe(amount);
  if (!n) return 0;
  update((s) => {
    s.coins += n;
  });
  emit("coinsChanged", { delta: n });
  return n;
}

export function canAfford(price) {
  return getState().coins >= safe(price);
}

/** Spend coins; returns false (and changes nothing) when there is not enough. */
export function spendCoins(price) {
  const n = safe(price);
  if (!canAfford(n)) return false;
  update((s) => {
    s.coins -= n;
  });
  emit("coinsChanged", { delta: -n });
  return true;
}
