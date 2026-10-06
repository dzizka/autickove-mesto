// Progress transfer between devices: "AM2:" + base64(UTF-8 JSON of the state).

import { getState, migrate, saveNow } from "./state.js";

export const PREFIX = "AM2:";

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function exportCode(state = getState()) {
  saveNow();
  return PREFIX + toBase64(JSON.stringify(state));
}

/**
 * Parse a transfer code into a migrated state object.
 * Throws an Error with `code`: "prefix" | "broken" | "newer".
 */
export function parseCode(text) {
  const clean = String(text || "").replace(/\s+/g, "");
  if (!clean.startsWith(PREFIX)) throw Object.assign(new Error("Missing AM2: prefix"), { code: "prefix" });
  let data;
  try {
    data = JSON.parse(fromBase64(clean.slice(PREFIX.length)));
  } catch {
    throw Object.assign(new Error("Code is damaged"), { code: "broken" });
  }
  try {
    return migrate(data);
  } catch (err) {
    const newer = /newer/.test(err.message);
    throw Object.assign(new Error(err.message), { code: newer ? "newer" : "broken" });
  }
}
