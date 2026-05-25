# Decision Log: AI Inference Lab

## ADR-001: Vite + React + TypeScript for Frontend
**Date**: 2026-05-23  
**Decision**: Use Vite with React 19 and TypeScript 6.x  
**Context**: Need fast dev server, modern React features, and type safety  
**Alternatives**: Next.js (overkill for SPA), Create React App (deprecated), Parcel  
**Consequences**: Fast HMR, small bundle, no SSR complexity  

## ADR-002: Tailwind CSS v4 for Styling
**Date**: 2026-05-23  
**Decision**: Use Tailwind CSS v4 with `@tailwindcss/vite` plugin  
**Context**: Need rapid UI development with consistent design tokens  
**Alternatives**: Styled-components, CSS Modules, plain CSS  
**Consequences**: No separate tailwind.config.js needed, CSS-first configuration, all styles in index.css  

## ADR-003: Zustand over Redux Toolkit
**Date**: 2026-05-23  
**Decision**: Use Zustand for state management  
**Context**: Lightweight state needs for a single-page dashboard  
**Alternatives**: Redux Toolkit, Jotai, React Context  
**Consequences**: Less boilerplate, easy localStorage persistence via subscribe, minimal learning curve  

## ADR-004: Client-Side Simulation Only
**Date**: 2026-05-23  
**Decision**: Run all calculations in-browser, no backend API  
**Context**: This is an educational simulation tool, not a real inference service  
**Alternatives**: Python FastAPI backend, serverless functions  
**Consequences**: Zero hosting cost for compute, instant response, simpler architecture. Tradeoff: can't run actual models  

## ADR-005: Recharts for Data Visualization
**Date**: 2026-05-23  
**Decision**: Use Recharts for all charts  
**Context**: Need bar charts, pie charts, area charts, and donut charts  
**Alternatives**: D3.js (too low-level), Chart.js (less React-native), Victory  
**Consequences**: Declarative React API, responsive containers, good enough for dashboard needs  

## ADR-006: Portal-Based Tooltips
**Date**: 2026-05-23  
**Decision**: Render tooltips via ReactDOM.createPortal with smart positioning  
**Context**: Tooltips were appearing behind parent elements due to z-index stacking  
**Alternatives**: CSS-only tooltips, floating-ui library  
**Consequences**: Tooltips always on top, smart positioning prevents off-screen rendering, more code to maintain  

## ADR-007: localStorage for Persistence
**Date**: 2026-05-23  
**Decision**: Persist state to localStorage with schema versioning  
**Context**: Users want configurations to survive page refreshes  
**Alternatives**: IndexedDB (overkill), backend database (requires auth), sessionStorage  
**Consequences**: Free, works offline, survives refreshes. Limit: ~5MB storage, no cross-device sync  

## ADR-008: Flat Component Structure
**Date**: 2026-05-23  
**Decision**: Keep components mostly flat, group panels under `panels/`  
**Context**: Avoid deeply nested directory trees that make files hard to find  
**Alternatives**: Feature-based folders (model/, hardware/, engine/)  
**Consequences**: All shared components at root level, panel components in one folder. Easy to locate files  

## ADR-009: Pure Function Simulation Engine
**Date**: 2026-05-23  
**Decision**: Isolate all calculation logic in `lib/simulation.ts` as pure functions  
**Context**: Need testable, reusable calculation logic independent of React  
**Alternatives**: Class-based calculator, hooks-based calculations  
**Consequences**: Easy to unit test, can extract to Web Worker or backend later, no React dependency  

## ADR-010: No Light Theme
**Date**: 2026-05-23  
**Decision**: Support dark theme only  
**Context**: AI infrastructure dashboards (NVIDIA, Datadog) are predominantly dark  
**Alternatives**: Dual theme support with toggle  
**Consequences**: Half the CSS to maintain, consistent with industry aesthetic. Can add light theme later if needed

## ADR-011: Centralized Derived State in Zustand Store
**Date**: 2026-05-24  
**Decision**: Compute metrics/costs/bottlenecks inside the store, not in individual components  
**Context**: Every panel was independently calling `calculatePerformanceMetrics` via `useMemo`, causing 4+ redundant calculations per config change  
**Alternatives**: Keep `useMemo` in each panel, use Zustand `derive` middleware, use React Context with memoized selectors  
**Consequences**: Single source of truth for derived values. Components read `s.metrics` directly. Easier to test, no stale data. Tradeoff: store file is slightly larger

## ADR-012: Client-Side Undo/Redo Stack
**Date**: 2026-05-24  
**Decision**: Maintain an in-memory history array inside Zustand (not localStorage)  
**Context**: Users accidentally change configs and want to revert. Browser back button doesn't work for in-app state  
**Alternatives**: localStorage-backed history (would grow unbounded), browser undo events, immer patches  
**Consequences**: 50-entry limit prevents memory leaks. Not persisted across sessions by design (avoids resurrecting bad configs). Works with all state mutations

## ADR-013: Seeded PRNG for Deterministic Visualizations
**Date**: 2026-05-24  
**Decision**: Replace `Math.random()` in charts with a seeded pseudo-random function  
**Context**: The throughput area chart regenerated random noise on every render, causing visual jitter and unnecessary re-renders  
**Alternatives**: memoize random data once with `useMemo`, use a fixed noise array  
**Consequences**: Same visual variety but deterministic per throughput value. No extra hooks needed. Predictable in tests

## ADR-014: Shareable Config via URL
**Date**: 2026-05-24  
**Decision**: Encode full config as base64 in query parameter (`?config=...`)  
**Context**: Users want to share specific configurations without screenshots or manual instructions  
**Alternatives**: Short-link backend service, JSON in URL fragment, server-side persistence with share IDs  
**Consequences**: Zero backend needed. URLs are long (~2KB) but work universally. Base64 handles special chars safely. Config is decoded on initial load before localStorage hydration
