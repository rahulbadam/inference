import type { GpuSpec, RegionPricing, PrecisionInfo, PresetScenario, TooltipContent } from "../types";

export const PRECISION_INFO: Record<string, PrecisionInfo> = {
  fp32: { bitsPerParam: 32, qualityLossPct: 0, vramReductionPct: 0, speedImprovementPct: 0, perplexityImpact: 0 },
  fp16: { bitsPerParam: 16, qualityLossPct: 0.1, vramReductionPct: 50, speedImprovementPct: 80, perplexityImpact: 0.02 },
  bf16: { bitsPerParam: 16, qualityLossPct: 0.05, vramReductionPct: 50, speedImprovementPct: 85, perplexityImpact: 0.01 },
  int8: { bitsPerParam: 8, qualityLossPct: 1.5, vramReductionPct: 75, speedImprovementPct: 150, perplexityImpact: 0.5 },
  int4: { bitsPerParam: 4, qualityLossPct: 4, vramReductionPct: 87.5, speedImprovementPct: 220, perplexityImpact: 2.0 },
  gptq: { bitsPerParam: 4, qualityLossPct: 2.5, vramReductionPct: 87.5, speedImprovementPct: 200, perplexityImpact: 1.2 },
  awq: { bitsPerParam: 4, qualityLossPct: 1.8, vramReductionPct: 87.5, speedImprovementPct: 210, perplexityImpact: 0.8 },
  gguf: { bitsPerParam: 5, qualityLossPct: 2, vramReductionPct: 84, speedImprovementPct: 180, perplexityImpact: 1.0 },
};

export const GPU_SPECS: Record<string, GpuSpec> = {
  "T4": { name: "NVIDIA T4", vram: 16, bandwidth: 320, tensorCores: true, tflopsFp16: 65, tflopsInt8: 130, power: 70, pcieGen: 3, nvlink: false, releaseYear: 2018 },
  "L4": { name: "NVIDIA L4", vram: 24, bandwidth: 300, tensorCores: true, tflopsFp16: 120, tflopsInt8: 240, power: 72, pcieGen: 4, nvlink: false, releaseYear: 2023 },
  "A10": { name: "NVIDIA A10", vram: 24, bandwidth: 600, tensorCores: true, tflopsFp16: 125, tflopsInt8: 250, power: 150, pcieGen: 4, nvlink: false, releaseYear: 2021 },
  "A100-40GB": { name: "NVIDIA A100 40GB", vram: 40, bandwidth: 1555, tensorCores: true, tflopsFp16: 312, tflopsInt8: 624, power: 250, pcieGen: 4, nvlink: true, releaseYear: 2020 },
  "A100-80GB": { name: "NVIDIA A100 80GB", vram: 80, bandwidth: 2039, tensorCores: true, tflopsFp16: 312, tflopsInt8: 624, power: 300, pcieGen: 4, nvlink: true, releaseYear: 2020 },
  "H100-80GB": { name: "NVIDIA H100 80GB", vram: 80, bandwidth: 3350, tensorCores: true, tflopsFp16: 989, tflopsInt8: 1979, power: 350, pcieGen: 5, nvlink: true, releaseYear: 2022 },
  "H200-141GB": { name: "NVIDIA H200 141GB", vram: 141, bandwidth: 4900, tensorCores: true, tflopsFp16: 989, tflopsInt8: 1979, power: 400, pcieGen: 5, nvlink: true, releaseYear: 2024 },
  "RTX-4090": { name: "NVIDIA RTX 4090", vram: 24, bandwidth: 1008, tensorCores: true, tflopsFp16: 165, tflopsInt8: 330, power: 450, pcieGen: 4, nvlink: false, releaseYear: 2022 },
  "RTX-5090": { name: "NVIDIA RTX 5090", vram: 32, bandwidth: 1792, tensorCores: true, tflopsFp16: 380, tflopsInt8: 760, power: 575, pcieGen: 5, nvlink: false, releaseYear: 2025 },
  "MI300X": { name: "AMD MI300X", vram: 192, bandwidth: 5300, tensorCores: false, tflopsFp16: 1300, tflopsInt8: 2600, power: 750, pcieGen: 5, nvlink: false, releaseYear: 2023 },
  "M2-Ultra": { name: "Apple M2 Ultra", vram: 192, bandwidth: 800, tensorCores: false, tflopsFp16: 27, tflopsInt8: 54, power: 60, pcieGen: 4, nvlink: false, releaseYear: 2023 },
  "M3-Max": { name: "Apple M3 Max", vram: 128, bandwidth: 400, tensorCores: false, tflopsFp16: 18, tflopsInt8: 36, power: 50, pcieGen: 4, nvlink: false, releaseYear: 2023 },
};

