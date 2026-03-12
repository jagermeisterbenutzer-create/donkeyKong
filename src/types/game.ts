export type GamePhase = "boot" | "ready" | "running" | "paused" | "level-complete" | "game-over";

export type DifficultyName = "easy" | "normal" | "hard";

export interface DifficultyDefinition {
  id: DifficultyName;
  label: string;
  description: string;
  startingLives: number;
  playerSpeedMultiplier: number;
  jumpMultiplier: number;
  enemySpeedMultiplier: number;
  barrelSpeedMultiplier: number;
  spawnRateMultiplier: number;
  scoreMultiplier: number;
}

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
  difficulty: DifficultyName;
  sessionId: number;
}
