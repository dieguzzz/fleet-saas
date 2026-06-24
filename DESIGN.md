---
name: Merlin
description: Gestión empresarial inteligente para PyMEs
colors:
  violet-brand: "#7c3aed"
  indigo-deep: "#4f46e5"
  ink-dark: "#1a1a1a"
  ink-body: "#404040"
  neutral-muted: "#737373"
  surface-card: "#ffffff"
  surface-bg: "#ffffff"
  surface-muted: "#f5f5f5"
  border-default: "#e8e8e8"
  destructive-red: "#dc2626"
  success-green: "#16a34a"
  warning-amber: "#d97706"
  dark-bg: "#1a1a1a"
  dark-card: "#262626"
  dark-ink: "#fafafa"
  dark-muted: "#a3a3a3"
  dark-border: "rgba(255,255,255,0.1)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.05em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.violet-brand}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#6d28d9"
  button-outline:
    backgroundColor: "{colors.surface-bg}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-default:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
---

# Design System: Merlin

## 1. Overview

**Creative North Star: "La Herramienta de Bolsillo"**

Merlin is a pocket tool — compact, direct, always at hand. Like a digital Swiss Army knife for Latin American SMBs managing fleets, kitchens, finances, and teams. The interface disappears into the task: no chrome competes with the data, no decoration exists without function. Every screen answers one question fast, whether the user is a business owner at a desk or a field operator checking their phone under the sun.

The system is achromatic by doctrine. Pure neutral grays carry the structure; a single violet accent marks interactive elements and brand moments. This restraint is not minimalism for its own sake — it's operational clarity. When violet appears, it means something. When a surface is white (or dark-mode near-black), it means the content is what matters.

The feel is soft and welcoming, not cold or clinical. Gently rounded corners, smooth transitions, and generous touch targets communicate that this tool was built for real people with busy hands, not for design portfolios. Merlin speaks Spanish, tutea al usuario, and treats complexity as something to reveal progressively — never to dump on screen.

**Key Characteristics:**
- Achromatic structure with a single violet accent
- Soft, rounded component language (10-18px radii on containers)
- Mobile-real: 44px touch targets, one-hand operation
- Progressive disclosure over information density
- Full light/dark theme parity via OKLCH tokens
- Geist type family throughout (sans + mono)

## 2. Colors

An achromatic palette with a single accent. Structure is conveyed through lightness steps, not hue. The violet-to-indigo range is reserved exclusively for interactive elements and brand identity.

