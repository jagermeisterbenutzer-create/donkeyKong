import type { DifficultyDefinition, DifficultyName } from "../../types/game";

export const difficultyOrder: DifficultyName[] = ["easy", "normal", "hard"];

export const difficultyPresets: Record<DifficultyName, DifficultyDefinition> = {
  easy: {
    id: "easy",
    label: "Easy",
    description: "Extra lives and slower hazards for first runs and touch play.",
    startingLives: 5,
    playerSpeedMultiplier: 0.96,
    jumpMultiplier: 0.96,
    enemySpeedMultiplier: 0.84,
    barrelSpeedMultiplier: 0.84,
    spawnRateMultiplier: 1.2,
    scoreMultiplier: 0.9,
  },
  normal: {
    id: "normal",
    label: "Normal",
    description: "Arcade-balanced pacing tuned for modern desktop browsers.",
    startingLives: 3,
    playerSpeedMultiplier: 1,
    jumpMultiplier: 1,
    enemySpeedMultiplier: 1,
    barrelSpeedMultiplier: 1,
    spawnRateMultiplier: 1,
    scoreMultiplier: 1,
  },
  hard: {
    id: "hard",
    label: "Hard",
    description: "Faster spawns, sharper enemy patrols, and tighter recovery.",
    startingLives: 2,
    playerSpeedMultiplier: 1.06,
    jumpMultiplier: 1.04,
    enemySpeedMultiplier: 1.18,
    barrelSpeedMultiplier: 1.16,
    spawnRateMultiplier: 0.82,
    scoreMultiplier: 1.2,
  },
};
