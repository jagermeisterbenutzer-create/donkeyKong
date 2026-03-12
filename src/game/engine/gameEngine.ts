import { difficultyPresets } from "../config/difficultyPresets";
import { levelManifest } from "../levels/levelManifest";
import { getAwardedScore } from "../systems/scoring";
import {
  createBackgroundImage,
  createDonkeySpriteSheet,
  DONKEY_FRAME_COUNT,
  DONKEY_FRAME_HEIGHT,
  DONKEY_FRAME_WIDTH,
} from "../assets/artAssets";
import type { DifficultyName } from "../../types/game";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Platform = Rect & { direction: -1 | 1 };

const PLATFORMS: Platform[] = [
  { x: 110, y: 640, width: 740, height: 16, direction: 1 },
  { x: 170, y: 520, width: 620, height: 16, direction: -1 },
  { x: 210, y: 400, width: 560, height: 16, direction: 1 },
  { x: 250, y: 280, width: 460, height: 16, direction: -1 },
  { x: 310, y: 160, width: 360, height: 16, direction: 1 },
];

const GOAL_ZONE = { x: 340, y: 60, width: 280, height: 80 };

const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const BARREL_SIZE = 28;
const ENEMY_SIZE = 36;

const GRAVITY = 2200; // pixels per second squared
const PLAYER_SPEED = 220;
const JUMP_SPEED = -660;
const BARREL_BASE_SPEED = 190;
const BARREL_VERTICAL_SPEED = 220;
const BARREL_POINTS = 20;
const LEVEL_COMPLETE_POINTS = 500;

interface Player extends Rect {
  vx: number;
  vy: number;
  onGround: boolean;
}

interface Enemy extends Rect {
  vx: number;
}

interface Barrel extends Rect {
  vx: number;
  vy: number;
}

export type GameInput = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

export interface GameUpdateResult {
  points?: number;
  lifeLost?: boolean;
  levelComplete?: boolean;
  remainingSeconds?: number;
}

export class GameEngine {
  private player: Player;
  private enemies: Enemy[] = [];
  private barrels: Barrel[] = [];
  private levelIndex = 0;
  private levelDuration = 0;
  private timeRemaining = 0;
  private spawnCooldown = 0;
  private levelFinished = false;
  private timeOutTriggered = false;
  private difficulty: DifficultyName = "normal";
  private donkeyFrameIndex = 0;
  private donkeyAnimationTimer = 0;
  private backgroundImage: HTMLImageElement;
  private donkeySpriteSheet: HTMLImageElement;

  constructor(private width: number, private height: number) {
    this.player = this.createPlayer();
    this.backgroundImage = createBackgroundImage();
    this.donkeySpriteSheet = createDonkeySpriteSheet();
    this.resetLevel(0);
  }

  resetLevel(levelIndex: number, difficulty: DifficultyName = this.difficulty) {
    this.difficulty = difficulty;
    this.levelIndex = Math.max(0, Math.min(levelIndex, levelManifest.length - 1));
    this.levelDuration = levelManifest[this.levelIndex]?.timeLimitSeconds ?? 90;
    this.timeRemaining = this.levelDuration;
    this.spawnCooldown = 0;
    this.levelFinished = false;
    this.timeOutTriggered = false;
    this.player = this.createPlayer();
    this.enemies = this.createEnemies();
    this.barrels = [];
    this.resetDonkeyAnimation();
  }

  update(deltaMs: number, input: GameInput): GameUpdateResult | null {
    if (this.levelFinished) {
      return null;
    }

    const deltaSeconds = deltaMs / 1000;
    this.timeRemaining = Math.max(0, this.timeRemaining - deltaSeconds);

    this.movePlayer(deltaSeconds, input);
    this.moveEnemies(deltaSeconds);
    this.moveBarrels(deltaSeconds);
    this.updateDonkeyAnimation(deltaSeconds);

    this.spawnCooldown -= deltaMs;
    if (this.spawnCooldown <= 0) {
      this.spawnBarrel();
      this.spawnCooldown = this.getBarrelSpawnInterval();
    }

    const barrelPoints = this.cleanupBarrels();

    if (this.timeRemaining <= 0) {
      if (!this.timeOutTriggered) {
        this.timeOutTriggered = true;
        return { lifeLost: true };
      }
    } else {
      this.timeOutTriggered = false;
    }

    if (this.detectHazardCollision()) {
      return { lifeLost: true };
    }

    if (this.reachedGoal()) {
      this.levelFinished = true;
      const reward = getAwardedScore(LEVEL_COMPLETE_POINTS + Math.round(this.levelIndex * 60), this.difficulty);
      return {
        levelComplete: true,
        points: reward,
        remainingSeconds: Math.max(0, this.timeRemaining),
      };
    }

    if (barrelPoints > 0) {
      return { points: barrelPoints };
    }

    return null;
  }

