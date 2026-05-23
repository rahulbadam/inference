import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import { analyzeBottlenecks } from "../../lib/simulation";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

export default function BottleneckPanel() {
  const config = useStore((s) => s.config);
  const bottlenecks = useMemo(() => analyzeBottlenecks(config), [config]);

  const severityIcon = {
    critical: <AlertTriangle size={18} className="text-accent-red" />,
    warning: <AlertCircle size={18} className="text-accent-orange" />,
    info: <Info size={18} className="text-accent-blue" />,
  };

  const severityBg = {
    critical: "bg-accent-red/10 border-accent-red/30",
    warning: "bg-accent-orange/10 border-accent-orange/30",
    info: "bg-accent-blue/10 border-accent-blue/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <AlertTriangle size={22} className="text-accent-cyan" />
          Bottleneck Analyzer
        </h2>
        {bottlenecks.length === 0 && (
          <span className="flex items-center gap-2 text-accent-green text-sm">
            <CheckCircle2 size={16} />
            No bottlenecks detected
          </span>
        )}
      </div>

      {bottlenecks.length === 0 ? (
        <section className="glass-panel p-8 text-center">
          <CheckCircle2 size={48} className="mx-auto text-accent-green mb-3" />
          <h3 className="text-lg font-semibold text-accent-green">Configuration looks optimal</h3>
          <p className="text-text-muted text-sm mt-2">No critical bottlenecks detected with current settings.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {bottlenecks.map((b, i) => (
            <section key={i} className={`glass-panel p-5 border ${severityBg[b.severity]}`}>
              <div className="flex items-start gap-3">
                {severityIcon[b.severity]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      b.severity === "critical" ? "text-accent-red" : b.severity === "warning" ? "text-accent-orange" : "text-accent-blue"
                    }`}>{b.severity}</span>
                    <span className="text-xs text-text-muted capitalize">{b.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-text-primary text-sm font-medium mb-2">{b.message}</p>

                  {/* Root Cause Analysis */}
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-accent-yellow font-semibold mb-2">
                      Root Cause Analysis
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-text-muted border-b border-border/50">
                            <th className="text-left py-1.5 pr-4 font-medium">Parameter</th>
                            <th className="text-left py-1.5 pr-4 font-medium">Current Value</th>
                            <th className="text-left py-1.5 pr-4 font-medium">Safe Threshold</th>
                            <th className="text-left py-1.5 font-medium">Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.rootCauses.map((rc, j) => (
                            <tr key={j} className="border-b border-border/20 last:border-0">
                              <td className="py-2 pr-4 text-text-secondary font-medium whitespace-nowrap">{rc.parameter}</td>
                              <td className="py-2 pr-4 text-accent-red font-mono whitespace-nowrap">{rc.currentValue}</td>
                              <td className="py-2 pr-4 text-accent-green whitespace-nowrap">{rc.threshold}</td>
                              <td className="py-2 text-text-muted">{rc.impact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-surface-hover rounded-lg p-3 text-xs text-text-secondary">
                    <span className="text-accent-cyan font-semibold">Suggestion:</span> {b.suggestion}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Bottleneck Types Legend */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Common Bottleneck Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { type: "VRAM", desc: "Insufficient GPU memory for model + KV cache" },
            { type: "Memory Bandwidth", desc: "Data transfer limits throughput" },
            { type: "CPU", desc: "Preprocessing or data loading bottleneck" },
            { type: "KV Cache Overflow", desc: "Context window exceeds cache capacity" },
            { type: "Network", desc: "Inter-node communication latency" },
            { type: "PCIe", desc: "GPU-to-GPU transfer bottleneck" },
          ].map((item) => (
            <div key={item.type} className="bg-surface-hover rounded-lg p-3">
              <div className="font-semibold text-text-primary mb-1">{item.type}</div>
              <div className="text-text-muted">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}