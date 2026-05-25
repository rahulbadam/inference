import type {
  SimulationConfig,
  PerformanceMetrics,
  CostEstimation,
  Bottleneck,
  MemoryBreakdown,
  DeploymentRecommendation,
} from "../types";
import { PRECISION_INFO, GPU_SPECS, REGION_PRICING } from "../data/constants";
import {
  SIMULATION_CONSTANTS as C,
  getEngineSpeedup,
  SCHEDULING_SPEEDUP,
  KV_CACHE_FACTORS,
  DECODING_SPEEDUP,
  getPipelineBubbleFactor,
} from "./simulationConstants";

export function calculatePerformanceMetrics(config: SimulationConfig): PerformanceMetrics {
  const { model, hardware, engine, batchSize, inputTokens, concurrentUsers } = config;
  const gpuSpec = GPU_SPECS[hardware.gpuModel];
  const precision = PRECISION_INFO[model.precision];
  const bytesPerParam = precision.bitsPerParam / C.BITS_PER_BYTE;

  // Model weights size in GB
  const modelWeightsGB = (model.parameters * C.BYTES_PER_GB * bytesPerParam) / C.BYTES_PER_GB;

  // MoE active parameters factor
  const activeParamsFactor = model.type === "moe" ? C.MOE_ACTIVE_PARAMS_FACTOR : 1.0;
  const effectiveParams = model.parameters * activeParamsFactor;

  // KV Cache size
  const headDim = model.hiddenSize / model.attentionHeads;
  const kvCachePerTokenBytes =
    2 * model.layerCount * model.kvHeads * headDim * bytesPerParam;
  const kvCacheGB = (kvCachePerTokenBytes * inputTokens * batchSize) / C.BYTES_PER_GB;

  // Total memory
  const activationsGB = (model.hiddenSize * model.layerCount * batchSize * bytesPerParam) / C.BYTES_PER_GB * C.ACTIVATIONS_SCALE_FACTOR;
  const cudaGraphsGB = C.CUDA_GRAPHS_OVERHEAD_GB;
  const fragmentationGB = (modelWeightsGB + kvCacheGB + activationsGB) * C.FRAGMENTATION_PCT;
  const runtimeOverheadGB = C.RUNTIME_OVERHEAD_GB;
  const totalMemoryGB =
    modelWeightsGB + kvCacheGB + activationsGB + cudaGraphsGB + fragmentationGB + runtimeOverheadGB;

  // Adjust for tensor/pipeline parallelism
  const parallelismFactor = hardware.gpuCount > 1 && engine.servingMethod !== "single_gpu" ? hardware.gpuCount : 1;
  const memoryPerGPU = totalMemoryGB / parallelismFactor;

  // Pipeline parallelism bubble overhead
  const pipelineBubble = engine.servingMethod === "pipeline_parallel"
    ? getPipelineBubbleFactor(hardware.gpuCount)
    : 1.0;

  // Memory bandwidth bound tokens/sec
  const totalBandwidthGBs = gpuSpec.bandwidth * hardware.gpuCount;
  const bandwidthBoundTokSec =
    (totalBandwidthGBs * C.BYTES_PER_GB) /
    (effectiveParams * C.BYTES_PER_GB * bytesPerParam * 2) *
    (1 + precision.speedImprovementPct / 100);

  // Compute bound tokens/sec (prefill)
  const totalTFlops = gpuSpec.tensorCores
    ? gpuSpec.tflopsFp16 * hardware.gpuCount
    : gpuSpec.tflopsFp16 * hardware.gpuCount * C.NON_TC_COMPUTE_FACTOR;
  const prefillFlops = 2 * effectiveParams * C.BYTES_PER_GB * inputTokens * batchSize;
  const prefillTimeSec = prefillFlops / (totalTFlops * 1e12 * C.PREFILL_COMPUTE_UTILIZATION);
  const ttft = prefillTimeSec * 1000;

  // Decode tokens/sec (memory bound for autoregressive generation)
  const decodeTokSecSingle = Math.max(
    bandwidthBoundTokSec * C.DECODE_BANDWIDTH_EFFICIENCY,
    totalTFlops * 1e12 / (2 * effectiveParams * C.BYTES_PER_GB * bytesPerParam) * 0.001
  );

  // Engine optimizations with batch-aware scaling
  const engineSpeedup = getEngineSpeedup(engine.engine, batchSize);

  // Scheduling optimization
  const schedulingSpeedup = SCHEDULING_SPEEDUP[engine.scheduling] ?? 1.0;

  // KV cache strategy
  const kvFactors = KV_CACHE_FACTORS[engine.kvCacheStrategy] ?? { speedup: 1.0, memoryReduction: 1.0 };

  // Decoding strategy
  const decodingSpeedup = DECODING_SPEEDUP[engine.decoding] ?? 1.0;

  const tokensPerSecond =
    decodeTokSecSingle *
    batchSize *
    engineSpeedup *
    schedulingSpeedup *
    kvFactors.speedup *
    decodingSpeedup *
    pipelineBubble;

  // Latency percentiles
  const baseLatencyMs = 1000 / Math.max(tokensPerSecond, 0.001);
  const latencyP50 = baseLatencyMs;
  const latencyP95 = baseLatencyMs * C.LATENCY_P95_MULTIPLIER;
  const latencyP99 = baseLatencyMs * C.LATENCY_P99_MULTIPLIER;

  // GPU utilization
  const computeIntensity = effectiveParams / (gpuSpec.bandwidth / gpuSpec.tflopsFp16);
  let gpuUtilization = Math.min(
    C.GPU_UTIL_CEILING,
    Math.max(
      C.GPU_UTIL_FLOOR,
      45 +
        computeIntensity * C.GPU_UTIL_COMPUTE_COEFF +
        batchSize * C.GPU_UTIL_BATCH_COEFF +
        (engine.scheduling === "continuous_batching" ? C.CONTINUOUS_BATCHING_UTIL_BONUS : 0)
    )
  );

  // Thermal throttling: if too hot, reduce utilization
  const powerUsagePreThrottle = gpuSpec.power * hardware.gpuCount * (gpuUtilization / 100);
  const thermalEstimate = C.THERMAL_BASELINE_C + (powerUsagePreThrottle / (hardware.gpuCount * 10));
  
  if (thermalEstimate > C.THERMAL_THROTTLE_THRESHOLD_C) {
    gpuUtilization *= C.THERMAL_THROTTLE_DERATING;
  }

  // Memory adjusted
  const adjustedKvCacheGB = kvCacheGB * kvFactors.memoryReduction;
  const adjustedTotalMemoryGB =
    modelWeightsGB / parallelismFactor +
    adjustedKvCacheGB +
    activationsGB / parallelismFactor +
    cudaGraphsGB +
    fragmentationGB +
    runtimeOverheadGB;

  // Max concurrency based on available memory
  const totalVRAM = hardware.vramPerGpu * hardware.gpuCount;
  const concurrencyPerBatch = Math.floor(totalVRAM / Math.max(memoryPerGPU, 0.001));
  const maxConcurrency = Math.max(1, concurrencyPerBatch * batchSize);

  // Throughput
  const throughput = tokensPerSecond * Math.min(concurrentUsers, maxConcurrency);

  // Batch efficiency
  const batchEfficiency = Math.min(100, (batchSize / Math.max(1, maxConcurrency)) * 100 + C.BATCH_EFFICIENCY_FLOOR_PCT);

  // Power and thermal (post-throttling)
  const powerUsage = gpuSpec.power * hardware.gpuCount * (gpuUtilization / 100);
  const finalThermalEstimate = C.THERMAL_BASELINE_C + (powerUsage / (hardware.gpuCount * 10));

  // Load times
  const storageSpeed = hardware.storageType === "nvme" ? C.NVME_READ_SPEED_GBPS : hardware.storageType === "sata_ssd" ? C.SATA_SSD_READ_SPEED_GBPS : C.DISTRIBUTED_READ_SPEED_GBPS;
  const modelLoadTime = (modelWeightsGB * 2) / storageSpeed;
  const coldStartTime = modelLoadTime * C.COLD_START_MULTIPLIER_MS_PER_SEC + ttft * 0.5;
  const queueWaitTime = Math.max(0, (concurrentUsers - maxConcurrency) * latencyP50 * C.QUEUE_WAIT_FACTOR);

  return {
    ttft: Math.round(ttft),
    tokensPerSecond: Math.round(tokensPerSecond * 10) / 10,
    latencyP50: Math.round(latencyP50),
    latencyP95: Math.round(latencyP95),
    latencyP99: Math.round(latencyP99),
    gpuUtilization: Math.round(gpuUtilization),
    memoryUsed: Math.round(adjustedTotalMemoryGB * 10) / 10,
    memoryTotal: totalVRAM,
    kvCacheUsed: Math.round(adjustedKvCacheGB * 10) / 10,
    maxConcurrency,
    throughput: Math.round(throughput),
    batchEfficiency: Math.round(batchEfficiency),
    powerUsage: Math.round(powerUsage),
    thermalEstimate: Math.round(finalThermalEstimate),
    modelLoadTime: Math.round(modelLoadTime * 10) / 10,
    coldStartTime: Math.round(coldStartTime),
    queueWaitTime: Math.round(queueWaitTime),
  };
}

