import type { CSSProperties } from "react";
import { difficultyPresets } from "../game/config/difficultyPresets";
import type { DifficultyName, GamePhase } from "../types/game";

interface HudProps {
  score: number;
  totalScore: number;
  lives: number;
  levelName: string;
  phase: GamePhase;
  difficulty: DifficultyName;
  bonusThreshold?: number;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  boot: "Powering up",
  ready: "Get ready",
  running: "Action",
  paused: "Paused",
  "level-complete": "Level done",
  "game-over": "Game over",
};

const HUD_STYLE: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  background: "linear-gradient(135deg, #ff9f1c, #f72585)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  color: "#0a0b17",
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
};

const ROW_STYLE: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const BLOCK_STYLE: CSSProperties = {
  flex: "1 1 180px",
  background: "rgba(255, 255, 255, 0.9)",
  borderRadius: 12,
  padding: "8px 12px",
  textTransform: "uppercase",
  fontSize: "12px",
  letterSpacing: "0.06em",
  display: "flex",
  flexDirection: "column",
};

const VALUE_STYLE: CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 700,
  marginTop: "4px",
  color: "#222233",
  letterSpacing: "0.04em",
};

const STATUS_STYLE: CSSProperties = {
  flex: "1 1 260px",
  background: "rgba(10, 11, 23, 0.8)",
  borderRadius: 12,
  padding: "10px 14px",
  border: "2px solid #f9f871",
  color: "#f9f7de",
  textTransform: "uppercase",
  fontSize: "13px",
  letterSpacing: "0.1em",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  justifyContent: "center",
};

const PROGRESS_CONTAINER: CSSProperties = {
  width: "100%",
  height: "6px",
  borderRadius: "999px",
  background: "rgba(255, 255, 255, 0.6)",
  overflow: "hidden",
};

const PROGRESS_BAR: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #9b5de5, #f15bb5)",
};

export function Hud({ score, totalScore, lives, levelName, phase, difficulty, bonusThreshold }: HudProps) {
  const phaseLabel = PHASE_LABELS[phase];
  const bonusPercent = bonusThreshold ? Math.min(100, (score / bonusThreshold) * 100) : 0;
  const difficultyPreset = difficultyPresets[difficulty];

  return (
    <header style={HUD_STYLE} aria-label="Game HUD">
      <div style={ROW_STYLE}>
        <div style={BLOCK_STYLE}>
          <span>Current Level</span>
          <strong style={VALUE_STYLE}>{levelName}</strong>
        </div>
        <div style={BLOCK_STYLE}>
          <span>Score</span>
          <strong style={VALUE_STYLE}>{score.toLocaleString()}</strong>
        </div>
        <div style={BLOCK_STYLE}>
          <span>Total</span>
          <strong style={VALUE_STYLE}>{totalScore.toLocaleString()}</strong>
        </div>
        <div style={BLOCK_STYLE}>
          <span>Lives</span>
          <strong style={VALUE_STYLE}>{lives}</strong>
        </div>
        <div style={BLOCK_STYLE}>
          <span>Difficulty</span>
          <strong style={VALUE_STYLE}>{difficultyPreset.label}</strong>
        </div>
      </div>

      <div style={ROW_STYLE}>
        <div style={STATUS_STYLE}>
          <span>STATUS</span>
          <strong style={{ fontSize: "1.3rem" }}>{phaseLabel}</strong>
          {bonusThreshold && (
            <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#fbf8f4" }}>
              BONUS TARGET {bonusThreshold.toLocaleString()} pts
            </div>
          )}
          {bonusThreshold && (
            <div style={PROGRESS_CONTAINER}>
              <div style={{ ...PROGRESS_BAR, width: `${bonusPercent}%` }} />
            </div>
          )}
          <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#fbf8f4" }}>
            TARGET: 60 FPS DESKTOP / TOUCH CONTROLS MOBILE
          </div>
        </div>
      </div>
    </header>
  );
}
