import { useStore } from "../../store/useStore";
import { calculateMemoryBreakdown } from "../../lib/simulation";
import { useMemo } from "react";
import InfoTip from "../InfoTip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { MemoryStick } from "lucide-react";

export default function MemoryPanel() {
  const config = useStore((s) => s.config);
  const metrics = useStore((s) => s.metrics);
  const breakdown = useMemo(() => calculateMemoryBreakdown(config), [config]);

  const data = [
    { name: "Model Weights", value: breakdown.modelWeights, color: "#22d3ee", tip: "model-weights" },
    { name: "KV Cache", value: breakdown.kvCache, color: "#c084fc", tip: "kv-cache" },
    { name: "Activations", value: breakdown.activations, color: "#34d399", tip: "activations" },
    { name: "CUDA Graphs", value: breakdown.cudaGraphs, color: "#fb923c", tip: "cuda-graphs" },
    { name: "Fragmentation", value: breakdown.fragmentation, color: "#f87171", tip: "fragmentation" },
    { name: "Runtime", value: breakdown.runtimeOverhead, color: "#60a5fa", tip: "runtime-overhead" },
  ];

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const tooltipStyle = { background: "#11121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e6e7ee" };

  const vramStatus = metrics.memoryUsed > metrics.memoryTotal * 0.95
    ? { text: "Critical — OOM Risk", color: "text-accent-red" }
    : metrics.memoryUsed > metrics.memoryTotal * 0.8
    ? { text: "Warning — Near Capacity", color: "text-accent-orange" }
    : { text: "Healthy", color: "text-accent-green" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <MemoryStick size={22} className="text-accent-cyan" />
          Memory Breakdown
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${vramStatus.color}`}>{vramStatus.text}</span>
          <span className="text-sm text-text-muted">Total: <span className="text-accent-cyan font-mono font-bold">{total.toFixed(1)} GB</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
            <InfoTip term="vram">Allocation by Component</InfoTip>
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${v}GB`} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={100} />
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(2)} GB`} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Stacked Visual */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Visual Breakdown</h3>
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary flex items-center gap-1">
                    <InfoTip term={item.tip}>{item.name}</InfoTip>
                  </span>
                  <span className="text-text-primary font-mono">{item.value.toFixed(1)} GB ({((item.value / total) * 100).toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.value / total) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-3 bg-surface-hover rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Allocated</span>
              <span className="text-accent-cyan font-mono font-bold">{total.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-text-muted">Available VRAM</span>
              <span className="text-text-primary font-mono">{config.hardware.vramPerGpu * config.hardware.gpuCount} GB</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-text-muted">Headroom</span>
              <span className={`font-mono ${vramStatus.color}`}>
                {Math.max(0, config.hardware.vramPerGpu * config.hardware.gpuCount - total).toFixed(1)} GB
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Memory Formula */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Memory Calculation Formula</h3>
        <div className="bg-surface-hover rounded-lg p-4 font-mono text-xs text-text-secondary space-y-1">
          <div><InfoTip term="model-weights"><span className="text-accent-cyan">Model Weights</span></InfoTip> = params × bytes_per_param / parallelism</div>
          <div><InfoTip term="kv-cache"><span className="text-accent-purple">KV Cache</span></InfoTip> = 2 × layers × kv_heads × head_dim × seq_len × batch × bytes_per_param</div>
          <div><InfoTip term="activations"><span className="text-accent-green">Activations</span></InfoTip> = hidden_size × layers × batch × bytes_per_param × 0.5</div>
          <div><InfoTip term="fragmentation"><span className="text-accent-orange">Overhead</span></InfoTip> = CUDA graphs + runtime + fragmentation (~10%)</div>
        </div>
      </section>
    </div>
  );
}