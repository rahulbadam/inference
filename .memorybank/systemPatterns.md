# System Patterns: AI Inference Lab

## State Management Pattern

### Zustand Store + localStorage Persistence
```typescript
// Store definition
export const useStore = create<StoreState>((set, get) => ({
  ...initialState,  // Hydrated from localStorage
  // Actions that mutate state
}));

// Persistence subscription (outside create)
useStore.subscribe((state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersisted(state)));
});
```

**Why this pattern:**
- Zustand is lighter than Redux for a single-page app
- `subscribe` outside `create` avoids initialization order issues
- `pickPersisted` selects only serializable state (excludes methods)
- Schema migration handled in `loadPersisted()` via spread-merge with defaults

---

## Simulation Engine Pattern

### Pure Function Calculators
All simulation logic lives in `lib/simulation.ts` as pure functions:

```typescript
// Input: full configuration
// Output: derived metrics
export function calculatePerformanceMetrics(config: SimulationConfig): PerformanceMetrics
export function calculateCostEstimation(config: SimulationConfig): CostEstimation
export function analyzeBottlenecks(config: SimulationConfig): Bottleneck[]
export function calculateMemoryBreakdown(config: SimulationConfig): MemoryBreakdown
```

**Why this pattern:**
- Easy to unit test (pure functions)
- Can be extracted to Web Worker or backend later
- Components derive values via `useMemo` for caching
- No React dependency in simulation logic

---

## Component Data Pattern

### Store-Connected Panels
Each panel reads from Zustand and derives computed values:

```typescript
const config = useStore((s) => s.config);
const metrics = useMemo(() => calculatePerformanceMetrics(config), [config]);
```

**Why this pattern:**
- Minimal re-renders (Zustand selectors)
- Computed values cached via `useMemo`
- Easy to add new panels without touching existing ones

---

## Tooltip Pattern

### Portal-Based Smart Positioning
```typescript
// InfoTip component uses ReactDOM.createPortal
// Positions tooltip based on viewport space (bottom/top/left/right)
// Arrow rotates to point toward trigger element
// 150ms hover delay prevents accidental triggers
```

**Why this pattern:**
- Portals escape z-index stacking context of parent
- Smart positioning prevents tooltips from going off-screen
- Framer Motion handles enter/exit animations
- Unified tooltip dictionary (constants.ts + tooltips.ts)

---

## Styling Pattern

### Tailwind v4 + CSS Variables
```css
/* index.css */
@import "tailwindcss";

@theme {
  --color-accent-cyan: var(--color-accent-cyan);
  /* ... maps to CSS variables */
}

:root {
  --color-accent-cyan: #22d3ee;
  /* ... actual values */
}
```

**Why this pattern:**
- Tailwind v4 uses `@import "tailwindcss"` (no config file needed)
- CSS variables enable runtime theme switching (if ever needed)
- Consistent design tokens across all components
- Glassmorphism via `backdrop-blur` + semi-transparent backgrounds

---

## Panel Layout Pattern

### Glass Cards in Grid
```tsx
<section className="glass-panel p-5">
  <h3>Panel Title</h3>
  {/* Content */}
</section>
```

**Why this pattern:**
- `.glass-panel` utility provides consistent card styling
- Grid layouts adapt responsively (`grid-cols-1 lg:grid-cols-2`)
- Padding and spacing standardized across all panels
- Border colors indicate state (glow-cyan for selected, accent colors for severity)

---

## Preset System Pattern

### Static Data + State Merge
```typescript
// Constants define presets
const PRESETS = {
  "chatgpt_scale": { model: {...}, hardware: {...}, engine: {...} }
};

// Action merges preset into current state
loadPreset: (preset) => set((state) => ({
  config: { ...state.config, ...preset }
}));
```

**Why this pattern:**
- Presets are static JSON (no backend needed)
- Merging preserves user modifications to non-preset fields
- Easy to add new presets by extending constants

---

## Bottleneck Detection Pattern

### Threshold-Based Analysis with Root Causes
```typescript
if (metrics.memoryUsed > totalVRAM * 0.95) {
  bottlenecks.push({
    type: "vram",
    severity: "critical",
    message: "...",
    suggestion: "...",
    rootCauses: [
      { parameter: "Model Size", currentValue: "...", threshold: "...", impact: "..." }
    ]
  });
}
```

**Why this pattern:**
- Each bottleneck type has specific threshold logic
- Root causes link back to exact parameters user can change
- Severity levels (critical/warning/info) drive UI styling
- Suggestions are actionable and specific

---

## File Organization Conventions

### By Concern, Not by Type
```
src/
├── data/        # Static data (constants, tooltips)
├── lib/         # Pure logic (simulation engine)
├── store/       # State management
├── types/       # TypeScript definitions
└── components/  # UI components (flat, not nested deeply)
```

**Why this pattern:**
- Easy to find related code (data lives with data)
- Simulation engine isolated from React
- Types are centralized for consistency