### Primary
- **Violet Brand** (`oklch(0.541 0.245 293)` / #7c3aed): Primary interactive color — buttons, active nav states, links, focus rings. Used on ≤10% of any given screen.
- **Indigo Deep** (`oklch(0.496 0.232 264)` / #4f46e5): Gradient partner for the logo mark and hero accents. Never used alone as an interactive color.

### Neutral
- **Ink Dark** (`oklch(0.145 0 0)` / #1a1a1a): Headings, high-emphasis text. The darkest value in the light theme.
- **Ink Body** (`oklch(0.301 0 0)` / #404040): Body text, secondary headings.
- **Neutral Muted** (`oklch(0.556 0 0)` / #737373): Placeholder text, captions, metadata. Must maintain 4.5:1 against white.
- **Surface Card** (`oklch(1 0 0)` / #ffffff): Card backgrounds, popovers, dialogs.
- **Surface Background** (`oklch(1 0 0)` / #ffffff): Page body in light mode.
- **Surface Muted** (`oklch(0.97 0 0)` / #f5f5f5): Section backgrounds, secondary surface, sidebar.
- **Border Default** (`oklch(0.922 0 0)` / #e8e8e8): Card borders, dividers, input strokes.

### Semantic
- **Destructive Red** (#dc2626): Delete actions, error states. Never decorative.
- **Success Green** (#16a34a): Confirmation, positive status badges.
- **Warning Amber** (#d97706): Caution states, pending actions.

### Named Rules
**The One Accent Rule.** Violet is the only chromatic color in the structural palette. Status colors (red, green, amber) appear contextually in badges and alerts — they never carry structural weight. If a new feature needs "another accent," it doesn't; it needs violet applied differently.

**The Dark Parity Rule.** Every light-mode surface has a dark-mode counterpart defined in the same token layer. No component may hardcode `bg-white` or `text-black`. The semantic tokens (`--background`, `--card`, `--foreground`, `--muted-foreground`, `--border`) are the only source of truth.

## 3. Typography

**Display Font:** Geist (with system-ui fallback)
**Body Font:** Geist (same family, weight differentiation)
**Mono Font:** Geist Mono (code blocks, tabular data, timestamps)

**Character:** A single-family system that relies on weight contrast rather than font-family contrast. Geist is geometric enough to feel modern, humanist enough to feel approachable. The mono cut shares the same skeletal structure, so code and data feel native rather than foreign.

### Hierarchy
- **Display** (700, `clamp(2rem, 5vw, 3.75rem)`, 1.1): Landing page hero only. Letter-spacing -0.02em.
- **Headline** (700, 1.5rem, 1.25): Page titles inside the app shell. `text-2xl font-bold`.
- **Title** (600, 1rem, 1.4): Card headers, section labels, nav group headers. `text-base font-semibold`.
- **Body** (400, 0.875rem, 1.5): All running text, table cells, form descriptions. Max line length 65-75ch.
- **Label** (500, 0.75rem, 1.3): Form labels, metadata, badge text. Uppercase with 0.05em tracking on form field labels (`field-label` component class).

### Named Rules
**The Weight Ladder Rule.** Hierarchy is expressed through weight (700 → 600 → 500 → 400), not through size alone. A 600-weight title at 1rem outranks a 400-weight body at 1rem. Size steps are small (0.75 → 0.875 → 1 → 1.5rem); weight does the heavy lifting.

## 4. Elevation

Merlin uses a flat-by-default approach with minimal shadow. Depth is conveyed primarily through border + background contrast (card on background), not through shadow intensity.

### Shadow Vocabulary
- **Shadow XS** (`0 1px 2px rgba(0,0,0,0.05)`): Default card shadow in light mode. Nearly imperceptible — a gentle lift.
- **Shadow SM** (`0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`): Dropdown menus, popovers.
- **Shadow LG** (`0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)`): Dialogs, modals.

### Named Rules
**The Flat-at-Rest Rule.** Surfaces are flat at rest. Shadows appear as a response to elevation change (popovers, modals) or interaction (dropdown open), never as decoration. In dark mode, shadows are suppressed entirely; the `oklch(1 0 0 / 10%)` border token carries the surface boundary.

## 5. Components

### Buttons
- **Shape:** Gently rounded (8px / `rounded-md`)
- **Primary:** `bg-primary text-primary-foreground` (violet on white). Height 36px, horizontal padding 16px. Hover darkens to ~90% opacity.
- **Focus:** 3px ring in `ring/50` with `border-ring` border shift. Visible, not decorative.
- **Outline:** White/transparent bg, default border, hover shifts to `bg-accent`. Shadow-xs gives subtle depth.
- **Ghost:** No border, no background. Hover reveals `bg-accent`. Used in toolbars and nav.
- **Destructive:** `bg-destructive text-white`. Reserved for delete confirmations.
- **Sizes:** xs (24px), sm (32px), default (36px), lg (40px), icon variants match height to width.

### Cards / Containers
- **Corner Style:** Generously rounded (18px / `rounded-2xl` for page-level cards, 12px / `rounded-xl` for the Card component)
- **Background:** `bg-card` (white / dark:#262626)
- **Border:** 1px `border-border`. Always present — cards are border-defined, not shadow-defined.
- **Shadow:** shadow-sm in light mode, none in dark mode.
- **Internal Padding:** 24px (`p-6`) standard, 16-20px (`p-4` / `p-5`) for compact contexts.
- **Form cards** use the `.form-card` utility: `rounded-xl shadow-sm border p-4 lg:p-5`.

### Inputs / Fields
- **Style:** Transparent background, 1px `border-input` stroke, rounded-md (8px). Height 36px.
- **Focus:** Border shifts to `border-ring`, 3px ring in `ring/50`. Clean ring, no glow.
- **Error:** Ring shifts to `destructive/20`, border to `destructive`.
- **Disabled:** 50% opacity, `cursor-not-allowed`.
- **Field labels** (`.field-label`): 0.75rem, medium weight, uppercase, wide tracking, muted-foreground. Tight 2px margin-bottom.
- **Field inputs** (`.field-input`): unified utility class with full token adherence.

### Navigation (Sidebar)
- **Desktop:** Fixed sidebar, `bg-sidebar` background, full-height.
- **Mobile:** Slide-in overlay with spring animation (stiffness 300, damping 30). Backdrop with 55% black opacity + 6px blur.
- **Nav items:** Ghost-style with icon + label. Active state uses `bg-sidebar-accent text-sidebar-accent-foreground`. Rounded-lg (10px).
- **Section headers:** Uppercase label style, muted-foreground.
- **User footer:** Avatar + name at sidebar bottom, sign-out action.

### Header
- **Style:** `bg-card` with bottom border, height 56px. Spring-animated hide-on-scroll (desktop stays fixed).
- **Mobile:** Hamburger + org name. Touch-friendly 44px minimum targets.
- **Org switcher:** Dropdown with all organizations (super admin sees all).
- **Theme toggle:** Icon button switching light/dark.

### Status Badges
- **Pattern:** Colored background + text pairs with explicit `dark:` variants.
- **Active/Success:** `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`
- **Warning:** `bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300`
- **Error:** `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`
- **Info:** `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`

### Empty States
- **Component:** `EmptyState` with icon (muted), title, description, optional action button.
- **Style:** Centered, padded (py-12), muted tones. The icon is decorative; the CTA is the point.

## 6. Do's and Don'ts

### Do:
- **Do** use semantic tokens (`bg-card`, `text-foreground`, `border-border`) for every surface. The token is the source of truth, not the hex value.
- **Do** maintain 4.5:1 contrast ratio on all body text against its background. Test muted-foreground on both light and dark surfaces.
- **Do** use 44px minimum touch targets on every interactive element. Operators use this in the field with occupied hands.
- **Do** reveal complexity progressively. Show the essential action first; put secondary options behind a menu, disclosure, or second screen.
- **Do** pair every `bg-*-100` badge with its `dark:bg-*-900/30 dark:text-*-300` counterpart. No badge ships without a dark mode pair.
- **Do** use `text-wrap: balance` on headings (h1-h3) and `text-wrap: pretty` on body prose.

### Don't:
- **Don't** use hardcoded colors (`bg-white`, `text-black`, `bg-slate-800`, `text-gray-500`) in any component. This is the single most common regression and breaks dark mode immediately.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, list items, or alerts.
- **Don't** create interfaces that look like ERPs (SAP, Oracle): no 30-field forms without grouping, no tables as the only UI pattern, no 3-level nested navigation menus.
- **Don't** add a second chromatic accent color. Violet is the only accent. Status colors are contextual, not structural.
- **Don't** use gradient text (`background-clip: text`). The landing hero gradient is legacy; new instances are prohibited.
- **Don't** nest cards inside cards. One level of containment only.
- **Don't** use shadows heavier than shadow-sm on cards at rest. Elevation is structural (popovers, modals), not decorative.
- **Don't** add motion that blocks content visibility. Every animation must enhance an already-visible default. Content must render without waiting for a transition to complete.
- **Don't** skip `prefers-reduced-motion` alternatives. Every animation needs a reduced-motion fallback.
