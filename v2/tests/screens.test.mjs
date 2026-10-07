// Every screen opens and can return home, at phone and desktop width,
// without any console error. Screenshots go to tests/screenshots/ for a visual check.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setup, openGame, screenshot, passParentGate, WIDTHS } from "./helpers.mjs";

const PILLARS = ["races", "garage", "tuning", "crew", "coloring", "city", "games"];
let env;

before(async () => {
  env = await setup();
});
after(async () => {
  await env.teardown();
});

for (const width of WIDTHS) {
  test(`home and every pillar screen at ${width}px`, async () => {
    const page = await openGame(env.browser, env.server.url, { width });
    await page.getByTestId("screen-home").waitFor();
    await screenshot(page, `${width}-home`);

    // no horizontal scroll on the home screen
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 0, `home overflows horizontally by ${overflow}px`);

    for (const id of PILLARS) {
      await page.getByTestId(`home-${id}`).click();
      await page.getByTestId(`screen-${id}`).waitFor();
      await page.getByTestId("topbar-home").click();
      await page.getByTestId("screen-home").waitFor();
    }

    // bottom navigation and the top-bar home button
    await page.getByTestId("home-races").click();
    await page.getByTestId("nav-crew").click();
    await page.getByTestId("screen-crew").waitFor();
    await page.getByTestId("topbar-home").click();
    await page.getByTestId("screen-home").waitFor();

    // browser back button works (hash routing)
    await page.getByTestId("home-tuning").click();
    await page.getByTestId("screen-tuning").waitFor();
    await page.goBack();
    await page.getByTestId("screen-home").waitFor();

    // all touch targets at least 56 px (DESIGN-v2 §1); top bar buttons are 52 px circles on purpose
    const small = await page.evaluate(() =>
      [...document.querySelectorAll(".view button")]
        .filter((b) => b.offsetParent)
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.width < 56 || r.height < 56).length,
    );
    assert.equal(small, 0, "some buttons are smaller than 56 px");

    assert.deepEqual(page.errors, []);
    await page.context().close();
  });

  test(`settings, transfer dialog and test menu at ${width}px`, async () => {
    const page = await openGame(env.browser, env.server.url, { width });
    await page.getByTestId("gear").click();
    await page.getByTestId("screen-settings").waitFor();
    await screenshot(page, `${width}-settings`);

    await page.getByTestId("open-transfer").click();
    await page.getByTestId("transfer-modal").waitFor();
    await screenshot(page, `${width}-transfer`);
    await page.keyboard.press("Escape"); // not bound: modal stays, close via backdrop instead
    await page.getByTestId("transfer-modal").click({ position: { x: 5, y: 5 } });
    await page.getByTestId("transfer-modal").waitFor({ state: "detached" });

    // hold ⚙️ for 3 s → parent gate → test menu
    const gear = page.getByTestId("gear");
    await gear.hover();
    await page.mouse.down();
    await page.waitForTimeout(3200);
    await page.mouse.up();
    await page.getByTestId("parent-gate").waitFor();
    await passParentGate(page);
    await page.getByTestId("test-menu").waitFor();
    await screenshot(page, `${width}-test-menu`);

    const before = await page.evaluate(() => window.__game.state.getState().coins);
    await page.getByTestId("cheat-c1k").click();
    const after = await page.evaluate(() => window.__game.state.getState().coins);
    assert.equal(after - before, 1000);

    await page.getByTestId("cheat-lvl").click();
    assert.equal(await page.getByTestId("level").textContent(), "2");

    await page.getByRole("button", { name: "Zavrieť" }).click();
    await page.getByTestId("back-home").click();
    await page.getByTestId("screen-home").waitFor();
    assert.deepEqual(page.errors, []);
    await page.context().close();
  });
}

test("a wrong parent-gate answer does not open the test menu", async () => {
  const page = await openGame(env.browser, env.server.url);
  await page.evaluate(() => {
    // open the gate directly; the 3 s hold is covered above
    document.querySelector("[data-testid=gear]").dispatchEvent(new PointerEvent("pointerdown"));
  });
  await page.getByTestId("parent-gate").waitFor({ timeout: 5000 });
  await page.getByTestId("gate-input").fill("1");
  await page.getByTestId("gate-ok").click();
  await page.waitForTimeout(200);
  assert.equal(await page.getByTestId("test-menu").count(), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
