# Component recipes

Copy-paste starting points for the components agents are asked to build most. Each recipe names the rules it implements. Values come from `assets/motion-tokens.css` and `assets/motion-presets.ts`.

Assumptions: React + Motion (`motion/react`, formerly `framer-motion`) unless marked CSS-only.

## Dropdown / popover

Rules 1, 2, 10, 11, 12, 15. The origin must point at the trigger; Radix and Floating UI expose it as a CSS variable.

```tsx
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.16 } }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      style={{ transformOrigin: "var(--radix-popover-content-transform-origin, top left)" }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

Avoid `mode="wait"` here; the menu should be interactive on the first frame.

## Modal / dialog

Rules 10, 15, 16, a11y. The backdrop fades only; the panel does the scale. Focus moves into the dialog immediately, before the animation ends.

```tsx
<AnimatePresence>
  {open && (
    <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.div
      className="dialog"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16 } }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

If content is swapped inside the dialog, overlap old and new (rule 16) instead of closing and reopening.

## Toast

Rules 1, 12, 15. Enter from the edge nearest the trigger (usually bottom), exit faster and toward the same edge.

```tsx
<motion.div
  layout
  initial={{ opacity: 0, y: 16, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.16 } }}
  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
/>
```

Use `layout` on the stack so removing one toast closes the gap instead of jumping.

## Drawer / bottom sheet

Rules 2 (exception: large distance), 14, 19. Track the pointer 1:1; spring only after release. Dismiss past 30–40% of the height.

```tsx
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={{ top: 0, bottom: 0.5 }}
  onDragEnd={(_, info) => {
    if (info.offset.y > 120 || info.velocity.y > 500) close();
  }}
  initial={{ y: "100%" }}
  animate={{ y: 0 }}
  exit={{ y: "100%" }}
  transition={{ type: "spring", stiffness: 380, damping: 40 }}
/>
```

Do not animate the sheet's `height`; translate it. The backdrop opacity can map to progress while dragging.

## Tooltip

Rules 1, 2, 11. Wait 300–500ms before opening (hover intent), then animate in 120–180ms. Never animate on every pointer move.

```tsx
<motion.div
  initial={{ opacity: 0, y: 4, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 2, scale: 0.98 }}
  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
  style={{ transformOrigin: "bottom center" }}
/>
```

Tooltips must not contain interactive content (WCAG 1.4.13).

## Accordion

Rule 17 (mask/reveal), perf. Animate `grid-template-rows` from `0fr` to `1fr`; it is the one layout exception that stays cheap enough for small content.

```css
.accordion-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms cubic-bezier(0.23, 1, 0.32, 1);
}
.accordion-panel[data-open="true"] {
  grid-template-rows: 1fr;
}
.accordion-panel > div {
  overflow: hidden;
}
```

For large panels use FLIP or a measured height with `ResizeObserver`. Do not animate `height: auto`.

## Tabs indicator

Rule 20. One `layoutId` moves the pill/underline between tabs; it is physically the same object.

```tsx
{tabs.map((tab) => (
  <button key={tab} onClick={() => setActive(tab)} className="relative">
    {active === tab && (
      <motion.span layoutId="tab-pill" className="absolute inset-0 -z-10 rounded-md bg-white/10"
        transition={{ type: "spring", stiffness: 420, damping: 42 }} />
    )}
    {tab}
  </button>
))}
```

Keep the indicator mounted across tab changes; `layoutId` handles the rest. Do not fade the old pill out and a new one in.

## Segmented control (stretch)

Rules 5, 9. The thumb stretches along travel and returns to rest.

```tsx
<motion.span
  layout
  animate={{ scaleX: moving ? 1.12 : 1, scaleY: moving ? 0.89 : 1 }}
  transition={{ duration: 0.22, ease: [0.77, 0, 0.175, 1] }}
/>
```

Only stretch while the pointer is down or the thumb is travelling. A permanently stretched thumb looks broken.

## Switch

Rules 5, 9, 13. Knob translates with an ease-in-out, stretches transiently, settles without overshoot.

```tsx
<motion.span
  className="knob"
  animate={{ x: on ? 20 : 0, scaleX: [1, 1.12, 1], scaleY: [1, 0.89, 1] }}
  transition={{ duration: 0.22, ease: [0.77, 0, 0.175, 1] }}
/>
```

The track colour change can crossfade; the knob must not overshoot.

## Checkbox

Rules 4, 8. Draw the check with `pathLength` (or scale it in) and keep the press feedback on the whole control.

```tsx
<motion.svg viewBox="0 0 24 24">
  <motion.path
    d="M4 12l5 5L20 6"
    initial={false}
    animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
  />
</motion.svg>
```

Do not animate a checkmark with a 400ms draw; it delays the confirmation.

## Staggered list

Rules 3, 6. 30ms between rows, total under 300ms, only on first appearance.

```tsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const row = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } };

<motion.ul variants={container} initial="hidden" animate="show">
  {items.slice(0, 10).map((item) => <motion.li key={item.id} variants={row} />)}
  {items.slice(10).map((item) => <li key={item.id} />)}
</motion.ul>
```

Do not re-run the stagger on filter/sort unless the list identity changed; contents moving under the user is worse than no cascade.

## Card → detail (shared element)

