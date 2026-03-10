import type { LevelDefinition, LevelLayout } from "../../types/game";

export const levelManifest: LevelDefinition[] = [
  {
    id: "construction-yard-1",
    name: "Construction Yard",
    timeLimitSeconds: 75,
    bonusThreshold: 5000,
  },
  {
    id: "girder-climb-2",
    name: "Girder Climb",
    timeLimitSeconds: 90,
    bonusThreshold: 8000,
  },
];

export const levelLayouts: LevelLayout[] = [
  {
    levelId: "construction-yard-1",
    playerSpawn: { x: 120, y: 622 },
    kongSpawn: { x: 96, y: 120 },
    barrelSpawn: { x: 120, y: 160 },
    goal: { x: 760, y: 92, width: 80, height: 60 },
    platforms: [
      { x: 120, y: 620, width: 720, height: 16, direction: "right" },
      { x: 160, y: 520, width: 680, height: 16, direction: "left" },
      { x: 120, y: 420, width: 680, height: 16, direction: "right" },
      { x: 160, y: 320, width: 680, height: 16, direction: "left" },
      { x: 120, y: 220, width: 680, height: 16, direction: "right" },
      { x: 180, y: 140, width: 620, height: 16, direction: "left" },
    ],
    ladders: [
      { x: 240, y: 540, width: 44, height: 80 },
      { x: 600, y: 460, width: 44, height: 80 },
      { x: 300, y: 360, width: 44, height: 80 },
      { x: 660, y: 260, width: 44, height: 80 },
      { x: 360, y: 180, width: 44, height: 60 },
    ],
    barrelSpawnIntervalMs: 2400,
    barrelSpeed: 130,
    playerSpeed: 180,
    climbSpeed: 140,
    gravity: 900,
    jumpVelocity: 360,
    enemySpeed: 80,
  },
  {
    levelId: "girder-climb-2",
    playerSpawn: { x: 160, y: 622 },
    kongSpawn: { x: 820, y: 140 },
    barrelSpawn: { x: 780, y: 180 },
    goal: { x: 120, y: 92, width: 80, height: 60 },
    platforms: [
      { x: 120, y: 620, width: 720, height: 16, direction: "left" },
      { x: 120, y: 540, width: 680, height: 16, direction: "right" },
      { x: 160, y: 460, width: 680, height: 16, direction: "left" },
      { x: 120, y: 380, width: 680, height: 16, direction: "right" },
      { x: 160, y: 300, width: 680, height: 16, direction: "left" },
      { x: 120, y: 220, width: 680, height: 16, direction: "right" },
      { x: 180, y: 140, width: 620, height: 16, direction: "left" },
    ],
    ladders: [
      { x: 260, y: 560, width: 44, height: 80 },
      { x: 560, y: 500, width: 44, height: 80 },
      { x: 360, y: 420, width: 44, height: 80 },
      { x: 620, y: 340, width: 44, height: 80 },
      { x: 420, y: 260, width: 44, height: 80 },
      { x: 300, y: 180, width: 44, height: 60 },
    ],
    barrelSpawnIntervalMs: 2100,
    barrelSpeed: 150,
    playerSpeed: 190,
    climbSpeed: 150,
    gravity: 980,
    jumpVelocity: 380,
    enemySpeed: 90,
  },
];
