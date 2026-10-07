// Brush layer and undo history, shared by both colouring modes (DESIGN-v2 §7.3).
// The brush paints on its own canvas above the bucket fills, so it draws over coloured areas;
// the eraser removes only brush strokes. Strokes are kept as data in picture units (0..1),
// so they survive zoom and resize and can be undone one by one.

import { GLITTER, BRUSH_SIZES, COLORING } from "../../data/coloring/palette.js";

const glitterDef = (id) => GLITTER.find((g) => g.id === id) || null;

/** Undo stack of { undo, redo } actions, at most 20 steps (§7.3). */
export function createHistory(limit = COLORING.undoSteps) {
  const stack = [];
  return {
    push(action) {
      stack.push(action);
      if (stack.length > limit) stack.shift();
    },
    undo() {
      const a = stack.pop();
      a?.undo();
      return !!a;
    },
    get size() {
      return stack.length;
    },
  };
}

/** Canvas fill/stroke style for a colour or glitter id over a w × h area. */
export function paintStyle(g, color, w, h) {
  const gl = glitterDef(color);
  if (!gl) return typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : "#2b2d33";
  const grad = gl.id === "galaxy" ? g.createRadialGradient(w * 0.4, h * 0.4, 1, w / 2, h / 2, Math.max(w, h) * 0.7) : g.createLinearGradient(0, 0, w, h);
  gl.stops.forEach((c, i) => grad.addColorStop(i / Math.max(1, gl.stops.length - 1), c));
  return grad;
}

/**
 * @param {HTMLCanvasElement} canvas  sized by CSS to cover the picture
 * @param {object} opts { history, onStroke }
 */
export function createBrushLayer(canvas, { history, onStroke } = {}) {
  const g = canvas.getContext("2d");
  let strokes = [];
  let current = null;
  let w = 1;
  let h = 1;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function drawStroke(s) {
    if (!s.points.length) return;
    g.save();
    g.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = Math.max(1, s.size * w);
    g.strokeStyle = s.erase ? "#000" : paintStyle(g, s.color, w, h);
    g.beginPath();
    const [x0, y0] = s.points[0];
    g.moveTo(x0 * w, y0 * h);
    if (s.points.length === 1) g.lineTo(x0 * w + 0.1, y0 * h + 0.1);
    for (const [x, y] of s.points.slice(1)) g.lineTo(x * w, y * h);
    g.stroke();
    if (s.color === "galaxy" && !s.erase) {
      // sparkles along a galaxy stroke
      g.fillStyle = "#ffffff";
      s.points.forEach(([x, y], i) => i % 4 === 0 && g.fillRect(x * w - 1, y * h - 1, 2, 2));
    }
    g.restore();
  }

  function redraw() {
    g.clearRect(0, 0, w, h);
    for (const s of strokes) drawStroke(s);
  }

  const toUnit = (e) => {
    const r = canvas.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))];
  };

  return {
    resize,
    redraw,
    get strokes() {
      return strokes;
    },
    /** Start a stroke; tool: "brush" | "eraser"; sizeIndex 0..2. */
    begin(e, { tool, color, sizeIndex = 1 }) {
      current = { color, erase: tool === "eraser", size: BRUSH_SIZES[sizeIndex] * (tool === "eraser" ? 2 : 1), points: [toUnit(e)] };
      strokes.push(current);
      drawStroke(current);
    },
    move(e) {
      if (!current) return;
      const p = toUnit(e);
      const last = current.points[current.points.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.003) return;
      current.points.push(p);
      redraw();
    },
    end() {
      if (!current) return;
      const s = current;
      current = null;
      history?.push({
        undo: () => {
          strokes = strokes.filter((x) => x !== s);
          redraw();
        },
      });
      onStroke?.(s);
    },
    get active() {
      return !!current;
    },
    hasPaint: () => strokes.some((s) => !s.erase),
    canvas,
  };
}
