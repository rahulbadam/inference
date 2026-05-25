# Active Context: AI Inference Lab

## Current Work Focus
Repository has undergone a comprehensive enhancement sprint. All major improvements from the analysis have been implemented:

1. **Simulation Engine** — Extracted constants, added thermal throttling, pipeline parallelism bubble, batch-aware engine speedups
2. **Store Optimization** — Memoized metrics/costs/bottlenecks at store level; eliminated duplicate calculations across panels
3. **Performance** — Debounced sliders, removed Math.random from render, added seeded PRNG for throughput chart
4. **New Panels** — Token Generation Simulator, Deployment Recommendation Engine
5. **UX Features** — Undo/Redo (50-deep history), Export JSON, Shareable URLs, toast notifications
6. **Mobile** — Collapsible sidebar (64px icon-only on small screens, 240px on desktop)
7. **Testing** — Vitest unit tests for simulation engine
8. **Code Quality** — Deleted Tooltip.tsx (consolidated on InfoTip), fixed `any` casts, extracted SIMULATION_CONSTANTS

## Recent Changes
| Date | Change | Status |
|------|--------|--------|
| 2026-05-24 | Extracted simulation constants to `simulationConstants.ts` with JSDoc | Complete |
| 2026-05-24 | Added thermal throttling + pipeline bubble to simulation | Complete |
| 2026-05-24 | Memoized metrics/costs/bottlenecks in Zustand store | Complete |
| 2026-05-24 | Added undo/redo with 50-entry history | Complete |
| 2026-05-24 | Added Token Generation Simulator panel | Complete |
| 2026-05-24 | Added Deployment Recommendation panel | Complete |
| 2026-05-24 | Added Export JSON + Shareable Link to Comparison panel | Complete |
| 2026-05-24 | Debounced all range sliders (100ms delay) | Complete |
| 2026-05-24 | Removed Math.random, replaced with seeded PRNG | Complete |
| 2026-05-24 | Consolidated Tooltip into InfoTip, deleted Tooltip.tsx | Complete |
| 2026-05-24 | Mobile-responsive sidebar (icon-only narrow mode) | Complete |
| 2026-05-24 | Added vitest + simulation.test.ts with 15 tests | Complete |
| 2026-05-24 | Build passes cleanly (TypeScript + Vite) | Complete |

## Next Steps (Potential)
### High Priority
- None — all planned improvements implemented

### Medium Priority
- [ ] Dynamic imports for code-splitting (reduce bundle size from 861KB)
- [ ] Add more GPU models (L40S, B200, MI325X)
- [ ] Add benchmark presets (MMLU, HumanEval throughput targets)

### Low Priority
- [ ] Add light theme variant
- [ ] Add keyboard shortcuts for navigation
- [ ] Web Worker for simulation engine

## Open Questions
None currently.

## Blockers
None currently.

## Important Notes for Agents
- **Never run `yarn re:clean`** or any command that deletes build artifacts blindly
- Use `npm run build` to verify TypeScript before committing
- The dev server runs on port 5173 (or 5174 if occupied)
- All components use functional React + hooks; no class components
- Tailwind v4 uses `@import "tailwindcss"` not `@tailwind` directives
- Test files are excluded from tsc build via `tsconfig.app.json`
- Zustand store now contains memoized derived values (metrics, costs, bottlenecks)
- Undo/redo history is limited to 50 entries and persists only in memory (not localStorage)
- Shareable URLs encode config via base64 query param (`?config=...`)