import { TOOLTIP_CONTENT } from "../../data/constants";
import { EXTENDED_TOOLTIPS } from "../../data/tooltips";
import { BookOpen, Lightbulb } from "lucide-react";

export default function LearningPanel() {
  const allConcepts = Object.values({ ...TOOLTIP_CONTENT, ...EXTENDED_TOOLTIPS });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <BookOpen size={22} className="text-accent-cyan" />
          Learning Center
        </h2>
      </div>

      <p className="text-text-secondary text-sm">
        Hover over any term with a <span className="text-accent-cyan">ⓘ</span> icon anywhere in the app to see instant explanations.
        Every metric, GPU spec, and AI concept is documented here with formulas and real-world examples.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {allConcepts.map((concept) => (
          <section key={concept.term} className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-accent-yellow" />
              <h3 className="text-base font-bold text-accent-cyan">{concept.term}</h3>
            </div>
            <p className="text-sm text-text-secondary mb-3 leading-relaxed">{concept.detailedExplanation}</p>
            {concept.example && (
              <div className="bg-surface-hover rounded-lg p-3 text-xs text-accent-yellow italic border-l-2 border-accent-yellow/30">
                <span className="font-semibold not-italic">Example:</span> {concept.example}
              </div>
            )}
            {concept.formula && (
              <div className="mt-3 bg-surface-hover rounded-lg p-3">
                <div className="text-[10px] text-text-muted uppercase mb-1">Formula</div>
                <code className="text-xs text-accent-purple font-mono">{concept.formula}</code>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}