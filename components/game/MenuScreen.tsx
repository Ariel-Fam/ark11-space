import type { ReactNode } from "react";
import Link from "next/link";
import type { GameData } from "./types";
import Image from "next/image";

interface MenuScreenProps {
  data: GameData;
  musicMuted: boolean;
  musicVolumeLabel: string;
  onCycleMusicVolume: () => void;
  onStart: () => void;
  onResume: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  sfxMuted: boolean;
}

export function MenuScreen({
  data,
  musicMuted,
  musicVolumeLabel,
  onCycleMusicVolume,
  onStart,
  onResume,
  onToggleMusic,
  onToggleSfx,
  sfxMuted,
}: MenuScreenProps) {
  if (data.state === "playing") {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center px-6 py-8 md:items-center md:py-12">
        <div className="w-full max-w-5xl text-center">
        {data.state === "menu" ? (
          <>
            <h1
              className="mb-2 tracking-[0.2em] text-white"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: "48px" }}
            >
              Ark11: The Odyssey
            </h1>
            <p
              className="mb-12 tracking-widest text-cyan-400/60"
              style={{ fontSize: "14px" }}
            >
              DEEP SPACE EXPLORATION
            </p>
            <div className="mb-8 flex justify-center">
              <Image
                src="/softwareLogo.png"
                alt="Software logo"
                width={140}
                height={140}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <OverlayButton onClick={onStart} textColor="white" variant="primary">
                LAUNCH
              </OverlayButton>
              <OverlayLinkButton href="/controls" textColor="white">
                VIEW CONTROLS
              </OverlayLinkButton>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <OverlayToggleButton
                active={!musicMuted}
                color="emerald"
                onClick={onToggleMusic}
                textColor="white"
              >
                MUSIC {musicMuted ? "OFF" : "ON"}
              </OverlayToggleButton>
              <OverlayButton onClick={onCycleMusicVolume} textColor="white">
                VOL {musicVolumeLabel}
              </OverlayButton>
              <OverlayToggleButton
                active={!sfxMuted}
                color="cyan"
                onClick={onToggleSfx}
                textColor="white"
              >
                SFX {sfxMuted ? "OFF" : "ON"}
              </OverlayToggleButton>
            </div>
            <div className="mx-auto mt-8 mb-8 grid max-w-3xl gap-4 text-left md:grid-cols-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-2 tracking-[0.2em] text-cyan-300/70" style={{ fontSize: "10px" }}>
                  FLIGHT
                </div>
                <p className="font-sans text-white/80" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                  Traverse 9 elevation lanes, weave through dense obstacles, and stay ahead of droid patrols.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-2 tracking-[0.2em] text-emerald-300/70" style={{ fontSize: "10px" }}>
                  PICKUPS
                </div>
                <p className="font-sans text-white/80" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                  Orange refuels fuel, green gives your boost meter a quick top-up, and amethyst grants a 30 second invulnerability shield.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-2 tracking-[0.2em] text-violet-300/70" style={{ fontSize: "10px" }}>
                  COMBAT
                </div>
                <p className="font-sans text-white/80" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                  Fire on droids before they line up shots, use boost to reposition, and watch for patrols spread across rows and elevation lanes. Some droids hover still, while others drift vertically or sweep side to side.
                </p>
              </div>
            </div>
            <div className="mx-auto mb-8 grid max-w-3xl gap-4 text-left md:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-2 tracking-[0.2em] text-white/45" style={{ fontSize: "10px" }}>
                  CONTROLS
                </div>
                <div className="font-sans space-y-2 text-white/76" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                  <p>W / Up thrusts, S / Down brakes, and A / D or Left / Right turns the ship.</p>
                  <p>Q rolls left, E rolls right, while R / F climbs or drops between elevation lanes.</p>
                  <p>Press B while moving forward to engage boost, and let the meter recharge automatically when it is not in use.</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-2 tracking-[0.2em] text-white/45" style={{ fontSize: "10px" }}>
                  COMBAT
                </div>
                <div className="font-sans space-y-2 text-white/76" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                  <p>Press V or Space to fire lasers at obstacles, falling hazards, and enemy droids.</p>
                  <p>Droids are positioned in staggered rows ahead of you across the corridor and altitude lanes, so threat direction changes as you climb or descend.</p>
                  <p>Patrol types include stationary sentries, vertical movers, and side-to-side sweepers that can drag their firing line across your route.</p>
                  <p>Blue shield absorbs 4 droid laser hits, then the green health bar can take 3 more before SHOT BY DROID triggers.</p>
                  <p>Orange pickups restore fuel, green pickups top up boost, and purple amethyst grants a 30 second shield timer.</p>
                  <p>Use intact obstacles as cover because droid laser fire now gets blocked by solid terrain.</p>
                  <p>Collisions still destroy the ship instantly, so the health system only applies to droid laser shots.</p>
                  <p>Reach checkpoints for score, survive droid ambushes, and use ESC to pause or resume the run.</p>
                </div>
              </div>
            </div>
            
          </>
        ) : null}

        {data.state === "paused" ? (
          <div className="mx-auto w-full max-w-xl rounded-[32px] border border-white/15 bg-white/10 px-8 py-10 backdrop-blur-md">
            <h2
              className="mb-3 tracking-[0.3em] text-white"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: "36px" }}
            >
              PAUSED
            </h2>
            <p className="mb-8 text-white/60" style={{ fontSize: "13px" }}>
              Tune the audio, review the controls, or jump back into the run.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <OverlayButton onClick={onResume} textColor="white" variant="primary">
                RESUME
              </OverlayButton>
              <OverlayLinkButton href="/controls" textColor="white">
                OPEN CONTROLS
              </OverlayLinkButton>
              <OverlayToggleButton
                active={!musicMuted}
                color="emerald"
                onClick={onToggleMusic}
                textColor="white"
              >
                MUSIC {musicMuted ? "OFF" : "ON"}
              </OverlayToggleButton>
              <OverlayButton onClick={onCycleMusicVolume} textColor="white">
                VOL {musicVolumeLabel}
              </OverlayButton>
              <OverlayToggleButton
                active={!sfxMuted}
                color="cyan"
                onClick={onToggleSfx}
                textColor="white"
              >
                SFX {sfxMuted ? "OFF" : "ON"}
              </OverlayToggleButton>
            </div>
          </div>
        ) : null}

        {data.state === "gameover" ? (
          <>
            <h2
              className="mb-4 tracking-[0.3em] text-red-400"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: "36px" }}
            >
              {data.gameOverReason === "out_of_fuel"
                ? "OUT OF FUEL"
                : data.gameOverReason === "shot_by_droid"
                  ? "SHOT BY DROID"
                  : "SHIP DESTROYED"}
            </h2>
            <p className="mb-2 text-white/60" style={{ fontSize: "20px" }}>
              SCORE: {Math.floor(data.score)}
            </p>
            <p className="mb-2 text-cyan-400/60" style={{ fontSize: "14px" }}>
              CHECKPOINTS: {data.checkpoints}
            </p>
            <p className="mb-8 text-yellow-400/60" style={{ fontSize: "14px" }}>
              HIGH SCORE: {Math.floor(data.highScore)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <OverlayButton onClick={onStart} textColor="white">
                RELAUNCH
              </OverlayButton>
              <OverlayLinkButton href="/controls" textColor="white">
                CONTROLS
              </OverlayLinkButton>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <OverlayToggleButton
                active={!musicMuted}
                color="emerald"
                onClick={onToggleMusic}
                textColor="white"
              >
                MUSIC {musicMuted ? "OFF" : "ON"}
              </OverlayToggleButton>
              <OverlayButton onClick={onCycleMusicVolume} textColor="white">
                VOL {musicVolumeLabel}
              </OverlayButton>
              <OverlayToggleButton
                active={!sfxMuted}
                color="cyan"
                onClick={onToggleSfx}
                textColor="white"
              >
                SFX {sfxMuted ? "OFF" : "ON"}
              </OverlayToggleButton>
            </div>
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function OverlayButton({
  children,
  onClick,
  textColor = "black",
  variant = "secondary",
}: {
  children: ReactNode;
  onClick: () => void;
  textColor?: "black" | "white";
  variant?: "primary" | "secondary";
}) {
  const textClass = textColor === "white" ? "text-white" : "text-black/85";

  return (
    <button
      className={`cursor-pointer rounded-full border px-8 py-3 tracking-[0.28em] transition-colors ${
        variant === "primary"
          ? `border-cyan-400/50 ${textClass} hover:bg-cyan-400/10`
          : `border-white/20 ${textClass} hover:bg-white/10`
      }`}
      onClick={onClick}
      style={{ fontSize: "13px" }}
    >
      {children}
    </button>
  );
}

function OverlayLinkButton({
  children,
  href,
  textColor = "black",
}: {
  children: ReactNode;
  href: string;
  textColor?: "black" | "white";
}) {
  const textClass = textColor === "white" ? "text-white hover:text-white" : "text-black/85 hover:text-black";

  return (
    <Link
      className={`rounded-full border border-white/20 px-8 py-3 tracking-[0.28em] transition-colors hover:bg-white/10 ${textClass}`}
      href={href}
      style={{ fontSize: "13px" }}
    >
      {children}
    </Link>
  );
}

function OverlayToggleButton({
  active,
  children,
  color,
  onClick,
  textColor = "black",
}: {
  active: boolean;
  children: ReactNode;
  color: "cyan" | "emerald";
  onClick: () => void;
  textColor?: "black" | "white";
}) {
  const onTextClass = textColor === "white" ? "text-white" : "text-black/85";
  const activeClasses =
    color === "emerald"
      ? `border-emerald-400/45 ${onTextClass} hover:bg-emerald-400/12`
      : `border-cyan-400/45 ${onTextClass} hover:bg-cyan-400/12`;
  const offTextClass = textColor === "white" ? "text-white" : "text-black/85";

  return (
    <button
      className={`cursor-pointer rounded-full border px-5 py-2 tracking-[0.24em] transition-colors ${
        active
          ? activeClasses
          : `border-red-400/45 ${offTextClass} hover:bg-red-400/12`
      }`}
      onClick={onClick}
      style={{ fontSize: "11px" }}
    >
      {children}
    </button>
  );
}