export const GPU_MODELS_BY_VENDOR: Record<string, string[]> = {
  nvidia: ["T4", "L4", "A10", "A100-40GB", "A100-80GB", "H100-80GB", "H200-141GB", "RTX-4090", "RTX-5090"],
  amd: ["MI300X"],
  apple: ["M2-Ultra", "M3-Max"],
};

export const REGION_PRICING: Record<string, RegionPricing> = {
  aws: {
    gpuHourlyRate: { T4: 0.526, L4: 0.776, A10: 1.006, "A100-40GB": 2.5, "A100-80GB": 3.67, "H100-80GB": 8.8, "H200-141GB": 12.5, "RTX-4090": 2.0, "RTX-5090": 3.5, "MI300X": 10.0, "M2-Ultra": 4.0, "M3-Max": 3.0 },
    electricityRate: 0.12,
    overheadMultiplier: 1.15,
  },
  azure: {
    gpuHourlyRate: { T4: 0.55, L4: 0.8, A10: 1.05, "A100-40GB": 2.7, "A100-80GB": 3.9, "H100-80GB": 9.2, "H200-141GB": 13.0, "RTX-4090": 2.1, "RTX-5090": 3.6, "MI300X": 10.5, "M2-Ultra": 4.2, "M3-Max": 3.2 },
    electricityRate: 0.11,
    overheadMultiplier: 1.2,
  },
  gcp: {
    gpuHourlyRate: { T4: 0.5, L4: 0.75, A10: 0.95, "A100-40GB": 2.4, "A100-80GB": 3.5, "H100-80GB": 8.5, "H200-141GB": 12.0, "RTX-4090": 1.9, "RTX-5090": 3.4, "MI300X": 9.8, "M2-Ultra": 3.9, "M3-Max": 2.9 },
    electricityRate: 0.1,
    overheadMultiplier: 1.1,
  },
  onprem: {
    gpuHourlyRate: { T4: 0.1, L4: 0.15, A10: 0.2, "A100-40GB": 0.5, "A100-80GB": 0.7, "H100-80GB": 1.5, "H200-141GB": 2.0, "RTX-4090": 0.3, "RTX-5090": 0.5, "MI300X": 1.8, "M2-Ultra": 0.4, "M3-Max": 0.3 },
    electricityRate: 0.08,
    overheadMultiplier: 1.05,
  },
};

