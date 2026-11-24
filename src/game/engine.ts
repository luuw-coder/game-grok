export const PLAYER_X = 214;
export const ARCH_OPEN = 52;
export const CACTUS_H = 102;
export const BOULDER_H = 32;
export const RUN_H = 64;
export const SLIDE_H = 30;
export const SAVE_KEY = "dash-canyon-best";

const GRAVITY = 2000;
const JUMP_V = 720;
const MAX_FALL = 1100;
const COYOTE = 0.1;
const BUFFER = 0.12;
const SLIDE_TIME = 0.82;
const BASE_SPEED = 340;
const MAX_SPEED = 700;
const SPAWN_X = 1040;

export type Phase = "ready" | "running" | "paused" | "dead";
export type ObsKind = "cactus" | "boulder" | "arch";

export interface Obstacle {
  kind: ObsKind;
  x: number;
  w: number;
  passed: boolean;
  near: boolean;
  live: boolean;
}

export interface Pickup {
  kind: "coin" | "shield";
  x: number;
  y: number;
  bob: number;
  live: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  alive: boolean;
}

export interface FloatText {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  max: number;
  alive: boolean;
}

export interface Cloud {
  x: number;
  y: number;
  s: number;
  p: number;
}

export interface Butte {
  x: number;
  w: number;
  h: number;
  layer: number;
  tint: number;
}

export interface Scrub {
  x: number;
  s: number;
}

export interface Player {
  y: number;
  vy: number;
  slide: number;
  slideArm: number;
  coyote: number;
  buffer: number;
  run: number;
  grounded: boolean;
  cut: boolean;
  tumble: number;
}

export interface InputState {
  jumpPressed: boolean;
  jumpHeld: boolean;
  slidePressed: boolean;
  pausePressed: boolean;
  confirmPressed: boolean;
}

export interface Game {
  phase: Phase;
  time: number;
  scroll: number;
  speed: number;
  distance: number;
  coins: number;
  score: number;
  best: number;
  newBest: boolean;
  shield: boolean;
  shieldFlash: number;
  shake: number;
  flash: number;
  untilSpawn: number;
  lastKind: ObsKind | "none" | "coins";
  spawnCount: number;
  nearBonus: number;
  player: Player;
  obstacles: Obstacle[];
  pickups: Pickup[];
  particles: Particle[];
  floats: FloatText[];
  clouds: Cloud[];
  buttes: Butte[];
  scrubs: Scrub[];
  rng: number;
}

