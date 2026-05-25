import { useState } from "react";
import { useStore } from "../../store/useStore";
import { getDeploymentRecommendation } from "../../lib/simulation";
import { Rocket, Users, Activity, Clock, MessageSquare, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export default function DeployPanel() {
  const metrics = useStore((s) => s.metrics);
  const [inputs, setInputs] = useState({
    expectedUsers: 100,
    dailyRequests: 10000,
    avgPromptSize: 512,
    avgOutputTokens: 256,
    slaTargetMs: 200,
  });

  const recommendation = getDeploymentRecommendation(
    inputs.expectedUsers,
    inputs.dailyRequests,
    inputs.avgPromptSize,
    inputs.avgOutputTokens,
    inputs.slaTargetMs
  );

  const meetsSLA = metrics.latencyP50 <= inputs.slaTargetMs;
  const canHandleLoad = metrics.maxConcurrency >= Math.ceil(inputs.expectedUsers / 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Rocket size={22} className="text-accent-cyan" />
          Deployment Recommendation
        </h2>
      </div>

      {/* Input Requirements */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Your Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: "Expected Users", value: inputs.expectedUsers, icon: <Users size={14} />, key: "expectedUsers", min: 1, max: 1000000 },
            { label: "Daily Requests", value: inputs.dailyRequests, icon: <Activity size={14} />, key: "dailyRequests", min: 1, max: 100000000 },
            { label: "Avg Prompt Size", value: inputs.avgPromptSize, icon: <MessageSquare size={14} />, key: "avgPromptSize", min: 1, max: 128000 },
            { label: "Avg Output Tokens", value: inputs.avgOutputTokens, icon: <MessageSquare size={14} />, key: "avgOutputTokens", min: 1, max: 128000 },
            { label: "SLA Target (ms)", value: inputs.slaTargetMs, icon: <Clock size={14} />, key: "slaTargetMs", min: 10, max: 10000 },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs text-text-muted flex items-center gap-1 mb-1">
                {field.icon}
                {field.label}
              </label>
              <input
                type="number"
                min={field.min}
                max={field.max}
                value={field.value}
                onChange={(e) => setInputs((p) => ({ ...p, [field.key]: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Recommendation Card */}
      <section className="glass-panel p-6 border border-accent-cyan/30 glow-cyan">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={24} className="text-accent-cyan" />
          <div>
            <h3 className="text-lg font-bold text-accent-cyan">Recommended Setup</h3>
            <p className="text-xs text-text-muted">Confidence: {(recommendation.confidence * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="text-[10px] text-text-muted uppercase mb-1">GPU Setup</div>
            <div className="text-sm font-semibold text-text-primary">{recommendation.recommendedGpuSetup}</div>
          </div>
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="text-[10px] text-text-muted uppercase mb-1">Inference Engine</div>
            <div className="text-sm font-semibold text-text-primary">{recommendation.recommendedEngine}</div>
          </div>
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="text-[10px] text-text-muted uppercase mb-1">Quantization</div>
            <div className="text-sm font-semibold text-accent-purple uppercase">{recommendation.recommendedQuantization}</div>
          </div>
          <div className="bg-surface-hover rounded-lg p-4">
            <div className="text-[10px] text-text-muted uppercase mb-1">Batching Strategy</div>
            <div className="text-sm font-semibold text-text-primary">{recommendation.recommendedBatching}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <DollarSign size={16} className="text-accent-green" />
          <span className="text-accent-green font-bold text-lg">${recommendation.estimatedMonthlyCost.toLocaleString()}</span>
          <span className="text-text-muted text-sm">/ month estimated</span>
        </div>
      </section>

      {/* Current Config vs Requirement */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Current Config vs Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-lg p-4 border ${meetsSLA ? "bg-accent-green/10 border-accent-green/30" : "bg-accent-red/10 border-accent-red/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              {meetsSLA ? <CheckCircle2 size={16} className="text-accent-green" /> : <AlertCircle size={16} className="text-accent-red" />}
              <span className="text-sm font-semibold text-text-primary">Latency SLA</span>
            </div>
            <div className="text-xs text-text-secondary">
              Target: {inputs.slaTargetMs}ms | Current P50: {metrics.latencyP50}ms
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {meetsSLA ? "Current config meets SLA requirements." : `Need ${(inputs.slaTargetMs / metrics.latencyP50).toFixed(1)}× speedup.`}
            </div>
          </div>

          <div className={`rounded-lg p-4 border ${canHandleLoad ? "bg-accent-green/10 border-accent-green/30" : "bg-accent-red/10 border-accent-red/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              {canHandleLoad ? <CheckCircle2 size={16} className="text-accent-green" /> : <AlertCircle size={16} className="text-accent-red" />}
              <span className="text-sm font-semibold text-text-primary">Load Capacity</span>
            </div>
            <div className="text-xs text-text-secondary">
              Required: {Math.ceil(inputs.expectedUsers / 10)} concurrent | Current Max: {metrics.maxConcurrency}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {canHandleLoad
                ? "Current config can handle projected load."
                : `Need ${Math.ceil((inputs.expectedUsers / 10) / Math.max(metrics.maxConcurrency, 1))}× more capacity.`}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}