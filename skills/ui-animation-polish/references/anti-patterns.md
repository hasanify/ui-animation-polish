# Anti-patterns

The smell, why it reads cheap, and the exact replacement. Skim this when something feels off but you cannot name it.

## Timing and easing

| Smell | Why it reads cheap | Fix | Rule |
|---|---|---|---|
| `ease-in` on an entrance | The first 100ms is dead, exactly when the user is waiting | `ease-out`, ideally `cubic-bezier(0.23, 1, 0.32, 1)` | 1 |
| `ease` / default timing everywhere | Flat and unconsidered; no relationship between role and curve | Explicit entrance / move / exit curves | 1, 9 |
| Dropdown at 400–600ms | Every open becomes a small wait | 150–250ms | 2 |
| Tooltip at 300ms | Feels broken because it should be instant | 120–180ms after a 300–500ms hover delay | 2 |
| Same duration for a tooltip and a full-screen page | Scale is ignored | Duration grows with distance and size | 2 |
| Exits as slow as entrances | The user already decided to leave | Exit = entrance × 0.8 | 15 |
| `linear` on a UI move | Constant velocity reads mechanical | `ease-in-out` | 9 |
| `linear` on a spinner replaced with ease | Progress looks like it stalls | `linear` is correct for constant loops | 9 |
| Bounce on menus, tabs, toggles | Draws attention to the animation, not the content | `bounce: 0`, critically damped | 13 |
| Spring with a long tail | The element keeps moving after the user moved on | Raise damping or shorten `visualDuration` | 13 |
| Keyframes for a state toggle | Reverse animation restarts from zero | Transition/spring that retargets | — |
| Delays on every element | The interface feels frozen between steps | Only delay to show a relationship | — |

## Origin and space

| Smell | Why it reads cheap | Fix | Rule |
|---|---|---|---|
| `scale(0)` entrance | Nothing appears from nothing; reads as a zoom gimmick | `scale(0.95)` + opacity | 10 |
| Popover scales from its own centre | Looks detached from the button that opened it | Origin at the trigger corner/edge | 11 |
| Exit fades in place after entering from a corner | The loop is not closed; the object "evaporates" | Exit toward the trigger, same origin | 12 |
| Modal flies in from a random screen edge | No causal relationship | Scale/fade from centre or from the trigger | 11, 12 |
| Every element slides up 20px on mount | Generic template motion; the whole page performs | Animate only what changed; no entrance for static chrome | — |
| Distances inconsistent across components | The product feels assembled from parts | Shared distance tokens (4/8/16px) | — |
| Straight-line travel for a thrown object | Reads robotic over anything more than ~100px | Different x/y easing or an offset path, ~32px arc | 7 |
| Arc applied to a 12px nudge | Exaggerated and wobbly | Arc only for visible travel | 7 |
| Large translate on small UI | Looks like the element is falling | Reduce travel; prefer opacity + 4–8px | — |

## Interaction and feedback

| Smell | Why it reads cheap | Fix | Rule |
|---|---|---|---|
| No press state | The control feels dead | `scale(0.97)` for ~150ms | 4 |
| Press scale 0.8 | Cartoonish squash | 0.95 floor for small, 0.98–0.99 for cards | 4 |
| Scaling a disabled control | Suggests it can be pressed | `:active:not(:disabled)` | 4 |
| Press changes layout | Content jumps because width/height changed | `transform: scale` only | 4 |
| Rigid toggle knob | A sticker sliding on a rail | ~12% area-preserving stretch while moving | 5 |
| Permanent stretch on the knob | Looks broken at rest | Stretch is transient | 5 |
| Detail arrives before its parent | Breaks the sense of mass | Detail trails by ~50ms | 6 |
| Everything settles in lockstep | Rigid, synthetic | Stagger children/details | 6 |
| Success shown only as "Save → Saved" | Easy to miss in peripheral vision | One pulse at 1.04–1.08, under 400ms | 8 |
| Looping success pulse | Reads as "still loading" or begs for attention | Pulse once | 8 |
| Shake on validation error with no text | Motion-only information; inaccessible | Text + `aria-live`, optional small nudge | 8, a11y |

