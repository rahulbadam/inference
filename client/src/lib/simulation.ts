import type {
  SimulationConfig,
  PerformanceMetrics,
  CostEstimation,
  Bottleneck,
  MemoryBreakdown,
  DeploymentRecommendation,
} from "../types";
import { PRECISION_INFO, GPU_SPECS, REGION_PRICING } from "../data/constants";

export function calculatePerformanceMetrics(config: SimulationConfig): PerformanceMetrics {
  const { model, hardware, engine, batchSize, inputTokens, concurrentUsers } = config;
  const gpuSpec = GPU_SPECS[hardware.gpuModel];
  const precision = PRECISION_INFO[model.precision];
  const bitsPerByte = 8;
  const bytesPerParam = precision.bitsPerParam / bitsPerByte;

  // Model weights size in GB
  const modelWeightsGB = (model.parameters * 1e9 * bytesPerParam) / 1e9;

  // MoE active parameters factor
  const activeParamsFactor = model.type === "moe" ? 0.28 : 1.0; // ~28% active for typical MoE
  const effectiveParams = model.parameters * activeParamsFactor;

  // KV Cache size
  const headDim = model.hiddenSize / model.attentionHeads;
  const kvCachePerTokenBytes =
    2 * model.layerCount * model.kvHeads * headDim * bytesPerParam;
  const kvCacheGB = (kvCachePerTokenBytes * inputTokens * batchSize) / 1e9;

  // Total memory
  const activationsGB = (model.hiddenSize * model.layerCount * batchSize * bytesPerParam) / 1e9 * 0.5;
  const cudaGraphsGB = 0.5;
  const fragmentationGB = (modelWeightsGB + kvCacheGB + activationsGB) * 0.08;
  const runtimeOverheadGB = 1.5;
  const totalMemoryGB =
    modelWeightsGB + kvCacheGB + activationsGB + cudaGraphsGB + fragmentationGB + runtimeOverheadGB;

  // Adjust for tensor/pipeline parallelism
  const parallelismFactor = hardware.gpuCount > 1 && engine.servingMethod !== "single_gpu" ? hardware.gpuCount : 1;
  const memoryPerGPU = totalMemoryGB / parallelismFactor;

  // Memory bandwidth bound tokens/sec
  const totalBandwidthGBs = gpuSpec.bandwidth * hardware.gpuCount;
  const bandwidthBoundTokSec =
    (totalBandwidthGBs * 1e9) /
    (effectiveParams * 1e9 * bytesPerParam * 2) *
    (1 + precision.speedImprovementPct / 100);

  // Compute bound tokens/sec (prefill)
  const totalTFlops = gpuSpec.tensorCores
    ? gpuSpec.tflopsFp16 * hardware.gpuCount
    : gpuSpec.tflopsFp16 * hardware.gpuCount * 0.7;
  const prefillFlops = 2 * effectiveParams * 1e9 * inputTokens * batchSize;
  const prefillTimeSec = prefillFlops / (totalTFlops * 1e12 * 0.75);
  const ttft = prefillTimeSec * 1000;

  // Decode tokens/sec (memory bound for autoregressive generation)
  const decodeTokSecSingle = Math.max(
    bandwidthBoundTokSec * 0.85,
    totalTFlops * 1e12 / (2 * effectiveParams * 1e9 * bytesPerParam) * 0.001
  );

  // Engine optimizations
  let engineSpeedup = 1.0;
  if (engine.engine === "vLLM") engineSpeedup = 1.3;
  else if (engine.engine === "TensorRT-LLM") engineSpeedup = 1.5;
  else if (engine.engine === "llama.cpp") engineSpeedup = 0.9;
  else if (engine.engine === "SGLang") engineSpeedup = 1.25;
  else if (engine.engine === "TGI") engineSpeedup = 1.1;
  else if (engine.engine === "Ollama") engineSpeedup = 0.85;

  // Scheduling optimization
  let schedulingSpeedup = 1.0;
  if (engine.scheduling === "continuous_batching") schedulingSpeedup = 1.4;
  else if (engine.scheduling === "dynamic_batching") schedulingSpeedup = 1.15;

  // KV cache strategy
  let kvCacheSpeedup = 1.0;
  let kvCacheMemoryReduction = 1.0;
  if (engine.kvCacheStrategy === "paged_attention") {
    kvCacheSpeedup = 1.2;
    kvCacheMemoryReduction = 0.65;
  } else if (engine.kvCacheStrategy === "offloading") {
    kvCacheSpeedup = 0.6;
    kvCacheMemoryReduction = 0.3;
  } else if (engine.kvCacheStrategy === "prefix_caching") {
    kvCacheSpeedup = 1.1;
    kvCacheMemoryReduction = 0.8;
  }

  // Decoding strategy
  let decodingSpeedup = 1.0;
  if (engine.decoding === "speculative_decoding") decodingSpeedup = 2.2;
  else if (engine.decoding === "beam_search") decodingSpeedup = 0.7;

  const tokensPerSecond =
    decodeTokSecSingle *
    batchSize *
    engineSpeedup *
    schedulingSpeedup *
    kvCacheSpeedup *
    decodingSpeedup;

  // Latency percentiles
  const baseLatencyMs = 1000 / tokensPerSecond;
  const latencyP50 = baseLatencyMs;
  const latencyP95 = baseLatencyMs * 1.8;
  const latencyP99 = baseLatencyMs * 3.0;

  // GPU utilization
  const computeIntensity = effectiveParams / (gpuSpec.bandwidth / gpuSpec.tflopsFp16);
  const gpuUtilization = Math.min(
    95,
    Math.max(
      15,
      45 +
        computeIntensity * 20 +
        batchSize * 1.5 +
        (engine.scheduling === "continuous_batching" ? 20 : 0)
    )
  );

  // Memory adjusted
  const adjustedKvCacheGB = kvCacheGB * kvCacheMemoryReduction;
  const adjustedTotalMemoryGB =
    modelWeightsGB / parallelismFactor +
    adjustedKvCacheGB +
    activationsGB / parallelismFactor +
    cudaGraphsGB +
    fragmentationGB +
    runtimeOverheadGB;

  // Max concurrency based on available memory
  const totalVRAM = hardware.vramPerGpu * hardware.gpuCount;
  const concurrencyPerBatch = Math.floor(totalVRAM / memoryPerGPU);
  const maxConcurrency = Math.max(1, concurrencyPerBatch * batchSize);

  // Throughput
  const throughput = tokensPerSecond * Math.min(concurrentUsers, maxConcurrency);

  // Batch efficiency
  const batchEfficiency = Math.min(100, (batchSize / Math.max(1, maxConcurrency)) * 100 + 40);

  // Power and thermal
  const powerUsage = gpuSpec.power * hardware.gpuCount * (gpuUtilization / 100);
  const thermalEstimate = 35 + (powerUsage / (hardware.gpuCount * 10));

  // Load times
  const modelLoadTime = (modelWeightsGB * 2) / (hardware.storageType === "nvme" ? 3.5 : hardware.storageType === "sata_ssd" ? 0.5 : 0.1);
  const coldStartTime = modelLoadTime * 200 + ttft * 0.5;
  const queueWaitTime = Math.max(0, (concurrentUsers - maxConcurrency) * latencyP50 * 0.1);

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
    thermalEstimate: Math.round(thermalEstimate),
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
  const requestsPerHour = (3600 * 1000) / (metrics.latencyP50 + config.outputTokens * (1000 / metrics.tokensPerSecond));
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
  const bytesPerParam = precision.bitsPerParam / 8;
  const bottlenecks: Bottleneck[] = [];

  const totalVRAM = hardware.vramPerGpu * hardware.gpuCount;

  // VRAM bottleneck
  if (metrics.memoryUsed > totalVRAM * 0.95) {
    const weightSizeGB = (model.parameters * bytesPerParam);
    const kvGB = (2 * model.layerCount * model.kvHeads * (model.hiddenSize / model.attentionHeads) * bytesPerParam * inputTokens * batchSize) / 1e9;
    bottlenecks.push({
      type: "vram",
      severity: "critical",
      message: `Model requires ${metrics.memoryUsed.toFixed(1)}GB but only ${totalVRAM}GB VRAM available`,
      suggestion: "Use quantization (INT4/INT8), reduce batch size, or add more GPUs with tensor parallelism.",
      rootCauses: [
        {
          parameter: "Model Size",
          currentValue: `${model.parameters}B params × ${bytesPerParam * 8}-bit = ${weightSizeGB.toFixed(0)}GB`,
          threshold: `< ${totalVRAM * 0.6}GB (leaving room for cache + overhead)`,
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
  } else if (metrics.memoryUsed > totalVRAM * 0.8) {
    bottlenecks.push({
      type: "vram",
      severity: "warning",
      message: `VRAM utilization at ${((metrics.memoryUsed / totalVRAM) * 100).toFixed(0)}% — nearing capacity`,
      suggestion: "Consider INT8 quantization or reducing context window to leave headroom.",
      rootCauses: [
        {
          parameter: "VRAM Used / Total",
          currentValue: `${metrics.memoryUsed.toFixed(1)}GB / ${totalVRAM}GB (${((metrics.memoryUsed / totalVRAM) * 100).toFixed(0)}%)`,
          threshold: "< 80% for stable operation",
          impact: "Near-capacity leads to OOM crashes under load spikes",
        },
        {
          parameter: "Batch Size",
          currentValue: `${batchSize}`,
          threshold: `< ${Math.max(1, Math.floor(batchSize * 0.5))} to reduce KV cache`,
          impact: `Each batch unit adds ${(metrics.kvCacheUsed / batchSize).toFixed(2)}GB KV cache`,
        },
      ],
    });
  }

  // Memory bandwidth bottleneck
  const memBoundThreshold = gpuSpec.bandwidth * 0.85;
  const actualBandwidthNeeded = model.parameters * 1e9 * bytesPerParam * metrics.tokensPerSecond / 1e9;
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
          currentValue: `${bytesPerParam * 8}-bit (${model.precision.toUpperCase()})`,
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
  const kvCachePerToken = (2 * model.layerCount * model.kvHeads * headDim * bytesPerParam) / 1e9;
  const maxSeqLen = totalVRAM / (kvCachePerToken * batchSize);
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
  if (hardware.cpuCores < hardware.gpuCount * 8) {
    bottlenecks.push({
      type: "cpu",
      severity: "info",
      message: `CPU cores (${hardware.cpuCores}) may bottleneck ${hardware.gpuCount} GPUs`,
      suggestion: "Ensure at least 8 CPU cores per GPU for optimal data loading and preprocessing.",
      rootCauses: [
        {
          parameter: "CPU Cores / GPU Ratio",
          currentValue: `${(hardware.cpuCores / hardware.gpuCount).toFixed(1)} cores/GPU`,
          threshold: "≥ 8 cores per GPU",
          impact: `Data preprocessing and batching are CPU-bound operations`,
        },
        {
          parameter: "Total CPU Cores",
          currentValue: `${hardware.cpuCores} cores`,
          threshold: `≥ ${hardware.gpuCount * 8} cores for ${hardware.gpuCount} GPUs`,
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
  if (actualBandwidthNeeded < memBoundThreshold * 0.5 && metrics.gpuUtilization < 40) {
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

  return bottlenecks;
}

export function calculateMemoryBreakdown(config: SimulationConfig): MemoryBreakdown {
  const { model, hardware, engine, batchSize, inputTokens } = config;
  const precision = PRECISION_INFO[model.precision];
  const bytesPerParam = precision.bitsPerParam / 8;
  const parallelismFactor = hardware.gpuCount > 1 && engine.servingMethod !== "single_gpu" ? hardware.gpuCount : 1;

  const modelWeights = (model.parameters * 1e9 * bytesPerParam) / 1e9 / parallelismFactor;

  const headDim = model.hiddenSize / model.attentionHeads;
  const kvCachePerToken = (2 * model.layerCount * model.kvHeads * headDim * bytesPerParam) / 1e9;
  let kvCache = kvCachePerToken * inputTokens * batchSize;

  if (engine.kvCacheStrategy === "paged_attention") kvCache *= 0.65;
  else if (engine.kvCacheStrategy === "offloading") kvCache *= 0.3;

  const activations = (model.hiddenSize * model.layerCount * batchSize * bytesPerParam) / 1e9 * 0.5 / parallelismFactor;
  const cudaGraphs = 0.5;
  const fragmentation = (modelWeights + kvCache + activations) * 0.08;
  const runtimeOverhead = 1.5;

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
  // Simple heuristic recommendation
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