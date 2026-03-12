export type FrameHandler = (deltaMs: number) => void;

export function createGameLoop(onFrame: FrameHandler) {
  let frameId = 0;
  let previousTime = 0;
  const MAX_DELTA_MS = 33.3;

  const tick = (time: number) => {
    const rawDelta = previousTime === 0 ? 16.7 : time - previousTime;
    const deltaMs = Math.min(MAX_DELTA_MS, rawDelta);
    previousTime = time;
    onFrame(deltaMs);
    frameId = window.requestAnimationFrame(tick);
  };

  return {
    start() {
      frameId = window.requestAnimationFrame(tick);
    },
    stop() {
      window.cancelAnimationFrame(frameId);
      previousTime = 0;
    },
  };
}
