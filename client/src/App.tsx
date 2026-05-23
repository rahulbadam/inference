import { useStore } from "./store/useStore";
import Sidebar from "./components/Sidebar";
import ModelConfigPanel from "./components/panels/ModelConfigPanel";
import HardwareConfigPanel from "./components/panels/HardwareConfigPanel";
import EngineConfigPanel from "./components/panels/EngineConfigPanel";
import PerformancePanel from "./components/panels/PerformancePanel";
import CostPanel from "./components/panels/CostPanel";
import BottleneckPanel from "./components/panels/BottleneckPanel";
import MemoryPanel from "./components/panels/MemoryPanel";
import ComparisonPanel from "./components/panels/ComparisonPanel";
import LearningPanel from "./components/panels/LearningPanel";
import ArchitecturePanel from "./components/panels/ArchitecturePanel";
import PresetBar from "./components/PresetBar";
import LiveMetricsBar from "./components/LiveMetricsBar";

function App() {
  const activeTab = useStore((s) => s.activeTab);

  const renderPanel = () => {
    switch (activeTab) {
      case "model": return <ModelConfigPanel />;
      case "hardware": return <HardwareConfigPanel />;
      case "engine": return <EngineConfigPanel />;
      case "performance": return <PerformancePanel />;
      case "cost": return <CostPanel />;
      case "bottleneck": return <BottleneckPanel />;
      case "memory": return <MemoryPanel />;
      case "compare": return <ComparisonPanel />;
      case "learn": return <LearningPanel />;
      case "architecture": return <ArchitecturePanel />;
      default: return <ModelConfigPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PresetBar />
        <LiveMetricsBar />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPanel()}
        </main>
      </div>
    </div>
  );
}

export default App;