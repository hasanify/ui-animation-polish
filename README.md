# UI Animation Polish

An agent skill plus tooling for motion that feels designed instead of default.

Most "make it smooth" advice is taste. This repo turns it into numbers you can apply, review and lint: `150–250ms` popovers, `scale(0.95)` entrances, origin at the trigger, 30ms stagger, 20% faster exits, no bounce on everyday UI, rubber band at drag limits.

It works as a plain Agent Skill (`SKILL.md` + `references/` + `scripts/`) and as a standalone motion auditor.

```
SKILL.md                          the 20 rules (load this first)
references/                       deep dives, loaded only when needed
scripts/audit-motion.mjs          static anti-pattern auditor, zero dependencies
assets/motion-tokens.css          ready-to-paste duration/easing tokens
assets/motion-presets.ts          typed Motion (Framer Motion) presets
examples/before-after.html        interactive side-by-side demo
examples/react/                   copy-ready React + Motion components
evals/evals.json                  trigger and behaviour test cases
```

## Install as a skill

The skill is the folder itself. Clone it into the skills directory of your agent:

```bash
# Claude Code
git clone https://github.com/hasanify/ui-animation-polish.git ~/.claude/skills/ui-animation-polish

# Gemini CLI
git clone https://github.com/hasanify/ui-animation-polish.git ~/.gemini/config/skills/ui-animation-polish

# Codex / other agents that read AGENTS.md
git clone https://github.com/hasanify/ui-animation-polish.git ~/.codex/skills/ui-animation-polish
```

Or use the [`skills`](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add hasanify/ui-animation-polish
```

The agent picks the skill up from the `description` frontmatter. Ask for anything motion related — "make this dropdown feel less cheap", "review my modal animation", "why does this toggle feel robotic" — and it loads the rules plus the reference it needs.

## Install as a linter

No dependencies, Node 18+.

```bash
node scripts/audit-motion.mjs src/            # human output
node scripts/audit-motion.mjs src/ --json     # machine output
node scripts/audit-motion.mjs . --fail-on warn
```

It scans `.css .scss .less .tsx .jsx .ts .js .vue .svelte .html .astro` and reports rule-numbered findings: entrances on `ease-in`, popovers over 300ms, `scale(0)`, `transform-origin: center` on anchored UI, bouncing springs, `mode="wait"`, transitioned layout properties, heavy blur, long staggers, and missing `prefers-reduced-motion`.

Suppress intentional violations without hiding real ones:

```css
/* audit-motion:disable-next-line */
.before { transition: all 600ms ease-in; }

/* audit-motion:disable-file */
```

Full options: `node scripts/audit-motion.mjs --help`.

## Use the numbers directly

`assets/motion-tokens.css`:

```css
:root {
  --dur-fast: 150ms;
  --dur-base: 200ms;
  --dur-slow: 300ms;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}
```

`assets/motion-presets.ts` gives the same values as typed Motion presets: `popover`, `modal`, `list`, `press`, `successPulse`, `iconSwap`, `rubberBand`.

## The 20 rules

| # | Rule | # | Rule |
|---|------|---|------|
| 1 | Ease-out for entrances | 11 | Enter from the trigger |
| 2 | Popovers at 150–250ms | 12 | Exit toward the trigger |
| 3 | Stagger list rows ~30ms | 13 | No bounce on everyday UI |
| 4 | Scale to 0.97 on press | 14 | Don't tween while held |
| 5 | Stretch moving knobs ~12% | 15 | Exits ~20% shorter |
| 6 | Stagger as details settle | 16 | Overlap old and new states |
| 7 | Arcs for object movement | 17 | Masks for reveals and colour |
| 8 | Pulse to confirm success | 18 | Crossfade icons with scale + blur |
| 9 | Ease-in-out for moves | 19 | Rubber band past bounds |
| 10 | Start popovers at 0.95 | 20 | Reuse the same `layoutId` |

## Reference map

| Read this | When |
|---|---|
| [`references/easing-and-duration.md`](references/easing-and-duration.md) | Choosing curves, durations, spring configs, choreography timing |
| [`references/component-recipes.md`](references/component-recipes.md) | Building a specific component: modal, toast, tabs, switch, drag, … |
| [`references/platforms.md`](references/platforms.md) | CSS, Tailwind, Motion, Vue, Svelte, SwiftUI, React Native, Flutter |
| [`references/accessibility-and-performance.md`](references/accessibility-and-performance.md) | Reduced motion, vestibular safety, jank, compositor rules |
| [`references/review-and-audit.md`](references/review-and-audit.md) | Auditing a codebase, scoring, report template |
| [`references/anti-patterns.md`](references/anti-patterns.md) | A smell, why it reads cheap, and the exact fix |
| [`references/sources.md`](references/sources.md) | Where the guidance comes from |

## Examples

Open `examples/before-after.html` in a browser. Eight pairs run the same interaction twice — deliberate "before" and corrected "after" — so you can feel the difference rather than read about it.

The React examples are self-contained and copy-paste ready: `AnimatedPopover`, `StaggerList`, `PressButton`, `IconSwap`, `ThemeToggle`, `CardToDetail`.

## Evals

`evals/evals.json` holds prompts that should trigger the skill, prompts that should not, and the expected motion values for each. See [`evals/README.md`](evals/README.md) for the runner contract.

## Develop

```bash
npm test                      # audit unit tests
npm run audit:examples        # dogfood the linter
```

CI runs both on Node 20.

## Contributing

Numbers over adjectives. If you change a rule, update the matching reference, preset, and example in the same PR, and add an eval case if the trigger changed.

## License

MIT. See [LICENSE](LICENSE).

## Sources

The defaults synthesise Material Design motion, Apple HIG, IBM Carbon, Nielsen Norman Group, Motion documentation, and the practical web-motion community (easings.net, Emil Kowalski, Rauno Freiberg). Full list and links in [`references/sources.md`](references/sources.md).
