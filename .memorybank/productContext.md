# Product Context: AI Inference Lab

## User Experience Goals
1. **Immediate feedback** — Any configuration change instantly updates all metrics
2. **Zero learning curve** — Tooltips explain every term; presets provide starting points
3. **Visual clarity** — Charts and color-coded metrics make tradeoffs obvious
4. **Educational depth** — Users should understand WHY, not just WHAT

## Feature Modules

### 1. Model Configuration Panel
- **Purpose**: Define the AI model being simulated
- **Controls**: Model preset, parameters, context window, precision, architecture details, type (dense/MoE)
- **Outputs**: Model size estimate, quantization impact (quality loss %, VRAM reduction %, speed improvement %)

### 2. Hardware Configuration Panel
- **Purpose**: Select GPU and system infrastructure
- **Controls**: GPU vendor/model/count, region, CPU, RAM, storage, interconnect (NVLink, InfiniBand, PCIe)
- **Outputs**: GPU spec card with VRAM, bandwidth, TFLOPS, tensor cores, power draw

### 3. Inference Engine Panel
- **Purpose**: Choose serving framework and optimization strategies
- **Controls**: Engine (vLLM, TensorRT-LLM, Ollama, etc.), serving method, scheduling, KV cache strategy, decoding, streaming

### 4. Performance Output Panel
- **Purpose**: Display calculated performance metrics
- **Metrics**: TTFT, tokens/sec, throughput, latency P50/P95/P99, GPU utilization, thermal, queue wait
- **Visuals**: Bar charts (latency), donut charts (GPU util, VRAM), area chart (throughput over time)

### 5. Cost Estimation Panel
- **Purpose**: Calculate infrastructure costs
- **Metrics**: Hourly GPU cost, monthly total, per-request cost, per-million-token cost
- **Visuals**: Pie chart (monthly breakdown), bar chart (deployment comparison)

### 6. Bottleneck Analyzer
- **Purpose**: Detect and explain performance limitations
- **Detections**: VRAM, memory bandwidth, CPU, KV cache overflow, PCIe, network, compute
- **Output per bottleneck**: Severity, message, root cause table (parameter / current value / threshold / impact), suggestion

### 7. Memory Breakdown Visualizer
- **Purpose**: Show where GPU memory goes
- **Components**: Model weights, KV cache, activations, CUDA graphs, fragmentation, runtime overhead
- **Visuals**: Horizontal bar chart + stacked progress bars + formula display

### 8. Token Generation Simulator
- **Purpose**: Animated visualization of inference pipeline
- **Visuals**: Token traveling through User → LB → Gateway → Scheduler → GPU → KV Cache → Tokens

### 9. Comparison Mode
- **Purpose**: Save and compare multiple configurations
- **Features**: Save current config, compare metrics in table, compare bottlenecks side-by-side

### 10. Learning Center
- **Purpose**: Reference glossary for all AI inference concepts
- **Content**: 50+ terms with detailed explanation, formula, and real-world example

## User Journeys

### Journey 1: "Can I run Llama-70B on my RTX 4090?"
1. Select Llama-3-70B preset
2. Select RTX 4090 GPU
3. Observe critical VRAM bottleneck
4. Switch precision to INT4
5. See bottleneck resolve, check quality loss %
6. Save comparison (FP16 vs INT4)

### Journey 2: "What's the cheapest way to serve 1000 users?"
1. Go to Presets → Enterprise Serving
2. Check Performance tab for throughput
3. Check Cost tab for monthly estimate
4. Adjust batch size to maximize efficiency
5. Check Bottlenecks for any warnings
6. Save final configuration

### Journey 3: "Why is my inference slow?"
1. Set current configuration
2. Check Bottleneck Analyzer
3. Read root cause table to identify which parameter is wrong
4. Adjust based on suggestion
5. Watch metrics improve in real-time

## Key Metrics
- 13 dashboard modules
- 50+ educational tooltips
- 6 scenario presets
- 12 GPU models
- 8 inference engines
- 8 precision levels
- 7 bottleneck types analyzed