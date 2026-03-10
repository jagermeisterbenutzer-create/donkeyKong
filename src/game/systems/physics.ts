import type { Ladder, Platform, Point, Rect } from "../../types/game";

export interface MovementInput {
  axisX: number;
  axisY: number;
  jump: boolean;
}

export interface PlayerState {
  position: Point;
  velocity: Point;
  width: number;
  height: number;
  grounded: boolean;
  onLadder: boolean;
  facing: "left" | "right";
}

export function createPlayerState(spawn: Point): PlayerState {
  return {
    position: { ...spawn },
    velocity: { x: 0, y: 0 },
    width: 32,
    height: 38,
    grounded: false,
    onLadder: false,
    facing: "right",
  };
}

export function resolvePlayerPhysics(
  player: PlayerState,
  input: MovementInput,
  deltaSeconds: number,
  platforms: Platform[],
  ladders: Ladder[],
  gravity: number,
  moveSpeed: number,
  climbSpeed: number,
  jumpVelocity: number,
  bounds: Rect,
) {
  const onLadder = isOnLadder(player, ladders);
  player.onLadder = onLadder;
  player.velocity.x = input.axisX * moveSpeed;

  if (input.axisX !== 0) {
    player.facing = input.axisX > 0 ? "right" : "left";
  }

  if (onLadder) {
    player.velocity.y = input.axisY * climbSpeed;
  } else {
    player.velocity.y += gravity * deltaSeconds;
  }

  if (input.jump && player.grounded && !onLadder) {
    player.velocity.y = -jumpVelocity;
    player.grounded = false;
  }

  const nextX = player.position.x + player.velocity.x * deltaSeconds;
  player.position.x = Math.max(bounds.x, Math.min(bounds.x + bounds.width - player.width, nextX));

  const nextY = player.position.y + player.velocity.y * deltaSeconds;
  const collisions = platforms
    .map((platform) => ({
      rect: platform,
      intersects: intersectsRect({
        x: player.position.x,
        y: nextY,
        width: player.width,
        height: player.height,
      }, platform),
    }))
    .filter((item) => item.intersects);

  if (collisions.length > 0 && player.velocity.y >= 0) {
    const top = Math.min(...collisions.map((item) => item.rect.y));
    player.position.y = top - player.height;
    player.velocity.y = 0;
    player.grounded = true;
  } else {
    player.position.y = nextY;
    player.grounded = false;
  }

  player.position.y = Math.max(bounds.y, Math.min(bounds.y + bounds.height - player.height, player.position.y));
}

function isOnLadder(player: PlayerState, ladders: Ladder[]) {
  return ladders.some((ladder) => {
    const playerCenterX = player.position.x + player.width / 2;
    const withinX = playerCenterX >= ladder.x && playerCenterX <= ladder.x + ladder.width;
    const withinY = player.position.y + player.height >= ladder.y && player.position.y <= ladder.y + ladder.height;
    return withinX && withinY;
  });
}

function intersectsRect(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
