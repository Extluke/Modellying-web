---
name: css-hover-effects
description: >
  Automatically detect the design style of a webpage and apply matching
  pure-CSS hover effects. Zero JS, zero dependencies, no SSR issues.
  Covers navigation, cards, buttons, icons, tags, borders, shadows, and
  speech bubbles. Sourced from Hover.css (29.4k ★) and modernized.
triggers:
  - "hover effect"
  - "hover state"
  - "mouse over"
  - "mouseover"
  - "interactive card"
  - "card hover"
  - "button hover"
  - "navigation hover"
  - "link hover"
  - "add interaction"
  - "add hover"
  - "feels flat"
  - "no feedback"
  - "not interactive"
  - "css animation"
  - "css transition"
  - "hover css"
license: MIT
attribution: "Pattern library derived from Hover.css by Ian Lunn (MIT) — modernized with CSS custom properties"
upstream: "https://github.com/IanLunn/Hover"
---

# CSS Hover Effects

Zero-dependency, SSR-safe hover effect patterns for any webpage.
Automatically matches effects to the existing design style.

---

## Step 1 — Detect Design Style

Before choosing any effect, read the existing CSS and classify the design.
Check these signals in order:

### Signal Checklist

```
border-radius
  0–3px      → SHARP (corporate, enterprise)
  4–8px      → STANDARD (SaaS, neutral)
  12px+      → ROUNDED (consumer, friendly)

color saturation (look at primary/accent colors)
  muted, low-saturation (HSL s < 40%)  → MINIMAL
  moderate (40–70%)                    → STANDARD
  vivid, high-saturation (> 70%)       → BOLD

existing transitions
  none                → conservative, start subtle
  transition: all     → open to most effects
  specific property   → match their approach

spacing & density
  large padding/gaps  → marketing / hero page → bolder effects OK
  tight layout        → dashboard / app → subtle only

shadow usage
  no box-shadow       → FLAT design → avoid float-shadow
  has box-shadow      → ELEVATED → float-shadow fits
  
font style
  serif               → editorial / formal → no bouncy effects
  display / heavy     → bold brand → strong effects OK
  system-ui / sans    → neutral → match by other signals
```

### Style Classification

After reading signals, pick ONE category:

| Style | Signals | Examples |
|-------|---------|---------|
| **MINIMAL** | muted colors + large radius + no shadow + system font | Notion, Linear, Vercel |
| **BOLD** | vivid colors + any radius + strong shadow + display font | Stripe, creative agencies |
| **PLAYFUL** | vivid colors + large radius + playful font + colorful palette | Duolingo, consumer apps |
| **CORPORATE** | muted/navy colors + small radius + tight density + no decoration | B2B SaaS, dashboards |
| **DARK-PREMIUM** | dark background + glow accents + medium radius | Raycast, Linear dark, dev tools |

---

## Step 2 — Pick Effects from the Matrix

### Effect × Style Compatibility Matrix

| Effect | MINIMAL | BOLD | PLAYFUL | CORPORATE | DARK-PREMIUM |
|--------|---------|------|---------|-----------|--------------|
| Float | ✅ | ✅ | ✅ | ✅ | ✅ |
| Float Shadow | ❌ (flat) | ✅ | ✅ | ❌ | ✅ |
| Glow | ❌ | ✅ | ✅ | ❌ | ✅ ★ best |
| Underline From Center | ✅ ★ best | ✅ | ✅ | ✅ | ✅ |
| Sweep To Right | ❌ (too dramatic) | ✅ | ✅ | ❌ | ❌ |
| Grow | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pulse Grow | ❌ | ✅ | ✅ | ❌ | ❌ |
| Pop | ❌ | ✅ | ✅ ★ best | ❌ | ❌ |
| Wobble | ❌ | ✅ | ✅ | ❌ | ❌ |
| Buzz | ❌ | ✅ | ✅ | ❌ | ❌ |
| Background Fade | ✅ ★ best | ✅ | ✅ | ✅ ★ best | ✅ |
| Shutter In | ❌ | ✅ ★ best | ✅ | ❌ | ✅ |
| Border Fade | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ripple Out | ❌ | ✅ | ✅ | ❌ | ✅ |
| Shadow Radial | ❌ | ✅ | ❌ | ❌ | ✅ ★ best |
| Curl | ❌ | ✅ | ✅ | ❌ | ❌ |
| Bubble (tooltip) | ✅ | ✅ | ✅ | ✅ | ✅ |

