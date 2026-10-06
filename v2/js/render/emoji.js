// Emoji drawn once into a small canvas, then reused (fast on tablets).

const emojiCache = new Map();

export function emojiSprite(char, size) {
  const s = Math.max(8, Math.round(size));
  const key = `${char}|${s}`;
  let cv = emojiCache.get(key);
  if (cv) return cv;
  cv = document.createElement("canvas");
  cv.width = cv.height = Math.ceil(s * 1.3);
  const g = cv.getContext("2d");
  g.font = `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(char || "❓", cv.width / 2, cv.height / 2 + s * 0.06);
  emojiCache.set(key, cv);
  if (emojiCache.size > 200) emojiCache.delete(emojiCache.keys().next().value);
  return cv;
}

export function drawEmoji(g, char, x, y, size, alpha = 1) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const cv = emojiSprite(char, size);
  if (alpha !== 1) g.globalAlpha = Math.max(0, Math.min(1, alpha));
  g.drawImage(cv, x - cv.width / 2, y - cv.height / 2);
  if (alpha !== 1) g.globalAlpha = 1;
}

