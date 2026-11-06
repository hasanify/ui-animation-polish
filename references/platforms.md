# Platform implementations

The numbers are portable; the API is not. Use the section for your stack, and let platform conventions win when they conflict with the house defaults (say so when you deviate).

## CSS

Prefer `transition` for state changes and `@keyframes` for one-shot or looping effects that have no previous state. Transitions retarget from the current value, which is what makes interrupted motion feel right.

```css
.popover {
  opacity: 0;
  transform: scale(0.95);
  transform-origin: var(--origin, top left);
  transition:
    opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    overlay 200ms allow-discrete,
    display 200ms allow-discrete;
}

.popover:popover-open,
.popover[data-open="true"] {
  opacity: 1;
  transform: scale(1);
}

@starting-style {
  .popover[data-open="true"] {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

`@starting-style` gives an entry animation to an element that was just inserted or changed from `display: none`. Pair it with `transition-behavior: allow-discrete` for `display`/`overlay`. Do not use it for exit animations; those still need the element to stay mounted.

**Transitions vs keyframes**

| Need | Use |
|---|---|
| Hover, open/close, toggle, theme | transition |
| One-shot confirmation, attention | keyframes + `animation-fill-mode: both` |
| Loop (spinner, shimmer) | keyframes + `infinite` |
| Interruptible drag | transition or WAAPI, never keyframes |
| Content swap | clip-path/mask transition |

**Do not** transition `height: auto`, `width: auto`, `display` without `allow-discrete`, or `box-shadow` on large surfaces. Use `grid-template-rows: 0fr → 1fr`, FLIP, or `@starting-style`.

## Tailwind CSS v4

Map the values into the theme so utilities stay consistent:

```css
@import "tailwindcss";

@theme {
  --ease-out-quart: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
  --animate-pop-in: pop-in 200ms var(--ease-out-quart);
  --animate-pulse-once: pulse-once 300ms var(--ease-out-quart);

  @keyframes pop-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse-once {
    40% { transform: scale(1.06); }
  }
}
```

Usage: `transition-transform duration-200 ease-out-quart data-[state=open]:animate-pop-in`. Tailwind's `ease-out` is the standard curve, not the strong one.

For variants that only animate on mount, combine `starting:` (v4) or `data-[state=open]:` with `motion-safe:`.

## React + Motion

```tsx
import { AnimatePresence, MotionConfig, motion } from "motion/react";

<MotionConfig reducedMotion="user">
  <AnimatePresence>{open && <motion.div {...popover("top right")} />}</AnimatePresence>
</MotionConfig>
```

- `MotionConfig reducedMotion="user"` removes transform/layout animations when the OS asks, while keeping opacity.
- `useReducedMotion()` for conditional variants when you need finer control.
- `layout` and `layoutId` use FLIP internally; do not also animate width/height.
- `AnimatePresence` keeps exiting children mounted. With `mode="popLayout"`, exiting children are removed from layout flow; with `mode="wait"`, exit finishes before enter starts (avoid for swaps).
- Spring values are `{ type: "spring", stiffness, damping, mass }` or `{ type: "spring", visualDuration, bounce }`.
- `useVelocity` + `dragTransition` for velocity handoff on release.

**React 19 / View Transitions:** `document.startViewTransition` is available in Chrome and Safari; React's `useTransition` is unrelated. Wrap navigation, set `view-transition-name` on the shared element, and add a CSS `@media (prefers-reduced-motion: reduce)` override.

## Vue

```vue
<Transition
  :duration="{ enter: 200, leave: 160 }"
  enter-active-class="transition ease-[cubic-bezier(0.23,1,0.32,1)] duration-200"
  enter-from-class="opacity-0 scale-95"
  leave-active-class="transition ease-in duration-150"
  leave-to-class="opacity-0 scale-95"
