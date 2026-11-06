import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Copy → check swap. Both icons occupy the same cell; popLayout keeps the
 * layout from jumping. Rule 18 (scale + opacity + blur, overlapping).
 */
export function IconSwap() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={copied}
      onClick={() => setCopied((value) => !value)}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
    >
      <span className="relative grid size-4 place-items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "check" : "copy"}
            initial={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 grid place-items-center"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </motion.span>
        </AnimatePresence>
      </span>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
