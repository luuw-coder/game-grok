import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as RotateCcw, c as Coins, l as ArrowUp, n as Volume2, o as Play, r as Trophy, s as Pause, t as VolumeX, u as ArrowDown } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-COSgSVmi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Sfx = class {
	ctx = null;
	muted = false;
	lastCoin = 0;
	unlock() {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		if (!this.ctx) this.ctx = new AC();
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	toggle() {
		this.muted = !this.muted;
		return this.muted;
	}
	play(kind) {
		if (!this.ctx || this.muted) return;
		const now = this.ctx.currentTime;
		if (kind === "coin") {
			if (now - this.lastCoin < .045) return;
			this.lastCoin = now;
			this.tone(880, 1280, .09, "sine", .05);
			return;
		}
		if (kind === "jump") this.tone(420, 640, .1, "square", .04);
		else if (kind === "slide") this.tone(220, 90, .12, "sawtooth", .03);
		else if (kind === "shield") this.tone(520, 880, .16, "triangle", .05);
		else if (kind === "break") this.tone(300, 80, .18, "square", .05);
		else if (kind === "near") this.tone(740, 980, .08, "triangle", .03);
		else if (kind === "die") this.tone(240, 60, .32, "sawtooth", .06);
		else if (kind === "start") {
			this.tone(392, 392, .08, "triangle", .04);
			window.setTimeout(() => this.tone(523, 784, .12, "triangle", .04), 90);
		} else if (kind === "best") {
			this.tone(523, 659, .1, "triangle", .05);
			window.setTimeout(() => this.tone(784, 1046, .16, "triangle", .05), 110);
		}
	}
	tone(from, to, dur, type, gain) {
		if (!this.ctx) return;
		const t = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const amp = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(from, t);
		osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
		amp.gain.setValueAtTime(gain, t);
		amp.gain.exponentialRampToValueAtTime(1e-4, t + dur);
		osc.connect(amp);
		amp.connect(this.ctx.destination);
		osc.start(t);
		osc.stop(t + dur + .02);
	}
};
var SAVE_KEY = "dash-canyon-best";
var GRAVITY = 2e3;
var JUMP_V = 720;
var COYOTE = .1;
var BUFFER = .12;
var SLIDE_TIME = .82;
var BASE_SPEED = 340;
var MAX_SPEED = 700;
var SPAWN_X = 1040;
function loadBest() {
	try {
		const n = Number(localStorage.getItem(SAVE_KEY));
		return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
	} catch {
		return 0;
	}
}
function saveBest(n) {
	try {
		localStorage.setItem(SAVE_KEY, String(Math.floor(n)));
	} catch {}
}
function rand(g) {
	g.rng = Math.imul(g.rng, 1664525) + 1013904223 >>> 0;
	return g.rng / 4294967296;
}
function makePlayer() {
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
		tumble: 0
	};
}
function createGame(best = 0) {
	const g = {
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
		rng: 3737841677
	};
	seedDecor(g);
	return g;
}
function deadParticle() {
	return {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		max: 1,
		size: 2,
		color: "#E7C49A",
		alive: false
	};
}
function deadFloat() {
	return {
		x: 0,
		y: 0,
		vy: 0,
		text: "",
		life: 0,
		max: 1,
		alive: false
	};
}
function seedDecor(g) {
	for (let i = 0; i < 6; i++) g.clouds.push({
		x: i * 190 - 40,
		y: 36 + i % 3 * 34,
		s: .75 + i % 3 * .28,
		p: .12 + i % 2 * .1
	});
	let x = -80;
	for (let i = 0; i < 8; i++) {
		const layer = i % 2;
		const w = 200 + i * 53 % 160;
		const h = layer === 0 ? 150 + i * 37 % 80 : 86 + i * 29 % 50;
		g.buttes.push({
			x,
			w,
			h,
			layer,
			tint: i % 3
		});
		x += w * .62;
	}
	for (let i = 0; i < 10; i++) g.scrubs.push({
		x: i * 140,
		s: .6 + i % 4 * .18
	});
}
function resetRun(g) {
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
	g.shake = .15;
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
function speedFor(distance) {
	return Math.min(MAX_SPEED, BASE_SPEED + distance * 1.05);
}
function spacingFor(speed) {
	return Math.max(390, speed * 1.22);
}
function driftDecor(g, dx) {
	let maxButte = 0;
	for (const b of g.buttes) {
		b.x -= dx * (b.layer === 0 ? .16 : .34);
		if (b.x + b.w > maxButte) maxButte = b.x + b.w;
	}
	for (const b of g.buttes) if (b.x + b.w < -40) {
		b.x = maxButte + 30 + rand(g) * 40;
		b.w = 180 + rand(g) * 160;
		b.h = b.layer === 0 ? 140 + rand(g) * 90 : 70 + rand(g) * 60;
		maxButte = b.x + b.w;
	}
	for (const c of g.clouds) {
		c.x -= dx * c.p;
		if (c.x < -180) c.x = 1e3 + rand(g) * 80;
	}
	let maxScrub = 0;
	for (const s of g.scrubs) {
		s.x -= dx * .55;
		if (s.x > maxScrub) maxScrub = s.x;
	}
	for (const s of g.scrubs) if (s.x < -40) {
		s.x = maxScrub + 90 + rand(g) * 80;
		s.s = .55 + rand(g) * .6;
		maxScrub = s.x;
	}
}
function burst(g, x, y, color, n, spread) {
	for (let i = 0; i < n; i++) {
		const p = g.particles.find((q) => !q.alive);
		if (!p) return;
		p.alive = true;
		p.x = x;
		p.y = y;
		p.vx = (rand(g) - .5) * spread;
		p.vy = rand(g) * spread * .65;
		p.life = .28 + rand(g) * .28;
		p.max = p.life;
		p.size = 2 + rand(g) * 3.5;
		p.color = color;
	}
}
function floatText(g, x, y, text) {
	const f = g.floats.find((q) => !q.alive);
	if (!f) return;
	f.alive = true;
	f.x = x;
	f.y = y;
	f.vy = 46;
	f.text = text;
	f.life = .7;
	f.max = .7;
}
function hurtBox(p) {
	const sliding = p.slide > 0 && p.y < 12;
	const h = sliding ? 30 : 64;
	const w = sliding ? 54 : 28;
	return {
		x0: 214 - w * .4,
		x1: 214 + w * .45,
		y0: p.y + 12,
		y1: p.y + h - 2
	};
}
function obsBox(o) {
	if (o.kind === "arch") return {
		x0: o.x,
		x1: o.x + o.w,
		y0: 52,
		y1: 212
	};
	const h = o.kind === "cactus" ? 102 : 32;
	return {
		x0: o.x,
		x1: o.x + o.w,
		y0: 0,
		y1: h
	};
}
function overlap(a, b) {
	return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}
function expandX(b, dx) {
	return {
		x0: b.x0,
		x1: b.x1 + dx,
		y0: b.y0,
		y1: b.y1
	};
}
function grabObs(g) {
	const found = g.obstacles.find((o) => !o.live);
	if (found) return found;
	const o = {
		kind: "cactus",
		x: 0,
		w: 40,
		passed: false,
		near: false,
		live: false
	};
	g.obstacles.push(o);
	return o;
}
function grabPickup(g) {
	const found = g.pickups.find((p) => !p.live);
	if (found) return found;
	const p = {
		kind: "coin",
		x: 0,
		y: 0,
		bob: 0,
		live: false
	};
	g.pickups.push(p);
	return p;
}
function spawnPickup(g, kind, x, y, bob) {
	const p = grabPickup(g);
	p.kind = kind;
	p.x = x;
	p.y = y;
	p.bob = bob;
	p.live = true;
}
function spawnCoins(g, startX, baseY, n, arch) {
	for (let i = 0; i < n; i++) {
		const lift = arch ? Math.sin(i / Math.max(1, n - 1) * Math.PI) * 34 : 0;
		spawnPickup(g, "coin", startX + i * 34, baseY + lift, i * .6);
	}
}
function pickKind(g) {
	g.spawnCount += 1;
	if (g.spawnCount === 1) return "boulder";
	if (g.spawnCount === 2) return "cactus";
	if (g.spawnCount === 3) return "boulder";
	if (g.spawnCount === 4) return "arch";
	if (g.spawnCount % 6 === 0) return "coins";
	const r = rand(g);
	if (g.distance > 90 && g.lastKind !== "arch" && r < .26) return "arch";
	if (r < .62) return r < .3 ? "cactus" : "boulder";
	return "cactus";
}
function spawn(g) {
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
	if (!g.shield && g.distance > 140 && rand(g) < .14) {
		spawnPickup(g, "shield", 1060, 108, 0);
		return;
	}
	if (kind === "cactus") spawnCoins(g, o.x + o.w + 18, 42, 4, false);
	else if (kind === "boulder") spawnCoins(g, o.x - 6, 62, 4, true);
	else spawnCoins(g, o.x + 18, 18, 3, false);
}
function killRun(g, events) {
	g.phase = "dead";
	g.shake = .85;
	g.flash = .55;
	g.player.slide = 0;
	g.player.vy = 360;
	burst(g, 214, 30, "#E7C49A", 14, 280);
	if (g.score > g.best) {
		g.best = g.score;
		g.newBest = true;
		saveBest(g.best);
		events.push("best");
	}
	events.push("die");
}
function updatePlayer(g, dt, jumpPressed, jumpHeld, slidePressed, events) {
	const p = g.player;
	if (jumpPressed) p.buffer = BUFFER;
	else p.buffer = Math.max(0, p.buffer - dt);
	if (slidePressed) p.slideArm = .42;
	else p.slideArm = Math.max(0, p.slideArm - dt);
	if (p.grounded) p.coyote = COYOTE;
	else p.coyote = Math.max(0, p.coyote - dt);
	if (p.buffer > 0 && (p.grounded || p.coyote > 0)) {
		p.vy = JUMP_V;
		p.grounded = false;
		p.coyote = 0;
		p.buffer = 0;
		p.cut = false;
		p.slide = 0;
		p.slideArm = 0;
		burst(g, 206, 6, "#F0D2A4", 5, 160);
		events.push("jump");
	} else if (p.slideArm > 0 && p.grounded && p.y < 6 && p.slide <= 0) {
		p.slide = SLIDE_TIME;
		p.slideArm = 0;
		burst(g, 214, 8, "#E8C49A", 6, 220);
		events.push("slide");
	}
	if (!jumpHeld && p.vy > 220 && !p.cut) {
		p.vy *= .72;
		p.cut = true;
	}
	p.vy = Math.max(-1100, p.vy - GRAVITY * dt);
	p.y += p.vy * dt;
	if (p.y <= 0) {
		if (!p.grounded && p.vy < -240) burst(g, 214, 4, "#E7C49A", 4, 140);
		p.y = 0;
		p.vy = 0;
		p.grounded = true;
		p.cut = false;
	} else p.grounded = false;
	if (p.slide > 0) p.slide = Math.max(0, p.slide - dt);
	if (p.grounded && p.slide <= 0) p.run += dt * (9 + g.speed / 90);
	else if (!p.grounded) p.run += dt * 4;
}
function substep(g, dt, jumpPressed, jumpHeld, slidePressed, events) {
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
	const hurtSwept = {
		x0: hurt.x0,
		x1: hurt.x1,
		y0: Math.min(hurt.y0, hurt.y0 - dy),
		y1: Math.max(hurt.y1, hurt.y1 - dy)
	};
	for (const o of g.obstacles) {
		if (!o.live) continue;
		if (overlap(hurtSwept, expandX(obsBox(o), dx))) {
			if (g.shield) {
				g.shield = false;
				g.shieldFlash = .4;
				g.shake = Math.max(g.shake, .45);
				o.live = false;
				burst(g, 224, g.player.y + 40, "#8FE3F0", 10, 240);
				events.push("break");
				continue;
			}
			killRun(g, events);
			return;
		}
		const now = obsBox(o);
		if (hurt.x0 < now.x1 && hurt.x1 > now.x0 && !o.near) {
			if (o.kind === "arch") {
				if (hurt.y1 <= 52 && 52 - hurt.y1 < 18) o.near = true;
			} else if (hurt.y0 >= now.y1 && hurt.y0 - now.y1 < 24) o.near = true;
		}
		if (!o.passed && now.x1 < 190) {
			o.passed = true;
			if (o.near) {
				g.nearBonus += 5;
				floatText(g, 230, g.player.y + 78, "+5");
				events.push("near");
			}
		}
		if (now.x1 < -120) o.live = false;
	}
	if (g.phase !== "running") return;
	const cy = g.player.y + (g.player.slide > 0 ? 16 : 40);
	for (const c of g.pickups) {
		if (!c.live) continue;
		const dxp = c.x - 214;
		const dyp = c.y - cy;
		if (dxp * dxp + dyp * dyp < 1936) {
			c.live = false;
			if (c.kind === "coin") {
				g.coins += 1;
				burst(g, c.x, c.y, "#FFD15C", 4, 120);
				events.push("coin");
			} else {
				g.shield = true;
				g.shieldFlash = .45;
				floatText(g, 214, g.player.y + 90, "KHIÊN");
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
function decayFx(g, dt, dx) {
	g.shake = Math.max(0, g.shake - dt * 1.6);
	g.flash = Math.max(0, g.flash - dt * 1.4);
	g.shieldFlash = Math.max(0, g.shieldFlash - dt);
	for (const p of g.particles) {
		if (!p.alive) continue;
		p.life -= dt;
		p.x += p.vx * dt - dx * .25;
		p.y += p.vy * dt;
		p.vy -= 40 * dt;
		if (p.life <= 0) p.alive = false;
	}
	for (const f of g.floats) {
		if (!f.alive) continue;
		f.life -= dt;
		f.y += f.vy * dt;
		f.x -= dx * .2;
		if (f.life <= 0) f.alive = false;
	}
}
function step(g, dtRaw, input) {
	const dt = Math.min(Math.max(dtRaw, 0), .05);
	const events = [];
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
		if (input.pausePressed || input.confirmPressed || input.jumpPressed) g.phase = "running";
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
	if (g.phase === "running" && g.player.grounded && g.player.slide <= 0 && rand(g) < dt * 10) burst(g, 198, 2, "#EBC896", 1, 80);
	g.score = Math.floor(g.distance) + g.coins * 10 + g.nearBonus;
	decayFx(g, dt, 0);
	return events;
}
function paceOf(speed) {
	return Math.max(0, Math.min(5, Math.round((speed - BASE_SPEED) / 360 * 5)));
}
var SKY_TOP = "#6eb6e4";
var SKY_MID = "#f2b56a";
var SKY_HORIZON = "#f0894b";
var SUN = "#ffe7a3";
function roundRect(ctx, x, y, w, h, r) {
	const radius = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}
function paintSky(ctx, w, h, dusk) {
	const grad = ctx.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0, dusk > .5 ? "#5aa4d6" : SKY_TOP);
	grad.addColorStop(.55, SKY_MID);
	grad.addColorStop(1, SKY_HORIZON);
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
}
function drawSun(ctx, w) {
	const x = w * .78;
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
function drawCloud(ctx, x, y, s) {
	ctx.fillStyle = "rgba(255,248,236,0.88)";
	ctx.beginPath();
	ctx.ellipse(x, y, 28 * s, 14 * s, 0, 0, Math.PI * 2);
	ctx.ellipse(x + 22 * s, y + 4 * s, 20 * s, 12 * s, 0, 0, Math.PI * 2);
	ctx.ellipse(x - 20 * s, y + 6 * s, 16 * s, 10 * s, 0, 0, Math.PI * 2);
	ctx.fill();
}
function drawButte(ctx, x, base, w, h, tint, far) {
	const colors = far ? [
		"#e7a56c",
		"#f0b57c",
		"#d99262"
	] : [
		"#d4844e",
		"#e09858",
		"#c67140"
	];
	ctx.fillStyle = colors[tint % colors.length] ?? colors[0];
	ctx.beginPath();
	ctx.moveTo(x, base);
	ctx.lineTo(x + w * .18, base - h);
	ctx.lineTo(x + w * .72, base - h * .9);
	ctx.lineTo(x + w, base);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = far ? "rgba(255,230,190,0.45)" : "rgba(255,214,160,0.35)";
	ctx.fillRect(x + w * .22, base - h + 4, w * .42, 8);
}
function drawScrub(ctx, x, ground, s) {
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
function drawCactus(ctx, x, ground) {
	const h = 102;
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
	roundRect(ctx, cx - 5, ground - h + 8, 4, 84, 2);
	ctx.fill();
}
function drawBoulder(ctx, x, ground, w) {
	const h = 32;
	ctx.fillStyle = "#c9844c";
	ctx.beginPath();
	ctx.ellipse(x + w / 2, ground - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#efc08a";
	ctx.beginPath();
	ctx.ellipse(x + w * .38, ground - h * .72, w * .22, h * .22, -.4, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "rgba(110,58,24,0.45)";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x + w * .35, ground - h * .35);
	ctx.lineTo(x + w * .62, ground - h * .7);
	ctx.stroke();
}
function drawArch(ctx, x, ground, w) {
	const lip = ground - 52;
	ctx.fillStyle = "#c67a42";
	ctx.beginPath();
	ctx.moveTo(x - 16, lip + 6);
	ctx.lineTo(x + 10, lip - 48);
	ctx.lineTo(x + w * .45, lip - 62);
	ctx.lineTo(x + w - 6, lip - 40);
	ctx.lineTo(x + w + 18, lip + 4);
	ctx.lineTo(x + w - 8, lip + 10);
	ctx.quadraticCurveTo(x + w * .5, lip + 18, x + 8, lip + 8);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = "#e0a066";
	ctx.beginPath();
	ctx.moveTo(x + 18, lip - 8);
	ctx.lineTo(x + w * .42, lip - 46);
	ctx.lineTo(x + w * .62, lip - 36);
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
function drawCoin(ctx, x, y, spin) {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(Math.max(.35, Math.abs(Math.sin(spin))), 1);
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
function drawShieldGem(ctx, x, y, t) {
	ctx.save();
	ctx.translate(x, y + Math.sin(t * 4) * 4);
	ctx.strokeStyle = "#1f8ea3";
	ctx.fillStyle = "rgba(150,230,245,0.9)";
	ctx.lineWidth = 3;
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const a = t * 1.4 + i / 6 * Math.PI * 2;
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
function limb(ctx, x0, y0, x1, y1, color, width) {
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.stroke();
}
function drawRunner(ctx, footY, p, dead, shield, t) {
	const sliding = p.slide > 0 && p.y < 12 && !dead;
	const swing = !p.grounded && !dead ? .55 : Math.sin(p.run);
	ctx.save();
	ctx.translate(214, footY);
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
		ctx.ellipse(-24, -4, 7, 4, .2, 0, Math.PI * 2);
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
		ctx.strokeStyle = `rgba(120, 220, 235, ${.45 + Math.sin(t * 8) * .2})`;
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.ellipse(2, sliding ? -16 : -48, sliding ? 40 : 26, sliding ? 20 : 42, 0, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.restore();
}
function drawObstacle(ctx, o, ground) {
	if (o.kind === "cactus") drawCactus(ctx, o.x, ground);
	else if (o.kind === "boulder") drawBoulder(ctx, o.x, ground, o.w);
	else drawArch(ctx, o.x, ground, o.w);
}
function renderGame(ctx, g, cssW, cssH) {
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
	paintSky(ctx, cssW, cssH, Math.min(1, g.distance / 1600));
	ctx.save();
	ctx.translate(ox, oy);
	ctx.scale(scale, scale);
	const mag = g.shake * 7;
	if (mag > .2) {
		const sx = Math.sin(g.time * 48) * mag;
		const sy = Math.cos(g.time * 53) * mag * .6;
		ctx.translate(sx, sy);
	}
	const ground = lh - 78;
	drawSun(ctx, lw);
	for (const c of g.clouds) drawCloud(ctx, c.x, c.y + 10, c.s);
	for (const b of g.buttes) if (b.layer === 0) drawButte(ctx, b.x, ground - 20, b.w, b.h, b.tint, true);
	for (const b of g.buttes) if (b.layer === 1) drawButte(ctx, b.x, ground - 6, b.w, b.h, b.tint, false);
	for (const s of g.scrubs) drawScrub(ctx, s.x, ground - 2, s.s);
	ctx.fillStyle = "#e39a52";
	ctx.fillRect(-20, ground, 1e3, lh - ground + 20);
	ctx.fillStyle = "#f6d19a";
	ctx.fillRect(-20, ground, 1e3, 12);
	ctx.fillStyle = "#c47a3c";
	ctx.fillRect(-20, ground + 12, 1e3, 7);
	const pebble = g.scroll % 72;
	for (let x = -pebble; x < 1032; x += 72) {
		ctx.fillStyle = "#b86b34";
		ctx.beginPath();
		ctx.ellipse(x + 20, ground + 34, 8, 4, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#efc07a";
		ctx.beginPath();
		ctx.ellipse(x + 48, ground + 48, 5, 3, .4, 0, Math.PI * 2);
		ctx.fill();
	}
	if (g.speed > 520 && g.phase === "running") {
		ctx.strokeStyle = "rgba(255,246,232,0.25)";
		ctx.lineWidth = 2;
		const stripes = 5;
		for (let i = 0; i < stripes; i++) {
			const y = 80 + (g.scroll * .4 + i * 70) % (ground - 100);
			ctx.beginPath();
			ctx.moveTo(20, y);
			ctx.lineTo(70 + i % 3 * 20, y);
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
		ctx.fillStyle = `rgba(255,244,230,${g.flash * .45})`;
		ctx.fillRect(-40, -40, 1040, lh + 80);
	}
	ctx.restore();
}
function emptyInput() {
	return {
		jumpPressed: false,
		jumpHeld: false,
		slidePressed: false,
		pausePressed: false,
		confirmPressed: false
	};
}
function DashCanyon() {
	const canvasRef = (0, import_react.useRef)(null);
	const gameRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(emptyInput());
	const sfxRef = (0, import_react.useRef)(null);
	const [phase, setPhase] = (0, import_react.useState)("ready");
	const [hud, setHud] = (0, import_react.useState)({
		score: 0,
		coins: 0,
		best: 0,
		dist: 0,
		pace: 1,
		shield: false,
		bestNew: false
	});
	const [touchUi, setTouchUi] = (0, import_react.useState)(false);
	const [muted, setMuted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const game = createGame(loadBest());
		gameRef.current = game;
		const sfx = new Sfx();
		sfxRef.current = sfx;
		const input = inputRef.current;
		const mq = window.matchMedia("(pointer: coarse)");
		const applyTouch = () => setTouchUi(mq.matches || window.innerWidth < 840);
		applyTouch();
		mq.addEventListener("change", applyTouch);
		window.addEventListener("resize", applyTouch);
		const publish = (force) => {
			const snapshot = {
				score: game.score,
				coins: game.coins,
				best: game.best,
				dist: Math.floor(game.distance),
				pace: Math.max(1, paceOf(game.speed)),
				shield: game.shield,
				bestNew: game.newBest
			};
			setHud((prev) => {
				if (!force && prev.score === snapshot.score && prev.coins === snapshot.coins && prev.best === snapshot.best && prev.dist === snapshot.dist && prev.pace === snapshot.pace && prev.shield === snapshot.shield && prev.bestNew === snapshot.bestNew) return prev;
				return snapshot;
			});
			setPhase((prev) => prev === game.phase ? prev : game.phase);
			const api = {
				phase: game.phase,
				score: game.score,
				y: game.player.y,
				dist: game.distance,
				shield: game.shield,
				speed: game.speed
			};
			window.__dash = api;
		};
		let raf = 0;
		let last = performance.now();
		let hudAcc = 0;
		const frame = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const events = step(game, dt, input);
			for (const ev of events) sfx.play(ev);
			const parent = canvas.parentElement;
			if (parent) {
				const cssW = parent.clientWidth;
				const cssH = parent.clientHeight;
				const dpr = Math.min(window.devicePixelRatio || 1, 2);
				const bw = Math.max(1, Math.round(cssW * dpr));
				const bh = Math.max(1, Math.round(cssH * dpr));
				if (canvas.width !== bw || canvas.height !== bh) {
					canvas.width = bw;
					canvas.height = bh;
				}
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				renderGame(ctx, game, cssW, cssH);
			}
			hudAcc += dt;
			if (hudAcc > .12 || events.includes("die") || events.includes("start")) {
				hudAcc = 0;
				publish(events.includes("die") || events.includes("start"));
			}
			raf = requestAnimationFrame(frame);
		};
		publish(true);
		raf = requestAnimationFrame(frame);
		const jumpDown = (code) => code === "Space" || code === "ArrowUp" || code === "KeyW";
		const onKeyDown = (e) => {
			if (e.repeat) return;
			if (jumpDown(e.code)) {
				e.preventDefault();
				input.jumpPressed = true;
				input.jumpHeld = true;
				sfx.unlock();
			} else if (e.code === "ArrowDown" || e.code === "KeyS") {
				e.preventDefault();
				input.slidePressed = true;
				sfx.unlock();
			} else if (e.code === "KeyP" || e.code === "Escape") {
				if (game.phase === "running" || game.phase === "paused") input.pausePressed = true;
			} else if (e.code === "Enter") {
				input.confirmPressed = true;
				sfx.unlock();
			} else if (e.code === "KeyR" && game.phase !== "ready") {
				resetRun(game);
				sfx.unlock();
				sfx.play("start");
				publish(true);
			}
		};
		const onKeyUp = (e) => {
			if (jumpDown(e.code)) input.jumpHeld = false;
		};
		const onHide = () => {
			if (document.hidden && game.phase === "running") {
				game.phase = "paused";
				publish(true);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		document.addEventListener("visibilitychange", onHide);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			document.removeEventListener("visibilitychange", onHide);
			mq.removeEventListener("change", applyTouch);
			window.removeEventListener("resize", applyTouch);
		};
	}, []);
	const pressJump = (held) => {
		const input = inputRef.current;
		if (held) {
			input.jumpPressed = true;
			input.jumpHeld = true;
		} else input.jumpHeld = false;
		sfxRef.current?.unlock();
	};
	const pressSlide = () => {
		inputRef.current.slidePressed = true;
		sfxRef.current?.unlock();
	};
	const confirm = () => {
		inputRef.current.confirmPressed = true;
		sfxRef.current?.unlock();
	};
	const togglePause = () => {
		inputRef.current.pausePressed = true;
	};
	const toggleMute = () => {
		const sfx = sfxRef.current;
		if (!sfx) return;
		sfx.unlock();
		setMuted(sfx.toggle());
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-dvh flex-col bg-night text-cream",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-0 flex-1 touch-none",
			onPointerDown: (e) => {
				if (e.button !== 0) return;
				if (e.target.closest("button")) return;
				sfxRef.current?.unlock();
				const startY = e.clientY;
				const startX = e.clientX;
				const move = (ev) => {
					const dy = ev.clientY - startY;
					const dx = ev.clientX - startX;
					if (dy > 48 && Math.abs(dy) > Math.abs(dx)) {
						pressSlide();
						window.removeEventListener("pointermove", move);
					}
				};
				const up = (ev) => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
					if (ev.clientY - startY < 36) pressJump(true);
					window.setTimeout(() => {
						inputRef.current.jumpHeld = false;
					}, 90);
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", up);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					className: "absolute inset-0 h-full w-full"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pill pointer-events-auto flex items-center gap-3 px-3 py-2 font-sans text-sm font-extrabold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Coins, {
									className: "size-4 text-sun",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hud.coins })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sand",
								children: [hud.dist, " m"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, {
									className: "size-4 text-sand",
									"aria-hidden": "true"
								}), hud.best]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex gap-1",
								"aria-hidden": "true",
								children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: i < hud.pace ? "h-2 w-2 rounded-full bg-band" : "h-2 w-2 rounded-full bg-cream/30" }, i))
							}),
							hud.shield ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sky",
								children: "Khiên"
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-ghost grid size-11 place-items-center",
							onClick: toggleMute,
							"aria-label": muted ? "Bật tiếng" : "Tắt tiếng",
							children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
						}), phase === "running" || phase === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-ghost grid size-11 place-items-center",
							onClick: togglePause,
							"aria-label": phase === "paused" ? "Tiếp tục" : "Tạm dừng",
							children: phase === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" })
						}) : null]
					})]
				}),
				phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 flex flex-col items-center justify-start px-5 pt-24 text-center sm:pt-28",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "scrim-top pointer-events-none absolute inset-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex w-full max-w-lg flex-col items-center gap-4 px-5 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-sans text-xs font-extrabold tracking-widest text-sand",
								children: "HẺM ĐÁ VÔ TẬN"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "title-shadow font-display text-6xl leading-none text-cream sm:text-7xl",
								children: "Dash Canyon"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-sm font-sans text-base font-bold text-cream",
								children: "Chạy xuyên hẻm đá. Nhảy đá và xương rồng, trượt mái đá, gom xu vàng."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap justify-center gap-2 font-sans text-sm font-extrabold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "pill flex items-center gap-1 px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
										className: "size-4",
										"aria-hidden": "true"
									}), " Giữ để nhảy cao"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "pill flex items-center gap-1 px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
										className: "size-4",
										"aria-hidden": "true"
									}), " Trượt mái đá"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-play mt-1",
								onClick: confirm,
								children: "Chơi"
							}),
							hud.best > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-sans text-sm font-extrabold text-sand",
								children: ["Kỷ lục ", hud.best]
							}) : null
						]
					})]
				}) : null,
				phase === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex items-center justify-center bg-night/45 p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-cream px-6 py-7 text-center text-ink",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-4xl",
								children: "Tạm dừng"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-sans font-bold",
								children: [
									hud.dist,
									" m · ",
									hud.score,
									" điểm"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-play",
								onClick: togglePause,
								children: "Tiếp tục"
							})
						]
					})
				}) : null,
				phase === "dead" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex items-center justify-center p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-cream px-6 py-7 text-center text-ink",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-sans text-xs font-extrabold tracking-widest text-clay",
								children: "HẾT LƯỢT"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-5xl leading-none",
								children: hud.score
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-sans font-extrabold text-clay",
								children: [
									hud.dist,
									" m · ",
									hud.coins,
									" xu"
								]
							}),
							hud.bestNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-full bg-sun px-3 py-1 font-sans text-sm font-extrabold text-ink",
								children: "Kỷ lục mới"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-sans text-sm font-bold",
								children: ["Kỷ lục ", hud.best]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-play mt-1",
								onClick: confirm,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
										className: "size-5",
										"aria-hidden": "true"
									}), "Chơi lại"]
								})
							})
						]
					})
				}) : null
			]
		}), touchUi && phase !== "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-3 bg-night px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-touch flex-1 bg-deep",
				onPointerDown: pressSlide,
				children: "Trượt"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-touch flex-[1.4] bg-band",
				onPointerDown: () => pressJump(true),
				onPointerUp: () => pressJump(false),
				onPointerLeave: () => pressJump(false),
				children: "Nhảy"
			})]
		}) : null]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashCanyon, {});
}
//#endregion
export { Home as component };
