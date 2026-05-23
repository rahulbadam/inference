import { create } from "zustand";
import type { SimulationConfig, TabId, ComparisonConfig, ModelConfig, HardwareConfig, EngineConfig } from "../types";
import { GPU_SPECS, MODEL_PRESETS } from "../data/constants";
import { calculatePerformanceMetrics, calculateCostEstimation, analyzeBottlenecks } from "../lib/simulation";

interface StoreState {
  config: SimulationConfig;
  activeTab: TabId;
  comparisons: ComparisonConfig[];
  learnMode: boolean;
  showArchitecture: boolean;
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

export const useStore = create<StoreState>((set, get) => ({
  config: {
    model: defaultModel,
    hardware: defaultHardware,
    engine: defaultEngine,
    batchSize: 1,
    inputTokens: 512,
    outputTokens: 256,
    concurrentUsers: 1,
  },
  activeTab: "model",
  comparisons: [],
  learnMode: true,
  showArchitecture: false,

  updateModel: (partial) =>
    set((state) => {
      const newModel = { ...state.config.model, ...partial };
      // Auto-update related fields based on preset
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
      return { config: { ...state.config, model: newModel } };
    }),

  updateHardware: (partial) =>
    set((state) => {
      const newHardware = { ...state.config.hardware, ...partial };
      // Auto-update GPU specs
      if (partial.gpuModel && GPU_SPECS[partial.gpuModel]) {
        const spec = GPU_SPECS[partial.gpuModel];
        newHardware.vramPerGpu = spec.vram;
        newHardware.memoryBandwidth = spec.bandwidth;
        newHardware.hasTensorCores = spec.tensorCores;
        newHardware.powerConsumption = spec.power;
        newHardware.pcieGen = spec.pcieGen;
        newHardware.nvlink = spec.nvlink;
        // Infer vendor
        if (["T4", "L4", "A10", "A100-40GB", "A100-80GB", "H100-80GB", "H200-141GB", "RTX-4090", "RTX-5090"].includes(partial.gpuModel)) {
          newHardware.vendor = "nvidia";
        } else if (partial.gpuModel === "MI300X") {
          newHardware.vendor = "amd";
        } else {
          newHardware.vendor = "apple";
        }
      }
      return { config: { ...state.config, hardware: newHardware } };
    }),

  updateEngine: (partial) =>
    set((state) => ({
      config: { ...state.config, engine: { ...state.config.engine, ...partial } },
    })),

  updateSimulation: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  addComparison: (name) => {
    const state = get();
    const metrics = calculatePerformanceMetrics(state.config);
    const costs = calculateCostEstimation(state.config);
    const bottlenecks = analyzeBottlenecks(state.config);
    const newComparison: ComparisonConfig = {
      id: crypto.randomUUID(),
      name,
      config: JSON.parse(JSON.stringify(state.config)),
      metrics,
      costs,
      bottlenecks,
    };
    set((s) => ({ comparisons: [...s.comparisons.slice(-3), newComparison] }));
  },

  removeComparison: (id) =>
    set((state) => ({
      comparisons: state.comparisons.filter((c) => c.id !== id),
    })),

  loadPreset: (preset) =>
    set((state) => ({
      config: {
        model: { ...state.config.model, ...preset.model },
        hardware: { ...state.config.hardware, ...preset.hardware },
        engine: { ...state.config.engine, ...preset.engine },
        batchSize: preset.batchSize ?? state.config.batchSize,
        inputTokens: preset.inputTokens ?? state.config.inputTokens,
        outputTokens: preset.outputTokens ?? state.config.outputTokens,
        concurrentUsers: preset.concurrentUsers ?? state.config.concurrentUsers,
      },
    })),

  toggleLearnMode: () => set((state) => ({ learnMode: !state.learnMode })),
  toggleArchitecture: () => set((state) => ({ showArchitecture: !state.showArchitecture })),
}));