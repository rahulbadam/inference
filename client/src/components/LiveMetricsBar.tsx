import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { calculatePerformanceMetrics, calculateCostEstimation } from "../lib/simulation";
import { Activity, Clock, Gauge, DollarSign, Users } from "lucide-react";
import InfoTip from "./InfoTip";

export default function LiveMetricsBar() {
  const config = useStore((s) => s.config);

  const metrics = useMemo(() => calculatePerformanceMetrics(config), [config]);
  const costs = useMemo(() => calculateCostEstimation(config), [config]);

  const items = [
    { label: "TTFT", value: `${metrics.ttft}ms`, tip: "ttft", icon: <Clock size={14} className="text-accent-cyan" />, color: "text-accent-cyan" },
    { label: "Tokens/s", value: `${metrics.tokensPerSecond}`, tip: "tokens-per-second", icon: <Activity size={14} className="text-accent-green" />, color: "text-accent-green" },
    { label: "GPU Util", value: `${metrics.gpuUtilization}%`, tip: "gpu-utilization", icon: <Gauge size={14} className="text-accent-orange" />, color: "text-accent-orange" },
    { label: "VRAM", value: `${metrics.memoryUsed}/${metrics.memoryTotal}GB`, tip: "vram", icon: <Activity size={14} className="text-accent-purple" />, color: metrics.memoryUsed > metrics.memoryTotal * 0.9 ? "text-accent-red" : "text-accent-purple" },
    { label: "$/hr", value: `$${costs.hourlyGpuCost}`, tip: "cost-hourly", icon: <DollarSign size={14} className="text-accent-yellow" />, color: "text-accent-yellow" },
    { label: "Max Concurrency", value: `${metrics.maxConcurrency}`, tip: "concurrency", icon: <Users size={14} className="text-accent-blue" />, color: "text-accent-blue" },
  ];

  return (
    <div className="bg-surface/80 backdrop-blur border-b border-border px-6 py-2.5">
      <div className="grid grid-cols-6 gap-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            {item.icon}
            <div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">
                <InfoTip term={item.tip}>{item.label}</InfoTip>
              </div>
              <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}