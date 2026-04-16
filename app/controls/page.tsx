import Link from "next/link";

const flightControls = [
  {
    keycap: "W / Up",
    title: "Accelerate",
    description: "Push forward thrust to build speed and keep your run alive.",
  },
  {
    keycap: "S / Down",
    title: "Brake",
    description: "Bleed speed when you need a tighter line through crowded lanes.",
  },
  {
    keycap: "A / D or Left / Right",
    title: "Yaw Turn",
    description: "Steer the ship through the corridor and line up pickups or enemies.",
  },
  {
    keycap: "Q LEFT / E RIGHT",
    title: "Roll",
    description: "Use Q to roll left and E to roll right for quick style and micro-adjustments around hazards.",
  },
  {
    keycap: "R / F",
    title: "Elevation Shift",
    description: "Climb or descend between the nine traversal lanes to avoid collisions.",
  },
];

const combatControls = [
  {
    keycap: "V / Space",
    title: "Fire Lasers",
    description: "Destroy droids, asteroids, and hazards before they collapse your route.",
  },
  {
    keycap: "B + Forward Thrust",
    title: "Boost",
    description: "Convert stored boost charge into a burst of speed for escapes and repositioning.",
  },
  {
    keycap: "Esc",
    title: "Pause",
    description: "Open the pause overlay to resume, mute music, mute SFX, or review controls.",
  },
];

const survivalTips = [
  "Orange pickups restore fuel, so route toward them before your tank gets critical.",
  "Green pickups refill boost faster than passive recharge, which helps during heavy droid pressure.",
  "Purple amethyst grants a 30-second shield and is worth grabbing before dense obstacle clusters.",
  "Solid terrain blocks hostile laser fire, so obstacles can be used as cover when droids line up shots.",
];

export default function ControlsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_28%),linear-gradient(180deg,#020617_0%,#050816_48%,#020617_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-3 tracking-[0.4em] text-cyan-300/70" style={{ fontSize: "11px" }}>
              ARK11 FLIGHT MANUAL
            </p>
            <h1
              className="text-balance text-4xl font-semibold tracking-[0.16em] text-white md:text-6xl"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              Controls
            </h1>
            <p className="mt-4 max-w-2xl text-white/68" style={{ fontSize: "15px", lineHeight: 1.8 }}>
              Everything you need to fly clean lines, survive droid pressure, manage your fuel, and
              keep full control over the game audio while you play.
            </p>
          </div>
          <Link
            className="rounded-full border border-cyan-400/45 bg-cyan-400/8 px-6 py-3 tracking-[0.24em] text-cyan-200 transition-colors hover:bg-cyan-400/14"
            href="/"
            style={{ fontSize: "12px" }}
          >
            RETURN TO GAME
          </Link>
        </div>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[32px] border border-white/12 bg-white/8 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md">
            <p className="mb-3 tracking-[0.32em] text-cyan-300/70" style={{ fontSize: "11px" }}>
              CORE FLIGHT
            </p>
            <h2
              className="mb-4 text-2xl tracking-[0.12em] text-white"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              Navigation controls built for speed and readability
            </h2>
            <p className="mb-8 max-w-3xl text-white/66" style={{ fontSize: "14px", lineHeight: 1.8 }}>
              The ship rewards steady forward momentum. Use gentle steering for lane discipline, then
              layer roll and elevation changes when traffic tightens up.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {flightControls.map((control) => (
                <article
                  key={control.title}
                  className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5"
                >
                  <div className="mb-3 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                    <span style={{ fontSize: "11px", letterSpacing: "0.26em" }}>{control.keycap}</span>
                  </div>
                  <h3 className="mb-2 text-lg tracking-[0.08em] text-white">{control.title}</h3>
                  <p className="text-white/65" style={{ fontSize: "13px", lineHeight: 1.75 }}>
                    {control.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-400/16 bg-emerald-400/8 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md">
            <p className="mb-3 tracking-[0.32em] text-emerald-300/75" style={{ fontSize: "11px" }}>
              AUDIO QUICK GUIDE
            </p>
            <h2
              className="mb-4 text-2xl tracking-[0.12em] text-white"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              Music and SFX controls
            </h2>
            <div className="space-y-4 text-white/72" style={{ fontSize: "14px", lineHeight: 1.8 }}>
              <p>
                Background music loops continuously using <span className="text-white">`binaryPalindrome.wav`</span>{" "}
                at a restrained level so it supports the run without overpowering gameplay.
              </p>
              <p>
                Music and game sound effects are controlled separately. You can mute either one from
                the in-game HUD or from the pause screen.
              </p>
              <p>
                Sound effects cover ship thrust, boost energy, and gameplay cues. Music only affects
                the ambient soundtrack.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.25fr]">
          <div className="rounded-[32px] border border-violet-400/16 bg-violet-400/8 p-8 backdrop-blur-md">
            <p className="mb-3 tracking-[0.32em] text-violet-300/70" style={{ fontSize: "11px" }}>
              COMBAT SYSTEM
            </p>
            <h2
              className="mb-5 text-2xl tracking-[0.12em] text-white"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              Offensive controls
            </h2>
            <div className="space-y-4">
              {combatControls.map((control) => (
                <article
                  key={control.title}
                  className="rounded-[24px] border border-white/10 bg-slate-950/44 p-5"
                >
                  <div className="mb-2 text-cyan-200" style={{ fontSize: "11px", letterSpacing: "0.28em" }}>
                    {control.keycap}
                  </div>
                  <h3 className="mb-2 text-lg tracking-[0.08em] text-white">{control.title}</h3>
                  <p className="text-white/66" style={{ fontSize: "13px", lineHeight: 1.75 }}>
                    {control.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/12 bg-white/8 p-8 backdrop-blur-md">
            <p className="mb-3 tracking-[0.32em] text-yellow-300/70" style={{ fontSize: "11px" }}>
              SURVIVAL NOTES
            </p>
            <h2
              className="mb-4 text-2xl tracking-[0.12em] text-white"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              What to prioritize during a run
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {survivalTips.map((tip, index) => (
                <div
                  key={tip}
                  className="rounded-[24px] border border-white/10 bg-slate-950/44 p-5"
                >
                  <div className="mb-3 text-yellow-200/85" style={{ fontSize: "11px", letterSpacing: "0.3em" }}>
                    TIP 0{index + 1}
                  </div>
                  <p className="text-white/68" style={{ fontSize: "13px", lineHeight: 1.8 }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-cyan-400/16 bg-cyan-400/8 p-8 backdrop-blur-md">
          <p className="mb-3 tracking-[0.32em] text-cyan-300/72" style={{ fontSize: "11px" }}>
            AT-A-GLANCE MAP
          </p>
          <div className="grid gap-4 md:grid-cols-4">
            <QuickCard label="Move" value="WASD / Arrows" />
            <QuickCard label="Roll" value="Q left / E right" />
            <QuickCard label="Elevation" value="R / F" />
            <QuickCard label="Fire" value="V / Space" />
            <QuickCard label="Boost" value="B while thrusting" />
            <QuickCard label="Pause" value="Esc" />
            <QuickCard label="Music" value="HUD or pause toggle" />
            <QuickCard label="SFX" value="HUD or pause toggle" />
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/42 p-4">
      <div className="mb-2 text-white/48" style={{ fontSize: "10px", letterSpacing: "0.3em" }}>
        {label}
      </div>
      <div className="text-white" style={{ fontSize: "14px", lineHeight: 1.6 }}>
        {value}
      </div>
    </div>
  );
}
