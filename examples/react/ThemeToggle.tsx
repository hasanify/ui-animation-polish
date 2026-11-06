import { useState } from "react";
import { motion } from "motion/react";

/**
 * Switch with a transient 12% stretch while the knob travels.
 * Rules: 5 (stretch), 9 (ease-in-out), 13 (no overshoot), 4 (press).
 */
export function ThemeToggle() {
  const [on, setOn] = useState(false);
  const [moving, setMoving] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Dark mode"
      onClick={() => {
        setMoving(true);
        setOn((value) => !value);
      }}
      className="relative h-7 w-12 rounded-full p-1"
      style={{ background: on ? "#2c5c4d" : "#d9d7d1" }}
    >
      <motion.span
        className="block size-5 rounded-full bg-white shadow"
        animate={{
          x: on ? 20 : 0,
          scaleX: moving ? 1.12 : 1,
          scaleY: moving ? 0.89 : 1,
        }}
        transition={{ duration: 0.25, ease: [0.77, 0, 0.175, 1] }}
        onAnimationComplete={() => setMoving(false)}
      />
    </button>
  );
}
