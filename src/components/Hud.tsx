interface HudProps {
  score: number;
  lives: number;
  levelName: string;
}

export function Hud({ score, lives, levelName }: HudProps) {
  return (
    <header>
      <p>Score: {score}</p>
      <p>Lives: {lives}</p>
      <p>Level: {levelName}</p>
    </header>
  );
}
