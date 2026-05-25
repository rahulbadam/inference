import { useStore } from "../../store/useStore";
import { Plus, Trash2, BarChart3, Download, Share2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ComparisonPanel() {
  const comparisons = useStore((s) => s.comparisons);
  const addComparison = useStore((s) => s.addComparison);
  const removeComparison = useStore((s) => s.removeComparison);
  const config = useStore((s) => s.config);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    addComparison(name.trim());
    setName("");
    if (comparisons.length >= 3) {
      setToast("Maximum 4 comparisons — oldest removed");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const exportJSON = () => {
    const data = {
      current: config,
      comparisons,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inference-lab-config.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Config exported as JSON");
    setTimeout(() => setToast(null), 3000);
  };

  const shareLink = () => {
    const encoded = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast("Shareable link copied to clipboard");
      setTimeout(() => setToast(null), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <BarChart3 size={22} className="text-accent-cyan" />
          Comparison Mode
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover text-text-secondary border border-border text-xs font-medium hover:border-text-muted transition-all"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={shareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover text-text-secondary border border-border text-xs font-medium hover:border-text-muted transition-all"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-accent-purple/90 text-white text-sm px-4 py-2 rounded-lg shadow-lg backdrop-blur flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          {toast}
        </div>
      )}

      {/* Add Comparison */}
      <section className="glass-panel p-5">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Name this configuration..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 px-4 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-accent-cyan/25 transition-all"
          >
            <Plus size={16} />
            Save Config
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">Save the current configuration to compare against others. Max 4 saved configs.</p>
      </section>

      {comparisons.length === 0 ? (
        <section className="glass-panel p-8 text-center">
          <BarChart3 size={48} className="mx-auto text-text-muted mb-3" />
          <h3 className="text-lg font-semibold text-text-secondary">No comparisons yet</h3>
          <p className="text-text-muted text-sm mt-2">Configure a model and save it here to compare.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {/* Comparison Table */}
          <section className="glass-panel p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted text-xs uppercase py-2 pr-4">Metric</th>
                  {comparisons.map((c) => (
                    <th key={c.id} className="text-left text-text-primary py-2 px-3 min-w-[140px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{c.name}</span>
                        <button onClick={() => removeComparison(c.id)} className="text-text-muted hover:text-accent-red transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {[
                  { label: "Model", key: (c: typeof comparisons[0]) => c.config.model.name },
                  { label: "GPU", key: (c: typeof comparisons[0]) => c.config.hardware.gpuModel },
                  { label: "Engine", key: (c: typeof comparisons[0]) => c.config.engine.engine },
                  { label: "Precision", key: (c: typeof comparisons[0]) => c.config.model.precision.toUpperCase() },
                  { label: "Batch Size", key: (c: typeof comparisons[0]) => c.config.batchSize },
                  { label: "TTFT", key: (c: typeof comparisons[0]) => `${c.metrics.ttft}ms`, highlight: true },
                  { label: "Tokens/s", key: (c: typeof comparisons[0]) => c.metrics.tokensPerSecond, highlight: true },
                  { label: "Throughput", key: (c: typeof comparisons[0]) => `${c.metrics.throughput}/s`, highlight: true },
                  { label: "GPU Util", key: (c: typeof comparisons[0]) => `${c.metrics.gpuUtilization}%`, highlight: true },
                  { label: "VRAM Used", key: (c: typeof comparisons[0]) => `${c.metrics.memoryUsed}GB`, highlight: true },
                  { label: "Max Conc.", key: (c: typeof comparisons[0]) => c.metrics.maxConcurrency },
                  { label: "Monthly Cost", key: (c: typeof comparisons[0]) => `$${c.costs.monthlyCost}`, highlight: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-border/30">
                    <td className="py-2.5 pr-4 text-text-muted text-xs">{row.label}</td>
                    {comparisons.map((c) => (
                      <td key={c.id} className={`py-2.5 px-3 font-mono ${row.highlight ? "text-accent-cyan" : ""}`}>
                        {row.key(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Bottleneck Comparison */}
          <section className="glass-panel p-5">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Bottleneck Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {comparisons.map((c) => (
                <div key={c.id} className="bg-surface-hover rounded-lg p-3">
                  <div className="font-semibold text-text-primary text-xs mb-2">{c.name}</div>
                  {c.bottlenecks.length === 0 ? (
                    <span className="text-accent-green text-xs">No issues</span>
                  ) : (
                    <div className="space-y-1">
                      {c.bottlenecks.map((b, i) => (
                        <div key={i} className={`text-[10px] px-2 py-1 rounded ${
                          b.severity === "critical" ? "bg-accent-red/10 text-accent-red" :
                          b.severity === "warning" ? "bg-accent-orange/10 text-accent-orange" :
                          "bg-accent-blue/10 text-accent-blue"
                        }`}>
                          {b.type.replace(/_/g, " ")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}