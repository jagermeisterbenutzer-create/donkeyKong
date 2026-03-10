import { useEffect, useMemo, useRef } from "react";

import { createGameLoop } from "../core/gameLoop";
import { levelLayouts } from "../levels/levelManifest";
import { intersects } from "../systems/collision";
import { createControls } from "../systems/controls";
import {
  createPlayerState,
  resolvePlayerPhysics,
  type MovementInput,
  type PlayerState,
} from "../systems/physics";
import { getLevelBonus } from "../systems/scoring";
import { useGameStore } from "../../state/gameStore";
import type { LevelLayout, Rect } from "../../types/game";

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 720;

interface Barrel {
  id: number;
  position: { x: number; y: number };
  velocityX: number;
  width: number;
  height: number;
  active: boolean;
  bouncing: boolean;
}

interface Enemy {
  position: { x: number; y: number };
  width: number;
  height: number;
  direction: "left" | "right";
}

function createEnemy(layout: LevelLayout): Enemy {
  return {
    position: { ...layout.kongSpawn },
    width: 60,
    height: 52,
    direction: "left",
  };
}

function createBarrel(id: number, layout: LevelLayout): Barrel {
  return {
    id,
    position: { ...layout.barrelSpawn },
    velocityX: 0,
    width: 26,
    height: 26,
    active: true,
    bouncing: true,
  };
}

function getStageBounds(): Rect {
  return { x: 0, y: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT };
}

export function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { state, dispatch } = useGameStore();
  const controls = useMemo(() => createControls(), []);
  const stateRef = useRef(state);
  const engineRef = useRef({
    player: createPlayerState({ x: 120, y: 620 }),
    enemy: createEnemy(levelLayouts[0]),
    barrels: [] as Barrel[],
    barrelId: 0,
    barrelTimer: 0,
    elapsedSeconds: 0,
    lastBonusTick: 0,
    levelId: levelLayouts[0]?.levelId ?? "",
    pauseLatch: false,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    controls.bind();

    const loop = createGameLoop((deltaMs) => {
      const activeState = stateRef.current;
      const layout = levelLayouts[activeState.currentLevelIndex];
      if (!layout) {
        context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        context.fillStyle = "#101820";
        context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        context.fillStyle = "#f4f1de";
        context.font = "28px " + "Courier New";
        context.fillText("GAME COMPLETE", 340, 360);
        return;
      }

      const engine = engineRef.current;
      const deltaSeconds = deltaMs / 1000;
      const isRunning = activeState.phase === "running";

      if (!isRunning && engine.lastBonusTick !== 0) {
        engine.lastBonusTick = 0;
      }

      if (engine.levelId !== layout.levelId) {
        resetEngineForLevel(engine, layout);
        engine.levelId = layout.levelId;
      }

      if (controls.state.pause && !engine.pauseLatch) {
        dispatch({ type: activeState.phase === "paused" ? "resume-run" : "pause-run" });
        engine.pauseLatch = true;
      }

      if (!controls.state.pause) {
        engine.pauseLatch = false;
      }

      if (activeState.phase === "boot") {
        dispatch({ type: "start-run" });
      }

      if (activeState.phase === "ready") {
        resetEngineForLevel(engine, layout);
        dispatch({ type: "start-run" });
      }

      if (activeState.phase === "paused") {
        drawScene(context, layout, engine, activeState, false);
        drawOverlay(context, "PAUSED", "Press Esc to resume");
        return;
      }

      if (activeState.phase === "level-complete") {
        drawScene(context, layout, engine, activeState, false);
        drawOverlay(context, "LEVEL COMPLETE", "Get ready for the next climb");
        return;
      }

      if (activeState.phase === "game-over") {
        drawScene(context, layout, engine, activeState, false);
        drawOverlay(context, "GAME OVER", "Refresh to try again");
        return;
      }

      if (!isRunning) {
        drawScene(context, layout, engine, activeState, false);
        return;
      }

      engine.elapsedSeconds += deltaSeconds;
      const remainingSeconds = Math.max(0, layout.timeLimitSeconds - engine.elapsedSeconds);

      if (remainingSeconds <= 0) {
        dispatch({ type: "lose-life" });
        dispatch({ type: "reset-level" });
        resetEngineForLevel(engine, layout);
      }

      const input = getMovementInput(controls.state);
      const bounds = getStageBounds();
      resolvePlayerPhysics(
        engine.player,
        input,
        deltaSeconds,
        layout.platforms,
        layout.ladders,
        layout.gravity,
        layout.playerSpeed,
        layout.climbSpeed,
        layout.jumpVelocity,
        bounds,
      );

      updateEnemy(engine.enemy, layout, deltaSeconds);
      updateBarrels(engine, layout, deltaSeconds);

      const playerRect = toRect(engine.player);

      if (engine.barrels.some((barrel) => barrel.active && intersects(playerRect, toRect(barrel)))) {
        dispatch({ type: "lose-life" });
        dispatch({ type: "reset-level" });
        resetEngineForLevel(engine, layout);
      }

      if (intersects(playerRect, layout.goal)) {
        const bonus = getLevelBonus(activeState.currentLevelIndex, remainingSeconds);
        if (bonus > 0) {
          dispatch({ type: "add-score", points: bonus });
        }
        dispatch({ type: "complete-level" });
        return;
      }

      if (engine.elapsedSeconds - engine.lastBonusTick >= 1) {
        dispatch({ type: "add-score", points: 10 });
        engine.lastBonusTick = Math.floor(engine.elapsedSeconds);
      }

      drawScene(context, layout, engine, activeState, true, remainingSeconds);
    });

    loop.start();

    return () => {
      controls.unbind();
      loop.stop();
    };
  }, [controls, dispatch]);

  return <canvas ref={canvasRef} width={STAGE_WIDTH} height={STAGE_HEIGHT} aria-label="Game stage" />;
}

