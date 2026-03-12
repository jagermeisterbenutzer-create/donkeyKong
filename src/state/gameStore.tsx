import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from "react";

import { difficultyPresets } from "../game/config/difficultyPresets";
import { trackDifficultySelected, trackPhaseChange, trackRunStarted } from "../game/analytics/gameAnalytics";
import { levelManifest } from "../game/levels/levelManifest";
import type { DifficultyName, GameSessionState, LevelProgress } from "../types/game";

type GameAction =
  | { type: "start-run"; source?: string }
  | { type: "restart-run"; source?: string }
  | { type: "pause-run" }
  | { type: "resume-run" }
  | { type: "add-score"; points: number }
  | { type: "complete-level" }
  | { type: "lose-life" }
  | { type: "set-difficulty"; difficulty: DifficultyName }
  | { type: "reset-session" };

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

const createFreshSessionState = (state: GameSessionState, nextPhase: GameSessionState["phase"], sessionId: number): GameSessionState => ({
  ...state,
  phase: nextPhase,
  currentLevelIndex: 0,
  totalScore: 0,
  lives: difficultyPresets[state.difficulty].startingLives,
  levels: createInitialLevels(),
  sessionId,
});

const initialState: GameSessionState = {
  phase: "boot",
  currentLevelIndex: 0,
  totalScore: 0,
  lives: difficultyPresets.normal.startingLives,
  levels: createInitialLevels(),
  difficulty: "normal",
  sessionId: 1,
};

const GameStoreContext = createContext<GameStoreValue | null>(null);

function gameReducer(state: GameSessionState, action: GameAction): GameSessionState {
  switch (action.type) {
    case "start-run":
      if (
        state.phase === "level-complete" &&
        state.currentLevelIndex === state.levels.length - 1 &&
        state.levels[state.currentLevelIndex]?.completed
      ) {
        return createFreshSessionState(state, "running", state.sessionId + 1);
      }

      return {
        ...state,
        phase: "running",
      };
    case "restart-run":
      return createFreshSessionState(state, "running", state.sessionId + 1);
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
    case "set-difficulty": {
      const nextLives = difficultyPresets[action.difficulty].startingLives;
      return {
        ...state,
        difficulty: action.difficulty,
        lives: state.phase === "boot" ? nextLives : state.lives,
      };
    }
    case "reset-session": {
      return createFreshSessionState(state, "boot", state.sessionId + 1);
    }
    default:
      return state;
  }
}

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const trackedDispatch = useCallback<Dispatch<GameAction>>(
    (action) => {
      switch (action.type) {
        case "set-difficulty":
          trackDifficultySelected(action.difficulty);
          break;
        case "start-run":
          trackRunStarted(
            state.phase === "level-complete" && state.currentLevelIndex === state.levels.length - 1
              ? state.sessionId + 1
              : state.sessionId,
            state.difficulty,
            action.source ?? state.phase,
          );
          break;
        case "restart-run":
          trackRunStarted(state.sessionId + 1, state.difficulty, action.source ?? state.phase);
          break;
        default:
          break;
      }

      dispatch(action);
    },
    [state],
  );

  useEffect(() => {
    trackPhaseChange(state.phase, state.difficulty, state.sessionId);
  }, [state.phase, state.difficulty, state.sessionId]);

  const value = useMemo(() => ({ state, dispatch: trackedDispatch }), [state, trackedDispatch]);

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
