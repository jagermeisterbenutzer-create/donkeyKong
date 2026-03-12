import { useEffect, useRef } from "react";

import { createGameLoop } from "../core/gameLoop";
import { GameEngine, GameInput } from "../engine/gameEngine";
import { playArcadeEffect } from "../audio/arcadeAudio";
import { useGameStore } from "../../state/gameStore";

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 720;

const INITIAL_INPUT: GameInput = { left: false, right: false, jump: false };

export function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<GameInput>({ ...INITIAL_INPUT });
  const { state, dispatch } = useGameStore();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const engine = new GameEngine(STAGE_WIDTH, STAGE_HEIGHT);
    engine.resetLevel(state.currentLevelIndex);

    const loop = createGameLoop((deltaMs) => {
      const result = engine.update(deltaMs, inputRef.current);

      if (result?.lifeLost) {
        playArcadeEffect("lifeLost");
        dispatch({ type: "lose-life" });
        engine.handleLifeLoss();
      }

      if (result?.levelComplete) {
        dispatch({ type: "add-score", points: result.points ?? 0 });
        dispatch({ type: "complete-level" });
        playArcadeEffect("levelComplete");
      } else if (result?.points) {
        playArcadeEffect("barrel");
        dispatch({ type: "add-score", points: result.points });
      }

      engine.render(context);
    });

    loop.start();

    return () => {
      loop.stop();
    };
    }, [dispatch, state.currentLevelIndex]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent, value: boolean) => {
      if (event.code === "ArrowLeft" || event.key === "a") {
        inputRef.current.left = value;
      } else if (event.code === "ArrowRight" || event.key === "d") {
        inputRef.current.right = value;
      } else if (event.code === "Space" || event.key === "w" || event.key === "ArrowUp") {
        inputRef.current.jump = value;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => handleKey(event, true);
    const handleKeyUp = (event: KeyboardEvent) => handleKey(event, false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} width={STAGE_WIDTH} height={STAGE_HEIGHT} aria-label="Game stage" />;
}
