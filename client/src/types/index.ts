export interface ModelConfig {
  name: string;
  type: "dense" | "moe";
  parameters: number; // in billions
  contextWindow: number; // in tokens
  hiddenSize: number;
  attentionHeads: number;
  kvHeads: number;
  layerCount: number;
  embeddingSize: number;
  precision: Precision;
  vocabSize: number;
}

export type Precision = "fp32" | "fp16" | "bf16" | "int8" | "int4" | "gptq" | "awq" | "gguf";

export interface PrecisionInfo {
  bitsPerParam: number;
  qualityLossPct: number;
  vramReductionPct: number;
  speedImprovementPct: number;
  perplexityImpact: number;
}

export interface HardwareConfig {
  vendor: "nvidia" | "amd" | "apple";
  gpuModel: string;
  gpuCount: number;
  vramPerGpu: number; // GB
  memoryBandwidth: number; // GB/s
  hasTensorCores: boolean;
  cpuCores: number;
  cpuThreads: number;
  cpuClockSpeed: number; // GHz
  ramSize: number; // GB
  storageType: "sata_ssd" | "nvme" | "distributed";
  pcieGen: number;
  nvlink: boolean;
  infiniband: boolean;
  powerConsumption: number; // watts per GPU
  region: "aws" | "azure" | "gcp" | "onprem";
}

export interface EngineConfig {
  engine: string;
  servingMethod: "single_gpu" | "tensor_parallel" | "pipeline_parallel" | "distributed";
  scheduling: "fcfs" | "continuous_batching" | "dynamic_batching";
  kvCacheStrategy: "paged_attention" | "offloading" | "prefix_caching";
  decoding: "greedy" | "beam_search" | "speculative_decoding";
  streaming: boolean;
}

export interface SimulationConfig {
  model: ModelConfig;
  hardware: HardwareConfig;
  engine: EngineConfig;
  batchSize: number;
  inputTokens: number;
  outputTokens: number;
  concurrentUsers: number;
}

export interface PerformanceMetrics {
  ttft: number; // ms
  tokensPerSecond: number;
  latencyP50: number; // ms
  latencyP95: number; // ms
  latencyP99: number; // ms
  gpuUtilization: number; // %
  memoryUsed: number; // GB
  memoryTotal: number; // GB
  kvCacheUsed: number; // GB
  maxConcurrency: number;
  throughput: number; // tokens/sec total
  batchEfficiency: number; // %
  powerUsage: number; // watts
  thermalEstimate: number; // celsius
  modelLoadTime: number; // seconds
  coldStartTime: number; // ms
  queueWaitTime: number; // ms
}

export interface CostEstimation {
  hourlyGpuCost: number;
  monthlyCost: number;
  perRequestCost: number;
  perMillionTokenCost: number;
  infrastructureOverhead: number;
  electricityCost: number;
}

export interface BottleneckRootCause {
  parameter: string;
  currentValue: string;
  threshold: string;
  impact: string;
}

export interface Bottleneck {
  type: "vram" | "memory_bandwidth" | "cpu" | "kv_cache_overflow" | "network" | "pcie" | "compute";
  severity: "critical" | "warning" | "info";
  message: string;
  suggestion: string;
  rootCauses: BottleneckRootCause[];
}

export interface MemoryBreakdown {
  modelWeights: number; // GB
  activations: number; // GB
  kvCache: number; // GB
  cudaGraphs: number; // GB
  fragmentation: number; // GB
  runtimeOverhead: number; // GB
}

export interface DeploymentRecommendation {
  recommendedGpuSetup: string;
  recommendedEngine: string;
  recommendedQuantization: Precision;
  recommendedBatching: string;
  estimatedMonthlyCost: number;
  confidence: number; // 0-1
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  config: Partial<SimulationConfig>;
  icon: string;
}

export interface TooltipContent {
  term: string;
  shortDescription: string;
  detailedExplanation: string;
  example?: string;
  formula?: string;
}

export interface ComparisonConfig {
  id: string;
  name: string;
  config: SimulationConfig;
  metrics: PerformanceMetrics;
  costs: CostEstimation;
  bottlenecks: Bottleneck[];
}

export type TabId =
  | "model"
  | "hardware"
  | "engine"
  | "performance"
  | "cost"
  | "bottleneck"
  | "memory"
  | "tokens"
  | "gpu"
  | "deploy"
  | "compare"
  | "learn"
  | "architecture";

export interface GpuSpec {
  name: string;
  vram: number;
  bandwidth: number;
  tensorCores: boolean;
  tflopsFp16: number;
  tflopsInt8: number;
  power: number;
  pcieGen: number;
  nvlink: boolean;
  releaseYear: number;
}

export interface RegionPricing {
  gpuHourlyRate: Record<string, number>;
  electricityRate: number; // $/kWh
  overheadMultiplier: number;
}