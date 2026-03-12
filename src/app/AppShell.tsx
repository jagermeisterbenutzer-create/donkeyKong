import { Hud } from "../components/Hud";
import { GameMenu } from "../components/GameMenu";
import { levelManifest } from "../game/levels/levelManifest";
import { CanvasStage } from "../game/rendering/CanvasStage";
import { GameStoreProvider, selectCurrentLevelScore, useGameStore } from "../state/gameStore";

const MAIN_STYLE = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  boxSizing: "border-box",
  padding: "clamp(16px, 3vw, 32px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "clamp(16px, 2vw, 22px)",
  background:
    "radial-gradient(circle at top, rgba(255,214,102,0.14), transparent 24%), radial-gradient(circle at 20% 20%, rgba(255,94,98,0.16), transparent 28%), linear-gradient(180deg, #111b32, #050914 70%)",
} as const;

const STAGE_WRAPPER_STYLE = {
  width: "min(100%, 1000px)",
  boxSizing: "border-box",
  borderRadius: 28,
  padding: "clamp(10px, 1.8vw, 14px)",
  background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(7,9,20,0.9))",
  boxShadow: "0 30px 70px rgba(1,2,10,0.7)",
} as const;

function AppContent() {
  const { state } = useGameStore();
  const currentLevel = levelManifest[state.currentLevelIndex];

  return (
    <main style={MAIN_STYLE}>
      <Hud
        score={selectCurrentLevelScore(state)}
        totalScore={state.totalScore}
        lives={state.lives}
        levelName={currentLevel?.name ?? "Complete"}
        phase={state.phase}
        difficulty={state.difficulty}
        bonusThreshold={currentLevel?.bonusThreshold}
      />
      <div style={STAGE_WRAPPER_STYLE}>
        <CanvasStage />
      </div>
      <GameMenu />
    </main>
  );
}

export function AppShell() {
  return (
    <GameStoreProvider>
      <AppContent />
    </GameStoreProvider>
  );
}
