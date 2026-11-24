import {
  ARCH_OPEN,
  BOULDER_H,
  CACTUS_H,
  PLAYER_X,
  type Game,
  type Obstacle,
  type Player,
} from "@/game/engine";

const SKY_TOP = "#6eb6e4";
const SKY_MID = "#f2b56a";
const SKY_HORIZON = "#f0894b";
const SUN = "#ffe7a3";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function paintSky(ctx: CanvasRenderingContext2D, w: number, h: number, dusk: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, dusk > 0.5 ? "#5aa4d6" : SKY_TOP);
  grad.addColorStop(0.55, SKY_MID);
  grad.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawSun(ctx: CanvasRenderingContext2D, w: number) {
  const x = w * 0.78;
  const y = 92;
  const glow = ctx.createRadialGradient(x, y, 10, x, y, 90);
  glow.addColorStop(0, "rgba(255,236,180,0.95)");
  glow.addColorStop(1, "rgba(255,180,80,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = SUN;
  ctx.beginPath();
  ctx.arc(x, y, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "rgba(255,248,236,0.88)";
  ctx.beginPath();
  ctx.ellipse(x, y, 28 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 22 * s, y + 4 * s, 20 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 20 * s, y + 6 * s, 16 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawButte(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  w: number,
  h: number,
  tint: number,
  far: boolean,
) {
  const colors = far
    ? ["#e7a56c", "#f0b57c", "#d99262"]
    : ["#d4844e", "#e09858", "#c67140"];
  ctx.fillStyle = colors[tint % colors.length] ?? colors[0];
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.lineTo(x + w * 0.18, base - h);
  ctx.lineTo(x + w * 0.72, base - h * 0.9);
  ctx.lineTo(x + w, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = far ? "rgba(255,230,190,0.45)" : "rgba(255,214,160,0.35)";
  ctx.fillRect(x + w * 0.22, base - h + 4, w * 0.42, 8);
}

function drawScrub(ctx: CanvasRenderingContext2D, x: number, ground: number, s: number) {
  ctx.strokeStyle = "#6e9a3c";
  ctx.lineWidth = 3 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, ground);
  ctx.quadraticCurveTo(x + 4 * s, ground - 16 * s, x + 10 * s, ground - 22 * s);
  ctx.moveTo(x, ground);
  ctx.quadraticCurveTo(x - 6 * s, ground - 12 * s, x - 8 * s, ground - 20 * s);
  ctx.stroke();
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, ground: number) {
  const h = CACTUS_H;
  const cx = x + 18;
  ctx.fillStyle = "#2f7d3c";
  roundRect(ctx, cx - 9, ground - h, 18, h, 8);
  ctx.fill();
  roundRect(ctx, cx - 24, ground - h + 30, 16, 12, 6);
  ctx.fill();
  roundRect(ctx, cx - 24, ground - h + 18, 12, 24, 6);
  ctx.fill();
  roundRect(ctx, cx + 8, ground - h + 18, 16, 12, 6);
  ctx.fill();
  roundRect(ctx, cx + 12, ground - h + 6, 12, 24, 6);
  ctx.fill();
  ctx.fillStyle = "#8fd18a";
  roundRect(ctx, cx - 5, ground - h + 8, 4, h - 18, 2);
  ctx.fill();
}

function drawBoulder(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number) {
  const h = BOULDER_H;
  ctx.fillStyle = "#c9844c";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, ground - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#efc08a";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.38, ground - h * 0.72, w * 0.22, h * 0.22, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(110,58,24,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, ground - h * 0.35);
  ctx.lineTo(x + w * 0.62, ground - h * 0.7);
  ctx.stroke();
}

function drawArch(ctx: CanvasRenderingContext2D, x: number, ground: number, w: number) {
  const lip = ground - ARCH_OPEN;
  ctx.fillStyle = "#c67a42";
  ctx.beginPath();
  ctx.moveTo(x - 16, lip + 6);
  ctx.lineTo(x + 10, lip - 48);
  ctx.lineTo(x + w * 0.45, lip - 62);
  ctx.lineTo(x + w - 6, lip - 40);
  ctx.lineTo(x + w + 18, lip + 4);
  ctx.lineTo(x + w - 8, lip + 10);
  ctx.quadraticCurveTo(x + w * 0.5, lip + 18, x + 8, lip + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e0a066";
  ctx.beginPath();
  ctx.moveTo(x + 18, lip - 8);
  ctx.lineTo(x + w * 0.42, lip - 46);
  ctx.lineTo(x + w * 0.62, lip - 36);
  ctx.lineTo(x + 36, lip - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#a86434";
  for (let i = 0; i < 4; i++) {
    const sx = x + 18 + i * (w / 4.2);
    ctx.beginPath();
    ctx.moveTo(sx, lip + 2);
    ctx.lineTo(sx + 8, lip + 2);
    ctx.lineTo(sx + 4, lip + 16);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.max(0.35, Math.abs(Math.sin(spin))), 1);
  ctx.fillStyle = "#e2a322";
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe27a";
  ctx.beginPath();
  ctx.arc(-2, -2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShieldGem(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 4) * 4);
  ctx.strokeStyle = "#1f8ea3";
  ctx.fillStyle = "rgba(150,230,245,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = t * 1.4 + (i / 6) * Math.PI * 2;
    const px = Math.cos(a) * 12;
    const py = Math.sin(a) * 12;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawRunner(ctx: CanvasRenderingContext2D, footY: number, p: Player, dead: boolean, shield: boolean, t: number) {
  const sliding = p.slide > 0 && p.y < 12 && !dead;
  const air = !p.grounded && !dead;
  const swing = air ? 0.55 : Math.sin(p.run);

  ctx.save();
  ctx.translate(PLAYER_X, footY);
  if (dead) ctx.rotate(Math.min(1.2, p.tumble * 6));

  ctx.fillStyle = "rgba(90,48,22,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 6, sliding ? 30 : 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sliding) {
    ctx.fillStyle = "#d6453d";
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.quadraticCurveTo(-36, -28, -48, -12);
    ctx.quadraticCurveTo(-28, -8, -8, -14);
    ctx.fill();
    ctx.fillStyle = "#2f6fae";
    roundRect(ctx, -8, -20, 28, 14, 6);
    ctx.fill();
    ctx.fillStyle = "#fff3d8";
    roundRect(ctx, 8, -24, 26, 16, 7);
    ctx.fill();
    limb(ctx, -6, -12, -22, -6, "#f3c7a0", 6);
    ctx.fillStyle = "#f2c14d";
    ctx.beginPath();
    ctx.ellipse(-24, -4, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3c7a0";
    ctx.beginPath();
    ctx.arc(30, -22, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a211c";
    ctx.beginPath();
    ctx.arc(30, -26, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#d6453d";
    roundRect(ctx, 22, -28, 16, 5, 2);
    ctx.fill();
  } else {
    const leg = swing * 14;
    limb(ctx, -2, -30, -8 - leg, -4, "#f3c7a0", 7);
    limb(ctx, 4, -30, 10 + leg, -4, "#f3c7a0", 7);
    ctx.fillStyle = "#f2c14d";
    ctx.beginPath();
    ctx.ellipse(-8 - leg, -2, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(10 + leg, -2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2f6fae";
    roundRect(ctx, -11, -46, 22, 18, 6);
    ctx.fill();
    ctx.fillStyle = "#fff3d8";
    roundRect(ctx, -13, -64, 26, 22, 8);
    ctx.fill();
    limb(ctx, -8, -58, -16 - swing * 10, -40, "#f3c7a0", 6);
    limb(ctx, 8, -58, 16 + swing * 10, -38, "#f3c7a0", 6);
    ctx.fillStyle = "#d6453d";
    ctx.beginPath();
    ctx.moveTo(-4, -62);
    ctx.quadraticCurveTo(-28 - swing * 4, -70, -34, -58);
    ctx.quadraticCurveTo(-18, -60, -2, -64);
    ctx.fill();
    ctx.fillStyle = "#f3c7a0";
    ctx.beginPath();
    ctx.arc(2, -74, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2a211c";
    ctx.beginPath();
    ctx.moveTo(-8, -78);
    ctx.lineTo(-4, -90);
    ctx.lineTo(2, -80);
    ctx.lineTo(8, -92);
    ctx.lineTo(12, -78);
    ctx.lineTo(-8, -78);
    ctx.fill();
    ctx.fillStyle = "#d6453d";
    roundRect(ctx, -12, -80, 24, 6, 3);
    ctx.fill();
    ctx.fillStyle = "#2a211c";
    ctx.fillRect(-2, -76, 3, 3);
    ctx.fillRect(5, -76, 3, 3);
  }

  if (shield) {
    ctx.strokeStyle = `rgba(120, 220, 235, ${0.45 + Math.sin(t * 8) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(2, sliding ? -16 : -48, sliding ? 40 : 26, sliding ? 20 : 42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, ground: number) {
  if (o.kind === "cactus") drawCactus(ctx, o.x, ground);
  else if (o.kind === "boulder") drawBoulder(ctx, o.x, ground, o.w);
  else drawArch(ctx, o.x, ground, o.w);
}

export function renderGame(ctx: CanvasRenderingContext2D, g: Game, cssW: number, cssH: number) {
  const lw = 960;
  let lh = lw * (cssH / Math.max(cssW, 1));
  let scale = cssW / lw;
  let ox = 0;
  let oy = 0;
  if (lh < 520) {
    lh = 520;
    scale = Math.min(cssW / lw, cssH / lh);
    ox = (cssW - lw * scale) / 2;
    oy = (cssH - lh * scale) / 2;
  }

  const dusk = Math.min(1, g.distance / 1600);
  paintSky(ctx, cssW, cssH, dusk);

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  const mag = g.shake * 7;
  if (mag > 0.2) {
    const sx = Math.sin(g.time * 48) * mag;
    const sy = Math.cos(g.time * 53) * mag * 0.6;
    ctx.translate(sx, sy);
  }

  const ground = lh - 78;
  drawSun(ctx, lw);
  for (const c of g.clouds) drawCloud(ctx, c.x, c.y + 10, c.s);

  for (const b of g.buttes) {
    if (b.layer === 0) drawButte(ctx, b.x, ground - 20, b.w, b.h, b.tint, true);
  }
  for (const b of g.buttes) {
    if (b.layer === 1) drawButte(ctx, b.x, ground - 6, b.w, b.h, b.tint, false);
  }
  for (const s of g.scrubs) drawScrub(ctx, s.x, ground - 2, s.s);

  ctx.fillStyle = "#e39a52";
  ctx.fillRect(-20, ground, lw + 40, lh - ground + 20);
  ctx.fillStyle = "#f6d19a";
  ctx.fillRect(-20, ground, lw + 40, 12);
  ctx.fillStyle = "#c47a3c";
  ctx.fillRect(-20, ground + 12, lw + 40, 7);

  const pebble = g.scroll % 72;
  for (let x = -pebble; x < lw + 72; x += 72) {
    ctx.fillStyle = "#b86b34";
    ctx.beginPath();
    ctx.ellipse(x + 20, ground + 34, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#efc07a";
    ctx.beginPath();
    ctx.ellipse(x + 48, ground + 48, 5, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (g.speed > 520 && g.phase === "running") {
    ctx.strokeStyle = "rgba(255,246,232,0.25)";
    ctx.lineWidth = 2;
    const stripes = 5;
    for (let i = 0; i < stripes; i++) {
      const y = 80 + ((g.scroll * 0.4 + i * 70) % (ground - 100));
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(70 + (i % 3) * 20, y);
      ctx.stroke();
    }
  }

  for (const o of g.obstacles) if (o.live) drawObstacle(ctx, o, ground);
  for (const c of g.pickups) {
    if (!c.live) continue;
    const bob = Math.sin(g.time * 6 + c.bob) * 3;
    if (c.kind === "coin") drawCoin(ctx, c.x, ground - c.y + bob, g.time * 5 + c.bob);
    else drawShieldGem(ctx, c.x, ground - c.y, g.time);
  }

  for (const p of g.particles) {
    if (!p.alive) continue;
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, ground - p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawRunner(ctx, ground - g.player.y, g.player, g.phase === "dead", g.shield, g.time);

  ctx.font = "800 16px Nunito, sans-serif";
  ctx.textAlign = "center";
  for (const f of g.floats) {
    if (!f.alive) continue;
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    ctx.fillStyle = "#fff6e8";
    ctx.fillText(f.text, f.x, ground - f.y);
    ctx.globalAlpha = 1;
  }

  if (g.flash > 0) {
    ctx.fillStyle = `rgba(255,244,230,${g.flash * 0.45})`;
    ctx.fillRect(-40, -40, lw + 80, lh + 80);
  }

  ctx.restore();
}
