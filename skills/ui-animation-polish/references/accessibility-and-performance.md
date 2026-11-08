# Accessibility and performance

Motion that ignores either one is not polished; it is a demo. Both are hard requirements, not nice-to-haves.

## Reduced motion

Many people experience dizziness, nausea, migraine or disorientation from large-scale movement. The OS setting is a medical accommodation, not a style preference.

- **WCAG 2.3.3 (AAA), Animation from Interactions:** motion animation triggered by interaction can be disabled, unless the motion is essential to the functionality or the information being conveyed.
- **WCAG 2.2.2 (A), Pause, Stop, Hide:** automatically moving, blinking or scrolling content that lasts more than five seconds and appears alongside other content must be pausable, stoppable or hideable.
- **WCAG 1.4.13 (AA), Content on Hover or Focus:** tooltips and popovers must be dismissable, hoverable and persistent.

Reduced motion does **not** mean no feedback. It means no non-essential travel, scale, parallax, spin, zoom or oscillation. Keep opacity, colour and short state changes.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

This global reset is a safety net, not a design. Better: give each animated component a reduced-motion branch that keeps the meaningful part.

```css
@media (prefers-reduced-motion: reduce) {
  .popover {
    transform: none; /* keep the opacity fade */
    transition-duration: 120ms;
  }
  .card[data-expanded="true"] {
    /* replace the shared-element flight with an instant swap + fade */
  }
}
```

Motion:

```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

`reducedMotion="user"` automatically disables transform and layout animations while keeping opacity. For custom cases:

```tsx
const reduce = useReducedMotion();
const variants = reduce
  ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
  : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };
```

Other platforms:

| Platform | API |
|---|---|
| CSS | `@media (prefers-reduced-motion: reduce)` |
| Motion | `<MotionConfig reducedMotion="user">`, `useReducedMotion()` |
| WAAPI | `matchMedia("(prefers-reduced-motion: reduce)").matches` |
| SwiftUI | `@Environment(\.accessibilityReduceMotion)` |
| UIKit | `UIAccessibility.isReduceMotionEnabled` |
| React Native | `useReducedMotion()` (Reanimated) / `AccessibilityInfo` |
| Flutter | `MediaQuery.disableAnimationsOf(context)` |
| Android | `Settings.Global.ANIMATOR_DURATION_SCALE` |
| GSAP | `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", …)` |

## Vestibular safety

These are the patterns most likely to trigger symptoms:

- **Large-area movement:** anything covering more than roughly a third of the viewport.
- **Parallax and scroll hijacking**, especially multi-layer.
- **Zoom and spin** on images, cards or page transitions.
- **Oscillation** (shake, wobble, heartbeat, bounce loops).
- **Auto-playing carousels and background video.**
- **Perspective and 3D flips** at scale.
- **Smooth scrolling** applied globally.

Rules:

- Keep motion under your control opt-in, not forced.
- Never auto-play a looping animation for more than five seconds without a pause control.
- Never move focus or the viewport while the user is typing or tabbing.
- Keep focus indicators visible; animate the ring's colour, not its presence.
- Do not convey information by motion alone. Pair it with text, icon or `aria-live`.
- Announce async results with `aria-live="polite"`, not with a pulse.

## Testing reduced motion

1. **OS:** enable Reduce Motion (macOS/iOS), Remove animations (Android), Show animations off (Windows).
2. **Chrome DevTools:** Rendering panel → Emulate CSS media feature `prefers-reduced-motion: reduce`.
3. **Firefox:** `about:config` → `ui.prefersReducedMotion = 1`.
4. **CLI:** Chrome supports `--force-prefers-reduced-motion`.
5. Verify: entrances still readable, no travel, no looping, focus still visible, no blank frames.

## Performance

A frame is 16.7ms at 60Hz and 8.3ms at 120Hz. Your animation must fit inside that budget along with everything else the page is doing.

**Compositor-only properties:** `transform`, `opacity`. These can run off the main thread.

**Paint:** `color`, `background`, `border-color`, `box-shadow`, `filter`, `clip-path`. Usually cheap on small areas, expensive on large ones.

**Layout:** `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `font-size`, `grid-template-*`. Every frame forces reflow.

### FLIP for size and position changes

Measure, invert, play:

```js
const first = el.getBoundingClientRect();
// change layout (expand, reorder, navigate)
const last = el.getBoundingClientRect();
const dx = first.left - last.left;
const dy = first.top - last.top;
const sx = first.width / last.width;
const sy = first.height / last.height;

el.animate(
  [
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
    { transform: "none" },
  ],
  { duration: 250, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
);
```

Motion's `layout` and `layoutId` do this for you. Do not combine them with width/height transitions.

### Blur and backdrop-filter

- Cost scales with radius × area. A 4px blur on a 24px icon is free; a 20px backdrop blur over a scrolling page is not.
- Cap icon-swap blur at 4–6px.
- Never animate `backdrop-filter` during scroll.
- Test with the GPU rasterization disabled if the effect is essential.

### `will-change`

```css
.card:hover { will-change: transform; }
.card.is-animating { will-change: transform, opacity; }
```

Add it just before the animation, remove it after. Leaving it on dozens of elements creates layers, consumes memory and can make scrolling worse.

### Containment

```css
.widget {
  contain: layout paint;
  content-visibility: auto;
  contain-intrinsic-size: 320px;
}
```

Useful for long lists and dashboards. `content-visibility: auto` skips off-screen rendering but can interact badly with find-in-page and anchor scrolling; test it.

### Measuring

- DevTools → Performance: look for long tasks, layout shifts and dropped frames during the animation.
- Rendering panel: Paint flashing, Layer borders, Frame rendering stats.
- CPU throttling 4×: motion that only works on your machine does not work.
- `PerformanceObserver` for `long-animation-frame` (LoAF) and INP:

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) console.warn("long animation frame", entry);
  }
}).observe({ type: "long-animation-frame", buffered: true });
```

- INP: good is ≤ 200ms; motion that delays input handling will show up there.

### Common jank causes

| Cause | Fix |
|---|---|
| Animating `width`/`height` on a container | FLIP, `layout`, or clip-path |
| `box-shadow` transition on a large card | Animate opacity of a pseudo-element shadow |
| `filter: blur()` on a full-screen backdrop | Smaller radius, static blur, or none |
| Layout read in a pointer handler (`getBoundingClientRect`) | Cache on pointerdown; use `transform` |
| Many independent springs on a list | One container animation or CSS transitions |
| Re-rendering React on every frame | Animate refs/values, not state |
| Large `will-change` set | Apply near the animation only |
| Animating `top/left` for a tooltip | `transform: translate()` |

## Checklist

- [ ] `prefers-reduced-motion` honoured in CSS and JS.
- [ ] No essential information conveyed only by motion.
- [ ] No autoplay motion over five seconds without a pause.
- [ ] Focus visible and stable throughout the animation.
- [ ] Async confirmations announced with `aria-live`.
- [ ] Only `transform`/`opacity` animate on interaction.
- [ ] No `will-change` left on permanently.
- [ ] Tested at 4× CPU throttle and on a low-end phone.
- [ ] Blur ≤ 6px on small elements, none on large scrolling surfaces.
- [ ] Exits cannot trap focus or block input.