export function calculateCostEstimation(config: SimulationConfig): CostEstimation {
  const { hardware } = config;
  const pricing = REGION_PRICING[hardware.region];
  const gpuRate = pricing.gpuHourlyRate[hardware.gpuModel] || 1.0;

  const hourlyGpuCost = gpuRate * hardware.gpuCount;
  const monthlyCost = hourlyGpuCost * 24 * 30 * pricing.overheadMultiplier;
  const electricityKw = (hardware.powerConsumption * hardware.gpuCount) / 1000;
  const electricityCost = electricityKw * pricing.electricityRate * 24 * 30;

  // Per-request estimation
  const metrics = calculatePerformanceMetrics(config);
  const requestsPerHour = (3600 * 1000) / (metrics.latencyP50 + config.outputTokens * (1000 / Math.max(metrics.tokensPerSecond, 0.001)));
  const perRequestCost = (hourlyGpuCost + electricityCost / (24 * 30)) / Math.max(1, requestsPerHour);
  const perMillionTokenCost = perRequestCost * 1e6 / (config.inputTokens + config.outputTokens);
  const infrastructureOverhead = monthlyCost * (pricing.overheadMultiplier - 1);

  return {
    hourlyGpuCost: Math.round(hourlyGpuCost * 100) / 100,
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    perRequestCost: Math.round(perRequestCost * 10000) / 10000,
    perMillionTokenCost: Math.round(perMillionTokenCost * 100) / 100,
    infrastructureOverhead: Math.round(infrastructureOverhead * 100) / 100,
    electricityCost: Math.round(electricityCost * 100) / 100,
  };
}

