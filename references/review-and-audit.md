# Review and audit

How to evaluate existing motion, score it, and report it so the fix actually happens.

## Workflow

1. **Inventory.** Find every `transition`, `animation`, `@keyframes`, `animate`, `whileHover`, `whileTap`, spring config, `layout`/`layoutId`, and drag handler. Include CSS modules, Tailwind classes and inline styles.
2. **Run the auditor.** `node scripts/audit-motion.mjs src` catches the mechanical violations. It is a floor, not the whole review.
3. **Watch it.** Trigger each interaction at normal speed, then at 0.25× speed in DevTools Animations panel. Slow motion exposes origin, overlap and lockstep problems the eye forgives.
4. **Triage.** Fix in this order: broken/blocking (focus, reduced motion, jank) → timing/easing → origin/continuity → polish (stagger, pulse, arcs).
5. **Verify.** Re-run the auditor, re-watch at speed, test with reduced motion and 4× CPU throttle.
6. **Report.** One line per finding: `rule N: old → new, because <reason>`.

## Running the auditor

```bash
node scripts/audit-motion.mjs src
node scripts/audit-motion.mjs src --fail-on warn
node scripts/audit-motion.mjs src --json > motion-report.json
```

What it catches:

| Check | Rule |
|---|---|
| `ease-in` / `easeIn` entrances | 1 |
| Durations 300–1000ms on everyday UI | 2 |
| Durations over 1s | 2 |
| `staggerChildren` / `stagger` above 0.05s | 3 |
| `scale(0)` entrances | 10 |
| `transform-origin: center` on anchored UI | 11 |
| Spring `bounce` above 0 | 13 |
| `AnimatePresence mode="wait"` | 16 |
| Blur above 6px | 18 |
| Transitioned width/height/top/left/margin | performance |
| `transition: all` | performance |
| Looping attention animations | 8 |
| Missing `prefers-reduced-motion` at project level | accessibility |

What it cannot catch: whether an exit returns to its trigger, whether the stagger is capped, whether a drag is 1:1 while held, whether the motion is appropriate at all. Those need eyes and code reading.

**Suppress intentional violations** with a directive and a reason:

```css
/* audit-motion:disable-next-line -- playful onboarding, approved */
.welcome { transition: transform 600ms ease-in; }
```

Do not suppress the project-level reduced-motion warning; add the support.

## Severity

| Level | Meaning | Examples |
|---|---|---|
| **Blocking** | Breaks usability or accessibility | No reduced motion, motion blocks input, focus lost, jank on every frame |
| **Wrong** | Contradicts a rule, visibly cheap | `scale(0)`, 600ms menus, centre-origin popover, bounce on tabs |
| **Weak** | Works but unpolished | No press feedback, no detail trail, linear move on screen |
| **Taste** | Valid deviation | Brand uses a softer curve, longer page transition |

Fix blocking and wrong. Propose weak. Leave taste alone unless asked.

## Scoring rubric

Score each category 0–5, multiply by weight. Use it for a whole product or a single flow.

| Category | Weight | 0 | 3 | 5 |
|---|---|---|---|---|
| Timing and easing | 20% | Entrances on ease-in, >400ms everywhere | Mostly ease-out, a few long controls | Curve matches role, durations tiered by frequency |
| Origin and continuity | 20% | Centre origins, hard swaps | Some origin awareness, occasional jumps | Every anchored element enters/exits at its trigger; shared elements continue |
| State transitions | 15% | Blank gaps, muddy crossfades | Overlap mostly correct | Masks, overlap and handoff are seamless |
| Direct manipulation | 15% | Tweens while dragging, hard stops | 1:1 drag, abrupt limits | Velocity handoff, rubber band, spring settle |
| Accessibility | 15% | No reduced motion, auto-play loops | Media query present but blunt | Per-component reduced-motion branches, no essential motion-only info |
| Performance | 15% | Layout properties, jank on mid devices | Transform/opacity mostly, occasional blur | Compositor-only, FLIP, measured on low-end hardware |

**Bands:** 90–100 polished · 75–89 solid, a few tells · 60–74 functional but cheap in places · below 60 rebuild the motion layer.

## Report template

```markdown
## Motion review — <surface>

Score: 68/100 (functional, cheap in three places)

### Blocking
- `Modal.tsx:41` — no reduced-motion branch; the scale/slide still runs. Add
  `useReducedMotion()` and keep opacity only. (a11y)
- `Carousel.tsx:88` — auto-advances every 4s with no pause. Add pause on
  hover/focus and a visible control. (WCAG 2.2.2)

### Wrong
- `Popover.tsx:12` — rule 10: `scale(0)` → `scale(0.95)`; nothing appears
  from zero size.
- `Popover.tsx:9` — rule 11: `transform-origin: center` → the Radix origin
  variable so it grows from the button.
- `Menu.css:31` — rule 2: `600ms` → `200ms`; this menu opens dozens of times
  a day.

### Weak
- `List.tsx:22` — rule 3: no stagger; add `staggerChildren: 0.03`, cap 10.
- `Button.tsx:18` — rule 4: add `whileTap={{ scale: 0.97 }}`.

### Left alone
- Brand page transition at 450ms: deliberate, documented, not a violation.
```

## PR comment format

```
rule 10: scale(0) → scale(0.95)
Why: an element appearing from zero size reads as a gimmick; 0.95 reads as a lift and survives repeated opens.
```

One finding per comment, with the rule number so the author can look it up. Do not leave a comment that says only "make it smoother".

## False positives and judgement

- **Long durations are legitimate** for page transitions, onboarding and celebration. The auditor allows page/route/hero lines, but it cannot see intent. If the line is legitimately page-level and not marked, add the directive.
- **`transform-origin: center`** is correct for modals, spinners and symmetric reveals. Only anchored UI needs a trigger origin.
- **Bounce** is correct for a one-shot celebration. Keep it out of menus, tabs, forms and toggles.
- **`ease-in`** is correct for exits and for elements accelerating away. The auditor flags any `ease-in`; confirm the role before changing it.
- **Linear** is correct for spinners, marquees and progress. The auditor ignores looping lines that name them.
- **No motion at all** can be correct. Do not add animation just to satisfy a checklist; the point is cause, effect and continuity.

## Acceptance checklist

- [ ] Auditor reports zero errors and no unexplained warnings.
- [ ] Every interaction watched at speed and at 0.25×.
- [ ] Entrances are ease-out; exits are shorter and mirrored.
- [ ] Anchored elements originate at their trigger.
- [ ] Old and new states overlap; no blank or muddy frame.
- [ ] Lists stagger only on first appearance, capped under 300ms.
- [ ] Press feedback on every clickable surface.
- [ ] Drag is 1:1 while held; release settles with physics.
- [ ] Reduced motion tested on the OS and in DevTools.
- [ ] 4× CPU throttle and a low-end device stay smooth.
- [ ] Every deviation from the defaults is stated and justified.
