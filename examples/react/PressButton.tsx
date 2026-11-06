import { motion } from "motion/react";

/**
 * Press feedback. 0.97 for small controls; use 0.99 for a whole card.
 * Rule 4. Never apply to a disabled control.
 */
export function PressButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {children}
    </motion.button>
  );
}
