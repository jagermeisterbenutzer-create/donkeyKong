export interface ControlState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  pause: boolean;
}

export function createControls() {
  const state: ControlState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    pause: false,
  };

  const setKey = (key: string, isDown: boolean) => {
    switch (key) {
      case "ArrowLeft":
      case "a":
      case "A":
        state.left = isDown;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        state.right = isDown;
        break;
      case "ArrowUp":
      case "w":
      case "W":
        state.up = isDown;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        state.down = isDown;
        break;
      case " ":
      case "Space":
        state.jump = isDown;
        break;
      case "Escape":
        state.pause = isDown;
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    setKey(event.key, true);
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    setKey(event.key, false);
  };

  const bind = (target: Window = window) => {
    target.addEventListener("keydown", handleKeyDown);
    target.addEventListener("keyup", handleKeyUp);
  };

  const unbind = (target: Window = window) => {
    target.removeEventListener("keydown", handleKeyDown);
    target.removeEventListener("keyup", handleKeyUp);
  };

  return { state, bind, unbind };
}