  handleLifeLoss() {
    this.player = this.createPlayer();
    this.barrels = [];
    this.spawnCooldown = this.getBarrelSpawnInterval();
    this.timeRemaining = this.levelDuration;
    this.timeOutTriggered = false;
    this.levelFinished = false;
    this.resetDonkeyAnimation();
  }

  render(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, this.width, this.height);

    context.save();
    if (this.backgroundImage.complete) {
      context.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
      context.globalAlpha = 0.35;
    }
    const gradient = context.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#0b1420");
    gradient.addColorStop(0.45, "#15263f");
    gradient.addColorStop(1, "#080c16");
    context.fillStyle = gradient;
    context.fillRect(0, 0, this.width, this.height);
    context.restore();

    context.fillStyle = "rgba(255,255,255,0.05)";
    context.beginPath();
    context.ellipse(this.width * 0.7, this.height * 0.2, 260, 120, 0, 0, Math.PI * 2);
    context.fill();

    for (const platform of PLATFORMS) {
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.fillRect(platform.x, platform.y, platform.width, platform.height);
      context.fillStyle = "#ffb703";
      context.fillRect(platform.x + 4, platform.y - 8, platform.width * 0.4, 6);
    }

    context.globalAlpha = 0.25;
    context.fillStyle = "#f94144";
    context.fillRect(GOAL_ZONE.x, GOAL_ZONE.y, GOAL_ZONE.width, GOAL_ZONE.height);
    context.globalAlpha = 1;

    for (const barrel of this.barrels) {
      context.save();
      context.translate(barrel.x + barrel.width / 2, barrel.y + barrel.height / 2);
      context.rotate((barrel.x + barrel.y) * 0.01);
      context.fillStyle = "#c44569";
      context.beginPath();
      context.ellipse(0, 0, barrel.width / 2, barrel.height / 2, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#ffc857";
      context.fillRect(-barrel.width / 4, -barrel.height / 8, barrel.width / 2, barrel.height / 4);
      context.restore();
    }

    for (const enemy of this.enemies) {
      context.fillStyle = "#ff5d8f";
      context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      context.fillStyle = "#2d3142";
      context.fillRect(enemy.x + 6, enemy.y + 10, enemy.width - 12, enemy.height - 12);
    }

    const facingLeft = this.player.vx < 0;
    context.save();
    context.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    context.scale(facingLeft ? -1 : 1, 1);
    const drawX = -this.player.width / 2;
    const drawY = -this.player.height / 2;
    if (this.donkeySpriteSheet.complete) {
      context.drawImage(
        this.donkeySpriteSheet,
        this.donkeyFrameIndex * DONKEY_FRAME_WIDTH,
        0,
        DONKEY_FRAME_WIDTH,
        DONKEY_FRAME_HEIGHT,
        drawX,
        drawY,
        this.player.width,
        this.player.height
      );
    } else {
      context.fillStyle = "#fefae0";
      context.fillRect(drawX, drawY, this.player.width, this.player.height);
      context.strokeStyle = "#f07167";
      context.lineWidth = 3;
      context.strokeRect(drawX, drawY, this.player.width, this.player.height);
      context.fillStyle = "#0b1320";
      context.fillRect(drawX + 4, drawY + 18, this.player.width - 8, 4);
      context.fillRect(drawX + 4, drawY + 28, this.player.width - 8, 4);
    }
    context.restore();

    context.fillStyle = "#f1faee";
    context.textBaseline = "top";
    context.font = '600 18px "Press Start 2P", sans-serif';
    context.fillText(`Barrels: ${this.barrels.length}`, 24, 18);
    context.fillText(`Time: ${Math.max(0, Math.ceil(this.timeRemaining))}`, 24, 42);
    context.textAlign = "right";
    context.font = '600 22px "Press Start 2P", sans-serif';
    context.fillText(`Level ${this.levelIndex + 1}`, this.width - 24, 22);
    context.textAlign = "left";
  }

  private updateDonkeyAnimation(deltaSeconds: number) {
    const frameDuration = 0.12;
    if (this.player.vx !== 0) {
      this.donkeyAnimationTimer += deltaSeconds;
      if (this.donkeyAnimationTimer >= frameDuration) {
        this.donkeyAnimationTimer -= frameDuration;
        this.donkeyFrameIndex = (this.donkeyFrameIndex + 1) % DONKEY_FRAME_COUNT;
      }
    } else {
      this.resetDonkeyAnimation();
    }
  }

  private resetDonkeyAnimation() {
    this.donkeyFrameIndex = 0;
    this.donkeyAnimationTimer = 0;
  }

  private createPlayer(): Player {
    const platform = PLATFORMS[0];
    return {
      x: platform.x + 60,
      y: platform.y - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      onGround: true,
    };
  }

