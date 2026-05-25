import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { MODEL_PRESETS, PRECISION_INFO } from "../../data/constants";
import type { Precision } from "../../types";
import InfoTip from "../InfoTip";
import { BrainCircuit, Hash, Layers, Ruler, Binary, Type } from "lucide-react";

function DebouncedRange({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), 100);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={localValue}
      onChange={(e) => setLocalValue(parseFloat(e.target.value))}
      className="w-full mt-3 accent-accent-cyan"
    />
  );
}

export default function ModelConfigPanel() {
  const config = useStore((s) => s.config);
  const updateModel = useStore((s) => s.updateModel);
  const learnMode = useStore((s) => s.learnMode);
  const model = config.model;
  const precision = PRECISION_INFO[model.precision];

  const paramOptions = [1, 3, 7, 8, 13, 32, 70, 405];
  const contextOptions = [2048, 4096, 8192, 32768, 131072, 1048576];

  const handleUpdateSimulation = useCallback(
    (key: string, val: number) => {
      useStore.getState().updateSimulation({ [key]: val });
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <BrainCircuit size={22} className="text-accent-cyan" />
          Model Configuration
        </h2>
        {learnMode && (
          <span className="text-xs text-accent-purple bg-accent-purple/10 px-2 py-1 rounded border border-accent-purple/20">
            Configure the AI model architecture and precision
          </span>
        )}
      </div>

      {/* Model Preset */}
      <section className="glass-panel p-5">
        <label className="block text-sm font-medium text-text-secondary mb-3">
          <InfoTip term="context-window">Model Preset</InfoTip>
        </label>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {Object.keys(MODEL_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => updateModel({ name })}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                model.name === name
                  ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                  : "bg-surface-hover text-text-secondary border-border hover:border-text-muted"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Hash size={14} />
            <InfoTip term="parameters">Parameters (Billions)</InfoTip>
          </label>
          <div className="flex flex-wrap gap-2">
            {paramOptions.map((p) => (
              <button
                key={p}
                onClick={() => updateModel({ parameters: p })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  model.parameters === p
                    ? "bg-accent-purple/15 text-accent-purple border-accent-purple/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                {p}B
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <DebouncedRange
              min={0.5}
              max={700}
              step={0.1}
              value={model.parameters}
              onChange={(v) => updateModel({ parameters: v })}
            />
            <span className="text-sm font-mono text-accent-cyan w-16 text-right">{model.parameters}B</span>
          </div>
        </section>

        {/* Context Window */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Ruler size={14} />
            <InfoTip term="context-window">Context Window</InfoTip>
          </label>
          <div className="flex flex-wrap gap-2">
            {contextOptions.map((c) => (
              <button
                key={c}
                onClick={() => updateModel({ contextWindow: c })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  model.contextWindow === c
                    ? "bg-accent-purple/15 text-accent-purple border-accent-purple/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                {c >= 1000 ? `${c / 1000}k` : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <DebouncedRange
              min={512}
              max={2000000}
              step={512}
              value={model.contextWindow}
              onChange={(v) => updateModel({ contextWindow: v })}
            />
            <span className="text-sm font-mono text-accent-cyan w-16 text-right">
              {model.contextWindow >= 1000 ? `${(model.contextWindow / 1000).toFixed(0)}k` : model.contextWindow}
            </span>
          </div>
        </section>

        {/* Precision */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Binary size={14} />
            <InfoTip term="quantization">Precision / Quantization</InfoTip>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(PRECISION_INFO).map(([key, info]) => (
              <button
                key={key}
                onClick={() => updateModel({ precision: key as Precision })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                  model.precision === key
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                <div className="font-semibold uppercase">{key}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{info.bitsPerParam}-bit</div>
              </button>
            ))}
          </div>
          {learnMode && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-surface-hover rounded px-2 py-1 text-center">
                <span className="text-accent-red">{precision.qualityLossPct}%</span> quality loss
              </div>
              <div className="bg-surface-hover rounded px-2 py-1 text-center">
                <span className="text-accent-green">{precision.vramReductionPct}%</span> VRAM saved
              </div>
              <div className="bg-surface-hover rounded px-2 py-1 text-center">
                <span className="text-accent-cyan">+{precision.speedImprovementPct}%</span> speed
              </div>
            </div>
          )}
        </section>

        {/* Model Architecture Details */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Layers size={14} />
            Architecture Details
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Hidden Size", value: model.hiddenSize, key: "hiddenSize", tip: "hidden-size" },
              { label: "Attention Heads", value: model.attentionHeads, key: "attentionHeads", tip: "attention-heads" },
              { label: "KV Heads", value: model.kvHeads, key: "kvHeads", tip: "kv-heads" },
              { label: "Layer Count", value: model.layerCount, key: "layerCount", tip: "layers" },
              { label: "Embedding Size", value: model.embeddingSize, key: "embeddingSize", tip: "hidden-size" },
              { label: "Vocab Size", value: model.vocabSize, key: "vocabSize" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] text-text-muted uppercase flex items-center gap-1">
                  {field.tip ? <InfoTip term={field.tip}>{field.label}</InfoTip> : field.label}
                </label>
                <input
                  type="number"
                  value={field.value}
                  onChange={(e) => updateModel({ [field.key]: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 px-3 py-1.5 bg-surface-hover border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Model Type */}
      <section className="glass-panel p-5">
        <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
          <Type size={14} />
          Model Type
        </label>
        <div className="flex gap-3">
          {(["dense", "moe"] as const).map((type) => (
            <button
              key={type}
              onClick={() => updateModel({ type })}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                model.type === type
                  ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                  : "bg-surface-hover text-text-secondary border-border"
              }`}
            >
              <div className="font-semibold capitalize">{type === "moe" ? "Mixture of Experts (MoE)" : "Dense Transformer"}</div>
              <div className="text-[10px] text-text-muted mt-1">
                {type === "moe"
                  ? "Sparse activation — massive params, lower active compute"
                  : "All parameters active per token"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Simulation Parameters */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Simulation Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: "Batch Size", value: config.batchSize, min: 1, max: 128, key: "batchSize", tip: "batch-size" },
            { label: "Input Tokens", value: config.inputTokens, min: 1, max: 128000, key: "inputTokens", tip: "context-window" },
            { label: "Output Tokens", value: config.outputTokens, min: 1, max: 128000, key: "outputTokens" },
            { label: "Concurrent Users", value: config.concurrentUsers, min: 1, max: 10000, key: "concurrentUsers", tip: "concurrency" },
          ].map((param) => (
            <div key={param.key}>
              <label className="text-xs text-text-muted flex items-center gap-1">
                {param.tip ? <InfoTip term={param.tip}>{param.label}</InfoTip> : param.label}
              </label>
              <div className="flex items-center gap-3 mt-1">
                <DebouncedRange
                  min={param.min}
                  max={param.max}
                  step={param.key === "batchSize" ? 1 : 16}
                  value={param.value}
                  onChange={(v) => handleUpdateSimulation(param.key, v)}
                />
                <span className="text-sm font-mono text-accent-cyan w-16 text-right">{param.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}