export function loadBest(): number {
  try {
    const n = Number(localStorage.getItem(SAVE_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(n: number) {
  try {
    localStorage.setItem(SAVE_KEY, String(Math.floor(n)));
  } catch {
    /* private mode */
  }
}

function rand(g: Game) {
  g.rng = (Math.imul(g.rng, 1664525) + 1013904223) >>> 0;
  return g.rng / 4294967296;
}

function makePlayer(): Player {
  return {
    y: 0,
    vy: 0,
    slide: 0,
    slideArm: 0,
    coyote: COYOTE,
    buffer: 0,
    run: 0,
    grounded: true,
    cut: false,
    tumble: 0,
  };
}

export function createGame(best = 0): Game {
  const g: Game = {
    phase: "ready",
    time: 0,
    scroll: 0,
    speed: BASE_SPEED,
    distance: 0,
    coins: 0,
    score: 0,
    best,
    newBest: false,
    shield: false,
    shieldFlash: 0,
    shake: 0,
    flash: 0,
    untilSpawn: 460,
    lastKind: "none",
    spawnCount: 0,
    nearBonus: 0,
    player: makePlayer(),
    obstacles: [],
    pickups: [],
    particles: Array.from({ length: 80 }, () => deadParticle()),
    floats: Array.from({ length: 10 }, () => deadFloat()),
    clouds: [],
    buttes: [],
    scrubs: [],
    rng: 0xdecaf00d,
  };
  seedDecor(g);
  return g;
}

function deadParticle(): Particle {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: "#E7C49A", alive: false };
}

function deadFloat(): FloatText {
  return { x: 0, y: 0, vy: 0, text: "", life: 0, max: 1, alive: false };
}

function seedDecor(g: Game) {
  for (let i = 0; i < 6; i++) {
    g.clouds.push({
      x: i * 190 - 40,
      y: 36 + (i % 3) * 34,
      s: 0.75 + (i % 3) * 0.28,
      p: 0.12 + (i % 2) * 0.1,
    });
  }
  let x = -80;
  for (let i = 0; i < 8; i++) {
    const layer = i % 2;
    const w = 200 + ((i * 53) % 160);
    const h = layer === 0 ? 150 + ((i * 37) % 80) : 86 + ((i * 29) % 50);
    g.buttes.push({ x, w, h, layer, tint: i % 3 });
    x += w * 0.62;
  }
  for (let i = 0; i < 10; i++) {
    g.scrubs.push({ x: i * 140, s: 0.6 + (i % 4) * 0.18 });
  }
}

export function resetRun(g: Game) {
  g.phase = "running";
  g.time = 0;
  g.scroll = 0;
  g.speed = BASE_SPEED;
  g.distance = 0;
  g.coins = 0;
  g.score = 0;
  g.newBest = false;
  g.shield = false;
  g.shieldFlash = 0;
  g.shake = 0.15;
  g.flash = 0;
  g.untilSpawn = 420;
  g.lastKind = "none";
  g.spawnCount = 0;
  g.nearBonus = 0;
  g.player = makePlayer();
  for (const o of g.obstacles) o.live = false;
  for (const p of g.pickups) p.live = false;
  for (const p of g.particles) p.alive = false;
  for (const f of g.floats) f.alive = false;
}

function speedFor(distance: number) {
  return Math.min(MAX_SPEED, BASE_SPEED + distance * 1.05);
}

function spacingFor(speed: number) {
  return Math.max(390, speed * 1.22);
}

function driftDecor(g: Game, dx: number) {
  let maxButte = 0;
  for (const b of g.buttes) {
    b.x -= dx * (b.layer === 0 ? 0.16 : 0.34);
    if (b.x + b.w > maxButte) maxButte = b.x + b.w;
  }
  for (const b of g.buttes) {
    if (b.x + b.w < -40) {
      b.x = maxButte + 30 + rand(g) * 40;
      b.w = 180 + rand(g) * 160;
      b.h = b.layer === 0 ? 140 + rand(g) * 90 : 70 + rand(g) * 60;
      maxButte = b.x + b.w;
    }
  }
  for (const c of g.clouds) {
    c.x -= dx * c.p;
    if (c.x < -180) c.x = 1000 + rand(g) * 80;
  }
  let maxScrub = 0;
  for (const s of g.scrubs) {
    s.x -= dx * 0.55;
    if (s.x > maxScrub) maxScrub = s.x;
  }
  for (const s of g.scrubs) {
    if (s.x < -40) {
      s.x = maxScrub + 90 + rand(g) * 80;
      s.s = 0.55 + rand(g) * 0.6;
      maxScrub = s.x;
    }
  }
}

function burst(g: Game, x: number, y: number, color: string, n: number, spread: number) {
  for (let i = 0; i < n; i++) {
    const p = g.particles.find((q) => !q.alive);
    if (!p) return;
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = (rand(g) - 0.5) * spread;
    p.vy = rand(g) * spread * 0.65;
    p.life = 0.28 + rand(g) * 0.28;
    p.max = p.life;
    p.size = 2 + rand(g) * 3.5;
    p.color = color;
  }
}

function floatText(g: Game, x: number, y: number, text: string) {
  const f = g.floats.find((q) => !q.alive);
  if (!f) return;
  f.alive = true;
  f.x = x;
  f.y = y;
  f.vy = 46;
  f.text = text;
  f.life = 0.7;
  f.max = 0.7;
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function hurtBox(p: Player): Box {
  const sliding = p.slide > 0 && p.y < 12;
  const h = sliding ? SLIDE_H : RUN_H;
  const w = sliding ? 54 : 28;
  const sole = 12;
  return {
    x0: PLAYER_X - w * 0.4,
    x1: PLAYER_X + w * 0.45,
    y0: p.y + sole,
    y1: p.y + h - 2,
  };
}

function obsBox(o: Obstacle): Box {
  if (o.kind === "arch") {
    return { x0: o.x, x1: o.x + o.w, y0: ARCH_OPEN, y1: ARCH_OPEN + 160 };
  }
  const h = o.kind === "cactus" ? CACTUS_H : BOULDER_H;
  return { x0: o.x, x1: o.x + o.w, y0: 0, y1: h };
}

function overlap(a: Box, b: Box) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

function expandX(b: Box, dx: number): Box {
  return { x0: b.x0, x1: b.x1 + dx, y0: b.y0, y1: b.y1 };
}

function grabObs(g: Game): Obstacle {
  const found = g.obstacles.find((o) => !o.live);
  if (found) return found;
  const o: Obstacle = { kind: "cactus", x: 0, w: 40, passed: false, near: false, live: false };
  g.obstacles.push(o);
  return o;
}

function grabPickup(g: Game): Pickup {
  const found = g.pickups.find((p) => !p.live);
  if (found) return found;
  const p: Pickup = { kind: "coin", x: 0, y: 0, bob: 0, live: false };
  g.pickups.push(p);
  return p;
}

function spawnPickup(g: Game, kind: Pickup["kind"], x: number, y: number, bob: number) {
  const p = grabPickup(g);
  p.kind = kind;
  p.x = x;
  p.y = y;
  p.bob = bob;
  p.live = true;
}

function spawnCoins(g: Game, startX: number, baseY: number, n: number, arch: boolean) {
  for (let i = 0; i < n; i++) {
    const lift = arch ? Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 34 : 0;
    spawnPickup(g, "coin", startX + i * 34, baseY + lift, i * 0.6);
  }
}

function pickKind(g: Game): ObsKind | "coins" {
  g.spawnCount += 1;
  if (g.spawnCount === 1) return "boulder";
  if (g.spawnCount === 2) return "cactus";
  if (g.spawnCount === 3) return "boulder";
  if (g.spawnCount === 4) return "arch";
  if (g.spawnCount % 6 === 0) return "coins";
  const r = rand(g);
  const archOk = g.distance > 90 && g.lastKind !== "arch";
  if (archOk && r < 0.26) return "arch";
  if (r < 0.62) return r < 0.3 ? "cactus" : "boulder";
  return "cactus";
}

function spawn(g: Game) {
  const kind = pickKind(g);
  if (kind === "coins") {
    spawnCoins(g, SPAWN_X, 46, 5, false);
    g.lastKind = "coins";
    return;
  }
  const o = grabObs(g);
  o.kind = kind;
  o.x = SPAWN_X;
  o.w = kind === "cactus" ? 34 : kind === "boulder" ? 50 : 86;
  o.passed = false;
  o.near = false;
  o.live = true;
  g.lastKind = kind;

  const offerShield = !g.shield && g.distance > 140 && rand(g) < 0.14;
  if (offerShield) {
    spawnPickup(g, "shield", SPAWN_X + 20, 108, 0);
    return;
  }
  if (kind === "cactus") spawnCoins(g, o.x + o.w + 18, 42, 4, false);
  else if (kind === "boulder") spawnCoins(g, o.x - 6, 62, 4, true);
  else spawnCoins(g, o.x + 18, 18, 3, false);
}

function killRun(g: Game, events: string[]) {
  g.phase = "dead";
  g.shake = 0.85;
  g.flash = 0.55;
  g.player.slide = 0;
  g.player.vy = 360;
  burst(g, PLAYER_X, 30, "#E7C49A", 14, 280);
  if (g.score > g.best) {
    g.best = g.score;
    g.newBest = true;
    saveBest(g.best);
    events.push("best");
  }
  events.push("die");
}

function updatePlayer(g: Game, dt: number, jumpPressed: boolean, jumpHeld: boolean, slidePressed: boolean, events: string[]) {
  const p = g.player;
  if (jumpPressed) p.buffer = BUFFER;
  else p.buffer = Math.max(0, p.buffer - dt);
  if (slidePressed) p.slideArm = 0.42;
  else p.slideArm = Math.max(0, p.slideArm - dt);

  if (p.grounded) p.coyote = COYOTE;
  else p.coyote = Math.max(0, p.coyote - dt);

  const canJump = p.buffer > 0 && (p.grounded || p.coyote > 0);
  if (canJump) {
    p.vy = JUMP_V;
    p.grounded = false;
    p.coyote = 0;
    p.buffer = 0;
    p.cut = false;
    p.slide = 0;
    p.slideArm = 0;
    burst(g, PLAYER_X - 8, 6, "#F0D2A4", 5, 160);
    events.push("jump");
  } else if (p.slideArm > 0 && p.grounded && p.y < 6 && p.slide <= 0) {
    p.slide = SLIDE_TIME;
    p.slideArm = 0;
    burst(g, PLAYER_X, 8, "#E8C49A", 6, 220);
    events.push("slide");
  }

  if (!jumpHeld && p.vy > 220 && !p.cut) {
    p.vy *= 0.72;
    p.cut = true;
  }

  p.vy = Math.max(-MAX_FALL, p.vy - GRAVITY * dt);
  p.y += p.vy * dt;
  if (p.y <= 0) {
    if (!p.grounded && p.vy < -240) burst(g, PLAYER_X, 4, "#E7C49A", 4, 140);
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.cut = false;
  } else {
    p.grounded = false;
  }

  if (p.slide > 0) p.slide = Math.max(0, p.slide - dt);
  if (p.grounded && p.slide <= 0) p.run += dt * (9 + g.speed / 90);
  else if (!p.grounded) p.run += dt * 4;
}

function substep(g: Game, dt: number, jumpPressed: boolean, jumpHeld: boolean, slidePressed: boolean, events: string[]) {
  g.speed = speedFor(g.distance);
  const dx = g.speed * dt;
  g.scroll += dx;
  g.distance = g.scroll / 46;

  for (const o of g.obstacles) if (o.live) o.x -= dx;
  for (const c of g.pickups) if (c.live) c.x -= dx;
  driftDecor(g, dx);
  updatePlayer(g, dt, jumpPressed, jumpHeld, slidePressed, events);

  const hurt = hurtBox(g.player);
  const dy = g.player.vy * dt;
  const hurtSwept: Box = {
    x0: hurt.x0,
    x1: hurt.x1,
    y0: Math.min(hurt.y0, hurt.y0 - dy),
    y1: Math.max(hurt.y1, hurt.y1 - dy),
  };

  for (const o of g.obstacles) {
    if (!o.live) continue;
    const box = expandX(obsBox(o), dx);
    if (overlap(hurtSwept, box)) {
      if (g.shield) {
        g.shield = false;
        g.shieldFlash = 0.4;
        g.shake = Math.max(g.shake, 0.45);
        o.live = false;
        burst(g, PLAYER_X + 10, g.player.y + 40, "#8FE3F0", 10, 240);
        events.push("break");
        continue;
      }
      killRun(g, events);
      return;
    }
    const now = obsBox(o);
    const xOverlap = hurt.x0 < now.x1 && hurt.x1 > now.x0;
    if (xOverlap && !o.near) {
      if (o.kind === "arch") {
        if (hurt.y1 <= ARCH_OPEN && ARCH_OPEN - hurt.y1 < 18) o.near = true;
      } else if (hurt.y0 >= now.y1 && hurt.y0 - now.y1 < 24) {
        o.near = true;
      }
    }
    if (!o.passed && now.x1 < PLAYER_X - 24) {
      o.passed = true;
      if (o.near) {
        g.nearBonus += 5;
        floatText(g, PLAYER_X + 16, g.player.y + 78, "+5");
        events.push("near");
      }
    }
    if (now.x1 < -120) o.live = false;
  }

  if (g.phase !== "running") return;

  const cy = g.player.y + (g.player.slide > 0 ? 16 : 40);
  for (const c of g.pickups) {
    if (!c.live) continue;
    const dxp = c.x - PLAYER_X;
    const dyp = c.y - cy;
    if (dxp * dxp + dyp * dyp < 44 * 44) {
      c.live = false;
      if (c.kind === "coin") {
        g.coins += 1;
        burst(g, c.x, c.y, "#FFD15C", 4, 120);
        events.push("coin");
      } else {
        g.shield = true;
        g.shieldFlash = 0.45;
        floatText(g, PLAYER_X, g.player.y + 90, "KHIÊN");
        events.push("shield");
      }
    } else if (c.x < -40) c.live = false;
  }

  g.untilSpawn -= dx;
  if (g.untilSpawn <= 0) {
    spawn(g);
    g.untilSpawn = spacingFor(g.speed);
  }
}

function decayFx(g: Game, dt: number, dx: number) {
  g.shake = Math.max(0, g.shake - dt * 1.6);
  g.flash = Math.max(0, g.flash - dt * 1.4);
  g.shieldFlash = Math.max(0, g.shieldFlash - dt);
  for (const p of g.particles) {
    if (!p.alive) continue;
    p.life -= dt;
    p.x += p.vx * dt - dx * 0.25;
    p.y += p.vy * dt;
    p.vy -= 40 * dt;
    if (p.life <= 0) p.alive = false;
  }
  for (const f of g.floats) {
    if (!f.alive) continue;
    f.life -= dt;
    f.y += f.vy * dt;
    f.x -= dx * 0.2;
    if (f.life <= 0) f.alive = false;
  }
}

export function step(g: Game, dtRaw: number, input: InputState): string[] {
  const dt = Math.min(Math.max(dtRaw, 0), 0.05);
  const events: string[] = [];

  if (g.phase === "ready") {
    g.time += dt;
    g.player.run += dt * 9;
    driftDecor(g, 36 * dt);
    decayFx(g, dt, 36 * dt);
    if (input.confirmPressed || input.jumpPressed) {
      input.confirmPressed = false;
      input.jumpPressed = false;
      input.slidePressed = false;
      resetRun(g);
      events.push("start");
    }
    return events;
  }

  if (g.phase === "paused") {
    if (input.pausePressed || input.confirmPressed || input.jumpPressed) {
      g.phase = "running";
    }
    input.pausePressed = false;
    input.confirmPressed = false;
    input.jumpPressed = false;
    input.slidePressed = false;
    return events;
  }

  if (g.phase === "dead") {
    g.time += dt;
    g.player.tumble += dt;
    g.player.y += g.player.vy * dt;
    g.player.vy -= GRAVITY * dt;
    if (g.player.y <= 0) {
      g.player.y = 0;
      g.player.vy = 0;
    }
    decayFx(g, dt, 0);
    if (input.confirmPressed || input.jumpPressed) {
      input.confirmPressed = false;
      input.jumpPressed = false;
      resetRun(g);
      events.push("start");
    }
    return events;
  }

  if (input.pausePressed) {
    input.pausePressed = false;
    g.phase = "paused";
    return events;
  }

  const jumpPressed = input.jumpPressed;
  const slidePressed = input.slidePressed;
  const jumpHeld = input.jumpHeld;
  input.jumpPressed = false;
  input.slidePressed = false;
  input.confirmPressed = false;

  g.time += dt;
  let left = dt;
  let first = true;
  while (left > 0 && g.phase === "running") {
    const h = Math.min(left, 1 / 120);
    substep(g, h, first ? jumpPressed : false, jumpHeld, first ? slidePressed : false, events);
    first = false;
    left -= h;
  }

  if (g.phase === "running" && g.player.grounded && g.player.slide <= 0 && rand(g) < dt * 10) {
    burst(g, PLAYER_X - 16, 2, "#EBC896", 1, 80);
  }

  g.score = Math.floor(g.distance) + g.coins * 10 + g.nearBonus;
  decayFx(g, dt, 0);
  return events;
}

export function paceOf(speed: number) {
  return Math.max(0, Math.min(5, Math.round(((speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)) * 5)));
}