export function analyzeBottlenecks(config: SimulationConfig): Bottleneck[] {
  const { model, hardware, engine, batchSize, inputTokens } = config;
  const metrics = calculatePerformanceMetrics(config);
  const gpuSpec = GPU_SPECS[hardware.gpuModel];
  const precision = PRECISION_INFO[model.precision];
  const bytesPerParam = precision.bitsPerParam / C.BITS_PER_BYTE;
  const bottlenecks: Bottleneck[] = [];

  const totalVRAM = hardware.vramPerGpu * hardware.gpuCount;

  // VRAM bottleneck
  if (metrics.memoryUsed > totalVRAM * C.VRAM_CRITICAL_THRESHOLD_PCT) {
    const weightSizeGB = (model.parameters * bytesPerParam);
    const kvGB = (2 * model.layerCount * model.kvHeads * (model.hiddenSize / model.attentionHeads) * bytesPerParam * inputTokens * batchSize) / C.BYTES_PER_GB;
    bottlenecks.push({
      type: "vram",
      severity: "critical",
      message: `Model requires ${metrics.memoryUsed.toFixed(1)}GB but only ${totalVRAM}GB VRAM available`,
      suggestion: "Use quantization (INT4/INT8), reduce batch size, or add more GPUs with tensor parallelism.",
      rootCauses: [
        {
          parameter: "Model Size",
          currentValue: `${model.parameters}B params × ${bytesPerParam * C.BITS_PER_BYTE}-bit = ${weightSizeGB.toFixed(0)}GB`,
          threshold: `< ${totalVRAM * C.VRAM_SAFE_WEIGHTS_PCT}GB (leaving room for cache + overhead)`,
          impact: `Consumes ${((weightSizeGB / totalVRAM) * 100).toFixed(0)}% of total VRAM alone`,
        },
        {
          parameter: "KV Cache",
          currentValue: `${kvGB.toFixed(1)}GB (${inputTokens} ctx × ${batchSize} batch)`,
          threshold: `< ${(totalVRAM * 0.2).toFixed(1)}GB recommended`,
          impact: `Scales linearly with context window and batch size`,
        },
        {
          parameter: "GPU VRAM",
          currentValue: `${hardware.gpuCount}× ${gpuSpec.vram}GB = ${totalVRAM}GB`,
          threshold: `≥ ${Math.ceil(metrics.memoryUsed * 1.2)}GB required safely`,
          impact: `VRAM is the absolute hard ceiling — no workaround except add GPUs or quantize`,
        },
      ],
    });
  } else if (metrics.memoryUsed > totalVRAM * C.VRAM_WARNING_THRESHOLD_PCT) {
    bottlenecks.push({
      type: "vram",
      severity: "warning",
      message: `VRAM utilization at ${((metrics.memoryUsed / totalVRAM) * 100).toFixed(0)}% — nearing capacity`,
      suggestion: "Consider INT8 quantization or reducing context window to leave headroom.",
      rootCauses: [
        {
          parameter: "VRAM Used / Total",
          currentValue: `${metrics.memoryUsed.toFixed(1)}GB / ${totalVRAM}GB (${((metrics.memoryUsed / totalVRAM) * 100).toFixed(0)}%)`,
          threshold: `< 80% for stable operation`,
          impact: "Near-capacity leads to OOM crashes under load spikes",
        },
        {
          parameter: "Batch Size",
          currentValue: `${batchSize}`,
          threshold: `< ${Math.max(1, Math.floor(batchSize * 0.5))} to reduce KV cache`,
          impact: `Each batch unit adds ${(metrics.kvCacheUsed / Math.max(batchSize, 1)).toFixed(2)}GB KV cache`,
        },
      ],
    });
  }

  // Memory bandwidth bottleneck
  const memBoundThreshold = gpuSpec.bandwidth * C.MEM_BW_SATURATION_PCT;
  const actualBandwidthNeeded = model.parameters * C.BYTES_PER_GB * bytesPerParam * metrics.tokensPerSecond / C.BYTES_PER_GB;
  if (actualBandwidthNeeded > memBoundThreshold) {
    const idealTokSec = gpuSpec.bandwidth / (2 * model.parameters * bytesPerParam);
    bottlenecks.push({
      type: "memory_bandwidth",
      severity: "warning",
      message: "Inference is memory bandwidth bound — GPU compute is underutilized",
      suggestion: "Enable quantization to reduce memory traffic, or upgrade to H100/H200 with higher bandwidth.",
      rootCauses: [
        {
          parameter: "Memory Bandwidth Needed",
          currentValue: `${actualBandwidthNeeded.toFixed(0)} GB/s`,
          threshold: `< ${memBoundThreshold.toFixed(0)} GB/s (85% of ${gpuSpec.bandwidth})`,
          impact: `GPU can supply ${gpuSpec.bandwidth} GB/s, but model demands more`,
        },
        {
          parameter: "Precision",
          currentValue: `${bytesPerParam * C.BITS_PER_BYTE}-bit (${model.precision.toUpperCase()})`,
          threshold: "INT4 (4-bit) for 2× bandwidth relief",
          impact: `Doubling bandwidth by halving bytes per param`,
        },
        {
          parameter: "Theoretical Max Tok/s",
          currentValue: `${metrics.tokensPerSecond.toFixed(1)} tok/s`,
          threshold: `${idealTokSec.toFixed(1)} tok/s at this GPU's bandwidth`,
          impact: "Cannot exceed bandwidth limit regardless of GPU compute",
        },
      ],
    });
  }

  // KV cache overflow
  const headDim = model.hiddenSize / model.attentionHeads;
  const kvCachePerToken = (2 * model.layerCount * model.kvHeads * headDim * bytesPerParam) / C.BYTES_PER_GB;
  const maxSeqLen = totalVRAM / (kvCachePerToken * Math.max(batchSize, 1));
  if (model.contextWindow > maxSeqLen) {
    bottlenecks.push({
      type: "kv_cache_overflow",
      severity: "critical",
      message: `Context window (${model.contextWindow}) exceeds KV cache capacity (~${Math.floor(maxSeqLen)} tokens)`,
      suggestion: "Reduce context window, enable KV cache offloading, or use paged attention with longer sequences.",
      rootCauses: [
        {
          parameter: "Context Window",
          currentValue: `${model.contextWindow.toLocaleString()} tokens`,
          threshold: `≤ ${Math.floor(maxSeqLen).toLocaleString()} tokens (VRAM limit)`,
          impact: `Each token needs ${(kvCachePerToken * batchSize * 1024).toFixed(1)}MB at batch=${batchSize}`,
        },
        {
          parameter: "KV Cache Strategy",
          currentValue: engine.kvCacheStrategy.replace("_", " "),
          threshold: "Paged Attention (65% cache reduction)",
          impact: `Switching would raise capacity to ~${Math.floor(maxSeqLen * 1.5).toLocaleString()} tokens`,
        },
      ],
    });
  }

  // CPU bottleneck
  if (hardware.cpuCores < hardware.gpuCount * C.MIN_CPU_CORES_PER_GPU) {
    bottlenecks.push({
      type: "cpu",
      severity: "info",
      message: `CPU cores (${hardware.cpuCores}) may bottleneck ${hardware.gpuCount} GPUs`,
      suggestion: "Ensure at least 8 CPU cores per GPU for optimal data loading and preprocessing.",
      rootCauses: [
        {
          parameter: "CPU Cores / GPU Ratio",
          currentValue: `${(hardware.cpuCores / Math.max(hardware.gpuCount, 1)).toFixed(1)} cores/GPU`,
          threshold: `≥ ${C.MIN_CPU_CORES_PER_GPU} cores per GPU`,
          impact: `Data preprocessing and batching are CPU-bound operations`,
        },
        {
          parameter: "Total CPU Cores",
          currentValue: `${hardware.cpuCores} cores`,
          threshold: `≥ ${hardware.gpuCount * C.MIN_CPU_CORES_PER_GPU} cores for ${hardware.gpuCount} GPUs`,
          impact: "Under-provisioned CPUs create queuing delays before GPU work",
        },
      ],
    });
  }

  // PCIe bottleneck
  if (!gpuSpec.nvlink && hardware.gpuCount > 1 && engine.servingMethod === "tensor_parallel") {
    const pcieBandwidth = hardware.pcieGen === 5 ? 64 : hardware.pcieGen === 4 ? 32 : 16;
    bottlenecks.push({
      type: "pcie",
      severity: "warning",
      message: "Multi-GPU tensor parallelism without NVLink causes significant PCIe communication overhead",
      suggestion: "Use NVLink-enabled GPUs (A100, H100) for tensor parallelism, or switch to pipeline parallelism.",
      rootCauses: [
        {
          parameter: "Interconnect",
          currentValue: `PCIe ${hardware.pcieGen}.0 (~${pcieBandwidth} GB/s)`,
          threshold: "NVLink (600–900 GB/s)",
          impact: `PCIe is ${(600 / pcieBandwidth).toFixed(0)}× slower than NVLink — tensor sync dominates`,
        },
        {
          parameter: "GPU Count",
          currentValue: `${hardware.gpuCount} GPUs`,
          threshold: "1 GPU (no sync needed) or NVLink cluster",
          impact: `All-reduce across ${hardware.gpuCount} GPUs every layer with slow interconnect`,
        },
        {
          parameter: "Serving Method",
          currentValue: engine.servingMethod.replace("_", " "),
          threshold: "Pipeline Parallel (less comms) or Single GPU",
          impact: "Tensor parallel shards weights → constant all-gather traffic",
        },
      ],
    });
  }

  // Network bottleneck
  if (hardware.gpuCount > 4 && !hardware.infiniband && engine.servingMethod === "distributed") {
    bottlenecks.push({
      type: "network",
      severity: "warning",
      message: "Distributed inference across nodes without InfiniBand will have high inter-node latency",
      suggestion: "Enable InfiniBand for multi-node setups, or consolidate onto fewer nodes.",
      rootCauses: [
        {
          parameter: "Network",
          currentValue: hardware.infiniband ? "InfiniBand" : "Ethernet/TCP",
          threshold: "InfiniBand NDR (400 Gbps) or HDR (200 Gbps)",
          impact: "TCP/IP adds ms-scale latency; IB enables RDMA direct GPU memory access",
        },
        {
          parameter: "GPU Count",
          currentValue: `${hardware.gpuCount} GPUs`,
          threshold: "≤ 4 GPUs per node (avoiding multi-node)",
          impact: "Cross-node communication is the bottleneck in distributed setups",
        },
      ],
    });
  }

  // Compute bottleneck (if NOT memory bound and GPU util is low)
  if (actualBandwidthNeeded < memBoundThreshold * C.COMPUTE_SPARE_BW_THRESHOLD_PCT && metrics.gpuUtilization < C.COMPUTE_UNDERUTIL_THRESHOLD) {
    bottlenecks.push({
      type: "compute",
      severity: "info",
      message: "GPU compute is underutilized — consider increasing batch size",
      suggestion: `Increase batch size from ${batchSize} to ${Math.min(batchSize * 4, 128)} for better GPU utilization.`,
      rootCauses: [
        {
          parameter: "GPU Utilization",
          currentValue: `${metrics.gpuUtilization}%`,
          threshold: "> 60% for cost efficiency",
          impact: "Low util means you're paying for idle GPU cycles",
        },
        {
          parameter: "Batch Size",
          currentValue: `${batchSize}`,
          threshold: `≥ ${Math.min(batchSize * 4, 128)} to saturate GPU`,
          impact: `Larger batches amortize kernel launch overhead across more work`,
        },
      ],
    });
  }

  // Thermal throttling warning
  if (metrics.thermalEstimate > C.THERMAL_THROTTLE_THRESHOLD_C) {
    bottlenecks.push({
      type: "compute",
      severity: "warning",
      message: `Thermal throttling detected — GPU at ${metrics.thermalEstimate}°C exceeds ${C.THERMAL_THROTTLE_THRESHOLD_C}°C threshold`,
      suggestion: "Improve cooling (liquid cooling), reduce power limit, or decrease batch size.",
      rootCauses: [
        {
          parameter: "GPU Temperature",
          currentValue: `${metrics.thermalEstimate}°C`,
          threshold: `< ${C.THERMAL_THROTTLE_THRESHOLD_C}°C`,
          impact: `Clock speeds reduced by ${Math.round((1 - C.THERMAL_THROTTLE_DERATING) * 100)}%, hurting throughput`,
        },
        {
          parameter: "Power Draw",
          currentValue: `${metrics.powerUsage}W`,
          threshold: `< ${Math.round(gpuSpec.power * hardware.gpuCount * 0.85)}W sustainable`,
          impact: "Sustained high power generates excess heat",
        },
      ],
    });
  }

  return bottlenecks;
}

