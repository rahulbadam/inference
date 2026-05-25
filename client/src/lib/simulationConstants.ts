/**
 * AI Inference Lab - Simulation Constants
 * 
 * All physics-based constants used in the inference simulation engine.
 * Sources: NVIDIA whitepapers, vLLM/TensorRT-LLM benchmarks, academic papers.
 */

export const SIMULATION_CONSTANTS = {
  /** MoE models activate roughly 28% of total parameters per token (typical for Mixtral/DeepSeek style) */
  MOE_ACTIVE_PARAMS_FACTOR: 0.28,

  /** Activations are estimated as hidden × layers × batch × bytes × this factor */
  ACTIVATIONS_SCALE_FACTOR: 0.5,

  /** CUDA graphs allocate ~0.5GB fixed overhead per GPU context */
  CUDA_GRAPHS_OVERHEAD_GB: 0.5,

  /** Memory fragmentation is ~8% of total allocated (weights + kv + activations) */
  FRAGMENTATION_PCT: 0.08,

  /** Framework runtime overhead: PyTorch caching allocator, cuBLAS workspaces, etc. */
  RUNTIME_OVERHEAD_GB: 1.5,

  /** Decode bandwidth utilization is ~85% of theoretical max (cache misses, inefficiencies) */
  DECODE_BANDWIDTH_EFFICIENCY: 0.85,

  /** Prefill compute utilization: 75% of peak TFLOPS (not all SMs active, kernel launch gaps) */
  PREFILL_COMPUTE_UTILIZATION: 0.75,

  /** Non-tensor-core GPUs achieve ~70% of rated TFLOPS for inference */
  NON_TC_COMPUTE_FACTOR: 0.7,

  /** Base GPU utilization floor when idle/small batches */
  GPU_UTIL_FLOOR: 15,

  /** GPU utilization ceiling (never reaches 100% due to scheduling gaps) */
  GPU_UTIL_CEILING: 95,

  /** Thermal baseline: ambient temp estimate in Celsius */
  THERMAL_BASELINE_C: 35,

  /** Thermal throttling starts at 83°C on NVIDIA GPUs */
  THERMAL_THROTTLE_THRESHOLD_C: 83,

  /** Derating factor applied when thermally throttled */
  THERMAL_THROTTLE_DERATING: 0.85,

  /** NVMe sequential read speed for model loading (GB/s) */
  NVME_READ_SPEED_GBPS: 3.5,

  /** SATA SSD sequential read speed (GB/s) */
  SATA_SSD_READ_SPEED_GBPS: 0.5,

  /** Distributed/network storage read speed (GB/s) */
  DISTRIBUTED_READ_SPEED_GBPS: 0.1,

  /** Cold start overhead multiplier on top of model load time */
  COLD_START_MULTIPLIER_MS_PER_SEC: 200,

  /** Queue wait scales by this factor when overloaded */
  QUEUE_WAIT_FACTOR: 0.1,

  /** P95 latency multiplier over P50 */
  LATENCY_P95_MULTIPLIER: 1.8,

  /** P99 latency multiplier over P50 */
  LATENCY_P99_MULTIPLIER: 3.0,

  /** Bits per byte */
  BITS_PER_BYTE: 8,

  /** Bytes per gigabyte */
  BYTES_PER_GB: 1e9,

  /** GPU utilization compute intensity coefficient */
  GPU_UTIL_COMPUTE_COEFF: 20,

  /** GPU utilization batch size coefficient */
  GPU_UTIL_BATCH_COEFF: 1.5,

  /** Continuous batching bonus to GPU utilization */
  CONTINUOUS_BATCHING_UTIL_BONUS: 20,

  /** VRAM critical threshold: >95% triggers OOM bottleneck */
  VRAM_CRITICAL_THRESHOLD_PCT: 0.95,

  /** VRAM warning threshold: >80% triggers warning */
  VRAM_WARNING_THRESHOLD_PCT: 0.8,

  /** Safe VRAM headroom: weights should be <60% of total */
  VRAM_SAFE_WEIGHTS_PCT: 0.6,

  /** Memory bandwidth saturation threshold: >85% of spec triggers bottleneck */
  MEM_BW_SATURATION_PCT: 0.85,

  /** Compute underutilization threshold: <40% GPU util with spare bandwidth */
  COMPUTE_UNDERUTIL_THRESHOLD: 40,

  /** Spare bandwidth threshold for compute bottleneck detection */
  COMPUTE_SPARE_BW_THRESHOLD_PCT: 0.5,

  /** Minimum CPU cores per GPU */
  MIN_CPU_CORES_PER_GPU: 8,

  /** Minimum batch efficiency floor */
  BATCH_EFFICIENCY_FLOOR_PCT: 40,
} as const;

/** Engine-specific speedup multipliers (base values, can be scaled by batch size) */
export const ENGINE_SPEEDUP: Record<string, number> = {
  "vLLM": 1.3,
  "TensorRT-LLM": 1.5,
  "llama.cpp": 0.9,
  "SGLang": 1.25,
  "TGI": 1.1,
  "Ollama": 0.85,
  "ONNX Runtime": 1.0,
  "DeepSpeed": 1.15,
};

/** Engine speedup scaling with batch size (higher batch = more advantage for advanced engines) */
export function getEngineSpeedup(engine: string, batchSize: number): number {
  const base = ENGINE_SPEEDUP[engine] ?? 1.0;
  // vLLM, TensorRT-LLM, SGLang benefit more from larger batches
  const batchScaling = ["vLLM", "TensorRT-LLM", "SGLang"].includes(engine)
    ? 1 + Math.log10(Math.max(1, batchSize)) * 0.05
    : 1;
  return base * batchScaling;
}

/** Scheduling strategy speedups */
export const SCHEDULING_SPEEDUP: Record<string, number> = {
  "fcfs": 1.0,
  "continuous_batching": 1.4,
  "dynamic_batching": 1.15,
};

/** KV cache strategy speedup and memory reduction factors */
export const KV_CACHE_FACTORS: Record<string, { speedup: number; memoryReduction: number }> = {
  "paged_attention": { speedup: 1.2, memoryReduction: 0.65 },
  "offloading": { speedup: 0.6, memoryReduction: 0.3 },
  "prefix_caching": { speedup: 1.1, memoryReduction: 0.8 },
};

/** Decoding strategy speedups */
export const DECODING_SPEEDUP: Record<string, number> = {
  "greedy": 1.0,
  "beam_search": 0.7,
  "speculative_decoding": 2.2,
};

/** Pipeline parallelism bubble overhead (fraction of time GPUs are idle) */
export function getPipelineBubbleFactor(gpuCount: number): number {
  if (gpuCount <= 1) return 1.0;
  // More stages = bigger bubble. Roughly 10% idle per stage added
  return Math.max(0.5, 1 - (gpuCount - 1) * 0.08);
}