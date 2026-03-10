import { useEffect, useRef } from "react";

import { createGameLoop } from "../core/gameLoop";

const STAGE_WIDTH = 960;
const STAGE_HEIGHT = 720;

export function CanvasStage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const loop = createGameLoop(() => {
      context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      context.fillStyle = "#101820";
      context.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      context.fillStyle = "#ffd166";
      context.fillRect(120, 620, 720, 16);
    });

    loop.start();

    return () => loop.stop();
  }, []);

  return <canvas ref={canvasRef} width={STAGE_WIDTH} height={STAGE_HEIGHT} aria-label="Game stage" />;
}