export function calculateMemoryBreakdown(config: SimulationConfig): MemoryBreakdown {
  const { model, hardware, engine, batchSize, inputTokens } = config;
  const precision = PRECISION_INFO[model.precision];
  const bytesPerParam = precision.bitsPerParam / C.BITS_PER_BYTE;
  const parallelismFactor = hardware.gpuCount > 1 && engine.servingMethod !== "single_gpu" ? hardware.gpuCount : 1;

  const modelWeights = (model.parameters * C.BYTES_PER_GB * bytesPerParam) / C.BYTES_PER_GB / parallelismFactor;

  const headDim = model.hiddenSize / model.attentionHeads;
  const kvCachePerToken = (2 * model.layerCount * model.kvHeads * headDim * bytesPerParam) / C.BYTES_PER_GB;
  let kvCache = kvCachePerToken * inputTokens * batchSize;

  const kvFactors = KV_CACHE_FACTORS[engine.kvCacheStrategy];
  if (kvFactors) {
    kvCache *= kvFactors.memoryReduction;
  }

  const activations = (model.hiddenSize * model.layerCount * batchSize * bytesPerParam) / C.BYTES_PER_GB * C.ACTIVATIONS_SCALE_FACTOR / parallelismFactor;
  const cudaGraphs = C.CUDA_GRAPHS_OVERHEAD_GB;
  const fragmentation = (modelWeights + kvCache + activations) * C.FRAGMENTATION_PCT;
  const runtimeOverhead = C.RUNTIME_OVERHEAD_GB;

  return {
    modelWeights: Math.round(modelWeights * 10) / 10,
    activations: Math.round(activations * 10) / 10,
    kvCache: Math.round(kvCache * 10) / 10,
    cudaGraphs,
    fragmentation: Math.round(fragmentation * 10) / 10,
    runtimeOverhead,
  };
}

