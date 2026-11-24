import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Coins,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Sfx } from "@/game/audio";
import { renderGame } from "@/game/draw";
import {
  createGame,
  loadBest,
  paceOf,
  resetRun,
  step,
  type Game,
  type InputState,
  type Phase,
} from "@/game/engine";

function emptyInput(): InputState {
  return {
    jumpPressed: false,
    jumpHeld: false,
    slidePressed: false,
    pausePressed: false,
    confirmPressed: false,
  };
}

export function DashCanyon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<InputState>(emptyInput());
  const sfxRef = useRef<Sfx | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [hud, setHud] = useState({ score: 0, coins: 0, best: 0, dist: 0, pace: 1, shield: false, bestNew: false });
  const [touchUi, setTouchUi] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
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

    const publish = (force: boolean) => {
      const snapshot = {
        score: game.score,
        coins: game.coins,
        best: game.best,
        dist: Math.floor(game.distance),
        pace: Math.max(1, paceOf(game.speed)),
        shield: game.shield,
        bestNew: game.newBest,
      };
      setHud((prev) => {
        if (
          !force &&
          prev.score === snapshot.score &&
          prev.coins === snapshot.coins &&
          prev.best === snapshot.best &&
          prev.dist === snapshot.dist &&
          prev.pace === snapshot.pace &&
          prev.shield === snapshot.shield &&
          prev.bestNew === snapshot.bestNew
        ) {
          return prev;
        }
        return snapshot;
      });
      setPhase((prev) => (prev === game.phase ? prev : game.phase));
      const api = {
        phase: game.phase,
        score: game.score,
        y: game.player.y,
        dist: game.distance,
        shield: game.shield,
        speed: game.speed,
      };
      window.__dash = api;
    };

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
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
      if (hudAcc > 0.12 || events.includes("die") || events.includes("start")) {
        hudAcc = 0;
        publish(events.includes("die") || events.includes("start"));
      }
      raf = requestAnimationFrame(frame);
    };
    publish(true);
    raf = requestAnimationFrame(frame);

    const jumpDown = (code: string) => code === "Space" || code === "ArrowUp" || code === "KeyW";
    const onKeyDown = (e: KeyboardEvent) => {
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
    const onKeyUp = (e: KeyboardEvent) => {
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

  const pressJump = (held: boolean) => {
    const input = inputRef.current;
    if (held) {
      input.jumpPressed = true;
      input.jumpHeld = true;
    } else {
      input.jumpHeld = false;
    }
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

  return (
    <main className="flex h-dvh flex-col bg-night text-cream">
      <div
        className="relative min-h-0 flex-1 touch-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const target = e.target as HTMLElement;
          if (target.closest("button")) return;
          sfxRef.current?.unlock();
          const startY = e.clientY;
          const startX = e.clientX;
          const move = (ev: PointerEvent) => {
            const dy = ev.clientY - startY;
            const dx = ev.clientX - startX;
            if (dy > 48 && Math.abs(dy) > Math.abs(dx)) {
              pressSlide();
              window.removeEventListener("pointermove", move);
            }
          };
          const up = (ev: PointerEvent) => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            const dy = ev.clientY - startY;
            if (dy < 36) pressJump(true);
            window.setTimeout(() => {
              inputRef.current.jumpHeld = false;
            }, 90);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="pill pointer-events-auto flex items-center gap-3 px-3 py-2 font-sans text-sm font-extrabold">
            <span className="flex items-center gap-1">
              <Coins className="size-4 text-sun" aria-hidden="true" />
              <span>{hud.coins}</span>
            </span>
            <span className="text-sand">{hud.dist} m</span>
            <span className="flex items-center gap-1">
              <Trophy className="size-4 text-sand" aria-hidden="true" />
              {hud.best}
            </span>
            <span className="flex gap-1" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < hud.pace ? "h-2 w-2 rounded-full bg-band" : "h-2 w-2 rounded-full bg-cream/30"} />
              ))}
            </span>
            {hud.shield ? <span className="text-sky">Khiên</span> : null}
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" className="btn-ghost grid size-11 place-items-center" onClick={toggleMute} aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}>
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            {phase === "running" || phase === "paused" ? (
              <button type="button" className="btn-ghost grid size-11 place-items-center" onClick={togglePause} aria-label={phase === "paused" ? "Tiếp tục" : "Tạm dừng"}>
                {phase === "paused" ? <Play className="size-5" /> : <Pause className="size-5" />}
              </button>
            ) : null}
          </div>
        </div>

        {phase === "ready" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-start px-5 pt-24 text-center sm:pt-28">
            <div className="scrim-top pointer-events-none absolute inset-0" />
            <div className="relative flex w-full max-w-lg flex-col items-center gap-4 px-5 text-center">
              <p className="font-sans text-xs font-extrabold tracking-widest text-sand">HẺM ĐÁ VÔ TẬN</p>
              <h1 className="title-shadow font-display text-6xl leading-none text-cream sm:text-7xl">Dash Canyon</h1>
              <p className="max-w-sm font-sans text-base font-bold text-cream">
                Chạy xuyên hẻm đá. Nhảy đá và xương rồng, trượt mái đá, gom xu vàng.
              </p>
              <div className="flex flex-wrap justify-center gap-2 font-sans text-sm font-extrabold">
                <span className="pill flex items-center gap-1 px-3 py-2">
                  <ArrowUp className="size-4" aria-hidden="true" /> Giữ để nhảy cao
                </span>
                <span className="pill flex items-center gap-1 px-3 py-2">
                  <ArrowDown className="size-4" aria-hidden="true" /> Trượt mái đá
                </span>
              </div>
              <button type="button" className="btn-play mt-1" onClick={confirm}>
                Chơi
              </button>
              {hud.best > 0 ? <p className="font-sans text-sm font-extrabold text-sand">Kỷ lục {hud.best}</p> : null}
            </div>
          </div>
        ) : null}

        {phase === "paused" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-night/45 p-5">
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-cream px-6 py-7 text-center text-ink">
              <h2 className="font-display text-4xl">Tạm dừng</h2>
              <p className="font-sans font-bold">{hud.dist} m · {hud.score} điểm</p>
              <button type="button" className="btn-play" onClick={togglePause}>
                Tiếp tục
              </button>
            </div>
          </div>
        ) : null}

        {phase === "dead" ? (
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-cream px-6 py-7 text-center text-ink">
              <p className="font-sans text-xs font-extrabold tracking-widest text-clay">HẾT LƯỢT</p>
              <h2 className="font-display text-5xl leading-none">{hud.score}</h2>
              <p className="font-sans font-extrabold text-clay">
                {hud.dist} m · {hud.coins} xu
              </p>
              {hud.bestNew ? (
                <p className="rounded-full bg-sun px-3 py-1 font-sans text-sm font-extrabold text-ink">Kỷ lục mới</p>
              ) : (
                <p className="font-sans text-sm font-bold">Kỷ lục {hud.best}</p>
              )}
              <button type="button" className="btn-play mt-1" onClick={confirm}>
                <span className="inline-flex items-center gap-2">
                  <RotateCcw className="size-5" aria-hidden="true" />
                  Chơi lại
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {touchUi && phase !== "ready" ? (
        <div className="flex gap-3 bg-night px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" className="btn-touch flex-1 bg-deep" onPointerDown={pressSlide}>
            Trượt
          </button>
          <button
            type="button"
            className="btn-touch flex-[1.4] bg-band"
            onPointerDown={() => pressJump(true)}
            onPointerUp={() => pressJump(false)}
            onPointerLeave={() => pressJump(false)}
          >
            Nhảy
          </button>
        </div>
      ) : null}
    </main>
  );
}

declare global {
  interface Window {
    __dash?: {
      phase: string;
      score: number;
      y: number;
      dist: number;
      shield: boolean;
      speed: number;
    };
  }
}
