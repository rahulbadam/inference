import { useStore } from "../../store/useStore";
import { GPU_SPECS, GPU_MODELS_BY_VENDOR } from "../../data/constants";
import InfoTip from "../InfoTip";
import { HardDrive, Cpu, Zap, Globe, MemoryStick } from "lucide-react";

export default function HardwareConfigPanel() {
  const config = useStore((s) => s.config);
  const updateHardware = useStore((s) => s.updateHardware);
  const learnMode = useStore((s) => s.learnMode);
  const hw = config.hardware;
  const gpuSpec = GPU_SPECS[hw.gpuModel];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <HardDrive size={22} className="text-accent-cyan" />
          Hardware Configuration
        </h2>
        {learnMode && (
          <span className="text-xs text-accent-purple bg-accent-purple/10 px-2 py-1 rounded border border-accent-purple/20">
            Select GPUs, memory, and infrastructure
          </span>
        )}
      </div>

      {/* GPU Selection */}
      <section className="glass-panel p-5">
        <label className="block text-sm font-medium text-text-secondary mb-3">GPU Vendor</label>
        <div className="flex gap-3 mb-4">
          {(["nvidia", "amd", "apple"] as const).map((vendor) => (
            <button
              key={vendor}
              onClick={() => updateHardware({ vendor })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                hw.vendor === vendor
                  ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                  : "bg-surface-hover text-text-secondary border-border"
              }`}
            >
              {vendor}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-text-secondary mb-3">GPU Model</label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {GPU_MODELS_BY_VENDOR[hw.vendor]?.map((model) => {
            const spec = GPU_SPECS[model];
            return (
              <button
                key={model}
                onClick={() => updateHardware({ gpuModel: model })}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                  hw.gpuModel === model
                    ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                    : "bg-surface-hover text-text-secondary border-border hover:border-text-muted"
                }`}
              >
                <div className="font-semibold">{spec.name}</div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {spec.vram}GB VRAM · {spec.bandwidth}GB/s
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* GPU Spec Card */}
      {gpuSpec && (
        <section className="glass-panel p-5 glow-cyan">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-accent-cyan">{gpuSpec.name} Specifications</h3>
            <span className="text-[10px] text-text-muted">{gpuSpec.releaseYear}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "VRAM", value: `${gpuSpec.vram} GB`, tip: "vram-spec", icon: <MemoryStick size={14} /> },
              { label: "Memory Bandwidth", value: `${gpuSpec.bandwidth} GB/s`, tip: "bandwidth-spec", icon: <Zap size={14} /> },
              { label: "FP16 TFLOPS", value: `${gpuSpec.tflopsFp16}`, tip: "fp16-tflops", icon: <Cpu size={14} /> },
              { label: "INT8 TFLOPS", value: `${gpuSpec.tflopsInt8}`, tip: "fp16-tflops", icon: <Cpu size={14} /> },
              { label: "Tensor Cores", value: gpuSpec.tensorCores ? "Yes" : "No", tip: "tensor-cores", icon: <Cpu size={14} /> },
              { label: "Power Draw", value: `${gpuSpec.power}W`, tip: "power", icon: <Zap size={14} /> },
              { label: "PCIe Gen", value: `${gpuSpec.pcieGen}`, tip: "pcie", icon: <HardDrive size={14} /> },
              { label: "NVLink", value: gpuSpec.nvlink ? "Yes" : "No", tip: "nvlink", icon: <HardDrive size={14} /> },
            ].map((spec) => (
              <div key={spec.label} className="bg-surface-hover rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase">
                  {spec.icon}
                  <InfoTip term={spec.tip}>{spec.label}</InfoTip>
                </div>
                <div className="text-sm font-semibold text-text-primary mt-1">{spec.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPU Count */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3">GPU Count</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={16}
              step={1}
              value={hw.gpuCount}
              onChange={(e) => updateHardware({ gpuCount: parseInt(e.target.value) })}
              className="flex-1 accent-accent-cyan"
            />
            <span className="text-lg font-mono text-accent-cyan w-10 text-right">{hw.gpuCount}</span>
          </div>
          {hw.gpuCount > 1 && (
            <div className="mt-2 text-[10px] text-accent-yellow">
              Total VRAM: {hw.gpuCount * gpuSpec.vram}GB · Total Bandwidth: {hw.gpuCount * gpuSpec.bandwidth}GB/s
            </div>
          )}
        </section>

        {/* Region */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Globe size={14} />
            Cloud Region / Deployment
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["aws", "azure", "gcp", "onprem"] as const).map((region) => (
              <button
                key={region}
                onClick={() => updateHardware({ region })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                  hw.region === region
                    ? "bg-accent-purple/15 text-accent-purple border-accent-purple/40"
                    : "bg-surface-hover text-text-secondary border-border"
                }`}
              >
                {region === "onprem" ? "On-Premises" : region.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* CPU Config */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Cpu size={14} />
            CPU Configuration
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Cores", value: hw.cpuCores, min: 1, max: 128, key: "cpuCores" },
              { label: "Threads", value: hw.cpuThreads, min: 1, max: 256, key: "cpuThreads" },
              { label: "Clock (GHz)", value: hw.cpuClockSpeed, min: 1, max: 6, step: 0.1, key: "cpuClockSpeed" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] text-text-muted uppercase">{field.label}</label>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step || 1}
                  value={field.value}
                  onChange={(e) => updateHardware({ [field.key]: parseFloat(e.target.value) })}
                  className="w-full mt-1 px-3 py-1.5 bg-surface-hover border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-accent-cyan"
                />
              </div>
            ))}
          </div>
        </section>

        {/* RAM & Storage */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <MemoryStick size={14} />
            System Memory & Storage
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-text-muted uppercase">RAM Size (GB)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={8}
                  max={1024}
                  step={8}
                  value={hw.ramSize}
                  onChange={(e) => updateHardware({ ramSize: parseInt(e.target.value) })}
                  className="flex-1 accent-accent-cyan"
                />
                <span className="text-sm font-mono text-accent-cyan w-12 text-right">{hw.ramSize}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase">Storage Type</label>
              <div className="flex gap-2 mt-1">
                {(["sata_ssd", "nvme", "distributed"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateHardware({ storageType: type })}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all capitalize ${
                      hw.storageType === type
                        ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                        : "bg-surface-hover text-text-secondary border-border"
                    }`}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Interconnect */}
        <section className="glass-panel p-5">
          <label className="block text-sm font-medium text-text-secondary mb-3">Interconnect</label>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-secondary flex items-center gap-1">
                <InfoTip term="nvlink">NVLink Enabled</InfoTip>
              </span>
              <input
                type="checkbox"
                checked={hw.nvlink}
                onChange={(e) => updateHardware({ nvlink: e.target.checked })}
                className="w-4 h-4 accent-accent-cyan rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-text-secondary flex items-center gap-1">
                <InfoTip term="infiniband">InfiniBand</InfoTip>
              </span>
              <input
                type="checkbox"
                checked={hw.infiniband}
                onChange={(e) => updateHardware({ infiniband: e.target.checked })}
                className="w-4 h-4 accent-accent-cyan rounded"
              />
            </label>
            <div>
              <label className="text-[10px] text-text-muted uppercase flex items-center gap-1">
                <InfoTip term="pcie">PCIe Generation</InfoTip>
              </label>
              <div className="flex gap-2 mt-1">
                {[3, 4, 5].map((gen) => (
                  <button
                    key={gen}
                    onClick={() => updateHardware({ pcieGen: gen })}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      hw.pcieGen === gen
                        ? "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40"
                        : "bg-surface-hover text-text-secondary border-border"
                    }`}
                  >
                    PCIe {gen}.0
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}