  private createEnemies(): Enemy[] {
    const platform = PLATFORMS[2];
    const count = Math.min(3, 1 + Math.floor((this.levelIndex + 1) / 2));
    const speedMultiplier = difficultyPresets[this.difficulty].enemySpeedMultiplier;
    return Array.from({ length: count }, (_, index) => ({
      x: platform.x + 60 + index * 90,
      y: platform.y - ENEMY_SIZE - 4,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
      vx: (Math.random() > 0.5 ? 1 : -1) * (90 + this.levelIndex * 20) * speedMultiplier,
    }));
  }

  private movePlayer(deltaSeconds: number, input: GameInput) {
    const player = this.player;
    const difficulty = difficultyPresets[this.difficulty];
    const playerSpeed = PLAYER_SPEED * difficulty.playerSpeedMultiplier;
    const jumpSpeed = JUMP_SPEED * difficulty.jumpMultiplier;

    if (input.left && !input.right) {
      player.vx = -playerSpeed;
    } else if (input.right && !input.left) {
      player.vx = playerSpeed;
    } else {
      player.vx = 0;
    }

    if (input.jump && player.onGround) {
      player.vy = jumpSpeed;
      player.onGround = false;
    }

    player.vy += GRAVITY * deltaSeconds;
    player.x += player.vx * deltaSeconds;
    player.y += player.vy * deltaSeconds;

    player.x = Math.max(20, Math.min(this.width - player.width - 20, player.x));
    player.y = Math.min(player.y, this.height - player.height - 22);

    const landing = PLATFORMS.find((platform) => {
      const horizontallyInside = player.x + player.width > platform.x && player.x < platform.x + platform.width;
      const falling = player.vy >= 0;
      const crossedPlatform =
        falling &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + 18 &&
        player.y <= platform.y;
      return horizontallyInside && crossedPlatform;
    });

    if (landing) {
      player.y = landing.y - player.height;
      player.vy = 0;
      player.onGround = true;
    } else if (player.y + player.height >= this.height - 52) {
      player.y = this.height - 52 - player.height;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
  }

  private moveEnemies(deltaSeconds: number) {
    for (const enemy of this.enemies) {
      enemy.x += enemy.vx * deltaSeconds;
      const leftBound = 160;
      const rightBound = this.width - 190;
      if (enemy.x <= leftBound) {
        enemy.x = leftBound;
        enemy.vx = Math.abs(enemy.vx);
      } else if (enemy.x + enemy.width >= rightBound) {
        enemy.x = rightBound - enemy.width;
        enemy.vx = -Math.abs(enemy.vx);
      }
    }
  }

  private moveBarrels(deltaSeconds: number) {
    for (const barrel of this.barrels) {
      barrel.vy += GRAVITY * deltaSeconds;
      barrel.x += barrel.vx * deltaSeconds;
      barrel.y += barrel.vy * deltaSeconds;
      if (barrel.x <= 20) {
        barrel.x = 20;
        barrel.vx = Math.abs(barrel.vx);
      } else if (barrel.x + barrel.width >= this.width - 20) {
        barrel.x = this.width - 20 - barrel.width;
        barrel.vx = -Math.abs(barrel.vx);
      }
    }
  }

  private spawnBarrel() {
    const difficulty = difficultyPresets[this.difficulty];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = (BARREL_BASE_SPEED + this.levelIndex * 14 + Math.random() * 40) * difficulty.barrelSpeedMultiplier;
    const barrel: Barrel = {
      x: this.width / 2 + (direction === 1 ? -120 : 120),
      y: 60,
      width: BARREL_SIZE,
      height: BARREL_SIZE,
      vx: direction * speed,
      vy: (BARREL_VERTICAL_SPEED + this.levelIndex * 15) * difficulty.barrelSpeedMultiplier,
    };
    this.barrels.push(barrel);
  }

  private cleanupBarrels(): number {
    let points = 0;
    this.barrels = this.barrels.filter((barrel) => {
      if (barrel.y > this.height) {
        points += getAwardedScore(BARREL_POINTS, this.difficulty);
        return false;
      }
      return true;
    });
    return points;
  }

  private detectHazardCollision(): boolean {
    const playerRect = this.player;
    for (const barrel of this.barrels) {
      if (this.intersects(playerRect, barrel)) {
        return true;
      }
    }
    for (const enemy of this.enemies) {
      if (this.intersects(playerRect, enemy)) {
        return true;
      }
    }
    return false;
  }

  private reachedGoal(): boolean {
    const player = this.player;
    const insideX = player.x + player.width > GOAL_ZONE.x && player.x < GOAL_ZONE.x + GOAL_ZONE.width;
    const insideY = player.y + player.height <= GOAL_ZONE.y + GOAL_ZONE.height;
    return insideX && insideY;
  }

  private intersects(a: Rect, b: Rect) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  private getBarrelSpawnInterval(): number {
    const difficulty = difficultyPresets[this.difficulty];
    const base = 1400 - this.levelIndex * 120;
    return Math.max(550, (base + Math.random() * 400 - 200) * difficulty.spawnRateMultiplier);
  }
}