**Rules:**
- MINIMAL: max 2 effects per page, keep `duration ≤ 250ms`
- CORPORATE: only Background Fade, Underline, Border, subtle Float — nothing else
- DARK-PREMIUM: prioritize Glow and Shadow Radial over movement
- PLAYFUL: combine 2 effects (e.g. Pop + Background color change)
- Never use Wobble/Buzz on elements that appear more than 3× on one page

---

## Step 3 — Effect Library (Copy-Ready CSS)

Use CSS custom properties to match the existing palette.
Replace `var(--accent)` with the project's actual accent color.

---

### CATEGORY: 2D Transitions

#### Float
Lifts element upward. Universal, works with all styles.
```css
.hvr-float {
  --duration: 0.3s;
  transition: transform var(--duration) ease;
}
.hvr-float:hover {
  transform: translateY(-6px);
}
```
*For MINIMAL: use `translateY(-4px)`. For BOLD/PLAYFUL: use `translateY(-8px)`.*

---

#### Float Shadow
Float + matching shadow. Only use when design already has shadows.
```css
.hvr-float-shadow {
  --duration: 0.3s;
  --shadow-color: rgba(0, 0, 0, 0.12);
  transition: transform var(--duration) ease,
              box-shadow var(--duration) ease;
}
.hvr-float-shadow:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px var(--shadow-color);
}
```
*Tip: Set `--shadow-color` to a tinted version of the accent color for richer feel.*

---

#### Grow
Subtle scale up. Safe on any element, good for cards and images.
```css
.hvr-grow {
  transition: transform 0.2s ease;
}
.hvr-grow:hover {
  transform: scale(1.05);
}
```

---

#### Shrink
Scale down — signals "this is pressable". Good for icon buttons.
```css
.hvr-shrink {
  transition: transform 0.2s ease;
}
.hvr-shrink:hover {
  transform: scale(0.94);
}
```

---

#### Pop
Spring-like scale with elastic overshoot. PLAYFUL and BOLD only.
```css
.hvr-pop {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hvr-pop:hover {
  transform: scale(1.15);
}
```

---

#### Pulse Grow
Pulsing grow animation. Draws attention to a single CTA.
Use sparingly — maximum one element per page.
```css
.hvr-pulse-grow {
  animation: hvr-pulse-grow 0.4s linear infinite alternate;
}
@keyframes hvr-pulse-grow {
  to { transform: scale(1.06); }
}
```

---

#### Wobble Horizontal
Playful side-to-side shake. Tags, badges, fun UI only.
```css
.hvr-wobble-horizontal:hover {
  animation: hvr-wobble-h 0.8s ease both;
}
@keyframes hvr-wobble-h {
  16.65% { transform: translateX(6px); }
  33.3%  { transform: translateX(-5px); }
  49.95% { transform: translateX(4px); }
  66.6%  { transform: translateX(-2px); }
  83.25% { transform: translateX(1px); }
  100%   { transform: translateX(0); }
}
```

---

#### Buzz
Rapid vibration. Alerts, error states, notification icons only.
```css
.hvr-buzz:hover {
  animation: hvr-buzz 0.15s linear infinite;
}
@keyframes hvr-buzz {
  50% { transform: translateX(2px) rotate(1deg); }
  100% { transform: translateX(-2px) rotate(-1deg); }
}
```

---