export const MODEL_PRESETS: Record<string, { parameters: number; hiddenSize: number; attentionHeads: number; kvHeads: number; layerCount: number; embeddingSize: number; vocabSize: number; type: "dense" | "moe"; defaultContext: number }> = {
  "Llama-3": { parameters: 8, hiddenSize: 4096, attentionHeads: 32, kvHeads: 8, layerCount: 32, embeddingSize: 4096, vocabSize: 128256, type: "dense", defaultContext: 8192 },
  "Llama-3-70B": { parameters: 70, hiddenSize: 8192, attentionHeads: 64, kvHeads: 8, layerCount: 80, embeddingSize: 8192, vocabSize: 128256, type: "dense", defaultContext: 8192 },
  "Llama-3-405B": { parameters: 405, hiddenSize: 16384, attentionHeads: 128, kvHeads: 8, layerCount: 126, embeddingSize: 16384, vocabSize: 128256, type: "dense", defaultContext: 131072 },
  "Mistral-7B": { parameters: 7, hiddenSize: 4096, attentionHeads: 32, kvHeads: 8, layerCount: 32, embeddingSize: 4096, vocabSize: 32768, type: "dense", defaultContext: 32768 },
  "Gemma-2B": { parameters: 2, hiddenSize: 2048, attentionHeads: 8, kvHeads: 1, layerCount: 18, embeddingSize: 2048, vocabSize: 256128, type: "dense", defaultContext: 8192 },
  "Gemma-7B": { parameters: 7, hiddenSize: 3072, attentionHeads: 16, kvHeads: 16, layerCount: 28, embeddingSize: 3072, vocabSize: 256128, type: "dense", defaultContext: 8192 },
  "DeepSeek-V3": { parameters: 671, hiddenSize: 7168, attentionHeads: 128, kvHeads: 128, layerCount: 61, embeddingSize: 7168, vocabSize: 102400, type: "moe", defaultContext: 128000 },
  "Qwen-2.5": { parameters: 7, hiddenSize: 3584, attentionHeads: 28, kvHeads: 4, layerCount: 28, embeddingSize: 3584, vocabSize: 151936, type: "dense", defaultContext: 32768 },
  "Phi-3": { parameters: 3.8, hiddenSize: 3072, attentionHeads: 32, kvHeads: 32, layerCount: 32, embeddingSize: 3072, vocabSize: 32064, type: "dense", defaultContext: 131072 },
  "Mixtral-8x7B": { parameters: 46.7, hiddenSize: 4096, attentionHeads: 32, kvHeads: 8, layerCount: 32, embeddingSize: 4096, vocabSize: 32000, type: "moe", defaultContext: 32768 },
  "Mixtral-8x22B": { parameters: 141, hiddenSize: 6144, attentionHeads: 48, kvHeads: 8, layerCount: 56, embeddingSize: 6144, vocabSize: 32000, type: "moe", defaultContext: 65536 },
};

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "chatgpt-scale",
    name: "ChatGPT Scale",
    description: "Enterprise-grade deployment handling millions of requests daily",
    icon: "rocket",
    config: {
      model: { name: "Llama-3-70B", parameters: 70, hiddenSize: 8192, attentionHeads: 64, kvHeads: 8, layerCount: 80, embeddingSize: 8192, precision: "fp16", vocabSize: 128256, contextWindow: 8192, type: "dense" },
      hardware: { vendor: "nvidia", gpuModel: "H100-80GB", gpuCount: 8, vramPerGpu: 80, memoryBandwidth: 3350, hasTensorCores: true, cpuCores: 64, cpuThreads: 128, cpuClockSpeed: 3.5, ramSize: 512, storageType: "nvme", pcieGen: 5, nvlink: true, infiniband: true, powerConsumption: 350, region: "aws" },
      engine: { engine: "vLLM", servingMethod: "tensor_parallel", scheduling: "continuous_batching", kvCacheStrategy: "paged_attention", decoding: "greedy", streaming: true },
      batchSize: 32, inputTokens: 512, outputTokens: 256, concurrentUsers: 1000,
    },
  },
  {
    id: "local-rtx4090",
    name: "Local RTX 4090",
    description: "Single GPU setup for personal research and development",
    icon: "cpu",
    config: {
      model: { name: "Llama-3", parameters: 8, hiddenSize: 4096, attentionHeads: 32, kvHeads: 8, layerCount: 32, embeddingSize: 4096, precision: "int4", vocabSize: 128256, contextWindow: 8192, type: "dense" },
      hardware: { vendor: "nvidia", gpuModel: "RTX-4090", gpuCount: 1, vramPerGpu: 24, memoryBandwidth: 1008, hasTensorCores: true, cpuCores: 16, cpuThreads: 32, cpuClockSpeed: 4.5, ramSize: 64, storageType: "nvme", pcieGen: 4, nvlink: false, infiniband: false, powerConsumption: 450, region: "onprem" },
      engine: { engine: "llama.cpp", servingMethod: "single_gpu", scheduling: "dynamic_batching", kvCacheStrategy: "paged_attention", decoding: "greedy", streaming: true },
      batchSize: 1, inputTokens: 1024, outputTokens: 512, concurrentUsers: 1,
    },
  },
  {
    id: "edge-deployment",
    name: "Edge AI Deployment",
    description: "Low-power edge device for IoT and embedded applications",
    icon: "wifi",
    config: {
      model: { name: "Gemma-2B", parameters: 2, hiddenSize: 2048, attentionHeads: 8, kvHeads: 1, layerCount: 18, embeddingSize: 2048, precision: "int4", vocabSize: 256128, contextWindow: 2048, type: "dense" },
      hardware: { vendor: "apple", gpuModel: "M3-Max", gpuCount: 1, vramPerGpu: 128, memoryBandwidth: 400, hasTensorCores: false, cpuCores: 16, cpuThreads: 16, cpuClockSpeed: 3.5, ramSize: 36, storageType: "nvme", pcieGen: 4, nvlink: false, infiniband: false, powerConsumption: 50, region: "onprem" },
      engine: { engine: "llama.cpp", servingMethod: "single_gpu", scheduling: "fcfs", kvCacheStrategy: "offloading", decoding: "greedy", streaming: true },
      batchSize: 1, inputTokens: 256, outputTokens: 128, concurrentUsers: 1,
    },
  },
  {
    id: "enterprise-serving",
    name: "Enterprise Serving",
    description: "High-throughput business-critical AI service",
    icon: "building",
    config: {
      model: { name: "Llama-3-70B", parameters: 70, hiddenSize: 8192, attentionHeads: 64, kvHeads: 8, layerCount: 80, embeddingSize: 8192, precision: "bf16", vocabSize: 128256, contextWindow: 32768, type: "dense" },
      hardware: { vendor: "nvidia", gpuModel: "A100-80GB", gpuCount: 4, vramPerGpu: 80, memoryBandwidth: 2039, hasTensorCores: true, cpuCores: 64, cpuThreads: 128, cpuClockSpeed: 3.0, ramSize: 512, storageType: "nvme", pcieGen: 4, nvlink: true, infiniband: true, powerConsumption: 300, region: "azure" },
      engine: { engine: "TensorRT-LLM", servingMethod: "tensor_parallel", scheduling: "continuous_batching", kvCacheStrategy: "paged_attention", decoding: "greedy", streaming: true },
      batchSize: 16, inputTokens: 1024, outputTokens: 512, concurrentUsers: 500,
    },
  },
  {
    id: "mobile-inference",
    name: "Mobile Inference",
    description: "Ultra-lightweight on-device inference",
    icon: "smartphone",
    config: {
      model: { name: "Phi-3", parameters: 3.8, hiddenSize: 3072, attentionHeads: 32, kvHeads: 32, layerCount: 32, embeddingSize: 3072, precision: "int4", vocabSize: 32064, contextWindow: 2048, type: "dense" },
      hardware: { vendor: "apple", gpuModel: "M3-Max", gpuCount: 1, vramPerGpu: 128, memoryBandwidth: 400, hasTensorCores: false, cpuCores: 12, cpuThreads: 12, cpuClockSpeed: 3.0, ramSize: 18, storageType: "nvme", pcieGen: 4, nvlink: false, infiniband: false, powerConsumption: 15, region: "onprem" },
      engine: { engine: "llama.cpp", servingMethod: "single_gpu", scheduling: "fcfs", kvCacheStrategy: "offloading", decoding: "greedy", streaming: false },
      batchSize: 1, inputTokens: 128, outputTokens: 64, concurrentUsers: 1,
    },
  },
  {
    id: "ultra-low-latency",
    name: "Ultra Low Latency",
    description: "Sub-100ms first token latency for real-time applications",
    icon: "zap",
    config: {
      model: { name: "Mistral-7B", parameters: 7, hiddenSize: 4096, attentionHeads: 32, kvHeads: 8, layerCount: 32, embeddingSize: 4096, precision: "fp16", vocabSize: 32768, contextWindow: 4096, type: "dense" },
      hardware: { vendor: "nvidia", gpuModel: "H100-80GB", gpuCount: 1, vramPerGpu: 80, memoryBandwidth: 3350, hasTensorCores: true, cpuCores: 32, cpuThreads: 64, cpuClockSpeed: 4.0, ramSize: 256, storageType: "nvme", pcieGen: 5, nvlink: false, infiniband: false, powerConsumption: 350, region: "gcp" },
      engine: { engine: "vLLM", servingMethod: "single_gpu", scheduling: "continuous_batching", kvCacheStrategy: "paged_attention", decoding: "greedy", streaming: true },
      batchSize: 4, inputTokens: 256, outputTokens: 128, concurrentUsers: 50,
    },
  },
];

