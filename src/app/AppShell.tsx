import { Hud } from "../components/Hud";
import { levelManifest } from "../game/levels/levelManifest";
import { CanvasStage } from "../game/rendering/CanvasStage";
import { GameStoreProvider, selectCurrentLevelScore, useGameStore } from "../state/gameStore";

function AppContent() {
  const { state } = useGameStore();
  const currentLevel = levelManifest[state.currentLevelIndex];

  return (
    <main>
      <Hud
        score={selectCurrentLevelScore(state)}
        lives={state.lives}
        levelName={currentLevel?.name ?? "Complete"}
      />
      <CanvasStage />
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
