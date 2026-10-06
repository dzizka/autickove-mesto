// Minimal event bus: on/off/emit. Listener errors are caught so one bad
// listener never breaks the emitter (e.g. raceFinished, itemDropped, levelUp).

const listeners = new Map();

export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => off(name, fn);
}

export function off(name, fn) {
  listeners.get(name)?.delete(fn);
}

export function emit(name, payload) {
  const set = listeners.get(name);
  if (!set) return;
  for (const fn of [...set]) {
    try {
      fn(payload);
    } catch (err) {
      console.error(`[events] listener for "${name}" failed`, err);
    }
  }
}

export function clearAll() {
  listeners.clear();
}
