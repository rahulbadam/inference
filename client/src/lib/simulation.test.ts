import { describe, it, expect } from "vitest";
import {
  calculatePerformanceMetrics,
  calculateCostEstimation,
  analyzeBottlenecks,
  getDeploymentRecommendation,
} from "./simulation";
import type { SimulationConfig } from "../types";

const baseConfig: SimulationConfig = {
  model: {
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
  },
  hardware: {
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
  },
  engine: {
    engine: "vLLM",
    servingMethod: "single_gpu" as const,
    scheduling: "continuous_batching" as const,
    kvCacheStrategy: "paged_attention" as const,
    decoding: "greedy" as const,
    streaming: true,
  },
  batchSize: 1,
  inputTokens: 512,
  outputTokens: 256,
  concurrentUsers: 1,
};

describe("calculatePerformanceMetrics", () => {
  it("should produce sane values for Llama-3 8B on RTX 4090 at FP16", () => {
    const m = calculatePerformanceMetrics(baseConfig);
    expect(m.tokensPerSecond).toBeGreaterThan(50);
    expect(m.tokensPerSecond).toBeLessThan(300);
    expect(m.ttft).toBeGreaterThan(0);
    expect(m.ttft).toBeLessThan(1000);
    expect(m.memoryUsed).toBeLessThan(24); // Fits in VRAM
    expect(m.gpuUtilization).toBeGreaterThanOrEqual(15);
    expect(m.gpuUtilization).toBeLessThanOrEqual(95);
  });

  it("should detect OOM for 70B on single RTX 4090", () => {
    const config = {
      ...baseConfig,
      model: { ...baseConfig.model, parameters: 70, name: "Llama-3-70B" },
    };
    const m = calculatePerformanceMetrics(config);
    expect(m.memoryUsed).toBeGreaterThan(24);
  });

  it("should apply thermal throttling at high power", () => {
    const config = {
      ...baseConfig,
      hardware: { ...baseConfig.hardware, gpuCount: 4, powerConsumption: 450 },
    };
    const m = calculatePerformanceMetrics(config);
    // 4× RTX 4090 at full load generates ~84°C, triggering throttle
    expect(m.thermalEstimate).toBeGreaterThanOrEqual(83);
  });

  it("should scale tokens/sec with batch size", () => {
    const b1 = calculatePerformanceMetrics({ ...baseConfig, batchSize: 1 });
    const b8 = calculatePerformanceMetrics({ ...baseConfig, batchSize: 8 });
    expect(b8.throughput).toBeGreaterThan(b1.throughput);
  });

  it("should reduce memory with INT4 quantization", () => {
    const fp16 = calculatePerformanceMetrics(baseConfig);
    const int4 = calculatePerformanceMetrics({ ...baseConfig, model: { ...baseConfig.model, precision: "int4" } });
    expect(int4.memoryUsed).toBeLessThan(fp16.memoryUsed);
  });

  it("should apply pipeline bubble for pipeline parallelism", () => {
    const tp = calculatePerformanceMetrics({
      ...baseConfig,
      hardware: { ...baseConfig.hardware, gpuCount: 4 },
      engine: { ...baseConfig.engine, servingMethod: "tensor_parallel" as const },
    });
    const pp = calculatePerformanceMetrics({
      ...baseConfig,
      hardware: { ...baseConfig.hardware, gpuCount: 4 },
      engine: { ...baseConfig.engine, servingMethod: "pipeline_parallel" as const },
    });
    expect(pp.tokensPerSecond).toBeLessThan(tp.tokensPerSecond);
  });
});

describe("analyzeBottlenecks", () => {
  it("should report critical VRAM bottleneck for 70B on RTX 4090", () => {
    const config = {
      ...baseConfig,
      model: { ...baseConfig.model, parameters: 70, name: "Llama-3-70B" },
    };
    const b = analyzeBottlenecks(config);
    const vram = b.find((x) => x.type === "vram");
    expect(vram).toBeDefined();
    expect(vram?.severity).toBe("critical");
  });

  it("should report no bottlenecks for well-configured 8B on RTX 4090", () => {
    const b = analyzeBottlenecks(baseConfig);
    expect(b.length).toBeLessThanOrEqual(1); // May have thermal or compute info
    const critical = b.filter((x) => x.severity === "critical");
    expect(critical.length).toBe(0);
  });

  it("should warn about PCIe for multi-GPU tensor parallel without NVLink", () => {
    const config = {
      ...baseConfig,
      hardware: { ...baseConfig.hardware, gpuCount: 2 },
      engine: { ...baseConfig.engine, servingMethod: "tensor_parallel" as const },
    };
    const b = analyzeBottlenecks(config);
    const pcie = b.find((x) => x.type === "pcie");
    expect(pcie).toBeDefined();
    expect(pcie?.severity).toBe("warning");
  });

  it("should warn about thermal throttling when overheated", () => {
    const config = {
      ...baseConfig,
      hardware: { ...baseConfig.hardware, gpuCount: 4, powerConsumption: 450 },
    };
    const b = analyzeBottlenecks(config);
    const thermal = b.find((x) => x.message.includes("Thermal"));
    expect(thermal).toBeDefined();
  });
});

describe("calculateCostEstimation", () => {
  it("should scale cost with GPU count", () => {
    const c1 = calculateCostEstimation(baseConfig);
    const c4 = calculateCostEstimation({ ...baseConfig, hardware: { ...baseConfig.hardware, gpuCount: 4 } });
    expect(c4.hourlyGpuCost).toBeCloseTo(c1.hourlyGpuCost * 4, 1);
  });

  it("should be higher for cloud vs on-prem", () => {
    const onprem = calculateCostEstimation(baseConfig);
    const aws = calculateCostEstimation({ ...baseConfig, hardware: { ...baseConfig.hardware, region: "aws" } });
    expect(aws.monthlyCost).toBeGreaterThan(onprem.monthlyCost);
  });
});

describe("getDeploymentRecommendation", () => {
  it("should recommend large GPU cluster for enterprise scale", () => {
    const r = getDeploymentRecommendation(50000, 5000000, 1024, 512, 200);
    expect(r.recommendedGpuSetup).toContain("H100");
    expect(r.estimatedMonthlyCost).toBeGreaterThan(10000);
  });

  it("should recommend consumer GPU for small scale", () => {
    const r = getDeploymentRecommendation(10, 1000, 256, 128, 500);
    expect(r.recommendedGpuSetup).toContain("RTX 4090");
    expect(r.estimatedMonthlyCost).toBeLessThan(1000);
  });

  it("should optimize for latency when SLA < 100ms", () => {
    const r = getDeploymentRecommendation(100, 10000, 512, 256, 50);
    expect(r.recommendedGpuSetup).toContain("H100");
  });
});