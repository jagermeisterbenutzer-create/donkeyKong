export type FrameHandler = (deltaMs: number) => void;

export function createGameLoop(onFrame: FrameHandler) {
  let frameId = 0;
  let previousTime = 0;

  const tick = (time: number) => {
    const deltaMs = previousTime === 0 ? 16.7 : time - previousTime;
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