export const TOOLTIP_CONTENT: Record<string, TooltipContent> = {
  "kv-cache": {
    term: "KV Cache",
    shortDescription: "Key-Value cache stores intermediate attention computations to avoid recomputation during autoregressive generation.",
    detailedExplanation: "During transformer inference, each generated token needs to attend to all previous tokens. Instead of recomputing key and value vectors for all previous tokens at every step, the KV cache stores these values in GPU memory. This dramatically speeds up generation but consumes significant VRAM proportional to batch size × sequence length × hidden dimension × layers × 2 (keys and values) × precision bytes. For long contexts, the KV cache can exceed the model weights in memory consumption.",
    example: "A 70B model with 8192 context and batch size 32 can use 200+ GB of KV cache memory alone.",
    formula: "KV Cache (GB) = 2 × layers × num_kv_heads × head_dim × seq_len × batch_size × bytes_per_element / 1e9",
  },
  "quantization": {
    term: "Quantization",
    shortDescription: "Reducing the numerical precision of model weights to decrease memory usage and increase inference speed.",
    detailedExplanation: "Neural network weights are typically stored in 32-bit floating point (FP32). Quantization converts these to lower precision formats like 16-bit (FP16/BF16), 8-bit integer (INT8), or 4-bit (INT4/GPTQ/AWQ). This reduces VRAM requirements and can increase throughput, but may slightly degrade output quality. Post-training quantization (PTQ) methods like GPTQ and AWQ minimize quality loss by optimizing the quantization process.",
    example: "Quantizing a 70B model from FP16 to INT4 reduces VRAM from 140GB to ~35GB, fitting on a single A100.",
    formula: "VRAM = parameters × bits_per_param / 8",
  },
  "batching": {
    term: "Batching",
    shortDescription: "Processing multiple requests together to improve GPU utilization and throughput.",
    detailedExplanation: "Without batching, each request underutilizes GPU compute units. Batching groups multiple requests into a single forward pass, amortizing fixed costs across all requests. Static batching waits for a batch to fill before processing. Dynamic batching processes requests as they arrive. Continuous batching (a la vLLM) goes further by allowing new requests to join and completed requests to leave between token generation steps, maximizing GPU utilization.",
    example: "Batch size 16 typically achieves 8-10x higher throughput than batch size 1, with only ~2x latency increase.",
    formula: "Throughput (tok/s) ≈ batch_size × tokens_per_second_single",
  },
  "ttft": {
    term: "TTFT (Time To First Token)",
    shortDescription: "The latency from receiving a prompt to generating the first output token.",
    detailedExplanation: "TTFT measures the prefill phase where the model processes the entire input prompt to compute the initial KV cache and first output token. This involves a full forward pass through all layers and is compute-bound (limited by GPU FLOPS). Longer prompts, larger models, and lower batch sizes increase TTFT. Optimizations like prefix caching can reduce TTFT for repeated prompts.",
    example: "A 70B model on H100 has ~50ms TTFT for 512 tokens, but ~800ms for 8K tokens.",
    formula: "TTFT ≈ 2 × parameters × prompt_tokens / (GPU_FLOPS × utilization)",
  },
  "tensor-parallelism": {
    term: "Tensor Parallelism",
    shortDescription: "Splitting individual weight matrices across multiple GPUs to fit large models.",
    detailedExplanation: "Tensor parallelism shards each layer's weights across N GPUs. During forward pass, each GPU computes a partial result, and all-gather operations combine them. This allows models larger than a single GPU's VRAM to run, but introduces communication overhead proportional to hidden_size × batch_size × sequence_length. Pipeline parallelism (an alternative) splits by layers instead.",
    example: "A 405B model requires 8× H100 GPUs in tensor parallelism at FP16.",
    formula: "Communication overhead ∝ hidden_size × seq_len × batch_size / interconnect_bandwidth",
  },
  "speculative-decoding": {
    term: "Speculative Decoding",
    shortDescription: "Using a smaller draft model to predict tokens, verified by the main model in parallel.",
    detailedExplanation: "Autoregressive generation is memory-bound (limited by memory bandwidth, not compute). Speculative decoding uses a small draft model (~10x faster) to generate K candidate tokens. The main model verifies all K tokens in a single forward pass. If all are accepted, K tokens are produced for the cost of ~1. On average, 2-3x speedups are achieved with minimal quality loss.",
    example: "Using a 1B draft model with a 70B main model achieves ~2.5x speedup in memory-bound regimes.",
    formula: "Speedup ≈ acceptance_rate × K / (1 + draft_overhead)",
  },
  "memory-bandwidth": {
    term: "Memory Bandwidth",
    shortDescription: "The rate at which data can be read from GPU memory, often the bottleneck in inference.",
    detailedExplanation: "For large models, inference is memory-bound: each token requires loading all model weights from VRAM. Memory bandwidth (GB/s) determines how fast this happens. H100 has 3.35 TB/s, while A100 has 2 TB/s. Newer GPUs like H200 increase bandwidth to reduce this bottleneck. Quantization helps by reducing the amount of data to load.",
    example: "A 70B FP16 model at 2 TB/s bandwidth achieves ~28 tok/s, limited purely by memory bandwidth.",
    formula: "Max tokens/s = bandwidth / (2 × parameters × bytes_per_param)",
  },
  "paged-attention": {
    term: "Paged Attention",
    shortDescription: "vLLM's memory-efficient attention mechanism that eliminates KV cache waste.",
    detailedExplanation: "Traditional KV cache allocates fixed-size contiguous blocks for each sequence, leading to massive internal fragmentation (up to 80% waste). Paged Attention treats KV cache like virtual memory: it allocates non-contiguous physical blocks and maps them via a block table. This enables: (1) near-zero waste, (2) efficient memory sharing between sequences, (3) dynamic batching without copying, and (4) up to 2-4x higher throughput.",
    example: "vLLM with Paged Attention serves 2-4x more concurrent requests than baseline implementations.",
    formula: "Memory waste reduced from O(seq_len²) to O(block_size)",
  },
  "moe": {
    term: "Mixture of Experts (MoE)",
    shortDescription: "Architecture using conditional computation where only a subset of parameters are active per token.",
    detailedExplanation: "MoE models replace dense feed-forward layers with sparse expert layers. Each token is routed to a small subset of experts (e.g., 2 out of 64). This allows massive parameter counts (e.g., 1.8T) while keeping active parameters manageable (e.g., 39B). Benefits include higher capacity without proportional compute cost. Challenges include load balancing, communication overhead for expert routing, and increased memory requirements for storing all expert weights.",
    example: "Mixtral 8x7B has 46.7B total parameters but only uses ~13B active parameters per token.",
    formula: "Active params = num_experts_per_token × expert_size",
  },
  "continuous-batching": {
    term: "Continuous Batching",
    shortDescription: "Dynamic scheduling that adds and removes requests between token generation steps.",
    detailedExplanation: "Unlike static batching which waits for all requests to finish before starting a new batch, continuous batching (also called iterative or in-flight batching) allows new requests to join the batch and completed requests to leave between every token generation step. This maintains higher GPU utilization throughout the inference process, especially with variable-length outputs. Implemented in vLLM, TensorRT-LLM, and SGLang.",
    example: "With variable output lengths (100-2000 tokens), continuous batching achieves 10-20x better GPU utilization than static batching.",
    formula: "GPU utilization ∝ avg(batch_size) / max(batch_size)",
  },
  "context-window": {
    term: "Context Window",
    shortDescription: "The maximum number of tokens a model can process in a single forward pass.",
    detailedExplanation: "The context window (or sequence length) determines how much text the model can 'see' at once. Larger contexts enable document understanding, long conversations, and RAG with extensive retrieved content. However, attention computation scales quadratically with sequence length (O(n²)), and KV cache memory scales linearly. Techniques like RoPE scaling, ALiBi, and sparse attention aim to extend context windows efficiently.",
    example: "Expanding from 4K to 128K context increases KV cache memory by 32x for the same batch size.",
    formula: "Attention FLOPs ∝ batch_size × seq_len² × hidden_size",
  },
};