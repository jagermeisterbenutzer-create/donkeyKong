# Architecture

## Chosen stack

- UI layer: React with TypeScript.
- Rendering layer: HTML5 Canvas driven by `requestAnimationFrame`.
- Game logic: plain TypeScript systems organized by domain.
- State management: reducer-based local store with React context for session access.

This keeps HUD and menus declarative in React while moving frame-sensitive drawing and collision work into Canvas, which is the safest minimal architecture for an arcade platformer.

## Folder structure

```text
src/
  app/
    AppShell.tsx           # React composition root
  components/
    Hud.tsx                # Score, lives, level UI
  game/
    core/
      gameLoop.ts          # Frame timing contract
    levels/
      levelManifest.ts     # Level metadata and ordering
    rendering/
      CanvasStage.tsx      # Canvas mount + render surface
    systems/
      scoring.ts           # Score calculation helpers
  state/
    gameStore.tsx          # Reducer, actions, selectors
  types/
    game.ts                # Shared game and level types
```

## State management

- Use a reducer-backed store for level progression, score, lives, and run status.
- Keep difficulty selection in session state so menus, HUD, analytics, and engine tuning stay aligned.
- Expose the store through React context so UI components can read selectors without pushing gameplay state into props.
- Keep frame-by-frame transient data out of React state; the Canvas loop reads the latest store snapshot and mutates only per-frame engine objects.
- Track level configuration separately from run state:
  - `LevelDefinition` describes static layout, hazards, and completion goals.
  - `GameSessionState` tracks current level index, total score, per-level score, lives, and phase.

This avoids unnecessary re-renders and keeps scoring and level transitions predictable.

## Performance targets

- Target 60 FPS on modern desktop browsers during normal gameplay.
- Keep average frame time under 16.7 ms and avoid spikes above 24 ms during common scenes.
- Limit React re-renders to UI events and state transitions; gameplay frames should render on Canvas only.
- Reuse Canvas draw buffers and level metadata objects to minimize garbage collection churn.
- Load level data up front and keep individual level definitions lightweight enough to switch levels without visible hitching.

## Targeted scope

- Primary browsers: current Chrome, Edge, Firefox, and Safari releases.
- Primary devices: modern desktop/laptop screens plus recent iOS and Android touch devices in portrait and landscape.
- Instrument gameplay with `window` `CustomEvent` telemetry and optional `dataLayer` pushes so QA can verify starts, resets, difficulty changes, completions, and sampled frame metrics.
