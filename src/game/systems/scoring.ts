import { difficultyPresets } from "../config/difficultyPresets";
import { levelManifest } from "../levels/levelManifest";
import type { DifficultyName } from "../../types/game";

export function getAwardedScore(basePoints: number, difficulty: DifficultyName) {
  return Math.max(0, Math.round(basePoints * difficultyPresets[difficulty].scoreMultiplier));
}

export function getLevelBonus(levelIndex: number, remainingSeconds: number) {
  const level = levelManifest[levelIndex];

  if (!level) {
    return 0;
  }

  return Math.max(0, Math.min(level.bonusThreshold, remainingSeconds * 100));
}