function getMovementInput(state: ReturnType<typeof createControls>["state"]): MovementInput {
  const axisX = state.left ? -1 : state.right ? 1 : 0;
  const axisY = state.up ? -1 : state.down ? 1 : 0;

  return { axisX, axisY, jump: state.jump };
}

function resetEngineForLevel(
  engine: {
    player: PlayerState;
    enemy: Enemy;
    barrels: Barrel[];
    barrelId: number;
    barrelTimer: number;
    elapsedSeconds: number;
    lastBonusTick: number;
  },
  layout: LevelLayout,
) {
  engine.player = createPlayerState(layout.playerSpawn);
  engine.enemy = createEnemy(layout);
  engine.barrels = [];
  engine.barrelId = 0;
  engine.barrelTimer = 0;
  engine.elapsedSeconds = 0;
  engine.lastBonusTick = 0;
}

function updateEnemy(enemy: Enemy, layout: LevelLayout, deltaSeconds: number) {
  const speed = layout.enemySpeed;
  const direction = enemy.direction === "left" ? -1 : 1;
  enemy.position.x += direction * speed * deltaSeconds;
  const platform = layout.platforms[0];
  if (platform) {
    if (enemy.position.x <= platform.x) {
      enemy.position.x = platform.x;
      enemy.direction = "right";
    }
    if (enemy.position.x + enemy.width >= platform.x + platform.width) {
      enemy.position.x = platform.x + platform.width - enemy.width;
      enemy.direction = "left";
    }
  }
}

function updateBarrels(
  engine: {
    barrels: Barrel[];
    barrelId: number;
    barrelTimer: number;
  },
  layout: LevelLayout,
  deltaSeconds: number,
) {
  engine.barrelTimer += deltaSeconds * 1000;
  if (engine.barrelTimer >= layout.barrelSpawnIntervalMs) {
    engine.barrelTimer = 0;
    engine.barrels.push(createBarrel(engine.barrelId++, layout));
  }

  engine.barrels.forEach((barrel) => {
    if (!barrel.active) {
      return;
    }

    const platform = findPlatformForBarrel(barrel, layout.platforms);
    if (platform) {
      const direction = platform.direction === "left" ? -1 : 1;
      barrel.velocityX = direction * layout.barrelSpeed;
    }

    barrel.position.x += barrel.velocityX * deltaSeconds;
    barrel.position.y += layout.gravity * 0.15 * deltaSeconds;

    const currentPlatform = findPlatformForBarrel(barrel, layout.platforms);
    if (currentPlatform) {
      barrel.position.y = currentPlatform.y - barrel.height;
    }

    if (barrel.position.x < 60) {
      barrel.position.x = 60;
      barrel.velocityX = Math.abs(barrel.velocityX);
    }

    if (barrel.position.x + barrel.width > STAGE_WIDTH - 60) {
      barrel.position.x = STAGE_WIDTH - 60 - barrel.width;
      barrel.velocityX = -Math.abs(barrel.velocityX);
    }

    if (barrel.position.y > STAGE_HEIGHT + 60) {
      barrel.active = false;
    }

    if (barrel.bouncing && currentPlatform) {
      barrel.bouncing = false;
    }
  });
}

