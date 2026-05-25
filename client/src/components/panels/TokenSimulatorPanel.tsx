import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Zap, Cpu, Database, ArrowRight, Layers } from "lucide-react";

const PIPELINE_STAGES = [
  { id: "prefill", label: "Prefill Phase", icon: <Layers size={16} />, desc: "Process input prompt — compute all token embeddings and initial KV cache" },
  { id: "attention", label: "Self-Attention", icon: <Cpu size={16} />, desc: "Q·K^T softmax · V across all layers — O(n²) compute for each layer" },
  { id: "ffn", label: "Feed-Forward", icon: <Zap size={16} />, desc: "Two linear projections with GeLU/SiLU activation — largest FLOP contributor" },
  { id: "kvcache", label: "KV Cache Store", icon: <Database size={16} />, desc: "Save computed keys and values for future tokens — grows per step" },
  { id: "sample", label: "Token Sample", icon: <ArrowRight size={16} />, desc: "Softmax over logits + sampling strategy → next token ID" },
];

export default function TokenSimulatorPanel() {
  const metrics = useStore((s) => s.metrics);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);

  const wordBank = ["The", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "and", "runs", "fast", "through", "green", "fields", "under", "bright", "sunlight"];
  const intervalMs = metrics.tokensPerSecond > 0 ? Math.max(50, 1000 / metrics.tokensPerSecond) : 500;

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= PIPELINE_STAGES.length - 1) {
          // Completed one token cycle
          setTokenCount((tc) => {
            const newTc = tc + 1;
            setTokens((t) => [...t.slice(-20), wordBank[newTc % wordBank.length]]);
            return newTc;
          });
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs / PIPELINE_STAGES.length);

    return () => clearInterval(timer);
  }, [isPlaying, intervalMs]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStage(0);
    setTokenCount(0);
    setTokens([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Play size={22} className="text-accent-cyan" />
          Token Generation Simulator
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40 text-sm font-medium hover:bg-accent-cyan/25 transition-all"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Simulate"}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-text-secondary border border-border text-sm font-medium hover:border-text-muted transition-all"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Pipeline Animation */}
      <section className="glass-panel p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Inference Pipeline Step-by-Step</h3>
        <div className="flex items-center justify-between gap-2 mb-8">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.id} className="flex-1 flex flex-col items-center relative">
              <motion.div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-colors ${
                  i === currentStage && isPlaying
                    ? "bg-accent-cyan/20 border-accent-cyan shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                    : i < currentStage
                    ? "bg-accent-green/10 border-accent-green/50"
                    : "bg-surface-hover border-border"
                }`}
                animate={i === currentStage && isPlaying ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                <span className={i === currentStage && isPlaying ? "text-accent-cyan" : i < currentStage ? "text-accent-green" : "text-text-muted"}>
                  {stage.icon}
                </span>
              </motion.div>
              <span className={`text-[10px] font-semibold mt-2 text-center ${
                i === currentStage && isPlaying ? "text-accent-cyan" : "text-text-muted"
              }`}>
                {stage.label}
              </span>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className={`absolute top-5 -right-1 w-full h-0.5 ${
                  i < currentStage ? "bg-accent-green/50" : "bg-border"
                }`} style={{ left: "60%", width: "80%" }} />
              )}
            </div>
          ))}
        </div>

        {/* Stage Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface-hover rounded-lg p-4 text-center"
          >
            <div className="text-accent-cyan font-semibold text-sm mb-1">
              {PIPELINE_STAGES[currentStage].label}
            </div>
            <p className="text-text-secondary text-xs">{PIPELINE_STAGES[currentStage].desc}</p>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Generated Tokens */}
      <section className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-secondary">Generated Tokens</h3>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>Tokens: <span className="text-accent-cyan font-mono">{tokenCount}</span></span>
            <span>Speed: <span className="text-accent-green font-mono">{metrics.tokensPerSecond} tok/s</span></span>
            <span>Latency: <span className="text-accent-purple font-mono">{metrics.latencyP50}ms/token</span></span>
          </div>
        </div>
        <div className="min-h-[80px] bg-surface-hover rounded-lg p-4 flex flex-wrap gap-1.5 items-start">
          {tokens.length === 0 ? (
            <span className="text-text-muted text-sm italic">Press Simulate to watch tokens generate...</span>
          ) : (
            <AnimatePresence>
              {tokens.map((token, i) => (
                <motion.span
                  key={`${i}-${token}`}
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    i === tokens.length - 1
                      ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                      : "bg-surface text-text-secondary border border-border"
                  }`}
                >
                  {token}
                </motion.span>
              ))}
            </AnimatePresence>
          )}
        </div>
        <div className="mt-3 h-1 bg-surface-hover rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-cyan rounded-full"
            animate={{ width: isPlaying ? ["0%", "100%"] : "0%" }}
            transition={{ duration: intervalMs / 1000, ease: "linear", repeat: Infinity }}
          />
        </div>
      </section>

      {/* Pipeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase mb-1">Prefill (TTFT)</div>
          <div className="text-2xl font-bold text-accent-cyan">{metrics.ttft}<span className="text-sm font-normal text-text-muted ml-1">ms</span></div>
          <div className="text-xs text-text-secondary mt-1">One-time cost per prompt</div>
        </section>
        <section className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase mb-1">Decode per Token</div>
          <div className="text-2xl font-bold text-accent-green">{metrics.latencyP50}<span className="text-sm font-normal text-text-muted ml-1">ms</span></div>
          <div className="text-xs text-text-secondary mt-1">Memory bandwidth bound</div>
        </section>
        <section className="glass-panel p-4">
          <div className="text-[10px] text-text-muted uppercase mb-1">KV Cache Growth</div>
          <div className="text-2xl font-bold text-accent-purple">{metrics.kvCacheUsed}<span className="text-sm font-normal text-text-muted ml-1">GB</span></div>
          <div className="text-xs text-text-secondary mt-1">Grows linearly with tokens</div>
        </section>
      </div>
    </div>
  );
}