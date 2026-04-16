export type GameState = "menu" | "playing" | "paused" | "gameover";
export type GameOverReason = "destroyed" | "out_of_fuel" | "shot_by_droid";

export interface GameData {
  state: GameState;
  gameOverReason: GameOverReason;
  score: number;
  health: number;
  shield: number;
  speed: number;
  boostMeter: number;
  fuel: number;
  isBoosting: boolean;
  amethystShieldTime: number;
  checkpoints: number;
  highScore: number;
}

export interface ObstacleData {
  id: number;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive: string;
  destroyed: boolean;
  destructionProgress: number;
}

export interface AsteroidData {
  id: number;
  position: [number, number, number];
  scale: number;
  rotation: number;
  destroyed: boolean;
  destructionProgress: number;
}

export interface FallingHazardData {
  id: number;
  shape: "icosahedron" | "sphere";
  position: [number, number, number];
  scale: number;
  velocity: number;
  active: boolean;
  destroyed: boolean;
  destructionProgress: number;
}

export interface FuelOrbData {
  id: number;
  position: [number, number, number];
  scale: number;
  collected: boolean;
  collectionProgress: number;
  respawnTimer: number;
}

export interface AmethystClusterData {
  id: number;
  position: [number, number, number];
  scale: number;
  collected: boolean;
  collectionProgress: number;
  respawnTimer: number;
}

export interface BoostPickupData {
  id: number;
  position: [number, number, number];
  scale: number;
  collected: boolean;
  collectionProgress: number;
  respawnTimer: number;
}

export type EnemyDroidMovement = "stationary" | "vertical" | "left_to_right" | "right_to_left";

export interface EnemyDroidData {
  id: number;
  basePosition: [number, number, number];
  position: [number, number, number];
  size: number;
  movement: EnemyDroidMovement;
  moveRange: number;
  moveSpeed: number;
  fireCooldown: number;
  destroyed: boolean;
  destructionProgress: number;
}

export interface EnemyLaserData {
  id: number;
  position: [number, number, number];
  direction: [number, number, number];
  life: number;
  active: boolean;
}

export const ELEVATION_LEVELS = [4, 14, 24, 34, 46, 58, 70, 82, 94] as const;

export const initialGameData: GameData = {
  state: "menu",
  gameOverReason: "destroyed",
  score: 0,
  health: 100,
  shield: 100,
  speed: 0,
  boostMeter: 100,
  fuel: 100,
  isBoosting: false,
  amethystShieldTime: 0,
  checkpoints: 0,
  highScore: 0,
};
