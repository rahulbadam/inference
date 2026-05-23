import { useStore } from "../../store/useStore";
import Tooltip from "../Tooltip";
import { Settings2, Zap, LayoutGrid, Database, GitBranch, Radio } from "lucide-react";

const ENGINES = ["vLLM", "TensorRT-LLM", "Ollama", "llama.cpp", "TGI", "SGLang", "ONNX Runtime", "DeepSpeed"];
const SERVING_METHODS = ["single_gpu", "tensor_parallel", "pipeline_parallel", "distributed"];
const SCHEDULING = ["fcfs", "continuous_batching", "dynamic_batching"];
const KV_STRATEGIES = ["paged_attention", "offloading", "prefix_caching"];
const DECODING = ["greedy", "beam_search", "speculative_decoding"];

export default function EngineConfigPanel() {
  const config = useStore((s) => s.config);
  const updateEngine = useStore((s) => s.updateEngine);
  const learnMode = useStore((s) => s.learnMode);
  const engine = config.engine;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Settings2 size={22} className="text-accent-cyan" />
          Inference Engine
        </h2>
        {learnMode && (
          <span className="text-xs text-accent-purple bg-accent-purple/10 px-2 py-1 rounded border border-accent-purple/20">
            Optimize serving strategy and scheduling
          </span>
        )}
      </div>

      {/* Engine Selection */}
      <section className="glass-panel p-5">
        <label className="block text-sm font-medium text-text-secondary mb-3">Inference Engine</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ENGINES.map((eng) => (
            <button
              key={eng}
              onClick={() => updateEngine({ engine: eng })}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                engine.engine === eng
                  ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                  : "bg-surface-hover text-text-secondary border-border hover:border-text-muted"
              }`}
            >
              <div className="font-semibold">{eng}</div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {eng === "vLLM" && "PagedAttention · High throughput"}
                {eng === "TensorRT-LLM" && "NVIDIA optimized · Fastest"}
                {eng === "Ollama" && "Easy local deployment"}
                {eng === "llama.cpp" && "CPU/GPU · GGUF support"}
                {eng === "TGI" && "HuggingFace · Production"}
                {eng === "SGLang" && "Structured generation"}
                {eng === "ONNX Runtime" && "Cross-platform"}
                {eng === "DeepSpeed" && "Microsoft · Training+Inference"}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serving Method */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <LayoutGrid size={14} />
            <Tooltip term="tensor-parallelism">Serving Method</Tooltip>
          </label>
          <div className="space-y-2">
            {SERVING_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => updateEngine({ servingMethod: method as any })}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between ${
                  engine.servingMethod === method
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                <span className="capitalize font-semibold">{method.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-text-muted">
                  {method === "single_gpu" && "One GPU"}
                  {method === "tensor_parallel" && "Shard weights across GPUs"}
                  {method === "pipeline_parallel" && "Shard layers across GPUs"}
                  {method === "distributed" && "Multi-node cluster"}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Scheduling */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Zap size={14} />
            <Tooltip term="continuous-batching">Scheduling Strategy</Tooltip>
          </label>
          <div className="space-y-2">
            {SCHEDULING.map((sched) => (
              <button
                key={sched}
                onClick={() => updateEngine({ scheduling: sched as any })}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between ${
                  engine.scheduling === sched
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                <span className="capitalize font-semibold">{sched.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-text-muted">
                  {sched === "fcfs" && "Simple queue"}
                  {sched === "continuous_batching" && "In-flight batching · Best throughput"}
                  {sched === "dynamic_batching" && "Adaptive batch sizes"}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* KV Cache Strategy */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Database size={14} />
            <Tooltip term="kv-cache">KV Cache Strategy</Tooltip>
          </label>
          <div className="space-y-2">
            {KV_STRATEGIES.map((strategy) => (
              <button
                key={strategy}
                onClick={() => updateEngine({ kvCacheStrategy: strategy as any })}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between ${
                  engine.kvCacheStrategy === strategy
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                <span className="capitalize font-semibold">{strategy.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-text-muted">
                  {strategy === "paged_attention" && "vLLM · Zero waste"}
                  {strategy === "offloading" && "CPU offload · Slower"}
                  {strategy === "prefix_caching" && "Reuse prefixes · Faster TTFT"}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Decoding Strategy */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <GitBranch size={14} />
            <Tooltip term="speculative-decoding">Decoding Strategy</Tooltip>
          </label>
          <div className="space-y-2">
            {DECODING.map((dec) => (
              <button
                key={dec}
                onClick={() => updateEngine({ decoding: dec as any })}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center justify-between ${
                  engine.decoding === dec
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                <span className="capitalize font-semibold">{dec.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-text-muted">
                  {dec === "greedy" && "Deterministic · Fastest"}
                  {dec === "beam_search" && "Higher quality · Slower"}
                  {dec === "speculative_decoding" && "~2.5x speedup · Draft model"}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Streaming Toggle */}
      <section className="glass-panel p-5">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-accent-cyan" />
            <span className="text-sm font-medium text-text-secondary">Streaming Response</span>
          </div>
          <input
            type="checkbox"
            checked={engine.streaming}
            onChange={(e) => updateEngine({ streaming: e.target.checked })}
            className="w-5 h-5 accent-accent-cyan rounded"
          />
        </label>
        <p className="text-xs text-text-muted mt-2 ml-6">
          Stream tokens as they're generated rather than waiting for the full response. Improves perceived latency for users.
        </p>
      </section>
    </div>
  );
}