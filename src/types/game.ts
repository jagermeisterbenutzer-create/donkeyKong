export type GamePhase = "boot" | "ready" | "running" | "paused" | "level-complete" | "game-over";

export interface LevelDefinition {
  id: string;
  name: string;
  timeLimitSeconds: number;
  bonusThreshold: number;
}

export interface LevelProgress {
  levelId: string;
  score: number;
  completed: boolean;
}

export interface GameSessionState {
  phase: GamePhase;
  currentLevelIndex: number;
  totalScore: number;
  lives: number;
  levels: LevelProgress[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export interface Platform extends Rect {
  direction: "left" | "right";
}

export interface Ladder extends Rect {}

export interface LevelLayout {
  levelId: string;
  playerSpawn: Point;
  kongSpawn: Point;
  barrelSpawn: Point;
  goal: Rect;
  platforms: Platform[];
  ladders: Ladder[];
  barrelSpawnIntervalMs: number;
  barrelSpeed: number;
  playerSpeed: number;
  climbSpeed: number;
  gravity: number;
  jumpVelocity: number;
  enemySpeed: number;
}
