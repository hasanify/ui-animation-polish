import { motion } from "motion/react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const row = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
} as const;

interface Item {
  id: string;
  label: string;
}

/**
 * List cascade: 30ms between rows, capped at 10, only on first appearance.
 * Rules: 3 (stagger), 6 (detail settles after parent).
 */
export function StaggerList({ items }: { items: Item[] }) {
  const staggered = items.slice(0, 10);
  const rest = items.slice(10);

  return (
    <motion.ul variants={container} initial="hidden" animate="show" className="divide-y">
      {staggered.map((item) => (
        <motion.li key={item.id} variants={row} className="flex items-center gap-2 py-2">
          <span className="size-2 rounded-full bg-emerald-600" aria-hidden />
          {item.label}
        </motion.li>
      ))}
      {rest.map((item) => (
        <li key={item.id} className="flex items-center gap-2 py-2">
          <span className="size-2 rounded-full bg-emerald-600" aria-hidden />
          {item.label}
        </li>
      ))}
    </motion.ul>
  );
}
