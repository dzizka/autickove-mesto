// Free painting (DESIGN-v2 §7.1): an SVG picture with closed areas; the bucket fills the tapped
// area, the brush draws on a layer above. ✔ finishes the picture, it goes to the gallery.

import { h } from "../../core/ui.js";
import { GLITTER, COLORING } from "../../data/coloring/palette.js";
import { ownedGlitter, pictureReward } from "../../systems/coloring.js";
import { createHistory, createBrushLayer } from "./brush.js";
import { createToolbar, createPalette } from "./tools.js";
import { t } from "../../core/i18n.js";

const NS = "http://www.w3.org/2000/svg";
const OUTLINE = "#2b2d33";

function glitterDefs() {
  return GLITTER.map((g) => {
    const stops = g.stops.map((c, i) => `<stop offset="${(i / (g.stops.length - 1)) * 100}%" stop-color="${c}"/>`).join("");
    return g.id === "galaxy" ? `<radialGradient id="gl-${g.id}" cx=".4" cy=".4" r=".8">${stops}</radialGradient>` : `<linearGradient id="gl-${g.id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>`;
  }).join("");
}

const fillValue = (color) => (GLITTER.some((g) => g.id === color) ? `url(#gl-${color})` : color);

/** Build the picture SVG; fillable shapes get data-area. */
export function pictureSvg(pic) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 200 200");
  svg.setAttribute("class", "free-svg");
  svg.innerHTML = `<defs>${glitterDefs()}</defs>`;
  pic.shapes.forEach((shape, i) => {
    const opts = typeof shape[shape.length - 1] === "object" ? shape[shape.length - 1] : {};
    const [kind, ...a] = shape;
    const el = document.createElementNS(NS, kind === "poly" ? "polygon" : kind);
    const set = (k, v) => el.setAttribute(k, String(v));
    if (kind === "rect") [["x", a[0]], ["y", a[1]], ["width", a[2]], ["height", a[3]], ["rx", typeof a[4] === "number" ? a[4] : 0]].forEach(([k, v]) => set(k, v));
    else if (kind === "circle") [["cx", a[0]], ["cy", a[1]], ["r", a[2]]].forEach(([k, v]) => set(k, v));
    else if (kind === "ellipse") [["cx", a[0]], ["cy", a[1]], ["rx", a[2]], ["ry", a[3]]].forEach(([k, v]) => set(k, v));
    else if (kind === "poly") set("points", a[0]);
    else if (kind === "path") set("d", a[0]);
    set("stroke", OUTLINE);
    set("stroke-width", i === 0 ? 0 : 2.5);
    set("stroke-linejoin", "round");
    if (opts.line) {
      set("fill", "none");
      set("stroke-linecap", "round");
      el.style.pointerEvents = "none";
    } else if (opts.k) {
      set("fill", opts.k);
      el.style.pointerEvents = "none";
    } else {
      set("fill", "#ffffff");
      el.dataset.area = String(i);
    }
    svg.append(el);
  });
  return svg;
}

/** Small JPEG of the picture with the brush layer on top (for the gallery). */
export function freeThumbnail(svg, brushCanvas, size = COLORING.thumbSize) {
  return new Promise((resolve) => {
    const clone = svg.cloneNode(true);
    clone.setAttribute("width", size);
    clone.setAttribute("height", size);
    clone.setAttribute("xmlns", NS);
    const img = new Image();
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const g = cv.getContext("2d");
    const done = () => {
      try {
        g.drawImage(brushCanvas, 0, 0, size, size);
        resolve(cv.toDataURL("image/jpeg", COLORING.thumbQuality));
      } catch {
        resolve(cv.toDataURL("image/jpeg", COLORING.thumbQuality));
      }
    };
    img.onload = () => {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, size, size);
      g.drawImage(img, 0, 0, size, size);
      done();
    };
    img.onerror = done;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  });
}

export function startFreePaint(view, ctx, pic, cleanup) {
  const { sfx } = ctx.audio;
  const history = createHistory();
  const svg = pictureSvg(pic);
  const canvas = h("canvas", { class: "brush-layer", "data-testid": "brush-layer" });
  const stage = h("div", { class: "free-stage", "data-testid": "free-stage" }, svg, canvas);
  const brush = createBrushLayer(canvas, { history, onStroke: () => toolbar.setUndo(true) });
  let painted = 0;

  const palette = createPalette({
    owned: ownedGlitter(),
    onPick: () => sfx.tap(),
    onLocked: () => {
      sfx.oops();
      ctx.speak("Trblietavé farby získaš za hotové obrázky!");
    },
  });

  const finish = async () => {
    if (!painted && !brush.hasPaint()) {
      sfx.oops();
      ctx.speak("Najprv niečo vymaľuj!");
      return;
    }
    const thumb = await freeThumbnail(svg, canvas);
    ctx.finish({ ...pictureReward({ mode: "free" }), extra: { coloring: { id: pic.id, mode: "free", thumb } } });
  };

  const toolbar = createToolbar({
    onExit: ctx.exit,
    onUndo: () => toolbar.setUndo(history.undo() && history.size > 0),
    onDone: finish,
    onTool: (tool) => (canvas.style.pointerEvents = tool === "bucket" ? "none" : "auto"),
    speak: (t) => ctx.speak(t),
    sfx,
  });
  toolbar.setUndo(false);
  canvas.style.pointerEvents = "none";

  // bucket: fill the tapped area
  const onSvgClick = (e) => {
    if (toolbar.state.tool !== "bucket") return;
    const area = e.target.closest?.("[data-area]");
    if (!area) return;
    const prev = area.getAttribute("fill");
    const next = fillValue(palette.color);
    if (prev === next) return;
    area.setAttribute("fill", next);
    area.dataset.filled = palette.color;
    painted++;
    sfx.coin();
    history.push({ undo: () => (area.setAttribute("fill", prev), painted--) });
    toolbar.setUndo(true);
  };
  svg.addEventListener("click", onSvgClick);

  // brush and eraser on the layer above
  const down = (e) => {
    canvas.setPointerCapture?.(e.pointerId);
    brush.begin(e, { tool: toolbar.state.tool, color: palette.color, sizeIndex: toolbar.state.size });
  };
  const move = (e) => brush.active && brush.move(e);
  const up = () => brush.end();
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  const wrap = h("section", { class: "screen game coloring free", "data-testid": "screen-game-coloring", "data-mode": "free", "data-picture": pic.id }, h("div", { class: "cwork" }, stage), h("div", { class: "cside" }, toolbar.el, palette.el));
  view.append(wrap);
  brush.resize();
  const onResize = () => brush.resize();
  window.addEventListener("resize", onResize);
  cleanup.push(() => window.removeEventListener("resize", onResize));
  ctx.speak(t("{name}. Vyber farbu a ťukni do obrázka.", { name: t(pic.name) }));
  return { svg, brush, history };
}
