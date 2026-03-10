import { levelManifest } from "../levels/levelManifest";

export function getLevelBonus(levelIndex: number, remainingSeconds: number) {
  const level = levelManifest[levelIndex];

  if (!level) {
    return 0;
  }

  return Math.max(0, Math.min(level.bonusThreshold, remainingSeconds * 100));
}
