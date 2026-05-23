import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { TOOLTIP_CONTENT } from "../data/constants";

interface TooltipProps {
  term: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export default function Tooltip({ term, children, iconOnly = false }: TooltipProps) {
  const [show, setShow] = useState(false);
  const content = TOOLTIP_CONTENT[term];

  if (!content) return <>{children}</>;

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children}
      <button
        className="inline-flex text-text-muted hover:text-accent-cyan transition-colors cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <Info size={14} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 glass-panel p-4 text-sm shadow-xl"
            style={{ minWidth: iconOnly ? 320 : undefined }}
          >
            <div className="font-semibold text-accent-cyan mb-1">{content.term}</div>
            <p className="text-text-secondary text-xs leading-relaxed mb-2">{content.shortDescription}</p>
            <p className="text-text-muted text-xs leading-relaxed mb-2">{content.detailedExplanation}</p>
            {content.example && (
              <div className="text-accent-yellow text-xs italic border-l-2 border-accent-yellow/30 pl-2 mt-2">
                Example: {content.example}
              </div>
            )}
            {content.formula && (
              <div className="text-accent-purple text-xs font-mono mt-2 bg-surface px-2 py-1 rounded">
                {content.formula}
              </div>
            )}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-surface border-r border-b border-border" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}