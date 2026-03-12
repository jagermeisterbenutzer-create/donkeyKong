# donkeyKong

Project architecture is set up around React for UI composition and HTML5 Canvas for real-time gameplay rendering.

- Architecture notes: `docs/architecture.md`
- App shell entry point: `src/app/AppShell.tsx`
- Game state model: `src/state/gameStore.tsx`
- Shared domain types: `src/types/game.ts`
- Local start: `npm install && npm run dev`
- Production build: `npm run build`
- Auto deploy: `.github/workflows/deploy.yml` publishes to GitHub Pages on every push to `main`