#### Bob
Gentle floating bob animation. Always-on, not hover-triggered.
For decorative hero elements, logo marks.
```css
.hvr-bob {
  animation: hvr-bob 1.5s ease infinite;
}
@keyframes hvr-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

---

### CATEGORY: Background Transitions

#### Background Fade
Color wash on hover. The safest background effect — works everywhere.
```css
.hvr-bg-fade {
  --bg-hover: rgba(99, 102, 241, 0.08); /* use accent at 8% opacity */
  transition: background-color 0.25s ease;
}
.hvr-bg-fade:hover {
  background-color: var(--bg-hover);
}
```
*CORPORATE default. For table rows, menu items, list items.*

---

#### Sweep To Right
Solid color sweeps in from left. Dramatic — BOLD and PLAYFUL only.
```css
.hvr-sweep-right {
  --sweep-color: var(--accent, #6366f1);
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: color 0.3s ease;
}
.hvr-sweep-right::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--sweep-color);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  z-index: -1;
}
.hvr-sweep-right:hover::before { transform: scaleX(1); }
.hvr-sweep-right:hover { color: white; }
```

---

#### Shutter In Horizontal
Split shutter opens from center. High-impact CTA buttons.
```css
.hvr-shutter-in-h {
  --shutter-color: var(--accent, #6366f1);
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: color 0.35s ease;
}
.hvr-shutter-in-h::before,
.hvr-shutter-in-h::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 50%;
  background: var(--shutter-color);
  transition: transform 0.35s ease;
  z-index: -1;
}
.hvr-shutter-in-h::before { left: 0; transform: scaleX(0); transform-origin: left; }
.hvr-shutter-in-h::after  { right: 0; transform: scaleX(0); transform-origin: right; }
.hvr-shutter-in-h:hover::before,
.hvr-shutter-in-h:hover::after { transform: scaleX(1); }
.hvr-shutter-in-h:hover { color: white; }
```

---

#### Radial Out
Circular ripple expands from center. For image thumbnails and avatars.
```css
.hvr-radial-out {
  --radial-color: var(--accent, #6366f1);
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: color 0.3s ease;
}
.hvr-radial-out::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--radial-color);
  transform: scale(0);
  transition: transform 0.4s ease;
  z-index: -1;
}
.hvr-radial-out:hover::before { transform: scale(2.5); border-radius: 0; }
.hvr-radial-out:hover { color: white; }
```

---

### CATEGORY: Border Transitions

#### Underline From Center
Line grows outward from center below text. Navigation links — universal.
```css
.hvr-underline-center {
  --line-color: var(--accent, #6366f1);
  --line-height: 2px;
  position: relative;
}
.hvr-underline-center::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%; right: 50%;
  height: var(--line-height);
  background: var(--line-color);
  transition: left 0.25s ease, right 0.25s ease;
}
.hvr-underline-center:hover::after { left: 0; right: 0; }
```

---

#### Underline From Left
Line slides in from left. More directional than center version.
```css
.hvr-underline-left {
  --line-color: var(--accent, #6366f1);
  position: relative;
}
.hvr-underline-left::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 100%;
  height: 2px;
  background: var(--line-color);
  transition: right 0.25s ease;
}
.hvr-underline-left:hover::after { right: 0; }
```

---

#### Border Fade
Thin border appears on hover. Cards, panels, image containers.
```css
.hvr-border-fade {
  --border-color: var(--accent, #6366f1);
  border: 2px solid transparent;
  transition: border-color 0.25s ease;
}
.hvr-border-fade:hover {
  border-color: var(--border-color);
}
```

---

#### Ripple Out
Border ripple expands outward. Circular buttons and icon buttons.
```css
.hvr-ripple-out {
  --ripple-color: var(--accent, #6366f1);
  position: relative;
}
.hvr-ripple-out::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--ripple-color);
  border-radius: inherit;
  opacity: 0;
  transform: scale(1);
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.hvr-ripple-out:hover::before {
  transform: scale(1.12);
  opacity: 1;
}
```

---

#### Reveal (underline reveal)
Text appears to uncover a colored bar beneath. Emphasis links.
```css
.hvr-reveal {
  --reveal-color: var(--accent, #6366f1);
  position: relative;
  overflow: hidden;
}
.hvr-reveal::after {
  content: '';
  position: absolute;
  bottom: 0; left: -100%;
  width: 100%; height: 2px;
  background: var(--reveal-color);
  transition: left 0.3s ease;
}
.hvr-reveal:hover::after { left: 0; }
```

---

### CATEGORY: Shadow & Glow

#### Glow
Colored glow on hover. Signature effect for DARK-PREMIUM style.
```css
.hvr-glow {
  --glow-color: rgba(99, 102, 241, 0.5); /* use accent at 50% opacity */
  transition: box-shadow 0.3s ease;
}
.hvr-glow:hover {
  box-shadow: 0 0 18px var(--glow-color);
}
```
*For dark backgrounds: increase opacity to 0.7. For light backgrounds: 0.3.*

---

#### Shadow
Directional shadow on hover. Cards on white backgrounds.
```css
.hvr-shadow {
  transition: box-shadow 0.3s ease;
}
.hvr-shadow:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
```

---

#### Shadow Radial
Inward radial shadow — dramatic focus effect. DARK-PREMIUM only.
```css
.hvr-shadow-radial {
  --glow: rgba(99, 102, 241, 0.35);
  transition: box-shadow 0.4s ease;
}
.hvr-shadow-radial:hover {
  box-shadow: 0 0 0 4px var(--glow), 0 0 40px var(--glow);
}
```

---

### CATEGORY: Icons (with text)

Use these when a button or nav item contains both text and an icon.

#### Icon Forward
Icon slides right on hover. Navigation items with → arrows.
```css
.hvr-icon-forward .icon {
  transform: translateX(0);
  transition: transform 0.2s ease;
}
.hvr-icon-forward:hover .icon {
  transform: translateX(4px);
}
```

---

#### Icon Float
Icon floats up. Icon buttons in toolbars and sidebars.
```css
.hvr-icon-float .icon {
  transition: transform 0.3s ease;
}
.hvr-icon-float:hover .icon {
  transform: translateY(-4px);
}
```

---

#### Icon Spin
Icon rotates on hover. Refresh, settings, loading icons.
```css
.hvr-icon-spin .icon {
  transition: transform 0.3s ease;
}
.hvr-icon-spin:hover .icon {
  transform: rotate(90deg);
}
```

---

#### Icon Grow
Icon scales up while text stays still.
```css
.hvr-icon-grow .icon {
  transition: transform 0.2s ease;
}
.hvr-icon-grow:hover .icon {
  transform: scale(1.3);
}
```

---

### CATEGORY: Speech Bubbles (Tooltips)

Use when you need hover-triggered tooltip-style callouts.

#### Bubble Top
Tooltip appears above element on hover.
```css
.hvr-bubble-top {
  position: relative;
}
.hvr-bubble-top::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: #1a1a2e;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hvr-bubble-top::after {
  content: '';
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  border: 5px solid transparent;
  border-top-color: #1a1a2e;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hvr-bubble-top:hover::before,
.hvr-bubble-top:hover::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```
*Usage: `<button class="hvr-bubble-top" data-tooltip="Click to save">Save</button>`*

---

### CATEGORY: Curls

#### Curl Bottom Right
Page-curl effect at bottom-right corner. Creative / portfolio sites.
```css
.hvr-curl-bottom-right {
  position: relative;
  overflow: hidden;
}
.hvr-curl-bottom-right::before {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 0; height: 0;
  background: linear-gradient(
    225deg,
    #fff 45%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 56%, transparent 80%
  );
  transition: width 0.3s ease, height 0.3s ease;
  box-shadow: -1px -1px 4px rgba(0,0,0,0.1);
}
.hvr-curl-bottom-right:hover::before {
  width: 40px;
  height: 40px;
}
```

---

## Step 4 — Composition Rules

### Safe Combinations (use together on same element)
- Float + Border Fade
- Float Shadow + Grow (subtle grow only, max 1.03)
- Underline From Center + color transition on `:hover`
- Background Fade + Icon Forward
- Glow + Shadow Radial (DARK-PREMIUM only)

### Never Combine
- Sweep + Float (compete for attention)
- Wobble + Buzz (too chaotic)
- Pulse Grow + any other animation (seizure risk)
- Curl + Background transition (visual conflict)

### Duration Guidelines
```
MINIMAL style:     150–200ms  ease
CORPORATE style:   200–250ms  ease
STANDARD style:    200–300ms  ease
BOLD style:        250–350ms  ease
PLAYFUL style:     200–350ms  cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Accessibility
Always respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
Add this block once in the global stylesheet when applying hover effects.

---

## Step 5 — Application Checklist

Before outputting code, verify:

- [ ] Detected design style and justified the choice
- [ ] Checked compatibility matrix before picking effects
- [ ] Used CSS custom properties tied to existing palette
- [ ] Applied `prefers-reduced-motion` block
- [ ] Max 1 animation-type effect per element (no stacking)
- [ ] Pulse Grow used on ≤ 1 element per page
- [ ] Wobble/Buzz used on ≤ 3 elements per page
- [ ] All `position: relative` + `overflow: hidden` prerequisites are in place

---

## Quick Reference — Effect by Element Type

| Element | MINIMAL | BOLD | PLAYFUL | CORPORATE | DARK-PREMIUM |
|---------|---------|------|---------|-----------|--------------|
| Nav link | Underline Center | Sweep Right | Pop + color | Background Fade | Underline + Glow |
| Primary button | Grow + Border Fade | Shutter In | Pop | Background Fade | Glow |
| Secondary button | Border Fade | Sweep Right | Wobble | Border Fade | Border + Glow |
| Card | Float | Float Shadow | Pop + Shadow | Background Fade | Glow |
| Icon button | Icon Float | Icon Spin | Icon Grow | Icon Forward | Icon Float + Glow |
| Tag / badge | Grow | Pop | Pop + color | Background Fade | Grow |
| Image | Grow | Float Shadow | Float | Grow | Glow |
| Table row | Background Fade | Background Fade | Background Fade | Background Fade | Background Fade |
| Tooltip trigger | Bubble Top | Bubble Top | Bubble Top | Bubble Top | Bubble Top |
