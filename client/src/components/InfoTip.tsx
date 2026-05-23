import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { TOOLTIP_CONTENT } from "../data/constants";
import { EXTENDED_TOOLTIPS } from "../data/tooltips";

const ALL_TOOLTIPS = { ...TOOLTIP_CONTENT, ...EXTENDED_TOOLTIPS };
const GAP = 8;
const MARGIN = 12;
const W = 320;
const H_EST = 240;

type Placement = "bottom" | "top" | "left" | "right";

interface InfoTipProps {
  term: string;
  children: React.ReactNode;
}

function computePlacement(icon: DOMRect): { placement: Placement; left: number; top: number } {
  const spaceBelow = window.innerHeight - icon.bottom - GAP;
  const spaceAbove = icon.top - GAP;
  const spaceRight = window.innerWidth - icon.right - GAP;
  const spaceLeft = icon.left - GAP;

  let placement: Placement = "bottom";
  let left = 0;
  let top = 0;

  // Try bottom first (default)
  if (spaceBelow >= H_EST) {
    placement = "bottom";
    left = icon.left + icon.width / 2 - W / 2;
    top = icon.bottom + GAP;
  }
  // Then top
  else if (spaceAbove >= H_EST) {
    placement = "top";
    left = icon.left + icon.width / 2 - W / 2;
    top = icon.top - H_EST - GAP;
  }
  // Then right
  else if (spaceRight >= W) {
    placement = "right";
    left = icon.right + GAP;
    top = icon.top + icon.height / 2 - H_EST / 2;
  }
  // Then left
  else if (spaceLeft >= W) {
    placement = "left";
    left = icon.left - W - GAP;
    top = icon.top + icon.height / 2 - H_EST / 2;
  }
  // Fallback: bottom even if clipped
  else {
    placement = "bottom";
    left = icon.left + icon.width / 2 - W / 2;
    top = icon.bottom + GAP;
  }

  // Clamp horizontally
  if (placement === "bottom" || placement === "top") {
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - W - MARGIN));
  } else {
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - W - MARGIN));
  }

  // Clamp vertically
  if (placement === "left" || placement === "right") {
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - H_EST - MARGIN));
  }

  return { placement, left, top };
}

export default function InfoTip({ term, children }: InfoTipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ placement: Placement; left: number; top: number }>({
    placement: "bottom",
    left: 0,
    top: 0,
  });
  const iconRef = useRef<HTMLButtonElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const content = ALL_TOOLTIPS[term];

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => setShow(false), 120);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const open = useCallback(() => {
    cancelHide();
    if (!iconRef.current) return;
    const p = computePlacement(iconRef.current.getBoundingClientRect());
    setPos(p);
    setShow(true);
  }, [cancelHide]);

  if (!content) return <>{children}</>;

  const arrowClass =
    pos.placement === "bottom"
      ? "absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-l border-t border-white/[0.08]"
      : pos.placement === "top"
      ? "absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r border-b border-white/[0.08]"
      : pos.placement === "right"
      ? "absolute top-1/2 -left-[5px] -translate-y-1/2 w-2.5 h-2.5 rotate-45 border-l border-b border-white/[0.08]"
      : "absolute top-1/2 -right-[5px] -translate-y-1/2 w-2.5 h-2.5 rotate-45 border-r border-t border-white/[0.08]";

  const animInitial =
    pos.placement === "bottom"
      ? { opacity: 0, y: -6 }
      : pos.placement === "top"
      ? { opacity: 0, y: 6 }
      : pos.placement === "right"
      ? { opacity: 0, x: -6 }
      : { opacity: 0, x: 6 };

  const animTarget =
    pos.placement === "bottom" || pos.placement === "top"
      ? { opacity: 1, y: 0, x: 0 }
      : { opacity: 1, x: 0, y: 0 };

  return (
    <>
      <span className="inline-flex items-center gap-1">
        {children}
        <button
          ref={iconRef}
          className="inline-flex text-text-muted hover:text-accent-cyan transition-colors cursor-help shrink-0"
          onMouseEnter={open}
          onMouseLeave={scheduleHide}
          onClick={(e) => { e.stopPropagation(); open(); }}
        >
          <Info size={13} />
        </button>
      </span>
      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              key={term}
              initial={animInitial}
              animate={animTarget}
              exit={animInitial}
              transition={{ duration: 0.1 }}
              className="fixed z-[99999] w-80 rounded-xl p-4 text-left shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/[0.08]"
              style={{
                background: "#0b0c15",
                left: pos.left,
                top: pos.top,
              }}
              onMouseEnter={cancelHide}
              onMouseLeave={() => setShow(false)}
            >
              <div className="font-semibold text-accent-cyan text-xs mb-1.5">{content.term}</div>
              <p className="text-text-secondary text-[11px] leading-relaxed mb-2">{content.shortDescription}</p>
              <p className="text-text-muted text-[11px] leading-relaxed mb-2">{content.detailedExplanation}</p>
              {content.example && (
                <div className="text-accent-yellow text-[10px] italic border-l-2 border-accent-yellow/30 pl-2 mb-2">
                  Ex: {content.example}
                </div>
              )}
              {content.formula && (
                <div className="bg-black/40 rounded px-2 py-1.5">
                  <code className="text-xs text-accent-purple font-mono">{content.formula}</code>
                </div>
              )}
              <div className={arrowClass} style={{ background: "#0b0c15" }} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}