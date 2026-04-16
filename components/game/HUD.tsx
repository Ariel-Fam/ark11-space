import Link from "next/link";
import type { GameData } from "./types";

interface HUDProps {
  data: GameData;
  musicMuted: boolean;
  musicVolumeLabel: string;
  onCycleMusicVolume: () => void;
  onPause: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  sfxMuted: boolean;
}

export function HUD({
  data,
  musicMuted,
  musicVolumeLabel,
  onCycleMusicVolume,
  onPause,
  onToggleMusic,
  onToggleSfx,
  sfxMuted,
}: HUDProps) {
  if (data.state !== "playing") {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/40">
          <div className="h-1 w-1 rounded-full bg-cyan-400" />
        </div>
      </div>

      <div className="pointer-events-auto absolute left-8 top-6 flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/16 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur-md">
        <button
          className={`cursor-pointer rounded-full border px-3 py-1 tracking-[0.22em] transition-colors ${
            musicMuted
              ? "border-red-400/45 text-black/80 hover:bg-red-400/12"
              : "border-emerald-400/45 text-black/80 hover:bg-emerald-400/12"
          }`}
          onClick={onToggleMusic}
          style={{ fontSize: "10px" }}
        >
          MUSIC {musicMuted ? "OFF" : "ON"}
        </button>
        <button
          className="cursor-pointer rounded-full border border-black/20 px-3 py-1 tracking-[0.22em] text-black/80 transition-colors hover:bg-white/10"
          onClick={onCycleMusicVolume}
          style={{ fontSize: "10px" }}
        >
          VOL {musicVolumeLabel}
        </button>
        <button
          className={`cursor-pointer rounded-full border px-3 py-1 tracking-[0.22em] transition-colors ${
            sfxMuted
              ? "border-red-400/45 text-black/80 hover:bg-red-400/12"
              : "border-cyan-400/45 text-black/80 hover:bg-cyan-400/12"
          }`}
          onClick={onToggleSfx}
          style={{ fontSize: "10px" }}
        >
          SFX {sfxMuted ? "OFF" : "ON"}
        </button>
        <Link
          className="rounded-full border border-white/20 px-3 py-1 tracking-[0.22em] text-black/80 transition-colors hover:bg-white/10 hover:text-black"
          href="/controls"
          style={{ fontSize: "10px" }}
        >
          CONTROLS
        </Link>
      </div>

      <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-8 rounded-full border border-white/25 bg-white/18 px-6 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="tracking-widest text-black/70" style={{ fontSize: "12px" }}>
          SCORE
        </div>
        <div className="tracking-wider text-white" style={{ fontSize: "28px" }}>
          {Math.floor(data.score).toString().padStart(6, "0")}
        </div>
        <div className="tracking-widest text-black/70" style={{ fontSize: "12px" }}>
          CP: {data.checkpoints}
        </div>
      </div>

      <div className="absolute bottom-8 left-8 rounded-3xl border border-white/20 bg-white/16 px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-md">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-purple-500/45 bg-purple-500/15">
              <div className="h-4 w-4 rounded-full border border-purple-400/70 bg-purple-400/30" />
            </div>
            <div>
              <div className="tracking-widest text-black/70" style={{ fontSize: "10px" }}>
                AMETHYST SHIELD
              </div>
              <div className="text-black" style={{ fontSize: "14px" }}>
                {data.amethystShieldTime > 0
                  ? `${Math.ceil(data.amethystShieldTime)}s ACTIVE`
                  : "OFFLINE"}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1 tracking-widest text-black/70" style={{ fontSize: "10px" }}>
            FUEL
          </div>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-black/15">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${data.fuel}%`,
                background:
                  data.fuel > 50 ? "#ff9f1a" : data.fuel > 25 ? "#ff7a00" : "#ff4d00",
              }}
            />
          </div>
        </div>
        <div className="mb-1 tracking-widest text-black/70" style={{ fontSize: "10px" }}>
          SPEED
        </div>
        <div className="text-black" style={{ fontSize: "32px" }}>
          {Math.floor(data.speed)}
          <span className="ml-1 text-black/70" style={{ fontSize: "12px" }}>
            KM/S
          </span>
        </div>
        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${(data.speed / 180) * 100}%`,
              background: data.isBoosting ? "#ff6600" : "#00ccff",
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-8 right-8 rounded-3xl border border-white/20 bg-white/16 px-5 py-4 text-right shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-md">
        <div className="mb-3">
          <div className="mb-1 tracking-widest text-black/70" style={{ fontSize: "10px" }}>
            HULL
          </div>
          <div className="ml-auto h-2 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${data.health}%`,
                background:
                  data.health > 50
                    ? "#00ff66"
                    : data.health > 25
                      ? "#ffaa00"
                      : "#ff3333",
              }}
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1 tracking-widest text-black/70" style={{ fontSize: "10px" }}>
            SHIELD
          </div>
          <div className="ml-auto h-2 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${data.shield}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 tracking-widest text-black/70" style={{ fontSize: "10px" }}>
            BOOST
          </div>
          <div className="ml-auto h-2 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${data.boostMeter}%`,
                background: data.isBoosting ? "#ff4400" : "#ff8800",
              }}
            />
          </div>
          <div className="mt-2 text-black/70" style={{ fontSize: "10px" }}>
            `B` ENGAGE BOOST | AUTO RECHARGE
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex max-w-[92vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-[26px] border border-white/20 bg-white/16 px-3 py-2 shadow-[0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur-md">
        <div className="rounded-2xl bg-black/8 px-2.5 py-1.5 text-center">
          <div className="tracking-widest text-black/70" style={{ fontSize: "8px" }}>
            MOVE
          </div>
          <div className="text-black" style={{ fontSize: "10px" }}>
            WASD / ARROWS
          </div>
        </div>
        <div className="rounded-2xl bg-black/8 px-2.5 py-1.5 text-center">
          <div className="tracking-widest text-black/70" style={{ fontSize: "8px" }}>
            ELEVATION
          </div>
          <div className="text-black" style={{ fontSize: "10px" }}>
            R UP / F DOWN
          </div>
        </div>
        <div className="rounded-2xl bg-black/8 px-2.5 py-1.5 text-center">
          <div className="tracking-widest text-black/70" style={{ fontSize: "8px" }}>
            FIRE
          </div>
          <div className="text-black" style={{ fontSize: "10px" }}>
            V / SPACE
          </div>
        </div>
        <div className="rounded-2xl bg-black/8 px-2.5 py-1.5 text-center">
          <div className="tracking-widest text-black/70" style={{ fontSize: "8px" }}>
            BOOST
          </div>
          <div className="text-black" style={{ fontSize: "10px" }}>
            B
          </div>
        </div>
        <div className="rounded-2xl bg-black/8 px-2.5 py-1.5 text-center">
          <div className="tracking-widest text-black/70" style={{ fontSize: "8px" }}>
            PICKUPS
          </div>
          <div className="text-black" style={{ fontSize: "10px" }}>
            ORANGE FUEL | GREEN BOOST | PURPLE SHIELD
          </div>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-8 top-6 flex items-center gap-3">
        <Link
          className="rounded-full border border-white/20 bg-white/12 px-4 py-1.5 tracking-[0.22em] text-black/80 transition-colors hover:bg-white/18 hover:text-black"
          href="/controls"
          style={{ fontSize: "10px" }}
        >
          CONTROLS
        </Link>
        <button
          className="cursor-pointer tracking-widest text-black/55 hover:text-black/85"
          onClick={onPause}
          style={{ fontSize: "12px" }}
        >
          [ESC] PAUSE
        </button>
      </div>

      {data.isBoosting ? (
        <div
          className="absolute bottom-40 left-1/2 -translate-x-1/2 animate-pulse tracking-[0.3em] text-orange-400"
          style={{ fontSize: "14px" }}
        >
          BOOST ENGAGED
        </div>
      ) : null}
    </div>
  );
}
