import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface Card {
  id: string;
  title: string;
  body: string;
}

/**
 * Card expands into a detail view as the same object.
 * Rule 20: shared layoutId. Rule 16: views overlap instead of leaving a gap.
 */
export function CardToDetail({ cards }: { cards: Card[] }) {
  const [selected, setSelected] = useState<Card | null>(null);

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {selected ? (
          <motion.article
            key="detail"
            layoutId={`card-${selected.id}`}
            className="rounded-xl border bg-white p-6"
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <motion.h2 layout="position" layoutId={`title-${selected.id}`} className="text-xl font-semibold">
              {selected.title}
            </motion.h2>
            <motion.p layout="position" className="mt-2 text-neutral-600">
              {selected.body}
            </motion.p>
            <button type="button" onClick={() => setSelected(null)} className="mt-4 text-sm underline">
              Back
            </button>
          </motion.article>
        ) : (
          <motion.ul key="list" className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <motion.li
                key={card.id}
                layoutId={`card-${card.id}`}
                onClick={() => setSelected(card)}
                className="cursor-pointer rounded-xl border bg-white p-4"
                transition={{ type: "spring", stiffness: 380, damping: 40 }}
              >
                <motion.h2 layout="position" layoutId={`title-${card.id}`} className="font-medium">
                  {card.title}
                </motion.h2>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
