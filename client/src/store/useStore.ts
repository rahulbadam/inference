import { create } from "zustand";
import type { SimulationConfig, TabId, ComparisonConfig, ModelConfig, HardwareConfig, EngineConfig } from "../types";
import { GPU_SPECS, MODEL_PRESETS } from "../data/constants";
import { calculatePerformanceMetrics, calculateCostEstimation, analyzeBottlenecks } from "../lib/simulation";

const STORAGE_KEY = "inference-lab-state-v1";

interface PersistedState {
  config: SimulationConfig;
  activeTab: TabId;
  comparisons: ComparisonConfig[];
  learnMode: boolean;
  showArchitecture: boolean;
}

interface StoreState extends PersistedState {
  // Memoized computed values
  metrics: ReturnType<typeof calculatePerformanceMetrics>;
  costs: ReturnType<typeof calculateCostEstimation>;
  bottlenecks: ReturnType<typeof analyzeBottlenecks>;

  // History for undo/redo
  history: PersistedState[];
  historyIndex: number;

  // Actions
  updateModel: (partial: Partial<ModelConfig>) => void;
  updateHardware: (partial: Partial<HardwareConfig>) => void;
  updateEngine: (partial: Partial<EngineConfig>) => void;
  updateSimulation: (partial: Partial<Omit<SimulationConfig, "model" | "hardware" | "engine">>) => void;
  setActiveTab: (tab: TabId) => void;
  addComparison: (name: string) => void;
  removeComparison: (id: string) => void;
  loadPreset: (preset: Partial<SimulationConfig>) => void;
  toggleLearnMode: () => void;
  toggleArchitecture: () => void;
  resetToDefaults: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const defaultModel: ModelConfig = {
  name: "Llama-3",
  type: "dense",
  parameters: 8,
  contextWindow: 8192,
  hiddenSize: 4096,
  attentionHeads: 32,
  kvHeads: 8,
  layerCount: 32,
  embeddingSize: 4096,
  precision: "fp16",
  vocabSize: 128256,
};

const defaultHardware: HardwareConfig = {
  vendor: "nvidia",
  gpuModel: "RTX-4090",
  gpuCount: 1,
  vramPerGpu: 24,
  memoryBandwidth: 1008,
  hasTensorCores: true,
  cpuCores: 16,
  cpuThreads: 32,
  cpuClockSpeed: 4.5,
  ramSize: 64,
  storageType: "nvme",
  pcieGen: 4,
  nvlink: false,
  infiniband: false,
  powerConsumption: 450,
  region: "onprem",
};

const defaultEngine: EngineConfig = {
  engine: "vLLM",
  servingMethod: "single_gpu",
  scheduling: "continuous_batching",
  kvCacheStrategy: "paged_attention",
  decoding: "greedy",
  streaming: true,
};

const defaultConfig: SimulationConfig = {
  model: defaultModel,
  hardware: defaultHardware,
  engine: defaultEngine,
  batchSize: 1,
  inputTokens: 512,
  outputTokens: 256,
  concurrentUsers: 1,
};

const defaults: PersistedState = {
  config: defaultConfig,
  activeTab: "model",
  comparisons: [],
  learnMode: true,
  showArchitecture: false,
};

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      config: parsed.config ? { ...defaultConfig, ...parsed.config } : defaultConfig,
      activeTab: parsed.activeTab ?? "model",
      comparisons: parsed.comparisons ?? [],
      learnMode: parsed.learnMode ?? true,
      showArchitecture: parsed.showArchitecture ?? false,
    };
  } catch {
    return null;
  }
}

function loadSharedConfig(): SimulationConfig | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("config");
    if (!encoded) return null;
    const decoded = JSON.parse(atob(encoded)) as Partial<SimulationConfig>;
    return { ...defaultConfig, ...decoded };
  } catch {
    return null;
  }
}

function pickPersisted(state: StoreState): PersistedState {
  return {
    config: state.config,
    activeTab: state.activeTab,
    comparisons: state.comparisons,
    learnMode: state.learnMode,
    showArchitecture: state.showArchitecture,
  };
}

function computeDerived(config: SimulationConfig) {
  return {
    metrics: calculatePerformanceMetrics(config),
    costs: calculateCostEstimation(config),
    bottlenecks: analyzeBottlenecks(config),
  };
}

// Hydrate from localStorage or shared URL
const sharedConfig = loadSharedConfig();
const persisted = loadPersisted();
const initialPersisted: PersistedState = sharedConfig
  ? { ...defaults, config: sharedConfig }
  : persisted
  ? { ...persisted }
  : { ...defaults };
const initialDerived = computeDerived(initialPersisted.config);

