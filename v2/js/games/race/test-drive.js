// 🛣️ Test drive (DESIGN-v2 §14, part 15b): from the showroom the child drives the car with its
// whole look on an empty city road for a short while. No rivals, no obstacles, no rewards;
// tap left or right to change lanes, 📯 honks. Ends by itself or with ✖.

import { h, modal, closeModal } from "../../core/ui.js";
import { createLoop } from "../../core/loop.js";
import { speak, playNotes, sfx } from "../../core/audio.js";
import { TRACKS } from "../../data/tracks.js";
import { setLook } from "../../systems/stats.js";
import { getLook, resolveLook } from "../../systems/tuning.js";
import { activeBuddy, buddyLook } from "../../systems/crew.js";
import { createDriveScene } from "./drive-scene.js";

export const TEST_DRIVE_SECONDS = 14;

/** Open the test drive over the current screen (a modal). Returns the modal box. */
export function openTestDrive(look = { ...getLook(), ...setLook() }, { onClose } = {}) {
  const track = TRACKS.find((t) => t.id === "city") || TRACKS[0];
  const looks = resolveLook(look);
  const canvas = h("canvas", { class: "drive-canvas", "data-testid": "test-drive-canvas" });
  const close = h("button", { class: "btn ghost drive-close", "data-testid": "test-drive-close", "aria-label": "Koniec", onclick: () => closeModal() }, "✖");
  const horn = h("button", { class: "btn sun drive-horn", "aria-label": "Trúbiť", onclick: () => playNotes(looks.horn.notes) }, "📯");
  const time = h("div", { class: "drive-time", "aria-hidden": "true" }, h("i"));
  const wrap = h("div", { class: "drive-wrap" }, canvas, time, close, horn);

  let left = TEST_DRIVE_SECONDS;
  let scene = null;
  const resize = () => scene?.resize();

  const loop = createLoop({
    update(dt) {
      left -= dt;
      scene.update(dt);
      time.firstElementChild.style.width = `${Math.max(0, left / TEST_DRIVE_SECONDS) * 100}%`;
      if (left <= 0) closeModal();
    },
    draw(t) {
      scene.draw(t);
    },
  });

  const onPointer = (e) => {
    if (e.target !== canvas) return;
    const b = canvas.getBoundingClientRect();
    scene.steer(e.clientX - b.left < b.width / 2 ? -1 : 1);
    sfx.tap();
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft") scene.steer(-1);
    if (e.key === "ArrowRight") scene.steer(1);
  };
  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", resize);

  const box = modal(wrap, {
    className: "test-drive",
    testId: "test-drive-modal",
    dismissible: false,
    onClose: () => {
      loop.stop();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      if (window.__game) window.__game.testDrive = null;
      onClose?.();
    },
  });
  scene = createDriveScene(canvas, { track, look, buddy: buddyLook(activeBuddy()) });
  resize();
  loop.start();
  speak("Skúšobná jazda! Ťukaj vľavo a vpravo.");
  if (window.__game) window.__game.testDrive = scene.race; // test hook
  return box;
}