## State transitions

| Smell | Why it reads cheap | Fix | Rule |
|---|---|---|---|
| Fade out → blank → fade in | Reads as a flicker or lag | Overlap enter and exit | 16 |
| `AnimatePresence mode="wait"` on small swaps | Doubles duration and empties the frame | Default sync mode or `popLayout` | 16 |
| Crossfading two text strings | Both are unreadable at 50% | Clip/mask reveal or a fast out-in swap | 17 |
| Crossfading tab colour | Muddy intermediate colour | Mask the new colour in | 17 |
| Icon hard-swaps | Visible pop | Scale + opacity + blur, overlapping | 18 |
| Opacity-only icon crossfade | Two icons overlap at 50% | Add scale and 4px blur | 18 |
| Card vanishes and a detail page appears | The user loses the object | Shared `layoutId` | 20 |
| Two elements share a `layoutId` while both visible | The animation jumps between them | One visible at a time, or distinct ids | 20 |
| Re-stagger on every filter/sort | Content churns under the pointer | Stagger only on first mount | 3 |

## Motion and accessibility

| Smell | Why it reads cheap | Fix | Rule |
|---|---|---|---|
| No `prefers-reduced-motion` branch | Excludes people with vestibular disorders | Media query + per-component branch | a11y |
| Reduced motion sets `transition: none` on everything | Feedback disappears, focus becomes unclear | Keep opacity/colour, drop travel | a11y |
| Auto-playing carousel with no pause | Fails WCAG 2.2.2 and hijacks attention | Pause on hover/focus + control | a11y |
| Full-screen parallax | Common trigger for dizziness | Remove, or make opt-in and small | a11y |
| Status conveyed only by a pulse/shake | Inaccessible | Text + `aria-live` | a11y |
| Motion moves focus or scroll while typing | Disorienting and can steal input | Never move focus on animation | a11y |

## Performance

| Smell | Why it reads cheap | Fix | Rule |
|---|---|---|---|
| `transition: all` | Animates properties you did not intend, including layout | List properties explicitly | perf |
| Animating `width`, `height`, `top`, `left`, `margin` | Reflow every frame; jank on mid devices | Transform/opacity, FLIP, clip-path | perf |
| Animating `box-shadow` on a large card | Paint-heavy every frame | Animate a pseudo-element's opacity | perf |
| `backdrop-filter` while scrolling | Expensive, especially on mobile | Static blur, or lower radius | perf |
| Blur over 6px on icons/text | Smeared and expensive | 4–6px, small area only | 18 |
| `will-change` left on many elements | Layer/memory bloat, worse scrolling | Apply near the animation, remove after | perf |
| React state updates per frame | Re-render storm | Animate motion values/refs | perf |
| Layout read in a pointermove handler | Forced synchronous layout | Cache measurements, use transforms | 14, perf |
| Measuring on every render | Jank and layout thrash | Measure on pointerdown or use FLIP once | perf |

## Product-level smells

| Smell | Why it reads cheap | Fix |
|---|---|---|
| Motion on everything | Nothing stands out; the page feels restless | Animate cause/effect, confirmation and continuity only |
| A different duration/curve per component | Inconsistent, assembled feel | Shared tokens |
| Hover animation on a non-interactive card | Lies about affordance | Remove, or make it clickable |
| Motion used to hide loading | Users notice the sleight of hand | Show progress honestly |
| Animation longer than the task | Delays the user for decoration | Cap at 300ms for repeated actions |
| Motion that cannot be interrupted | Feels unresponsive when re-triggered | Transitions/springs, not keyframes |
| Copying a showcase animation into a settings form | Wrong register; delightful once, annoying daily | Match motion to frequency |
