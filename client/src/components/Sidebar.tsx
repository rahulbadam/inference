import { useStore } from "../store/useStore";
import type { TabId } from "../types";
import {
  Cpu, HardDrive, Settings2, BarChart3, DollarSign, AlertTriangle, MemoryStick,
  GitCompare, BookOpen, Layers, Sparkles
} from "lucide-react";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "model", label: "Model", icon: <Cpu size={18} /> },
  { id: "hardware", label: "Hardware", icon: <HardDrive size={18} /> },
  { id: "engine", label: "Engine", icon: <Settings2 size={18} /> },
  { id: "performance", label: "Performance", icon: <BarChart3 size={18} /> },
  { id: "cost", label: "Cost", icon: <DollarSign size={18} /> },
  { id: "bottleneck", label: "Bottlenecks", icon: <AlertTriangle size={18} /> },
  { id: "memory", label: "Memory", icon: <MemoryStick size={18} /> },
  { id: "compare", label: "Compare", icon: <GitCompare size={18} /> },
  { id: "learn", label: "Learn", icon: <BookOpen size={18} /> },
  { id: "architecture", label: "Architecture", icon: <Layers size={18} /> },
];

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const learnMode = useStore((s) => s.learnMode);
  const toggleLearnMode = useStore((s) => s.toggleLearnMode);

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold gradient-text flex items-center gap-2">
          <Sparkles size={20} className="text-accent-cyan" />
          AI Inference Lab
        </h1>
        <p className="text-text-muted text-xs mt-1">Interactive Simulation Platform</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={toggleLearnMode}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            learnMode
              ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen size={14} />
            Learning Mode
          </span>
          <span
            className={`w-8 h-4 rounded-full relative transition-colors ${
              learnMode ? "bg-accent-purple" : "bg-text-muted/30"
            }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                learnMode ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}