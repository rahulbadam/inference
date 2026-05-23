import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, ArrowRight, Server, Cpu, Database, Radio, User, Boxes } from "lucide-react";

const stages = [
  { id: "user", label: "User Request", icon: <User size={20} />, desc: "Client sends a prompt via API" },
  { id: "lb", label: "Load Balancer", icon: <Boxes size={20} />, desc: "Distributes requests across servers" },
  { id: "gateway", label: "API Gateway", icon: <Server size={20} />, desc: "Authentication, rate limiting" },
  { id: "scheduler", label: "Scheduler", icon: <Database size={20} />, desc: "Batching and queue management" },
  { id: "gpu", label: "GPU Cluster", icon: <Cpu size={20} />, desc: "Parallel inference execution" },
  { id: "kv", label: "KV Cache", icon: <Database size={20} />, desc: "Attention state storage" },
  { id: "generate", label: "Token Generation", icon: <Cpu size={20} />, desc: "Autoregressive decoding loop" },
  { id: "stream", label: "Streaming Response", icon: <Radio size={20} />, desc: "Tokens sent back to client" },
];

export default function ArchitecturePanel() {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Layers size={22} className="text-accent-cyan" />
          System Architecture
        </h2>
      </div>

      {/* Animated Pipeline */}
      <section className="glass-panel p-6">
        <h3 className="text-sm font-medium text-text-secondary mb-6">Inference Request Flow</h3>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all min-w-[100px] ${
                  hoveredStage === stage.id
                    ? "bg-accent-cyan/15 border-accent-cyan/40"
                    : "bg-surface-hover border-border hover:border-text-muted"
                }`}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <div className={`mb-1 ${hoveredStage === stage.id ? "text-accent-cyan" : "text-text-muted"}`}>
                  {stage.icon}
                </div>
                <span className="text-[10px] font-semibold text-text-primary text-center leading-tight">{stage.label}</span>
                {hoveredStage === stage.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-full mb-2 w-48 glass-panel p-2 text-center z-10"
                  >
                    <p className="text-[10px] text-text-secondary">{stage.desc}</p>
                  </motion.div>
                )}
              </motion.div>
              {i < stages.length - 1 && (
                <ArrowRight size={14} className="text-text-muted shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Token Animation */}
        <div className="mt-8 relative h-8 bg-surface-hover rounded-full overflow-hidden">
          <motion.div
            className="absolute top-1 w-6 h-6 rounded-full bg-accent-cyan shadow-[0_0_12px_rgba(34,211,238,0.5)]"
            animate={{ left: ["0%", "95%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-text-muted">
            Token traveling through inference pipeline
          </div>
        </div>
      </section>

      {/* GPU Internals */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Inside a Single Forward Pass</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { label: "Input Embedding", color: "#22d3ee", detail: "Token IDs → vectors" },
            { label: "Transformer Block ×N", color: "#c084fc", detail: "Attention + FFN" },
            { label: "Attention Layer", color: "#34d399", detail: "QK^T · V computation" },
            { label: "Feed Forward", color: "#fb923c", detail: "MLP projection" },
            { label: "Output Head", color: "#f87171", detail: "Logits → next token" },
          ].map((block) => (
            <div key={block.label} className="bg-surface-hover rounded-lg p-3 text-center border border-border hover:border-transparent transition-all" style={{ borderColor: hoveredStage === block.label ? block.color : undefined }}>
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: block.color, boxShadow: `0 0 10px ${block.color}40` }} />
              <div className="text-xs font-semibold text-text-primary">{block.label}</div>
              <div className="text-[10px] text-text-muted mt-1">{block.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Flow Diagram */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Memory & Compute Flow</h3>
        <div className="relative bg-surface-hover rounded-xl p-6 min-h-[200px]">
          <svg viewBox="0 0 800 200" className="w-full h-auto">
            {/* Host Memory */}
            <rect x="20" y="20" width="140" height="60" rx="8" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="1" />
            <text x="90" y="45" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="600">Host RAM</text>
            <text x="90" y="65" textAnchor="middle" fill="#9ca3af" fontSize="9">Model weights loaded</text>

            {/* PCIe Arrow */}
            <path d="M170 50 L230 50" stroke="#6b7280" strokeWidth="2" strokeDasharray="4 2" />
            <polygon points="225,46 235,50 225,54" fill="#6b7280" />

            {/* GPU Memory */}
            <rect x="250" y="20" width="160" height="160" rx="8" fill="rgba(192,132,252,0.05)" stroke="#c084fc" strokeWidth="1" />
            <text x="330" y="40" textAnchor="middle" fill="#c084fc" fontSize="11" fontWeight="600">GPU VRAM</text>

            {/* Sub-blocks */}
            <rect x="265" y="55" width="130" height="30" rx="4" fill="rgba(192,132,252,0.1)" />
            <text x="330" y="75" textAnchor="middle" fill="#e6e7ee" fontSize="9">Weights (shard)</text>

            <rect x="265" y="95" width="130" height="30" rx="4" fill="rgba(52,211,153,0.1)" />
            <text x="330" y="115" textAnchor="middle" fill="#e6e7ee" fontSize="9">KV Cache (growing)</text>

            <rect x="265" y="135" width="130" height="30" rx="4" fill="rgba(251,146,60,0.1)" />
            <text x="330" y="155" textAnchor="middle" fill="#e6e7ee" fontSize="9">Activations</text>

            {/* Compute */}
            <path d="M430 90 L480 90" stroke="#6b7280" strokeWidth="2" />
            <polygon points="475,86 485,90 475,94" fill="#6b7280" />

            <rect x="500" y="50" width="120" height="80" rx="8" fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="1" />
            <text x="560" y="75" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="600">Tensor Cores</text>
            <text x="560" y="95" textAnchor="middle" fill="#9ca3af" fontSize="9">Matrix multiply</text>
            <text x="560" y="115" textAnchor="middle" fill="#9ca3af" fontSize="9">GEMM ops</text>

            {/* Output */}
            <path d="M630 90 L680 90" stroke="#6b7280" strokeWidth="2" />
            <polygon points="675,86 685,90 675,94" fill="#6b7280" />

            <rect x="700" y="60" width="80" height="60" rx="8" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1" />
            <text x="740" y="85" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600">Next</text>
            <text x="740" y="105" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="600">Token</text>
          </svg>
        </div>
      </section>
    </div>
  );
}