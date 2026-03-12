import { useEffect, useRef, type CSSProperties } from "react";

import { trackCheckpoint, trackPerformanceMetric } from "../analytics/gameAnalytics";
import { createGameLoop } from "../core/gameLoop";
import { GameEngine, GameInput } from "../engine/gameEngine";
import { playArcadeEffect } from "../audio/arcadeAudio";
import { useGameStore } from "../../state/gameStore";

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 720;

const INITIAL_INPUT: GameInput = { left: false, right: false, jump: false };

const STAGE_FRAME_STYLE: CSSProperties = {
  width: "min(100%, 960px)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const CANVAS_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
  aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}`,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(180deg, rgba(7,10,21,0.4), rgba(7,10,21,0.9))",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
};

const TOUCH_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
};

const TOUCH_BUTTON_STYLE: CSSProperties = {
  minHeight: "52px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(180deg, rgba(255,184,108,0.22), rgba(255,122,89,0.16))",
  color: "#fff4df",
  fontSize: "0.82rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  touchAction: "manipulation",
};

export function CanvasStage() {
  const { state, dispatch } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<GameInput>({ ...INITIAL_INPUT });
  const levelIndexRef = useRef(state.currentLevelIndex);
  const livesRef = useRef(state.lives);
  const phaseRef = useRef(state.phase);
  const difficultyRef = useRef(state.difficulty);
  const sessionIdRef = useRef(state.sessionId);
  const performanceRef = useRef({ frameCount: 0, totalDelta: 0 });

  useEffect(() => {
    levelIndexRef.current = state.currentLevelIndex;
    livesRef.current = state.lives;
    phaseRef.current = state.phase;
    difficultyRef.current = state.difficulty;
    sessionIdRef.current = state.sessionId;
  }, [state.currentLevelIndex, state.lives, state.phase, state.difficulty, state.sessionId]);

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
    engine.resetLevel(state.currentLevelIndex, state.difficulty);

    const loop = createGameLoop((deltaMs) => {
      if (phaseRef.current !== "running") {
        engine.render(context);
        return;
      }

      performanceRef.current.frameCount += 1;
      performanceRef.current.totalDelta += deltaMs;

      if (performanceRef.current.frameCount >= 180) {
        const averageFrameTime = performanceRef.current.totalDelta / performanceRef.current.frameCount;
        trackPerformanceMetric("avg_frame_ms", averageFrameTime, difficultyRef.current, sessionIdRef.current);
        trackPerformanceMetric("avg_fps", 1000 / averageFrameTime, difficultyRef.current, sessionIdRef.current);
        performanceRef.current = { frameCount: 0, totalDelta: 0 };
      }

      const result = engine.update(deltaMs, inputRef.current);

      if (result?.lifeLost) {
        playArcadeEffect("lifeLost");
        trackCheckpoint("life_lost", {
          difficulty: difficultyRef.current,
          sessionId: sessionIdRef.current,
          levelIndex: levelIndexRef.current,
          livesRemaining: Math.max(0, livesRef.current - 1),
        });
        dispatch({ type: "lose-life" });
        engine.handleLifeLoss();
      }

      if (result?.levelComplete) {
        trackCheckpoint("level_complete", {
          difficulty: difficultyRef.current,
          sessionId: sessionIdRef.current,
          levelIndex: levelIndexRef.current,
          remainingSeconds: result.remainingSeconds ?? 0,
          pointsAwarded: result.points ?? 0,
        });
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
  }, [dispatch, state.currentLevelIndex, state.difficulty, state.lives]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent, value: boolean) => {
      if (event.code === "ArrowLeft" || event.key === "a" || event.key === "A") {
        inputRef.current.left = value;
      } else if (event.code === "ArrowRight" || event.key === "d" || event.key === "D") {
        inputRef.current.right = value;
      } else if (event.code === "Space" || event.key === "w" || event.key === "W" || event.key === "ArrowUp") {
        inputRef.current.jump = value;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.code === "Escape" || event.key === "p" || event.key === "P") && state.phase === "running") {
        dispatch({ type: "pause-run" });
        return;
      }

      handleKey(event, true);
    };
    const handleKeyUp = (event: KeyboardEvent) => handleKey(event, false);

    const handleVisibility = () => {
      if (document.hidden && phaseRef.current === "running") {
        dispatch({ type: "pause-run" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dispatch, state.phase]);

  const setTouchInput = (key: keyof GameInput, value: boolean) => {
    inputRef.current[key] = value;
  };

  return (
    <div style={STAGE_FRAME_STYLE}>
      <style>
        {`@media (min-width: 801px) {
            [data-touch-controls="true"] {
              display: none;
            }
          }`}
      </style>
      <canvas ref={canvasRef} width={STAGE_WIDTH} height={STAGE_HEIGHT} aria-label="Game stage" style={CANVAS_STYLE} />
      <div data-touch-controls="true" style={TOUCH_ROW_STYLE} aria-label="Touch controls">
        <button
          type="button"
          style={TOUCH_BUTTON_STYLE}
          onPointerDown={() => setTouchInput("left", true)}
          onPointerUp={() => setTouchInput("left", false)}
          onPointerCancel={() => setTouchInput("left", false)}
          onPointerLeave={() => setTouchInput("left", false)}
        >
          Left
        </button>
        <button
          type="button"
          style={TOUCH_BUTTON_STYLE}
          onPointerDown={() => setTouchInput("jump", true)}
          onPointerUp={() => setTouchInput("jump", false)}
          onPointerCancel={() => setTouchInput("jump", false)}
          onPointerLeave={() => setTouchInput("jump", false)}
        >
          Jump
        </button>
        <button
          type="button"
          style={TOUCH_BUTTON_STYLE}
          onPointerDown={() => setTouchInput("right", true)}
          onPointerUp={() => setTouchInput("right", false)}
          onPointerCancel={() => setTouchInput("right", false)}
          onPointerLeave={() => setTouchInput("right", false)}
        >
          Right
        </button>
      </div>
    </div>
  );
}
