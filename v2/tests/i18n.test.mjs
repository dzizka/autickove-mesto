// Part 19: the game in English. The dictionary is sound, an English device starts in English,
// every screen and game shows and says no Slovak text, the flags switch the language.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { EN } from "../js/data/i18n/en.js";
import { setup, openGame, screenshot } from "./helpers.mjs";

const SLOVAK = /[áäčďéíĺľňóôŕšťúýžÁČĎÉÍĽŇÓŠŤÚÝŽ]/;

test("dictionary: every value is English and keeps the {name} places of its key", () => {
  for (const [k, v] of Object.entries(EN)) {
    assert.ok(typeof v === "string" && v.length > 0, k);
    assert.ok(k === "Slovenčina" || !SLOVAK.test(v), `Slovak letters in the English text of "${k}": ${v}`);
    const places = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(places(v), places(k), `{places} of "${k}"`);
  }
});

let env;
before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

// everything open, so every screen and game can be visited
const rich = { level: 20, coins: 50000, scrap: 500, settings: { sound: false, voice: true }, cheats: { shortRaces: true } };

/** Record what the game says (the speech is stubbed, nothing is heard). */
const recordSpeech = () => {
  window.__said = [];
  const fake = { speaking: false, pending: false, getVoices: () => [], cancel() {}, speak: (u) => window.__said.push(u.text), addEventListener() {} };
  Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
};

async function slovakOnPage(page) {
  return page.evaluate((re) => {
    const rx = new RegExp(re);
    const out = new Set();
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement;
      if (el && el.closest("[aria-hidden=true], .lang-row") === null && rx.test(n.textContent) && el.offsetParent !== null) out.add(n.textContent.trim());
    }
    for (const el of document.querySelectorAll("[aria-label],[title],[placeholder]")) if (!el.closest(".lang-row")) for (const a of ["aria-label", "title", "placeholder"]) if (rx.test(el.getAttribute(a) || "")) out.add(`${a}: ${el.getAttribute(a)}`);
    return [...out];
  }, SLOVAK.source);
}

test("an English device plays in English: every screen and game, shown and spoken", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 1280, locale: "en-GB", storage: rich });
  await page.context().addInitScript(recordSpeech);
  await page.reload();
  await page.getByTestId("screen-home").waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "en");
  const found = {};
  const visit = async (hash, wait = 900) => {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(wait);
    const bad = await slovakOnPage(page);
    if (bad.length) found[hash] = bad;
    await page.evaluate(() => document.querySelector("[data-testid=reward-modal]") && window.__game.ui.closeModal?.());
  };
  for (const s of ["#/home", "#/races", "#/garage", "#/tuning", "#/crew", "#/coloring", "#/gallery", "#/games", "#/city", "#/album", "#/trophies", "#/settings", "#/parents"]) await visit(s);
  await screenshot(page, "1280-en-home");
  for (const g of ["pexeso", "wash", "repair", "park", "puzzle", "count", "maze", "letters", "music", "traffic"]) await visit(`#/game/${g}`, 1500);
  await visit("#/game/race/city/1", 2500);
  await screenshot(page, "1280-en-race");
  await visit("#/home");
  const res = await page.evaluate(async () => {
    const i18n = await import("./js/core/i18n.js");
    return { missing: [...i18n.missing], said: window.__said };
  });
  const slovakSaid = res.said.filter((s) => SLOVAK.test(s));
  assert.deepEqual(found, {}, "Slovak text on the page");
  assert.deepEqual(slovakSaid, [], "Slovak speech");
  assert.deepEqual(res.missing, [], "texts without an English translation");
  assert.ok(res.said.length > 10, "the game spoke");
  assert.deepEqual(page.errors.filter((e) => !/WebGL|speech/i.test(e)), []);
  await page.context().close();
});

test("the flags in the settings switch the language and it is remembered", async () => {
  const page = await openGame(env.browser, env.server.url, { width: 390, storage: { settings: { sound: false, voice: false } }, hash: "#/settings" });
  await page.getByTestId("screen-settings").waitFor();
  assert.match(await page.locator(".screen-title").textContent(), /Nastavenia/);
  await page.getByTestId("lang-en").click();
  await page.getByTestId("screen-settings").waitFor();
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.match(await page.locator(".screen-title").textContent(), /Settings/);
  assert.equal(await page.evaluate(() => window.__game.state.getState().settings.lang), "en");
  await screenshot(page, "390-en-settings");
  await page.getByTestId("lang-sk").click();
  await page.waitForFunction(() => document.documentElement.lang === "sk");
  await page.getByTestId("screen-settings").waitFor();
  assert.match(await page.locator(".screen-title").textContent(), /Nastavenia/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
