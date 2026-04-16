"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("./Game").then((module) => module.Game), {
  ssr: false,
});

export function GameScreen() {
  return <Game />;
}
