import { useEffect } from "react";
import type { CSSProperties } from "react";

import { trackCheckpoint } from "../game/analytics/gameAnalytics";
import type { GamePhase } from "../types/game";
import { useGameStore } from "../state/gameStore";
import { difficultyOrder, difficultyPresets } from "../game/config/difficultyPresets";
import { playArcadeEffect, startArcadeMusic, stopArcadeMusic } from "../game/audio/arcadeAudio";

const OVERLAY_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(circle at center, rgba(255,255,255,0.05), rgba(2,6,22,0.95) 65%)",
  padding: "24px",
  zIndex: 4,
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const CARD_STYLE: CSSProperties = {
  width: "min(520px, 100%)",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.4)",
  background: "rgba(5, 12, 28, 0.95)",
  padding: "28px 32px",
  boxShadow: "0 20px 45px rgba(1, 2, 10, 0.6)",
  color: "#fefefe",
  fontFamily: "'Share Tech Mono', 'Space Mono', Consolas, monospace",
  letterSpacing: "0.08em",
};

const HEADER_STYLE: CSSProperties = {
  marginBottom: "18px",
  fontSize: "1.05rem",
  textTransform: "uppercase",
};

const TITLE_STYLE: CSSProperties = {
  fontSize: "1.9rem",
  fontWeight: 700,
  marginBottom: "12px",
  color: "#ffd166",
};

const DESCRIPTION_STYLE: CSSProperties = {
  marginBottom: "18px",
  fontSize: "0.9rem",
  lineHeight: 1.4,
  color: "rgba(255,255,255,0.85)",
};

