import { useStore } from "../../store/useStore";
import InfoTip from "../InfoTip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Zap, Server } from "lucide-react";

export default function CostPanel() {
  const costs = useStore((s) => s.costs);
  const metrics = useStore((s) => s.metrics);

  const monthlyBreakdown = [
    { name: "GPU Rental", value: costs.monthlyCost - costs.infrastructureOverhead - costs.electricityCost },
    { name: "Infrastructure", value: costs.infrastructureOverhead },
    { name: "Electricity", value: costs.electricityCost },
  ];

  const costComparison = [
    { name: "Self-Hosted", value: costs.monthlyCost * 0.4 },
    { name: "Cloud (Current)", value: costs.monthlyCost },
    { name: "Reserved Instance", value: costs.monthlyCost * 0.7 },
  ];

  const tooltipStyle = { background: "#11121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e6e7ee" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <DollarSign size={22} className="text-accent-cyan" />
          Cost Estimation
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hourly GPU Cost", value: `$${costs.hourlyGpuCost}`, tip: "cost-hourly", icon: <Server size={18} />, color: "text-accent-cyan" },
          { label: "Monthly Total", value: `$${costs.monthlyCost.toLocaleString()}`, tip: "cost-monthly", icon: <TrendingUp size={18} />, color: "text-accent-green" },
          { label: "Per Request", value: `$${costs.perRequestCost.toFixed(4)}`, tip: "cost-per-request", icon: <DollarSign size={18} />, color: "text-accent-purple" },
          { label: "Per 1M Tokens", value: `$${costs.perMillionTokenCost.toFixed(2)}`, tip: "cost-per-million-tokens", icon: <Zap size={18} />, color: "text-accent-yellow" },
        ].map((card) => (
          <div key={card.label} className="metric-card">
            <div className={`mb-2 ${card.color}`}>{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 flex justify-center">
              <InfoTip term={card.tip}>{card.label}</InfoTip>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Monthly Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={monthlyBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" label={({ name }) => name}>
                <Cell fill="#22d3ee" />
                <Cell fill="#c084fc" />
                <Cell fill="#fb923c" />
              </Pie>
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* Deployment Comparison */}
        <section className="glass-panel p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Deployment Strategy Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#9ca3af", fontSize: 11 }} width={110} />
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Cost Insights */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Cost Insights</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          {[
            { label: "Infrastructure Overhead", value: `$${costs.infrastructureOverhead.toFixed(2)}/mo` },
            { label: "Electricity Cost", value: `$${costs.electricityCost.toFixed(2)}/mo` },
            { label: "Effective Hourly Rate", value: `$${(costs.monthlyCost / 720).toFixed(3)}/hr` },
            { label: "Annual Projection", value: `$${(costs.monthlyCost * 12).toLocaleString()}/yr` },
          ].map((item) => (
            <div key={item.label} className="flex justify-between py-2 border-b border-border/50 last:border-0">
              <span>{item.label}</span>
              <span className="text-accent-cyan font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cost vs Performance Tradeoff */}
      <section className="glass-panel p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-3">Performance-Cost Efficiency</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-surface-hover rounded-lg px-4 py-3 text-center">
            <div className="text-xs text-text-muted">Tokens per Dollar</div>
            <div className="text-xl font-bold text-accent-green mt-1">
              {metrics.tokensPerSecond > 0 && costs.hourlyGpuCost > 0
                ? Math.round((metrics.throughput * 3600) / (costs.hourlyGpuCost * 1000)).toLocaleString()
                : "0"}k
            </div>
          </div>
          <div className="bg-surface-hover rounded-lg px-4 py-3 text-center">
            <div className="text-xs text-text-muted">GPU Util per $</div>
            <div className="text-xl font-bold text-accent-cyan mt-1">
              {costs.hourlyGpuCost > 0 ? (metrics.gpuUtilization / costs.hourlyGpuCost).toFixed(1) : "0"}%
            </div>
          </div>
          <div className="bg-surface-hover rounded-lg px-4 py-3 text-center">
            <div className="text-xs text-text-muted">Cost Efficiency</div>
            <div className="text-xl font-bold text-accent-purple mt-1">
              {metrics.batchEfficiency > 60 && metrics.gpuUtilization > 50 ? "Good" : "Poor"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}