export const useStore = create<StoreState>((set, get) => ({
  ...initialPersisted,
  ...initialDerived,
  history: [initialPersisted],
  historyIndex: 0,

  updateModel: (partial) =>
    set((state) => {
      const newModel = { ...state.config.model, ...partial };
      if (partial.name && MODEL_PRESETS[partial.name]) {
        const preset = MODEL_PRESETS[partial.name];
        Object.assign(newModel, {
          parameters: preset.parameters,
          hiddenSize: preset.hiddenSize,
          attentionHeads: preset.attentionHeads,
          kvHeads: preset.kvHeads,
          layerCount: preset.layerCount,
          embeddingSize: preset.embeddingSize,
          vocabSize: preset.vocabSize,
          type: preset.type,
          contextWindow: preset.defaultContext,
        });
      }
      const newConfig = { ...state.config, model: newModel };
      return pushHistory(state, { config: newConfig, ...computeDerived(newConfig) });
    }),

  updateHardware: (partial) =>
    set((state) => {
      const newHardware = { ...state.config.hardware, ...partial };
      if (partial.gpuModel && GPU_SPECS[partial.gpuModel]) {
        const spec = GPU_SPECS[partial.gpuModel];
        newHardware.vramPerGpu = spec.vram;
        newHardware.memoryBandwidth = spec.bandwidth;
        newHardware.hasTensorCores = spec.tensorCores;
        newHardware.powerConsumption = spec.power;
        newHardware.pcieGen = spec.pcieGen;
        newHardware.nvlink = spec.nvlink;
        if (["T4", "L4", "A10", "A100-40GB", "A100-80GB", "H100-80GB", "H200-141GB", "RTX-4090", "RTX-5090"].includes(partial.gpuModel)) {
          newHardware.vendor = "nvidia";
        } else if (partial.gpuModel === "MI300X") {
          newHardware.vendor = "amd";
        } else {
          newHardware.vendor = "apple";
        }
      }
      const newConfig = { ...state.config, hardware: newHardware };
      return pushHistory(state, { config: newConfig, ...computeDerived(newConfig) });
    }),

  updateEngine: (partial) =>
    set((state) => {
      const newConfig = { ...state.config, engine: { ...state.config.engine, ...partial } };
      return pushHistory(state, { config: newConfig, ...computeDerived(newConfig) });
    }),

  updateSimulation: (partial) =>
    set((state) => {
      const newConfig = { ...state.config, ...partial };
      return pushHistory(state, { config: newConfig, ...computeDerived(newConfig) });
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  addComparison: (name) => {
    const state = get();
    const newComparison: ComparisonConfig = {
      id: crypto.randomUUID(),
      name,
      config: JSON.parse(JSON.stringify(state.config)),
      metrics: state.metrics,
      costs: state.costs,
      bottlenecks: state.bottlenecks,
    };
    set((s) => ({ comparisons: [...s.comparisons.slice(-3), newComparison] }));
  },

  removeComparison: (id) =>
    set((state) => ({
      comparisons: state.comparisons.filter((c) => c.id !== id),
    })),

  loadPreset: (preset) =>
    set((state) => {
      const newConfig = {
        model: { ...state.config.model, ...preset.model },
        hardware: { ...state.config.hardware, ...preset.hardware },
        engine: { ...state.config.engine, ...preset.engine },
        batchSize: preset.batchSize ?? state.config.batchSize,
        inputTokens: preset.inputTokens ?? state.config.inputTokens,
        outputTokens: preset.outputTokens ?? state.config.outputTokens,
        concurrentUsers: preset.concurrentUsers ?? state.config.concurrentUsers,
      };
      return pushHistory(state, { config: newConfig, ...computeDerived(newConfig) });
    }),

  toggleLearnMode: () => set((state) => ({ learnMode: !state.learnMode })),
  toggleArchitecture: () => set((state) => ({ showArchitecture: !state.showArchitecture })),
  resetToDefaults: () => set(pushHistory(get(), { ...defaults, ...computeDerived(defaults.config) })),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const prev = state.history[newIndex];
      return {
        ...prev,
        ...computeDerived(prev.config),
        history: state.history,
        historyIndex: newIndex,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const next = state.history[newIndex];
      return {
        ...next,
        ...computeDerived(next.config),
        history: state.history,
        historyIndex: newIndex,
      };
    }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));

function pushHistory(state: StoreState, update: Partial<StoreState>): Partial<StoreState> {
  // Don't push if config is identical to current
  const currentConfigStr = JSON.stringify(state.config);
  const newConfigStr = JSON.stringify(update.config);
  if (currentConfigStr === newConfigStr) return update;

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  const persistedSlice = pickPersisted({ ...state, ...update } as StoreState);
  newHistory.push(persistedSlice);

  // Limit history to 50 entries
  if (newHistory.length > 50) {
    newHistory.shift();
  }

  return {
    ...update,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

// Subscribe after create to persist all state changes to localStorage
useStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersisted(state)));
  } catch {
    // Ignore quota exceeded errors
  }
});