/>
```

`<Transition>` uses CSS classes; `<TransitionGroup>` adds `move` classes for list reordering (FLIP). Set `:css="false"` and use JS hooks when you need a spring. Respect reduced motion with a `matchMedia` check or a global CSS override.

## Svelte

```svelte
<script>
  import { fade, fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";
</script>

{#if open}
  <div transition:fly={{ y: 8, duration: 200, easing: quintOut }}>…</div>
{/if}
```

Svelte transitions are per-block; use `crossfade` for shared elements and `animate:flip` for reordering. `svelte/motion` springs (`spring`, `tweened`) are good for values that interrupt. Honour `prefers-reduced-motion` by passing `duration: 0` (keep opacity) or using a media query store.

## SwiftUI

```swift
.animation(.snappy(duration: 0.25), value: isOpen)
.transition(.scale(scale: 0.95).combined(with: .opacity))
```

- `Animation.spring(response:dampingFraction:blendDuration:)`; `dampingFraction` 1.0 = no overshoot. `.snappy` and `.smooth` are the modern presets.
- `matchedGeometryEffect(id:in:)` for shared elements (the `layoutId` equivalent). Both views must exist in the same namespace and not both be visible at once.
- `.phaseAnimator` (iOS 17+) for multi-step one-shot sequences; `.symbolEffect` for SF Symbols.
- Use `.contentTransition(.numericText())` for counters.
- Respect `@Environment(\.accessibilityReduceMotion)` and swap travel for a fade.
- HIG: transitions under ~0.5s; avoid motion that blocks input.

## React Native

```tsx
import Animated, { useSharedValue, withSpring, useReducedMotion } from "react-native-reanimated";

const x = useSharedValue(0);
x.value = withSpring(open ? 20 : 0, { damping: 18, stiffness: 220, mass: 0.8 });
```

- Reanimated runs on the UI thread; avoid `useNativeDriver: false` on the core `Animated` API for transform/opacity.
- `useReducedMotion()` from Reanimated (or `AccessibilityInfo.isReduceMotionEnabled()`) for the OS setting.
- Gesture Handler + Reanimated for 1:1 drag; spring only on release.
- Layout animations: `entering={FadeInDown.duration(200)}` / `exiting`; `Layout` for reordering.
- iOS and Android conventions differ (back gesture, sheet detents); follow the platform.

## Flutter

```dart
AnimationController(vsync: this, duration: const Duration(milliseconds: 200));
CurvedAnimation(parent: controller, curve: Curves.easeOutCubic);
```

- `Curves.easeOutCubic`/`easeOutQuart` for entrances; `Curves.easeInOutCubic` for moves; `Curves.linear` for progress only.
- `SpringSimulation` for physics; `Hero` for shared-element transitions.
- Check `MediaQuery.disableAnimationsOf(context)` and `MediaQuery.of(context).accessibleNavigation` before travel/parallax.
- Prefer `AnimatedBuilder`/`TweenAnimationBuilder` over rebuilding whole trees per frame.

## Web Animations API

Use WAAPI when you need a one-shot animation without a library, or need to cancel/retarget precisely.

```js
const animation = el.animate(
  [
    { opacity: 0, transform: "scale(0.95)" },
    { opacity: 1, transform: "scale(1)" },
  ],
  { duration: 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "both" },
);
animation.finished.then(() => animation.cancel()); // let CSS take over after
```

`commitStyles()` + `cancel()` if the end state must persist. Check `matchMedia("(prefers-reduced-motion: reduce)")` first.

## GSAP

```js
const xTo = gsap.quickTo(el, "x", { duration: 0.25, ease: "power3.out" });
gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => { /* motion */ });
```

- `quickTo` for pointer-following values; `overwrite: "auto"` for retargeting.
- Never `repeat: -1` on attention animations.
- `gsap.matchMedia()` reverts animations automatically when the query stops matching.

## Platform conventions

| | Apple (iOS/macOS) | Material 3 (Android) | Fluent (Windows) |
|---|---|---|---|
| Default duration | 0.25–0.35s | 200–300ms standard, 300–400ms emphasized | 150–300ms |
| Entrance curve | `.snappy` spring | Emphasized decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)` | Fluent decelerate |
| Movement | Springs, continuity | Shared-axis, container transform | Connected animation |
| Overshoot | Allowed in playful moments | Expressive springs, sparingly | Minimal |
| Reduced motion | Reduce Motion setting | Remove animations setting | Show animations toggle |

When a project already has tokens, use them and note the delta from these defaults. Do not mix two systems on one screen.

## Framework gotchas

| Symptom | Cause | Fix |
|---|---|---|
| Exit animation never runs (React) | Component unmounted immediately | Wrap in `AnimatePresence` and keep the key stable |
| Both icons visible during swap | No absolute positioning / popLayout | Stack in a grid cell or use `mode="popLayout"` |
| `layoutId` jumps | Two elements with the same id visible at once | Render only one, or use distinct ids |
| Transition restarts on every render | Inline object recreated | Hoist variants/transitions or use tokens |
| CSS transition ignores `display` | Discrete property | `transition-behavior: allow-discrete` |
| SwiftUI transition does nothing | No `withAnimation` / animation scope | Animate the state change, not the view |
| Vue leave class not applied | Element removed before transition | Use `<Transition>` and a stable `key` |
| Flutter animation stutters | Rebuilding on every tick | `AnimatedBuilder` + const children |