export function getDeploymentRecommendation(
  expectedUsers: number,
  dailyRequests: number,
  avgPromptSize: number,
  avgOutputTokens: number,
  slaTargetMs: number
): DeploymentRecommendation {
  const tokensPerDay = dailyRequests * (avgPromptSize + avgOutputTokens);

  let recommendedGpuSetup: string;
  let recommendedEngine: string;
  let recommendedQuantization: "fp16" | "bf16" | "int8" | "int4";
  let recommendedBatching: string;
  let estimatedMonthlyCost: number;

  if (expectedUsers > 10000 || tokensPerDay > 1e9) {
    recommendedGpuSetup = "8× H100 80GB with NVLink + InfiniBand";
    recommendedEngine = "vLLM or TensorRT-LLM";
    recommendedQuantization = "bf16";
    recommendedBatching = "Continuous batching (in-flight)";
    estimatedMonthlyCost = 50000;
  } else if (expectedUsers > 1000 || tokensPerDay > 1e8) {
    recommendedGpuSetup = "4× A100 80GB with NVLink";
    recommendedEngine = "vLLM";
    recommendedQuantization = "fp16";
    recommendedBatching = "Continuous batching";
    estimatedMonthlyCost = 12000;
  } else if (expectedUsers > 100 || tokensPerDay > 1e7) {
    recommendedGpuSetup = "1× H100 80GB or 2× A100 40GB";
    recommendedEngine = "vLLM";
    recommendedQuantization = "fp16";
    recommendedBatching = "Dynamic batching";
    estimatedMonthlyCost = 3000;
  } else {
    recommendedGpuSetup = "1× RTX 4090 or A10";
    recommendedEngine = "llama.cpp or vLLM";
    recommendedQuantization = "int8";
    recommendedBatching = "Dynamic batching";
    estimatedMonthlyCost = 500;
  }

  if (slaTargetMs < 100) {
    recommendedBatching = "Small batch sizes with continuous batching";
    recommendedGpuSetup = "1× H100 80GB (latency optimized)";
    estimatedMonthlyCost *= 1.5;
  }

  return {
    recommendedGpuSetup,
    recommendedEngine,
    recommendedQuantization,
    recommendedBatching,
    estimatedMonthlyCost,
    confidence: 0.85,
  };
}