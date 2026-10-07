// Shared test helpers: a tiny static server for the repo root, a browser,
// and pages that record every console error and page error.

import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

export const WIDTHS = [390, 1280];
export const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || join(ROOT, "v2", "tests", "screenshots");

export function startServer() {
  const server = http.createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}/v2/`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

/**
 * webgl: software WebGL for the 3D car tests (part 15a). Only there: it also moves the 2D
 * canvas onto the slow software GPU, which would spoil the race performance tests.
 */
export async function setup({ webgl = false } = {}) {
  const server = await startServer();
  const browser = await chromium.launch(webgl ? { args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {});
  return {
    server,
    browser,
    async teardown() {
      await browser.close();
      await server.close();
    },
  };
}

/**
 * New page at the given width. `page.errors` collects console errors and page errors.
 * Google Fonts is stubbed so tests run offline without network errors.
 */
export async function openGame(browser, baseUrl, { width = 390, height = width < 600 ? 844 : 800, hash = "", storage } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 600 });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  if (storage !== undefined) {
    await context.addInitScript((data) => {
      if (!sessionStorage.getItem("__seeded")) {
        localStorage.setItem("autickove-mesto-v2", data);
        sessionStorage.setItem("__seeded", "1");
      }
    }, typeof storage === "string" ? storage : JSON.stringify(storage));
  }
  const page = await context.newPage();
  page.errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") page.errors.push(msg.text());
  });
  page.on("pageerror", (err) => page.errors.push(String(err)));
  await page.goto(baseUrl + hash);
  await page.waitForFunction(() => window.__game);
  return page;
}

export async function screenshot(page, name) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.waitForTimeout(350); // let entry animations settle
  await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`) });
}

/** Pass the parent gate: read "Koľko je a × b?" and type the answer. */
export async function passParentGate(page) {
  const q = await page.getByTestId("gate-question").textContent();
  const [, a, b] = q.match(/(\d+)\s*×\s*(\d+)/);
  await page.getByTestId("gate-input").fill(String(a * b));
  await page.getByTestId("gate-ok").click();
}

/** After a race the chest waits for a tap (DESIGN-v2 §4.5): tap it if it is there. */
export async function openChest(page) {
  const chest = page.getByTestId("chest");
  if (await chest.count()) await chest.click();
}
