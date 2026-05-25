import { useStore } from "../store/useStore";
import type { TabId } from "../types";
import {
  Cpu, HardDrive, Settings2, BarChart3, DollarSign, AlertTriangle, MemoryStick,
  GitCompare, BookOpen, Layers, Sparkles, Play, Rocket, Undo2, Redo2
} from "lucide-react";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "model", label: "Model", icon: <Cpu size={18} /> },
  { id: "hardware", label: "Hardware", icon: <HardDrive size={18} /> },
  { id: "engine", label: "Engine", icon: <Settings2 size={18} /> },
  { id: "performance", label: "Performance", icon: <BarChart3 size={18} /> },
  { id: "cost", label: "Cost", icon: <DollarSign size={18} /> },
  { id: "bottleneck", label: "Bottlenecks", icon: <AlertTriangle size={18} /> },
  { id: "memory", label: "Memory", icon: <MemoryStick size={18} /> },
  { id: "tokens", label: "Token Sim", icon: <Play size={18} /> },
  { id: "deploy", label: "Deploy", icon: <Rocket size={18} /> },
  { id: "compare", label: "Compare", icon: <GitCompare size={18} /> },
  { id: "learn", label: "Learn", icon: <BookOpen size={18} /> },
  { id: "architecture", label: "Architecture", icon: <Layers size={18} /> },
];

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const learnMode = useStore((s) => s.learnMode);
  const toggleLearnMode = useStore((s) => s.toggleLearnMode);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());

  return (
    <aside className="w-16 md:w-60 bg-surface border-r border-border flex flex-col shrink-0 transition-all">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold gradient-text flex items-center gap-2">
          <Sparkles size={20} className="text-accent-cyan shrink-0" />
          <span className="hidden md:inline">AI Inference Lab</span>
        </h1>
        <p className="text-text-muted text-xs mt-1 hidden md:block">Interactive Simulation Platform</p>
      </div>

      <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.label}
            className={`w-full flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            }`}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Undo / Redo */}
      <div className="px-2 md:px-3 pb-2 flex gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            canUndo
              ? "bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-active"
              : "bg-surface text-text-muted/30 cursor-not-allowed"
          }`}
        >
          <Undo2 size={14} />
          <span className="hidden md:inline">Undo</span>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            canRedo
              ? "bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-active"
              : "bg-surface text-text-muted/30 cursor-not-allowed"
          }`}
        >
          <Redo2 size={14} />
          <span className="hidden md:inline">Redo</span>
        </button>
      </div>

      <div className="p-2 md:p-3 border-t border-border">
        <button
          onClick={toggleLearnMode}
          aria-label="Toggle Learning Mode"
          className={`w-full flex items-center justify-center md:justify-between px-2 md:px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            learnMode
              ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen size={14} />
            <span className="hidden md:inline">Learning Mode</span>
          </span>
          <span
            className={`w-8 h-4 rounded-full relative overflow-hidden transition-colors hidden md:block ${
              learnMode ? "bg-accent-purple" : "bg-text-muted/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                learnMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </button>
      </div>
    </aside>
  );
}
