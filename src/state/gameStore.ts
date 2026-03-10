import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";

import { levelManifest } from "../game/levels/levelManifest";
import type { GameSessionState, LevelProgress } from "../types/game";

type GameAction =
  | { type: "start-run" }
  | { type: "pause-run" }
  | { type: "resume-run" }
  | { type: "add-score"; points: number }
  | { type: "complete-level" }
  | { type: "lose-life" };

interface GameStoreValue {
  state: GameSessionState;
  dispatch: Dispatch<GameAction>;
}

const createInitialLevels = (): LevelProgress[] =>
  levelManifest.map((level) => ({
    levelId: level.id,
    score: 0,
    completed: false,
  }));

const initialState: GameSessionState = {
  phase: "boot",
  currentLevelIndex: 0,
  totalScore: 0,
  lives: 3,
  levels: createInitialLevels(),
};

const GameStoreContext = createContext<GameStoreValue | null>(null);

function gameReducer(state: GameSessionState, action: GameAction): GameSessionState {
  switch (action.type) {
    case "start-run":
      return { ...state, phase: "running" };
    case "pause-run":
      return { ...state, phase: "paused" };
    case "resume-run":
      return { ...state, phase: "running" };
    case "add-score": {
      const levels = state.levels.map((level, index) =>
        index === state.currentLevelIndex ? { ...level, score: level.score + action.points } : level,
      );

      return {
        ...state,
        totalScore: state.totalScore + action.points,
        levels,
      };
    }
    case "complete-level": {
      const levels = state.levels.map((level, index) =>
        index === state.currentLevelIndex ? { ...level, completed: true } : level,
      );
      const nextLevelIndex = Math.min(state.currentLevelIndex + 1, levels.length - 1);
      const phase = nextLevelIndex === state.currentLevelIndex ? "level-complete" : "ready";

      return {
        ...state,
        phase,
        currentLevelIndex: nextLevelIndex,
        levels,
      };
    }
    case "lose-life":
      return {
        ...state,
        lives: Math.max(0, state.lives - 1),
        phase: state.lives <= 1 ? "game-over" : "ready",
      };
    default:
      return state;
  }
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const context = useContext(GameStoreContext);

  if (!context) {
    throw new Error("useGameStore must be used within GameStoreProvider");
  }

  return context;
}

export function selectCurrentLevelScore(state: GameSessionState) {
  return state.levels[state.currentLevelIndex]?.score ?? 0;
}
