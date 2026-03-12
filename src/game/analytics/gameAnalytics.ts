import type { DifficultyName, GamePhase } from "../../types/game";

type AnalyticsDetail = Record<string, number | string | boolean | null | undefined>;

interface EmitOptions {
  sampleRate?: number;
}

declare global {
  interface WindowEventMap {
    "donkeykong:analytics": CustomEvent<AnalyticsDetail & { event: string }>;
  }
}

function shouldSample(sampleRate = 1) {
  if (sampleRate >= 1) {
    return true;
  }

  return Math.random() <= sampleRate;
}

export function emitGameEvent(event: string, detail: AnalyticsDetail, options?: EmitOptions) {
  if (typeof window === "undefined" || !shouldSample(options?.sampleRate)) {
    return;
  }

  const payload = { event, ...detail };

  window.dispatchEvent(new CustomEvent("donkeykong:analytics", { detail: payload }));

  const globalWithLayer = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  globalWithLayer.dataLayer?.push(payload);
}

export function trackPhaseChange(phase: GamePhase, difficulty: DifficultyName, sessionId: number) {
  emitGameEvent("phase_change", { phase, difficulty, sessionId });
}

export function trackDifficultySelected(difficulty: DifficultyName) {
  emitGameEvent("difficulty_selected", { difficulty });
}

export function trackRunStarted(sessionId: number, difficulty: DifficultyName, source: string) {
  emitGameEvent("run_started", { sessionId, difficulty, source });
}

export function trackCheckpoint(eventName: string, detail: AnalyticsDetail) {
  emitGameEvent(eventName, detail);
}

export function trackPerformanceMetric(metric: string, value: number, difficulty: DifficultyName, sessionId: number) {
  emitGameEvent(
    "performance_metric",
    {
      metric,
      value: Number(value.toFixed(2)),
      difficulty,
      sessionId,
    },
    { sampleRate: 0.35 },
  );
}
