# Sources

The defaults in this skill are a synthesis, not a single citation. Where sources disagree, the skill favours what holds up in repeated, everyday use.

## Design systems

- **Material Design 3 — Motion.** Duration tiers, easing and transition patterns (container transform, shared axis, fade through). https://m3.material.io/styles/motion/overview
- **Apple Human Interface Guidelines — Motion.** Restraint, continuity, reduced-motion behaviour. https://developer.apple.com/design/human-interface-guidelines/motion
- **IBM Carbon — Motion.** Productive vs expressive durations and easing tokens. https://carbondesignsystem.com/elements/motion/overview
- **Fluent 2 — Motion.** Duration and curve tokens for Windows. https://fluent2.microsoft.design/motion
- **Shopify Polaris — Motion.** Practical commerce UI timings. https://polaris.shopify.com/design/motion

## Research and guidance

- **Nielsen Norman Group — Duration and animation.** http://www.nngroup.com/articles/animation-duration/
- **Nielsen Norman Group — Motion and attention.** https://www.nngroup.com/articles/motion-design/
- **WCAG 2.3.3, Animation from Interactions.** https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- **WCAG 2.2.2, Pause, Stop, Hide.** https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- **WCAG 1.4.13, Content on Hover or Focus.** https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- **MDN — `prefers-reduced-motion`.** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- **web.dev — Animation performance.** https://web.dev/articles/animations-guide
- **web.dev — FLIP.** https://web.dev/articles/animating-layouts-with-the-flip-technique
- **web.dev — INP.** https://web.dev/articles/inp

## Implementation references

- **Motion (Framer Motion) — Transitions.** Springs, tween, `bounce`, `visualDuration`. https://motion.dev/docs/react-transition
- **Motion — AnimatePresence.** `mode="wait"`, `popLayout`, `sync`. https://motion.dev/docs/react-animate-presence
- **Motion — Layout animations.** `layout`, `layoutId`, `layout="position"`. https://motion.dev/docs/react-layout-animations
- **Motion — Reduced motion.** https://motion.dev/docs/react-accessibility
- **MDN — CSS transitions.** `transition-behavior`, `allow-discrete`, `@starting-style`. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions
- **MDN — View Transitions API.** https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
- **Easings.net.** Visual cubic-bezier reference. https://easings.net
- **Cubic-bezier.com.** Interactive curve editor. https://cubic-bezier.com

## Practitioner writing

- **Emil Kowalski — animations.dev.** Practical UI motion, durations and easing. https://animations.dev
- **Rauno Freiberg — Web Interface Guidelines.** Interaction details including motion. https://interfaces.rauno.me
- **Josh Comeau — Springs and CSS.** https://www.joshwcomeau.com/animation/
- **Cassie Evans — Motion path and SVG.** https://www.cassie.codes

## Standards and platform APIs

- **Agent Skills specification.** https://agentskills.io
- **SwiftUI — Animation.** https://developer.apple.com/documentation/swiftui/animation
- **SwiftUI — `matchedGeometryEffect`.** https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)
- **React Native Reanimated.** https://docs.swmansion.com/react-native-reanimated/
- **Flutter — Animations.** https://docs.flutter.dev/ui/animations
- **GSAP — `matchMedia`.** https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/

## Attribution

The 20-rule structure, numeric defaults and wording are original to this skill. The underlying conventions are drawn from the systems above, with the strongest practical influence from Material motion, Apple HIG, Motion's spring model, and the web-motion community named here.
