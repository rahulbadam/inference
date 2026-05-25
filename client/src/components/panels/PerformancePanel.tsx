import { useStore } from "../../store/useStore";
import InfoTip from "../InfoTip";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Timer, Gauge, Thermometer, Loader, Zap, Activity } from "lucide-react";

const COLORS = ["#22d3ee", "#c084fc", "#34d399", "#fb923c", "#f87171", "#facc15", "#60a5fa"];

// Seeded pseudo-random for consistent throughput simulation
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function PerformancePanel() {
  const metrics = useStore((s) => s.metrics);

  const latencyData = [
    { name: "P50", value: metrics.latencyP50 },
    { name: "P95", value: metrics.latencyP95 },
    { name: "P99", value: metrics.latencyP99 },
  ];

  const utilizationData = [
    { name: "Compute", value: metrics.gpuUtilization },
    { name: "Idle", value: 100 - metrics.gpuUtilization },
  ];

  const memoryData = [
    { name: "Used", value: metrics.memoryUsed },
    { name: "Free", value: Math.max(0, metrics.memoryTotal - metrics.memoryUsed) },
  ];

  // Use seeded random based on throughput for deterministic visual
  const throughputOverTime = Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 5}s`,
    throughput: Math.round(metrics.throughput * (0.7 + seededRandom(i + metrics.throughput) * 0.6)),
  }));

  const metricCards = [
    { label: "TTFT", value: `${metrics.ttft} ms`, tip: "ttft", icon: <Timer size={18} />, color: "text-accent-cyan" },
    { label: "Tokens/s", value: `${metrics.tokensPerSecond}`, tip: "tokens-per-second", icon: <Zap size={18} />, color: "text-accent-green" },
    { label: "Throughput", value: `${metrics.throughput}/s`, tip: "throughput", icon: <Activity size={18} />, color: "text-accent-purple" },
    { label: "GPU Util", value: `${metrics.gpuUtilization}%`, tip: "gpu-utilization", icon: <Gauge size={18} />, color: "text-accent-orange" },
    { label: "Thermal", value: `${metrics.thermalEstimate}°C`, tip: "thermal", icon: <Thermometer size={18} />, color: "text-accent-red" },
    { label: "Queue Wait", value: `${metrics.queueWaitTime} ms`, tip: "queue-wait", icon: <Loader size={18} />, color: "text-accent-yellow" },
  ];

  const tooltipStyle = { background: "#11121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e6e7ee" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Activity size={22} className="text-accent-cyan" />
          Performance Metrics
        </h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {metricCards.map((card) => (
          <div key={card.label} className="metric-card text-center">
            <div className={`flex justify-center mb-2 ${card.color}`}>{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 flex justify-center">
              <InfoTip term={card.tip}>{card.label}</InfoTip>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Distribution */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
            <InfoTip term="latency-p50">Latency Distribution (ms)</InfoTip>
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {latencyData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* GPU Utilization */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
            <InfoTip term="gpu-utilization">GPU Utilization</InfoTip>
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={utilizationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                <Cell fill="#22d3ee" />
                <Cell fill="rgba(255,255,255,0.06)" />
              </Pie>
              <RechartsTooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-4">
            <span className="text-2xl font-bold text-accent-cyan">{metrics.gpuUtilization}%</span>
          </div>
        </section>

        {/* Memory Usage */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
            <InfoTip term="vram">VRAM Usage (GB)</InfoTip>
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={memoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                <Cell fill="#c084fc" />
                <Cell fill="rgba(255,255,255,0.06)" />
              </Pie>
              <RechartsTooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-4">
            <span className="text-2xl font-bold text-accent-purple">{metrics.memoryUsed}/{metrics.memoryTotal}</span>
            <span className="text-xs text-text-muted ml-1">GB</span>
          </div>
        </section>

        {/* Throughput Over Time */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
            <InfoTip term="throughput">Throughput Simulation</InfoTip>
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={throughputOverTime}>
              <defs>
                <linearGradient id="tpColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="throughput" stroke="#34d399" fillOpacity={1} fill="url(#tpColor)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Detailed Metrics Table */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Detailed Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: "KV Cache Used", value: `${metrics.kvCacheUsed} GB`, tip: "kv-cache" },
            { label: "Max Concurrency", value: `${metrics.maxConcurrency} req`, tip: "concurrency" },
            { label: "Batch Efficiency", value: `${metrics.batchEfficiency}%`, tip: "batch-efficiency" },
            { label: "Power Usage", value: `${metrics.powerUsage} W`, tip: "power" },
            { label: "Model Load Time", value: `${metrics.modelLoadTime} s`, tip: "model-load-time" },
            { label: "Cold Start", value: `${metrics.coldStartTime} ms`, tip: "cold-start" },
            { label: "Latency P50", value: `${metrics.latencyP50} ms`, tip: "latency-p50" },
            { label: "Latency P95", value: `${metrics.latencyP95} ms`, tip: "latency-p95" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-hover rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-text-muted text-xs"><InfoTip term={item.tip}>{item.label}</InfoTip></span>
              <span className="text-text-primary font-mono font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}