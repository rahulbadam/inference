import { useStore } from "../store/useStore";
import { PRESET_SCENARIOS } from "../data/constants";
import { Rocket, Cpu, Wifi, Building2, Smartphone, Zap } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  rocket: <Rocket size={16} />,
  cpu: <Cpu size={16} />,
  wifi: <Wifi size={16} />,
  building: <Building2 size={16} />,
  smartphone: <Smartphone size={16} />,
  zap: <Zap size={16} />,
};

export default function PresetBar() {
  const loadPreset = useStore((s) => s.loadPreset);

  return (
    <div className="bg-surface border-b border-border px-6 py-3">
      <div className="flex items-center gap-4 overflow-x-auto">
        <span className="text-text-muted text-xs font-medium shrink-0 uppercase tracking-wider">Presets</span>
        {PRESET_SCENARIOS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => loadPreset(preset.config)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-hover hover:bg-surface-active border border-border hover:border-accent-cyan/30 text-text-secondary hover:text-text-primary text-xs font-medium transition-all whitespace-nowrap"
          >
            <span className="text-accent-cyan">{iconMap[preset.icon]}</span>
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}