const INSTRUCTION_STYLE: CSSProperties = {
  marginBottom: "18px",
  paddingLeft: "16px",
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "12px",
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  flex: "1 1 160px",
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #f72585, #7209b7)",
  color: "white",
  fontSize: "0.95rem",
  fontWeight: 700,
  cursor: "pointer",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const FOOTER_STYLE: CSSProperties = {
  fontSize: "0.7rem",
  letterSpacing: "0.2em",
  color: "rgba(255,255,255,0.65)",
  textTransform: "uppercase",
};

const SECTION_LABEL_STYLE: CSSProperties = {
  marginBottom: "10px",
  fontSize: "0.74rem",
  color: "rgba(255,255,255,0.72)",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
};

const DIFFICULTY_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const META_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const PHASE_HEADLINE: Record<GamePhase, string> = {
  boot: "Powering up",
  ready: "Next level queued",
  running: "Action",
  paused: "Paused",
  "level-complete": "Zone cleared",
  "game-over": "Game over",
};

const PHASE_DESCRIPTION: Record<GamePhase, string> = {
  boot: "The cabinet is charging. Drop in to start the climb.",
  ready: "Scaffolds are set. Hit start to chase the next rung.",
  running: "Stay sharp, barrels keep coming.",
  paused: "Everything is frozen. Resume to keep the momentum.",
  "level-complete": "Scores locked in. Take a breath before the next jump.",
  "game-over": "Lives drained and the lights dimmed. Press start to fight for another run.",
};

const INSTRUCTIONS = [
  "Arrow keys or A/D for movement",
  "Space / W or Arrow Up to jump",
  "Press P or Esc to pause instantly",
];

export function GameMenu() {
  const { state, dispatch } = useGameStore();
  const selectedDifficulty = difficultyPresets[state.difficulty];

  useEffect(() => {
    if (state.phase === "running") {
      startArcadeMusic();
    } else {
      stopArcadeMusic();
    }

    return () => {
      if (state.phase !== "running") {
        stopArcadeMusic();
      }
    };
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "level-complete") {
      playArcadeEffect("levelComplete");
    } else if (state.phase === "game-over") {
      playArcadeEffect("lifeLost");
    }
  }, [state.phase]);

  if (state.phase === "running") {
    return null;
  }

  const handlePrimary = () => {
    if (state.phase === "paused") {
      playArcadeEffect("resume");
      dispatch({ type: "resume-run" });
    } else if (state.phase === "game-over") {
      playArcadeEffect("start");
      dispatch({ type: "restart-run", source: "game-over" });
    } else {
      playArcadeEffect("start");
      dispatch({ type: "start-run", source: state.phase });
    }

    trackCheckpoint("menu_primary_action", {
      phase: state.phase,
      difficulty: state.difficulty,
      sessionId: state.sessionId,
    });
  };

  const handleDifficultyChange = (difficulty: (typeof difficultyOrder)[number]) => {
    trackCheckpoint("menu_difficulty_change", {
      phase: state.phase,
      difficulty,
      sessionId: state.sessionId,
    });
    dispatch({ type: "set-difficulty", difficulty });
  };

  const isDifficultyLocked = state.phase !== "boot";

  const primaryLabel =
    state.phase === "paused"
      ? "Resume"
      : state.phase === "level-complete"
      ? "Next run"
      : state.phase === "game-over"
      ? "Restart"
      : state.phase === "boot"
      ? "Start game"
      : "Start run";

  const footerLabel =
    state.phase === "boot"
      ? "Keyboard and touch layouts are tuned for desktop, tablet, and mobile screens."
      : "Pick up the next ladder run with the same difficulty profile and live telemetry hooks.";

  return (
    <>
      <style>
        {`@keyframes gameMenuPulse {
            0% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(0,6px,0) scale(1.01); }
            100% { transform: translate3d(0,0,0) scale(1); }
          }`}
      </style>
      <div
        style={{
          ...OVERLAY_STYLE,
          animation: "gameMenuPulse 4.2s ease-in-out infinite",
          boxShadow: "inset 0 0 40px rgba(255,255,255,0.12)",
        }}
        aria-live="polite"
      >
        <div style={CARD_STYLE}>
          <div style={HEADER_STYLE}>{PHASE_HEADLINE[state.phase]}</div>
          <div style={TITLE_STYLE}>{state.phase === "boot" ? "Donkey Kong 3.2" : "Arcade Ladder"}</div>
          <p style={DESCRIPTION_STYLE}>{PHASE_DESCRIPTION[state.phase]}</p>
          <div style={SECTION_LABEL_STYLE}>Difficulty</div>
          <div style={DIFFICULTY_GRID_STYLE}>
            {difficultyOrder.map((difficulty) => {
              const preset = difficultyPresets[difficulty];
              const selected = difficulty === state.difficulty;

              return (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => handleDifficultyChange(difficulty)}
                  style={{
                    borderRadius: 14,
                    border: selected ? "1px solid #ffd166" : "1px solid rgba(255,255,255,0.16)",
                    padding: "12px",
                    background: selected ? "rgba(255,209,102,0.14)" : "rgba(255,255,255,0.04)",
                    color: "#fefefe",
                    textAlign: "left",
                    cursor: isDifficultyLocked ? "not-allowed" : "pointer",
                    opacity: isDifficultyLocked && !selected ? 0.58 : 1,
                  }}
                  aria-pressed={selected}
                  disabled={isDifficultyLocked}
                >
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: "4px" }}>{preset.label}</div>
                  <div style={{ fontSize: "0.68rem", lineHeight: 1.5, color: "rgba(255,255,255,0.74)" }}>
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={META_GRID_STYLE}>
            <div style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)" }}>
              <div style={SECTION_LABEL_STYLE}>Lives</div>
              <div style={{ fontSize: "1.2rem", color: "#ffd166" }}>{selectedDifficulty.startingLives}</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)" }}>
              <div style={SECTION_LABEL_STYLE}>Score Rate</div>
              <div style={{ fontSize: "1.2rem", color: "#ffd166" }}>{selectedDifficulty.scoreMultiplier.toFixed(1)}x</div>
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)" }}>
              <div style={SECTION_LABEL_STYLE}>Session</div>
              <div style={{ fontSize: "1.2rem", color: "#ffd166" }}>#{state.sessionId}</div>
            </div>
          </div>
          {isDifficultyLocked ? (
            <div style={{ marginBottom: "16px", fontSize: "0.68rem", color: "rgba(255,255,255,0.62)" }}>
              Difficulty locks after the run begins. Use Reset Lobby to switch profiles.
            </div>
          ) : null}
          <ul style={INSTRUCTION_STYLE}>
            {INSTRUCTIONS.map((item) => (
              <li key={item} style={{ marginBottom: "6px" }}>
                {item}
              </li>
            ))}
          </ul>
          <div style={BUTTON_ROW_STYLE}>
            <button type="button" style={PRIMARY_BUTTON_STYLE} onClick={handlePrimary}>
              {primaryLabel}
            </button>
            {state.phase !== "boot" ? (
              <button
                type="button"
                style={{
                  ...PRIMARY_BUTTON_STYLE,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18))",
                }}
                onClick={() => {
                  trackCheckpoint("menu_reset_lobby", {
                    phase: state.phase,
                    difficulty: state.difficulty,
                    sessionId: state.sessionId,
                  });
                  dispatch({ type: "reset-session" });
                }}
              >
                Reset Lobby
              </button>
            ) : null}
          </div>
          <div style={FOOTER_STYLE}>{footerLabel}</div>
        </div>
      </div>
    </>
  );
}
