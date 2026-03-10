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
