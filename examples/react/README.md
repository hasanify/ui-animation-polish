# React examples

Copy-paste components, not a runnable app. They assume React 18+, Tailwind for layout classes, and `motion/react` (Motion 11+, formerly Framer Motion). The animation values are the point; the markup is replaceable.

| File | Rules | What it shows |
|---|---|---|
| `AnimatedPopover.tsx` | 1, 2, 10, 11, 12, 15 | Anchored entrance/exit, outside click, Escape |
| `StaggerList.tsx` | 3, 6 | 30ms cascade, capped at 10 rows |
| `PressButton.tsx` | 4 | 0.97 press, disabled-safe |
| `IconSwap.tsx` | 18 | Scale + opacity + blur, `popLayout` |
| `ThemeToggle.tsx` | 5, 9, 13 | Transient knob stretch, no overshoot |
| `CardToDetail.tsx` | 16, 20 | Shared `layoutId`, overlapping views |

## Wiring

```tsx
import { MotionConfig } from "motion/react";

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* your tree */}
    </MotionConfig>
  );
}
```

`reducedMotion="user"` honours the OS setting for transform and layout animations while keeping opacity. Do not skip it in production.

## Not included

Positioning (Radix/Floating UI), focus trapping, and `prefers-reduced-motion` branches beyond `MotionConfig`. Use a real popover/dialog primitive for those; the recipes in `../../references/component-recipes.md` name the integration points.

## Check them

```bash
node scripts/audit-motion.mjs examples/react --fail-on warn
```