function findPlatformForBarrel(barrel: Barrel, platforms: LevelLayout["platforms"]) {
  return platforms.find((platform) => {
    const withinX =
      barrel.position.x + barrel.width > platform.x && barrel.position.x < platform.x + platform.width;
    const withinY = barrel.position.y + barrel.height >= platform.y - 6 && barrel.position.y + barrel.height <= platform.y + 12;
    return withinX && withinY;
  });
}

function toRect(entity: { position: { x: number; y: number }; width: number; height: number }): Rect {
  return {
    x: entity.position.x,
    y: entity.position.y,
    width: entity.width,
    height: entity.height,
  };
}

function drawScene(
  context: CanvasRenderingContext2D,
  layout: LevelLayout,
  engine: {
    player: PlayerState;
    enemy: Enemy;
    barrels: Barrel[];
  },
  state: { phase: string },
  animate: boolean,
  remainingSeconds?: number,
) {
  context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  context.fillStyle = "#0f141b";
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  context.fillStyle = "#243b53";
  context.fillRect(60, 60, STAGE_WIDTH - 120, STAGE_HEIGHT - 120);

  context.strokeStyle = "#364f6b";
  context.lineWidth = 2;
  layout.platforms.forEach((platform) => {
    context.fillStyle = "#f9c74f";
    context.fillRect(platform.x, platform.y, platform.width, platform.height);
    context.strokeRect(platform.x, platform.y, platform.width, platform.height);
  });

  layout.ladders.forEach((ladder) => {
    context.fillStyle = "#f4a261";
    context.fillRect(ladder.x, ladder.y, ladder.width, ladder.height);
    context.strokeStyle = "#b5651d";
    context.strokeRect(ladder.x, ladder.y, ladder.width, ladder.height);
  });

  context.fillStyle = "#ee964b";
  context.fillRect(layout.goal.x, layout.goal.y, layout.goal.width, layout.goal.height);

  drawEnemy(context, engine.enemy);
  drawBarrels(context, engine.barrels);
  drawPlayer(context, engine.player, animate);

  if (state.phase === "running" && remainingSeconds !== undefined) {
    context.fillStyle = "#f4f1de";
    context.font = "16px " + "Courier New";
    const bonus = Math.max(0, Math.floor(remainingSeconds * 100));
    context.fillText("Bonus: " + bonus, 680, 48);
    context.fillText("Controls: arrows/WASD + space", 120, 48);
  }
}

function drawPlayer(context: CanvasRenderingContext2D, player: PlayerState, animate: boolean) {
  context.fillStyle = "#4d908e";
  context.fillRect(player.position.x, player.position.y, player.width, player.height);
  context.fillStyle = "#1b4332";
  if (animate) {
    const bob = Math.sin(Date.now() / 120) * 2;
    context.fillRect(player.position.x + 6, player.position.y + player.height - 10 + bob, 8, 8);
    context.fillRect(player.position.x + 18, player.position.y + player.height - 10 - bob, 8, 8);
  }
}

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy) {
  context.fillStyle = "#e63946";
  context.fillRect(enemy.position.x, enemy.position.y, enemy.width, enemy.height);
  context.fillStyle = "#590d22";
  context.fillRect(enemy.position.x + 8, enemy.position.y + 10, 12, 12);
  context.fillRect(enemy.position.x + enemy.width - 20, enemy.position.y + 10, 12, 12);
}

function drawBarrels(context: CanvasRenderingContext2D, barrels: Barrel[]) {
  barrels.forEach((barrel) => {
    if (!barrel.active) {
      return;
    }
    context.fillStyle = "#9b2226";
    context.beginPath();
    context.ellipse(
      barrel.position.x + barrel.width / 2,
      barrel.position.y + barrel.height / 2,
      barrel.width / 2,
      barrel.height / 2,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.strokeStyle = "#f4f1de";
    context.stroke();
  });
}

function drawOverlay(context: CanvasRenderingContext2D, title: string, subtitle: string) {
  context.fillStyle = "rgba(15, 20, 27, 0.75)";
  context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
  context.fillStyle = "#f4f1de";
  context.font = "28px " + "Courier New";
  context.fillText(title, 360, 340);
  context.font = "16px " + "Courier New";
  context.fillText(subtitle, 330, 370);
}
