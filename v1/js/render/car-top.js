function wheelTop(x, cx, cy, tw, th, wh, t = 0) {
  if (wh === "big") {
    tw *= 1.3;
    th *= 1.15;
  }
  x.fillStyle = "#1f2229";
  rr(x, cx - tw / 2, cy - th / 2, tw, th, tw * 0.3);
  x.fill();
  if (wh === "neon") {
    x.strokeStyle = `rgba(57,255,136,${0.6 + 0.4 * Math.sin(t * 6)})`;
    x.lineWidth = 2;
    rr(x, cx - tw / 2, cy - th / 2, tw, th, tw * 0.3);
    x.stroke();
  }
  const hub = {
    gold: "#ffc533",
    star: "#ffc533",
    sport: "#e3e8ef",
    flower: "#ff6fb5",
    fire: Math.floor(t * 10) % 2 ? "#ffd23f" : "#ff8c1a",
  }[wh];
  if (hub) {
    x.fillStyle = hub;
    x.fillRect(cx - tw * 0.25, cy - th * 0.3, tw * 0.5, th * 0.6);
  }
}
function topFill(x, tu, col, L, t) {
  if (tu.col === "rainbow") {
    const g = x.createLinearGradient(0, -L / 2, 0, L / 2);
    RAINBOW.forEach((c, i) => g.addColorStop(i / 5, c));
    return g;
  }
  if (tu.col === "galaxy") {
    const g = x.createRadialGradient(0, -L * 0.15, 2, 0, 0, L * 0.6);
    g.addColorStop(0, "#8a6bff");
    g.addColorStop(0.6, "#2a1660");
    g.addColorStop(1, "#120a33");
    return g;
  }
  return col;
}
function topPattern(x, pt, w, L) {
  const hw = w / 2,
    hl = L / 2;
  if (pt === "dots") {
    x.fillStyle = "rgba(255,255,255,.55)";
    for (let y = -hl + 3; y < hl; y += w * 0.2)
      for (let xx = -hw + 3; xx < hw; xx += w * 0.2) {
        x.beginPath();
        x.arc(xx, y, w * 0.04, 0, 7);
        x.fill();
      }
  }
  if (pt === "checker") {
    const s = w / 5;
    x.fillStyle = "rgba(21,49,77,.25)";
    for (let i = 0; i * s < L; i++)
      for (let j = 0; j < 5; j++) if ((i + j) % 2) x.fillRect(-hw + j * s, -hl + i * s, s, s);
  }
  if (pt === "zebra") {
    x.strokeStyle = "rgba(21,49,77,.55)";
    x.lineWidth = w * 0.09;
    for (let y = -hl; y < hl; y += w * 0.3) {
      x.beginPath();
      x.moveTo(-hw, y);
      x.quadraticCurveTo(0, y + w * 0.15, hw, y);
      x.stroke();
    }
  }
  if (pt === "camo") {
    [
      ["#3d5a2a", -0.2, -0.3],
      ["#6b4f2a", 0.2, -0.05],
      ["#2f4a22", -0.15, 0.2],
      ["#6b4f2a", 0.15, 0.35],
    ].forEach(([c, a, b]) => {
      x.fillStyle = c;
      x.globalAlpha = 0.75;
      x.beginPath();
      x.ellipse(a * w, b * L, w * 0.22, w * 0.14, 0, 0, 7);
      x.fill();
    });
    x.globalAlpha = 1;
  }
  if (pt === "flames") {
    x.fillStyle = "#ff8c1a";
    x.beginPath();
    x.moveTo(-hw, -hl);
    x.lineTo(hw, -hl);
    x.lineTo(hw, -hl + L * 0.2);
    for (let i = 0; i <= 4; i++) x.lineTo(hw - (i * w) / 4, -hl + L * (i % 2 ? 0.45 : 0.28));
    x.closePath();
    x.fill();
    x.fillStyle = "#ffd23f";
    x.beginPath();
    x.moveTo(-hw * 0.6, -hl);
    x.lineTo(hw * 0.6, -hl);
    x.lineTo(hw * 0.5, -hl + L * 0.18);
    x.lineTo(0, -hl + L * 0.3);
    x.lineTo(-hw * 0.5, -hl + L * 0.18);
    x.fill();
  }
  if (pt === "stars") {
    x.fillStyle = "rgba(255,255,255,.85)";
    [
      [-0.25, -0.3],
      [0.2, -0.1],
      [-0.15, 0.15],
      [0.22, 0.32],
      [0, 0.42],
    ].forEach(([a, b]) => {
      x.beginPath();
      for (let i = 0; i < 10; i++) {
        const an = -Math.PI / 2 + (i * Math.PI) / 5,
          r = i % 2 ? w * 0.04 : w * 0.09;
        x.lineTo(a * w + Math.cos(an) * r, b * L + Math.sin(an) * r);
      }
      x.fill();
    });
  }
}
function drawTop(x, def, tu, w, t = 0, col0) {
  const k = def.k,
    col = col0 || carColor(def, tu),
    dk = shade(col, -0.3),
    lt = shade(col, 0.28),
    L = carLen(def, w),
    hw = w / 2,
    hl = L / 2;
  x.save();
  if (tu.gl && tu.gl !== "none") {
    const gc = tu.gl === "rainbow" ? RAINBOW[((Math.floor(t * 4) % 6) + 6) % 6] : tu.gl;
    const g = x.createRadialGradient(0, 0, w * 0.2, 0, 0, L * 0.75);
    g.addColorStop(0, gc + "cc");
    g.addColorStop(1, gc + "00");
    x.fillStyle = g;
    x.globalAlpha = 0.75 + 0.25 * Math.sin(t * 5);
    x.beginPath();
    x.ellipse(0, 0, w * 1.05, L * 0.72, 0, 0, 7);
    x.fill();
    x.globalAlpha = 1;
  }
  if (tu.sp === "jet") {
    const f = hl + w * (0.35 + Math.sin(t * 40) * 0.12);
    x.fillStyle = "#ffc533";
    x.beginPath();
    x.moveTo(-w * 0.22, hl);
    x.lineTo(0, f + w * 0.25);
    x.lineTo(w * 0.22, hl);
    x.fill();
    x.fillStyle = "#ff5a4a";
    x.beginPath();
    x.moveTo(-w * 0.12, hl);
    x.lineTo(0, f);
    x.lineTo(w * 0.12, hl);
    x.fill();
  }
  if (tu.sp === "wings") {
    const fl = 1 + Math.sin(t * 8) * 0.18;
    x.fillStyle = "#fff";
    x.strokeStyle = "#15314d";
    x.lineWidth = 1.2;
    [-1, 1].forEach((sd) => {
      x.save();
      x.translate(sd * hw * 0.9, hl * 0.35);
      x.scale(sd * fl, 1);
      x.beginPath();
      x.moveTo(0, -L * 0.12);
      x.quadraticCurveTo(w * 0.8, -L * 0.2, w * 0.75, L * 0.02);
      x.quadraticCurveTo(w * 0.45, 0, w * 0.5, L * 0.1);
      x.quadraticCurveTo(w * 0.2, L * 0.05, 0, L * 0.08);
      x.closePath();
      x.fill();
      x.stroke();
      x.restore();
    });
  }
  if (k === "rocket") {
    const fl = hl + w * (0.5 + Math.sin(t * 35) * 0.15);
    x.fillStyle = "#ffc533";
    x.beginPath();
    x.moveTo(-w * 0.25, hl - w * 0.1);
    x.lineTo(0, fl + w * 0.3);
    x.lineTo(w * 0.25, hl - w * 0.1);
    x.fill();
    x.fillStyle = "#ff5a4a";
    x.beginPath();
    x.moveTo(-hw, hl);
    x.lineTo(-w * 0.2, hl - L * 0.3);
    x.lineTo(-w * 0.2, hl);
    x.fill();
    x.beginPath();
    x.moveTo(hw, hl);
    x.lineTo(w * 0.2, hl - L * 0.3);
    x.lineTo(w * 0.2, hl);
    x.fill();
    x.fillStyle = topFill(x, tu, col, L, t);
    x.strokeStyle = "#15314d";
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(0, 0, w * 0.32, hl, 0, 0, 7);
    x.fill();
    x.stroke();
    x.fillStyle = "#ff5a4a";
    x.beginPath();
    x.ellipse(0, -hl + L * 0.12, w * 0.22, L * 0.13, 0, 0, 7);
    x.fill();
    x.fillStyle = "#7fd0ff";
    x.beginPath();
    x.arc(0, -hl + L * 0.38, w * 0.14, 0, 7);
    x.fill();
    x.stroke();
    x.restore();
    return;
  }
  x.fillStyle = "rgba(0,0,0,.28)";
  rr(x, -hw + w * 0.1, -hl + w * 0.14, w, L, w * 0.28);
  x.fill();
  const tw = w * 0.2,
    th = Math.min(L * 0.17, w * 0.38);
  if (k === "tractor") {
    wheelTop(x, -hw, hl - L * 0.27, tw * 1.7, th * 1.9, tu.wh, t);
    wheelTop(x, hw, hl - L * 0.27, tw * 1.7, th * 1.9, tu.wh, t);
    wheelTop(x, -hw * 0.8, -hl + L * 0.18, tw, th, tu.wh, t);
    wheelTop(x, hw * 0.8, -hl + L * 0.18, tw, th, tu.wh, t);
  } else {
    const ys =
        k === "bus" || k === "truck"
          ? [-hl + L * 0.14, hl - L * 0.14, hl - L * 0.3]
          : [-hl + L * 0.22, hl - L * 0.22],
      ox = k === "formula" ? hw * 0.95 : hw * 0.92;
    ys.forEach((y) => {
      wheelTop(x, -ox, y, tw, th, tu.wh, t);
      wheelTop(x, ox, y, tw, th, tu.wh, t);
    });
  }
  if (tu.sp === "small" || tu.sp === "big") {
    const sw = tu.sp === "big" ? w * 1.15 : w * 0.9;
    x.fillStyle = dk;
    x.strokeStyle = "#15314d";
    x.lineWidth = 1.5;
    rr(x, -sw / 2, hl - w * 0.12, sw, w * (tu.sp === "big" ? 0.2 : 0.14), 3);
    x.fill();
    x.stroke();
  }
  x.strokeStyle = "#15314d";
  x.lineWidth = Math.max(1.5, w * 0.05);
  const fill = topFill(x, tu, col, L, t);
  const bodyClip = () => {
    x.save();
    rr(x, -hw, -hl, w, L, w * 0.3);
    x.clip();
    if (tu.col === "galaxy") {
      x.fillStyle = "#fff";
      for (let i = 0; i < 8; i++)
        x.fillRect((((i * 37) % 10) / 10 - 0.5) * w, (((i * 53) % 10) / 10 - 0.5) * L, 1.5, 1.5);
    }
    topPattern(x, tu.pt, w, L);
    x.restore();
  };
  if (k === "formula") {
    x.fillStyle = dk;
    rr(x, -hw, -hl, w, L * 0.07, 3);
    x.fill();
    rr(x, -hw, hl - L * 0.08, w, L * 0.08, 3);
    x.fill();
    x.fillStyle = fill;
    rr(x, -w * 0.22, -hl, w * 0.44, L, w * 0.2);
    x.fill();
    x.stroke();
    x.fillStyle = "#ffd23f";
    x.beginPath();
    x.arc(0, -hl + L * 0.52, w * 0.16, 0, 7);
    x.fill();
    x.stroke();
  } else if (k === "truck") {
    x.fillStyle = shade(col, 0.55);
    rr(x, -hw * 1.04, -hl + L * 0.31, w * 1.08, L * 0.69, w * 0.12);
    x.fill();
    x.stroke();
    x.fillStyle = fill;
    rr(x, -hw, -hl, w, L * 0.28, w * 0.25);
    x.fill();
    x.stroke();
    x.fillStyle = "#2b4a6b";
    x.fillRect(-hw * 0.75, -hl + L * 0.06, w * 0.75, L * 0.06);
  } else {
    x.fillStyle = fill;
    rr(x, -hw, -hl, w, L, w * 0.3);
    x.fill();
    bodyClip();
    rr(x, -hw, -hl, w, L, w * 0.3);
    x.stroke();
    const y1 = -hl + L * (k === "bus" ? 0.06 : 0.2),
      y2 = y1 + L * (k === "bus" ? 0.06 : 0.13);
    const wg = x.createLinearGradient(-hw, y1, hw, y2);
    wg.addColorStop(0, "#4a7aa6");
    wg.addColorStop(0.5, "#2b4a6b");
    wg.addColorStop(1, "#1d3550");
    x.fillStyle = wg;
    x.beginPath();
    x.moveTo(-hw * 0.7, y1);
    x.lineTo(hw * 0.7, y1);
    x.lineTo(hw * 0.82, y2);
    x.lineTo(-hw * 0.82, y2);
    x.fill();
    if (k === "pickup") {
      x.fillStyle = tu.col === "rainbow" || tu.col === "galaxy" ? "rgba(255,255,255,.25)" : lt;
      x.fillRect(-hw * 0.78, y2, w * 0.78, L * 0.2);
      x.fillStyle = dk;
      rr(x, -hw * 0.8, -hl + L * 0.56, w * 0.8, L * 0.38, 4);
      x.fill();
    } else if (k === "tractor") {
      x.fillStyle = lt;
      x.fillRect(-hw * 0.8, hl - L * 0.5, w * 0.8, L * 0.42);
      x.fillStyle = "#4a4f5c";
      x.beginPath();
      x.arc(hw * 0.4, -hl + L * 0.15, w * 0.08, 0, 7);
      x.fill();
    } else {
      const ye = hl - L * (k === "bus" ? 0.05 : 0.25);
      x.fillStyle = tu.col === "rainbow" || tu.col === "galaxy" ? "rgba(255,255,255,.18)" : lt;
      x.fillRect(-hw * 0.78, y2, w * 0.78, ye - y2);
      if (k !== "bus") {
        x.fillStyle = "#2b4a6b";
        x.fillRect(-hw * 0.72, ye, w * 0.72, L * 0.07);
      } else {
        x.fillStyle = dk;
        for (let i = 0; i < 3; i++) x.fillRect(-w * 0.15, y2 + L * (0.15 + i * 0.25), w * 0.3, L * 0.06);
      }
    }
    x.fillStyle = "rgba(255,255,255,.28)";
    rr(x, -hw * 0.82, -hl + L * 0.06, w * 0.12, L * 0.85, w * 0.06);
    x.fill();
  }
  if (tu.st === "stripes" && k !== "formula") {
    x.fillStyle = "rgba(255,255,255,.9)";
    x.fillRect(-w * 0.16, -hl + 2, w * 0.1, L - 4);
    x.fillRect(w * 0.06, -hl + 2, w * 0.1, L - 4);
  }
  const rm = k === "truck" ? -hl + L * 0.17 : -hl + L * 0.45;
  if (def.x === "taxi") {
    x.fillStyle = "#ffd23f";
    x.strokeStyle = "#15314d";
    x.lineWidth = 1.5;
    rr(x, -w * 0.22, rm - w * 0.1, w * 0.44, w * 0.2, 3);
    x.fill();
    x.stroke();
  }
  if (def.x === "police" || def.x === "amb") {
    const on = Math.floor(t * 6) % 2;
    x.fillStyle = on ? "#ff4d4d" : "#ff9a9a";
    x.fillRect(-w * 0.32, rm - w * 0.08, w * 0.32, w * 0.16);
    x.fillStyle = on ? "#9cc4ff" : "#3a86ff";
    x.fillRect(0, rm - w * 0.08, w * 0.32, w * 0.16);
  }
  if (def.x === "amb") {
    x.fillStyle = "#ff4d4d";
    x.fillRect(-w * 0.06, rm + w * 0.25, w * 0.12, w * 0.4);
    x.fillRect(-w * 0.2, rm + w * 0.39, w * 0.4, w * 0.12);
  }
  if (def.x === "fire") {
    x.strokeStyle = "#cfd6e0";
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(-w * 0.15, -hl + L * 0.35);
    x.lineTo(-w * 0.15, hl - 4);
    x.moveTo(w * 0.15, -hl + L * 0.35);
    x.lineTo(w * 0.15, hl - 4);
    for (let y = -hl + L * 0.38; y < hl - 4; y += w * 0.15) {
      x.moveTo(-w * 0.15, y);
      x.lineTo(w * 0.15, y);
    }
    x.stroke();
  }
  const ry = def.x ? rm + w * 0.35 : rm + w * 0.05;
  x.strokeStyle = "#15314d";
  x.lineWidth = 1.2;
  if (tu.rf === "box") {
    x.fillStyle = "#2a2d36";
    rr(x, -w * 0.28, ry - L * 0.12, w * 0.56, L * 0.26, w * 0.12);
    x.fill();
    x.stroke();
  }
  if (tu.rf === "surf") {
    x.fillStyle = "#20c9b8";
    x.beginPath();
    x.ellipse(0, ry, w * 0.18, L * 0.48, 0, 0, 7);
    x.fill();
    x.stroke();
    x.fillStyle = "#fff";
    x.fillRect(-1, ry - L * 0.4, 2, L * 0.8);
  }
  if (tu.rf === "siren") {
    x.fillStyle = Math.floor(t * 6) % 2 ? "#ff4d4d" : "#3a86ff";
    x.beginPath();
    x.arc(0, ry, w * 0.14, 0, 7);
    x.fill();
    x.stroke();
  }
  if (tu.rf === "prop") {
    x.save();
    x.translate(0, ry);
    x.rotate(t * 18);
    x.fillStyle = "#ffd23f";
    x.fillRect(-w * 0.42, -w * 0.05, w * 0.42, w * 0.1);
    x.fillStyle = "#ff4d4d";
    x.fillRect(0, -w * 0.05, w * 0.42, w * 0.1);
    x.restore();
  }
  if (tu.rf === "duck") {
    x.fillStyle = "#000";
    x.font = `${w * 0.42}px ${EMO}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("🦆", 0, ry);
  }
  if (STK_E[tu.st]) {
    x.fillStyle = "#000";
    x.font = `${w * 0.38}px ${EMO}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(STK_E[tu.st], 0, k === "truck" ? hl - L * 0.3 : hl - L * 0.42);
  }
  if (tu.st === "num") {
    const yy = k === "truck" ? hl - L * 0.3 : hl - L * 0.42;
    x.fillStyle = "#fff";
    x.beginPath();
    x.arc(0, yy, w * 0.18, 0, 7);
    x.fill();
    x.fillStyle = "#15314d";
    x.font = `800 ${w * 0.26}px sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("7", 0, yy + 1);
  }
  x.fillStyle = "#fff6b0";
  x.beginPath();
  x.arc(-hw * 0.62, -hl + w * 0.09, w * 0.09, 0, 7);
  x.arc(hw * 0.62, -hl + w * 0.09, w * 0.09, 0, 7);
  x.fill();
  x.fillStyle = "#ff3b3b";
  x.fillRect(-hw * 0.85, hl - w * 0.07, w * 0.22, w * 0.06);
  x.fillRect(hw * 0.63, hl - w * 0.07, w * 0.22, w * 0.06);
  x.restore();
}