Rule 20. Same `layoutId` in both states. The user perceives one object growing, not two unrelated views.

```tsx
// list
<motion.article layoutId={`card-${id}`} onClick={() => open(id)}>
  <motion.h2 layoutId={`title-${id}`}>{title}</motion.h2>
</motion.article>

// detail
<motion.article layoutId={`card-${id}`}>
  <motion.h2 layoutId={`title-${id}`}>{title}</motion.h2>
</motion.article>
```

Add `layout="position"` to children that distort while the parent resizes. Keep the list mounted underneath (or animate the container) so the return trip has somewhere to go.

## Icon swap

Rule 18. Scale + opacity + 4px blur, overlapping. Do not hard-swap and do not crossfade opacity alone.

```tsx
<AnimatePresence mode="popLayout" initial={false}>
  <motion.span
    key={copied ? "check" : "copy"}
    initial={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.6, filter: "blur(4px)" }}
    transition={{ duration: 0.16 }}
  />
</AnimatePresence>
```

Use `popLayout` so both icons occupy the same box without layout shift. Blur only the small icon area.

## Like / favourite button

Rules 4, 8, 13 exception. A single pop is allowed on a celebratory toggle; keep the peak small.

```tsx
<motion.button
  whileTap={{ scale: 0.9 }}
  animate={liked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
/>
```

No confetti per click, no infinite heartbeat.

## Save / copy confirmation

Rules 8, 17, 18. Change the label or icon, then pulse once. The pulse is confirmation, not decoration.

```tsx
<button onClick={save}>
  <AnimatePresence mode="popLayout" initial={false}>
    <motion.span key={saved ? "saved" : "save"} /* iconSwap values */ />
  </AnimatePresence>
  {saved ? "Saved" : "Save"}
</button>
```

Announce the change to screen readers with `aria-live="polite"`; motion alone is not an announcement.

## Drag to reorder

Rules 14, 19. While held: 1:1 tracking, no transition. On release: spring to the new slot with pointer velocity.

```tsx
<motion.li
  drag="y"
  dragConstraints={containerRef}
  dragElastic={0.12}
  onDragEnd={(_, info) => reorder(info.offset.y, info.velocity.y)}
  transition={{ type: "spring", stiffness: 500, damping: 45 }}
/>
```

Apply `layout` to siblings so gaps close behind the dragged row. Disable text selection and `touch-action` appropriately.

## Carousel

Rules 9, 19. Follow the pointer, snap on release, support keyboard.

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: -maxScroll, right: 0 }}
  dragElastic={0.15}
  dragMomentum={false}
  onDragEnd={(_, info) => snapToIndex(info.offset.x, info.velocity.x)}
  transition={{ type: "spring", stiffness: 350, damping: 38 }}
/>
```

Do not auto-advance unless the user can pause it (WCAG 2.2.2). Pause on hover and focus.

## Command palette

Rules 1, 2, 10, 16. Opens fast (150–180ms), backdrop fades, panel scales from 0.97. The list should not re-stagger on every keystroke.

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.97 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.97 }}
  transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
/>
```

Filter results without animating each row; only animate the first mount.

## Page / route transition

Rules 9, 16. Keep the outgoing page visible while the new one enters. 250–350ms. Respect reduced motion.

```tsx
<AnimatePresence mode="popLayout" initial={false}>
  <motion.main
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
  />
</AnimatePresence>
```

The native View Transitions API does this without double-rendering:

```ts
document.startViewTransition(() => navigate(path));
```

```css
::view-transition-old(root) { animation: fade-out 160ms ease-in; }
::view-transition-new(root) { animation: fade-in 220ms cubic-bezier(0.23, 1, 0.32, 1); }
```

## Number counter

Rules 6, 9. Tabular numbers, short spring, no roll-over of the whole row.

```tsx
<motion.span
  key={value}
  initial={{ y: 6, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: "spring", stiffness: 500, damping: 40 }}
  style={{ fontVariantNumeric: "tabular-nums" }}
/>
```

For a rolling digit, translate a column of digits by one row height; do not animate `font-size`.

## File drop zone

Rules 4, 8, 17. Border and label change, background fills, one pulse of confirmation. No bouncing dashed border.

```css
.dropzone {
  transition: background-color 150ms ease-out, border-color 150ms ease-out, transform 150ms ease-out;
}
.dropzone[data-over="true"] {
  transform: scale(1.01);
}
```

## Skeleton → content

Rules 16, 17. Crossfade only if the layout matches; otherwise mask the content in and remove the skeleton in the same frame.

```css
.content {
  clip-path: inset(0 0 100% 0);
  transition: clip-path 240ms cubic-bezier(0.23, 1, 0.32, 1);
}
.content[data-loaded="true"] {
  clip-path: inset(0 0 0 0);
}
```

Never leave a blank frame between skeleton and content.

## Sidebar collapse

Perf. Animate `transform` on the panel and `margin`/grid on the shell only if the layout must reflow. For a true width change, use FLIP or `grid-template-columns` with a transition and accept the layout cost.

```css
.sidebar {
  transition: transform 220ms cubic-bezier(0.77, 0, 0.175, 1);
}
.sidebar[data-collapsed="true"] {
  transform: translateX(-100%);
}
```

Do not animate `width` on a sidebar with many children; every frame relayouts the page.
