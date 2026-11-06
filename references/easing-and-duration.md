# Easing and duration

The two numbers that decide whether motion reads as responsive or as lag. Get these right before tuning anything else.

## How to read a cubic-bezier

`cubic-bezier(x1, y1, x2, y2)` places two control points on a unit square:

- **x** is time, always clamped to `0–1`.
- **y** is progress. Values outside `0–1` overshoot the target (that is how bounce is made).
- A curve that rises steeply early = fast start = feels responsive. A curve that rises late = fast end = feels sluggish.

| Curve | Value | Character | Use |
|---|---|---|---|
| Strong ease-out | `cubic-bezier(0.23, 1, 0.32, 1)` | ~80% of distance in the first third | House entrance curve |
| Standard ease-out | `cubic-bezier(0, 0, 0.2, 1)` | Softer deceleration | Material entrances |
| Strong ease-in-out | `cubic-bezier(0.77, 0, 0.175, 1)` | Symmetric, slow at both ends | Moves already on screen |
| Standard ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | Gentle acceleration | Cross-fades, larger moves |
| Ease-in | `cubic-bezier(0.55, 0, 1, 0.45)` | Slow start | Exits only |
| Linear | `linear` | Constant velocity | Spinners, marquees, progress |
| Overshoot | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Backs up past the target | Never for routine UI |

Why the strong ease-out wins for entrances: the user has just clicked and is watching. At 200ms, the standard `ease-out` has covered only ~50% of the distance by the halfway point of the *perceived* motion; the strong curve covers ~80% much earlier, so the element appears immediately and then settles. Use `ease-in` for exits because the user has already dismissed the thing and the fast end disguises the wait.

Do not put `ease-in` on an entrance "because it starts gently". The gentle start is the exact moment the user is checking whether their click registered.

## Duration is a function of frequency, distance and size

Frequency dominates. A control used 50 times a day must be fast even if it is large.

| Interaction | Duration | Notes |
|---|---|---|
| Hover, focus, colour, press | 100–150ms | Below ~80ms it looks like a jump cut |
| Tooltip | 120–180ms | Add 300–500ms open delay for hover intent |
| Dropdown, select, context menu | 150–200ms | 150ms for tiny, 250ms ceiling |
| Popover, combobox, command palette | 180–250ms | Scale 0.95 → 1 |
| Toast | 200–250ms in, ~160ms out | Never block the next action |
| Modal / dialog | 200–300ms | Larger surface needs slightly more |
| Drawer / bottom sheet | 250–350ms | Distance is large; spring is fine |
| Tabs, segmented control indicator | 200–300ms | Travel, not entrance |
| Accordion height | 200–300ms | Use grid-template-rows or FLIP |
| List row stagger | 20–40ms per row | Cap total at ~300ms |
| Page / route transition | 300–500ms | Only when the user is not waiting on data |
| Onboarding / celebration | 400–800ms | The one place bounce earns its keep |

Distance matters more than size for travel:

- Under 100px: 150–200ms.
- 100–400px: 250–350ms.
- Full screen: 350–500ms.
- A 600px drawer at 150ms feels violent; a 24px tooltip at 350ms feels broken.

**Exit = entrance × 0.8.** 250ms in → 200ms out. If the exit also travels toward the trigger, the shorter duration completes the loop without feeling cut off.

## Springs

Springs are better than curves when the motion can be interrupted: the pointer velocity, a second click, or a layout change become inputs rather than restarts.

Motion (Framer Motion) exposes two mental models:

```tsx
// Physical: stiffness + damping + mass
{ type: "spring", stiffness: 400, damping: 40, mass: 1 }

// Perceptual: duration + bounce (Motion 11+)
{ type: "spring", visualDuration: 0.25, bounce: 0 }
```

Rules of thumb:

- **Damping ratio** ζ = `damping / (2 * sqrt(stiffness * mass))`. ζ ≥ 1 is critically damped (no overshoot). ζ < 1 overshoots.
- Everyday UI: ζ ≈ 1. `stiffness: 400, damping: 40` is a safe default; raise damping until the wobble disappears.
- `bounce: 0` is the explicit no-overshoot switch in Motion. Do not use `bounce: 0.2` "for a little life" on menus.
- Velocity handoff: when a drag is released, pass the pointer velocity (`useVelocity` / `dragTransition`) so the object continues in the direction the hand was moving. Do not restart from zero.
- Springs have no fixed duration. If you need a deadline (e.g. exit before unmount), use `visualDuration` or a tween.

CSS cannot express a true spring, but `linear()` can approximate one:

```css
:root {
  /* Critically damped-ish spring, 400ms */
  --spring-settle: linear(
    0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%,
    1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161,
    1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%,
    0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%,
    1.003 76.9%, 1
  );
}
```

For everyday UI the strong ease-out is indistinguishable from a well-tuned spring and cheaper. Reserve springs for drag, layout, and gestures.

## Choreography budget

Perceived speed is about the whole sequence, not one element.

- **Total entrance budget:** under 400ms including stagger. A 540ms cascade feels slow even if each row is 200ms.
- **Stagger math:** `delay = index × stagger`, capped at `items × stagger ≤ 300ms`. With 30ms, 10 items = 300ms; stop staggering after item 10 and show the rest together.
- **Parent before detail:** the badge or counter trails its parent by ~50ms, not the other way around.
- **Overlap states:** exit and enter run simultaneously. The total is `max(exit, enter)`, not `exit + enter`.
- **One primary motion per moment.** If a modal scales, the backdrop only fades; do not also slide the content.
- **Delay is a cost.** Every millisecond of `delay` is a millisecond of "did my click work?". Only add delay to create a relationship (detail after parent, row after row).

## Interruptibility

Users re-trigger controls before animations finish. Design for it:

- Prefer transitions and springs over keyframes in CSS; they retarget from the current computed value instead of restarting.
- In Motion, do not remount to retrigger; change the target and let the existing animation retarget.
- For toggles, make the reverse animation start from the current position. If you use keyframes, the reverse must not snap to the start.
- Never block input during an entrance. The element should be clickable at frame one.

## Duration cheat sheet

```css
:root {
  --dur-instant: 100ms;
  --dur-fast: 150ms;
  --dur-base: 200ms;
  --dur-slow: 250ms;
  --dur-page: 400ms;
  --dur-exit: 160ms; /* 200ms × 0.8 */

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-in: cubic-bezier(0.55, 0, 1, 0.45);
}
```

## Quick diagnostics

| Symptom | Likely cause | Fix |
|---|---|---|
| Feels slow even at 200ms | `ease-in` or `ease` on entry | Strong ease-out |
| Feels floaty | Too long + too much scale/translate | Cut duration 20%, reduce travel |
| Feels cheap | `scale(0)`, linear, or symmetric timing | 0.95 start, ease-out, faster exit |
| Feels robotic | Lockstep elements, no overlap | 30ms stagger, detail trail |
| Feels heavy | Overshoot, long exit, large blur | Remove bounce, shorten exit |
| Feels abrupt | Exit too fast or no exit at all | Add a 150–200ms mirrored exit |
| Feels laggy only on one page | Layout properties or blur on a large area | Transform/opacity only, FLIP |
