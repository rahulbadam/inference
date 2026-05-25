# Tech Context: AI Inference Lab

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 6.x | Type safety |
| Vite | 8.x | Build tool / dev server |
| Tailwind CSS | 4.x | Utility-first CSS |
| Framer Motion | 12.x | Animations |
| Recharts | 2.x | Charts |
| Zustand | 5.x | State management |
| Lucide React | 0.x | Icons |

### Build & Deploy
| Tool | Purpose |
|------|---------|
| Vite | Bundling, HMR, dev server |
| TypeScript | Compile-time type checking |
| ESLint | Code linting |
| Vercel | Hosting & CI/CD |

### Optional Future Additions
- Python microservice for heavier inference calculations
- PostgreSQL for saved user sessions (if backend added)

## Architecture

### Directory Structure
```
client/
├── src/
│   ├── App.tsx              # Root layout with sidebar + main content
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles, Tailwind directives, CSS vars
│   ├── types/
│   │   └── index.ts         # All TypeScript interfaces
│   ├── store/
│   │   └── useStore.ts      # Zustand store + localStorage persistence
│   ├── lib/
│   │   └── simulation.ts    # Core calculation engine
│   ├── data/
│   │   ├── constants.ts     # GPU specs, model presets, pricing data
│   │   └── tooltips.ts      # 50+ AI term definitions
│   └── components/
│       ├── InfoTip.tsx      # Smart positioned tooltip with portal
│       ├── Tooltip.tsx      # Legacy simple tooltip
│       ├── Sidebar.tsx      # Navigation sidebar
│       ├── PresetBar.tsx    # Scenario preset buttons
│       ├── LiveMetricsBar.tsx # Top bar with live KPIs
│       └── panels/          # 13 dashboard modules
│           ├── ModelConfigPanel.tsx
│           ├── HardwareConfigPanel.tsx
│           ├── EngineConfigPanel.tsx
│           ├── PerformancePanel.tsx
│           ├── CostPanel.tsx
│           ├── BottleneckPanel.tsx
│           ├── MemoryPanel.tsx
│           ├── ComparisonPanel.tsx
│           ├── LearningPanel.tsx
│           └── ArchitecturePanel.tsx
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## Key Design Patterns

### State Management
- **Zustand** singleton store with `useStore.subscribe()` for localStorage persistence
- Actions directly mutate nested state (model/hardware/engine)
- Computed values (metrics/costs/bottlenecks) derived via `useMemo` in components

### Simulation Engine
- Pure functions: `calculatePerformanceMetrics()`, `calculateCostEstimation()`, `analyzeBottlenecks()`
- Input: `SimulationConfig` → Output: `PerformanceMetrics | CostEstimation | Bottleneck[]`
- Physics-based approximations using GPU specs, memory bandwidth, FLOPS

### Component Architecture
- Each panel is self-contained with its own data fetching (from store)
- Shared `InfoTip` component for contextual help everywhere
- Glassmorphism card pattern via `.glass-panel` utility class

### Styling Strategy
- Tailwind v4 with `@import "tailwindcss"` in index.css
- Custom CSS variables for theme tokens (colors, surfaces, borders)
- `@theme` block defines custom colors mapped to CSS variables
- Dark theme only — no light mode

## Data Flow
```
User Interaction
    ↓
Zustand Store (config mutated)
    ↓
Component re-renders
    ↓
useMemo calls simulation functions
    ↓
Charts + metrics update
    ↓
localStorage auto-saved via subscribe
```

## External Dependencies
No external APIs. All data is static (GPU specs, pricing, model presets) baked into the bundle.