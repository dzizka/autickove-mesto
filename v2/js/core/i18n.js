// Languages (DESIGN-v2 §15, part 19): Slovak (the source language of the code) and English.
// A text is looked up by its Slovak wording, so the code stays readable and a missing
// translation simply stays Slovak. t() is called for texts with numbers or names in them;
// ui.h(), speak() and toast() translate plain texts by themselves.

import { EN } from "../data/i18n/en.js";

export const LANGS = [
  { id: "sk", flag: "🇸🇰", name: "Slovenčina", voice: "sk-SK", locale: "sk-SK" },
  { id: "en", flag: "🇬🇧", name: "English", voice: "en-GB", locale: "en-GB" },
];

const DICTS = { en: EN };
const SLOVAK = /[áäčďéíĺľňóôŕšťúýžÁČĎÉÍĽŇÓŠŤÚÝŽ]/;

let lang = "sk";

/** Texts the game asked for in English that have no translation yet (the tests read it). */
export const missing = new Set();

/** The device language: Slovak and Czech devices get Slovak, everybody else English. */
export function detectLang(nav = typeof navigator === "undefined" ? null : navigator) {
  const l = String(nav?.languages?.[0] || nav?.language || "sk").toLowerCase();
  return /^(sk|cs)/.test(l) ? "sk" : "en";
}

export function setLang(id) {
  lang = LANGS.some((l) => l.id === id) ? id : "sk";
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export const getLang = () => lang;
export const langDef = () => LANGS.find((l) => l.id === lang);
/** Numbers with the separators of the language (5 000 / 5,000). */
export const num = (n) => Number(n).toLocaleString(langDef().locale);

/**
 * The text in the chosen language. params fill {name} places: t("Úroveň {n}", { n: 3 }).
 * Values of params are not translated: pass t(name) for names.
 */
export function t(text, params) {
  let s = text;
  if (lang !== "sk" && typeof text === "string") {
    const hit = DICTS[lang][text];
    if (hit !== undefined) s = hit;
    else if (/[a-zá-ž]{2}/i.test(text)) missing.add(text);
  }
  if (params) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
  return s;
}

/** Plain texts on the page: translated when known; only Slovak-looking ones count as missing. */
export function auto(text) {
  if (lang === "sk" || typeof text !== "string" || !text) return text;
  const hit = DICTS[lang][text];
  if (hit !== undefined) return hit;
  if (SLOVAK.test(text)) missing.add(text);
  return text;
}
