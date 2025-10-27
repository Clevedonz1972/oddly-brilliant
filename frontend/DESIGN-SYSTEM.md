# Oddly Brilliant Design System

**Version:** 2.0
**Last Updated:** 2025-10-27
**Quality Target:** 9+/10 (Stripe/Linear/Vercel-level polish)

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Border Radius](#border-radius)
6. [Elevation & Shadows](#elevation--shadows)
7. [Animation System](#animation-system)
8. [Component Patterns](#component-patterns)
9. [Accessibility](#accessibility)
10. [Usage Guidelines](#usage-guidelines)

---

## Brand Identity

### Design Philosophy

**Oddly Brilliant** combines cyberpunk aesthetics with professional polish. We create interfaces that feel futuristic and energetic while maintaining exceptional usability and accessibility.

**Core Principles:**
- **Cyberpunk Aesthetic**: Neon glows, electric colors, terminal-inspired typography
- **Professional Polish**: Stripe/Linear-level attention to detail and micro-interactions
- **Neurodivergent-Friendly**: High contrast, clear focus states, reduced-motion support
- **Accessible-First**: WCAG 2.1 AA compliance minimum
- **Performance-Conscious**: 60fps animations, optimized bundle size

**Visual Vibe:**
- Bladerunner meets modern SaaS
- Dark themes with vibrant neon accents
- Monospace headings + clean sans-serif body
- Subtle grid patterns and scanline effects
- Glow effects that enhance, not overwhelm

---

## Color System

### Primary Palette

Our cyberpunk color system uses three main accent colors against dark backgrounds:

#### Backgrounds

```css
--bg-primary: #0a0e27;      /* Deep space blue - main background */
--bg-surface: #1a1f3a;      /* Elevated surfaces */
--bg-elevated: #252b4a;     /* Interactive elements */
```

**Tailwind Tokens:**
```js
bg-cyber-dark: '#0a0e27'
bg-cyber-surface: '#1a1f3a'
bg-cyber-elevated: '#252b4a'
```

#### Text Colors

```css
--text-primary: #e0e7ff;    /* Primary text - high contrast */
--text-secondary: #94a3b8;  /* Secondary text - medium contrast */
--text-muted: #64748b;      /* Muted text - low contrast */
```

**Tailwind Tokens:**
```js
text-cyber-primary: '#e0e7ff'
text-cyber-secondary: '#94a3b8'
text-cyber-muted: '#64748b'
```

#### Accent Colors

**Primary (Cyan/Electric Blue):**
```css
--primary: #00d9ff;
--primary-glow: rgba(0, 217, 255, 0.25);
```

**Full Scale:**
- `cyan-50`: `#ecfeff` (almost white)
- `cyan-100`: `#cffafe`
- `cyan-200`: `#a5f3fc`
- `cyan-300`: `#67e8f9`
- `cyan-400`: `#22d3ee`
- `cyan-500`: `#00d9ff` ⭐ **Primary**
- `cyan-600`: `#00b8d9`
- `cyan-700`: `#0097b3`
- `cyan-800`: `#00768c`
- `cyan-900`: `#005566`

**Secondary (Magenta/Hot Pink):**
```css
--secondary: #ff006e;
--secondary-glow: rgba(255, 0, 110, 0.25);
```

**Full Scale:**
- `magenta-50`: `#fff0f7`
- `magenta-100`: `#ffe0ef`
- `magenta-200`: `#ffc2df`
- `magenta-300`: `#ff94c7`
- `magenta-400`: `#ff66af`
- `magenta-500`: `#ff006e` ⭐ **Secondary**
- `magenta-600`: `#d9005e`
- `magenta-700`: `#b3004e`
- `magenta-800`: `#8c003e`
- `magenta-900`: `#66002e`

**Accent (Purple):**
```css
--accent: #7b2cbf;
--accent-glow: rgba(123, 44, 191, 0.25);
```

**Full Scale:**
- `purple-50`: `#faf5ff`
- `purple-100`: `#f3e8ff`
- `purple-200`: `#e9d5ff`
- `purple-300`: `#d8b4fe`
- `purple-400`: `#c084fc`
- `purple-500`: `#a855f7`
- `purple-600`: `#9333ea`
- `purple-700`: `#7b2cbf` ⭐ **Accent**
- `purple-800`: `#6b21a8`
- `purple-900`: `#581c87`

#### Status Colors

**Success (Neon Green):**
```css
--success: #00ff88;
--success-glow: rgba(0, 255, 136, 0.25);
```

**Warning (Amber):**
```css
--warning: #ffb800;
--warning-glow: rgba(255, 184, 0, 0.25);
```

**Error (Crimson Red):**
```css
--error: #ff4757;
--error-glow: rgba(255, 71, 87, 0.25);
```

**Info (Primary Cyan):**
```css
--info: #00d9ff;
--info-glow: rgba(0, 217, 255, 0.25);
```

#### Borders

```css
--border: #2d3555;          /* Default border */
--border-glow: #00d9ff;     /* Interactive border glow */
```

### Gradients

**Cyber Gradient (Cyan to Purple):**
```css
--gradient-cyber: linear-gradient(135deg, #00d9ff 0%, #7b2cbf 100%);
```

**Pink Gradient (Magenta to Crimson):**
```css
--gradient-pink: linear-gradient(135deg, #ff006e 0%, #ff4757 100%);
```

**Green Gradient (Success to Cyan):**
```css
--gradient-green: linear-gradient(135deg, #00ff88 0%, #00d9ff 100%);
```

---

## Typography

### Font Families

**Display/Headings (Monospace):**
```css
--font-display: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

**Body (Sans-serif):**
```css
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

**Code/Terminal:**
```css
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

Based on a 1.250 (major third) modular scale with 16px base:

| Token | Size (rem) | Size (px) | Line Height | Use Case |
|-------|------------|-----------|-------------|----------|
| `text-xs` | 0.75rem | 12px | 1.5 | Micro labels, badges |
| `text-sm` | 0.875rem | 14px | 1.5 | Small text, captions |
| `text-base` | 1rem | 16px | 1.625 | Body text, paragraphs |
| `text-lg` | 1.125rem | 18px | 1.5 | Large body, subheadings |
| `text-xl` | 1.25rem | 20px | 1.4 | Section headings |
| `text-2xl` | 1.5rem | 24px | 1.3 | Card titles, h3 |
| `text-3xl` | 1.875rem | 30px | 1.25 | Page headings, h2 |
| `text-4xl` | 2.25rem | 36px | 1.2 | Hero headings, h1 |
| `text-5xl` | 3rem | 48px | 1.1 | Display text |
| `text-6xl` | 3.75rem | 60px | 1 | Hero display |

### Font Weights

- `font-normal`: 400 (body text)
- `font-medium`: 500 (emphasis)
- `font-semibold`: 600 (headings)
- `font-bold`: 700 (strong emphasis)

### Typography Guidelines

**Headings (h1-h6):**
- Font family: `JetBrains Mono` (monospace)
- Font weight: 600 (semibold)
- Letter spacing: -0.025em (tighter)
- Color: `--text-primary`

**Body Text:**
- Font family: `Inter` (sans-serif)
- Font weight: 400 (normal)
- Line height: 1.625 (relaxed for readability)
- Color: `--text-primary` or `--text-secondary`

**Labels:**
- Font family: `JetBrains Mono` (monospace)
- Font weight: 500-600
- Text transform: uppercase
- Letter spacing: 0.05em (wide)
- Color: `--text-secondary`

---

## Spacing System

Based on 4px grid with powers of 2 for scale:

| Token | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `space-0` | 0 | 0px | Reset |
| `space-px` | 1px | 1px | Hairline |
| `space-0.5` | 0.125rem | 2px | Micro spacing |
| `space-1` | 0.25rem | 4px | Tight spacing |
| `space-2` | 0.5rem | 8px | Small spacing |
| `space-3` | 0.75rem | 12px | Medium-small |
| `space-4` | 1rem | 16px | Default spacing |
| `space-5` | 1.25rem | 20px | Medium spacing |
| `space-6` | 1.5rem | 24px | Medium-large |
| `space-8` | 2rem | 32px | Large spacing |
| `space-10` | 2.5rem | 40px | Extra large |
| `space-12` | 3rem | 48px | Section spacing |
| `space-16` | 4rem | 64px | Major sections |
| `space-20` | 5rem | 80px | Page sections |
| `space-24` | 6rem | 96px | Hero spacing |

**Common Patterns:**
- Component padding: `space-4` to `space-6` (16-24px)
- Section margins: `space-8` to `space-12` (32-48px)
- Page margins: `space-16` to `space-24` (64-96px)
- Grid gaps: `space-4` or `space-6` (16-24px)

---

## Border Radius

Consistent rounding scale:

| Token | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| `rounded-none` | 0 | 0px | Sharp edges |
| `rounded-sm` | 0.125rem | 2px | Subtle rounding |
| `rounded` | 0.25rem | 4px | Small elements (badges) |
| `rounded-md` | 0.5rem | 8px | Buttons, inputs |
| `rounded-lg` | 0.75rem | 12px | Cards, containers |
| `rounded-xl` | 1rem | 16px | Large cards |
| `rounded-2xl` | 1.5rem | 24px | Hero elements |
| `rounded-3xl` | 2rem | 32px | Extra large |
| `rounded-full` | 9999px | 50% | Circles, pills |

**Default Choice:** `rounded-md` (8px) for most interactive elements

---

## Elevation & Shadows

Cyberpunk shadow system using glow effects instead of traditional shadows:

### Level 0: Flat
```css
box-shadow: none;
```

### Level 1: Subtle Glow (Default Cards)
```css
box-shadow:
  0 0 0 1px var(--border-glow),
  0 0 20px rgba(0, 217, 255, 0.05);
```

**Tailwind:** `shadow-cyber-sm`

### Level 2: Medium Glow (Hover States)
```css
box-shadow:
  0 0 0 1px var(--primary),
  0 0 25px rgba(0, 217, 255, 0.15);
```

**Tailwind:** `shadow-cyber-md`

### Level 3: Strong Glow (Active/Focus)
```css
box-shadow:
  0 0 0 1px var(--primary),
  0 0 30px rgba(0, 217, 255, 0.2);
```

**Tailwind:** `shadow-cyber-lg`

### Level 4: Intense Glow (Buttons, CTAs)
```css
box-shadow:
  0 0 20px var(--primary-glow),
  0 0 30px var(--primary-glow);
```

**Tailwind:** `shadow-cyber-xl`

### Level 5: Maximum Glow (Hero Elements)
```css
box-shadow:
  0 0 30px var(--primary-glow),
  0 0 40px var(--primary-glow),
  0 0 50px rgba(0, 217, 255, 0.2);
```

**Tailwind:** `shadow-cyber-2xl`

### Color Variants

**Cyan Glow:**
```css
box-shadow: 0 0 20px var(--primary-glow);
```

**Magenta Glow:**
```css
box-shadow: 0 0 20px var(--secondary-glow);
```

**Purple Glow:**
```css
box-shadow: 0 0 20px var(--accent-glow);
```

**Success Glow:**
```css
box-shadow: 0 0 20px var(--success-glow);
```

---

## Animation System

### Timing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Duration Scale

| Token | Duration | Use Case |
|-------|----------|----------|
| `duration-75` | 75ms | Micro-interactions |
| `duration-100` | 100ms | Quick feedback |
| `duration-150` | 150ms | Button hovers |
| `duration-200` | 200ms | Default transitions |
| `duration-300` | 300ms | Card animations |
| `duration-500` | 500ms | Page transitions |
| `duration-700` | 700ms | Complex animations |
| `duration-1000` | 1000ms | Ambient effects |

### Animation Principles

1. **Subtle by Default**: Most animations should be 150-300ms
2. **Performance First**: Use `transform` and `opacity` only when possible
3. **Respect Motion Preferences**: Always honor `prefers-reduced-motion`
4. **60fps Target**: All animations must maintain smooth 60fps
5. **Meaningful Motion**: Every animation should communicate purpose

### Common Animations

**Fade In:**
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Slide Up:**
```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Glow Pulse:**
```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--primary-glow);
  }
  50% {
    box-shadow: 0 0 30px var(--primary-glow), 0 0 40px var(--primary-glow);
  }
}
```

**Spin:**
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Shimmer (Loading):**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## Component Patterns

### Button Variants

**Primary (Cyan):**
- Border: 2px solid cyan
- Background: Transparent → Cyan on hover
- Text: Cyan → Dark on hover
- Glow: Cyan glow increases on hover

**Secondary (Magenta):**
- Border: 2px solid magenta
- Background: Transparent → Magenta on hover
- Text: Magenta → White on hover
- Glow: Magenta glow increases on hover

**Outline (Purple):**
- Border: 2px solid purple
- Background: Transparent → Purple on hover
- Text: Purple → White on hover
- Glow: Purple glow increases on hover

**Sizes:**
- `sm`: Padding 0.5rem 1rem, text-sm, min-h-36px
- `md`: Padding 0.75rem 1.5rem, text-base, min-h-44px (default)
- `lg`: Padding 1rem 2rem, text-lg, min-h-52px

**States:**
- Default: Subtle glow
- Hover: Filled background, intense glow, translateY(-1px)
- Focus: Focus ring (2px outline + glow)
- Active: Scale(0.98)
- Disabled: Opacity 0.5, no glow, cursor not-allowed
- Loading: Spinner icon + disabled state

### Card Variants

**Default:**
- Background: `--bg-surface`
- Border: 1px solid `--border`
- Border radius: `rounded-lg` (12px)
- Padding: `space-6` (24px)
- Shadow: `shadow-cyber-sm`

**Interactive:**
- Hover: Border color → primary, shadow-cyber-md, translateY(-2px)
- Focus: Focus ring
- Keyboard: Enter/Space activation

**Colored Accents:**
- `cyan`: 4px left border + cyan glow
- `magenta`: 4px left border + magenta glow
- `purple`: 4px left border + purple glow
- `green`: 4px left border + success glow

**Elevation Levels:**
- `flat`: No shadow
- `default`: shadow-cyber-sm
- `elevated`: shadow-cyber-md
- `floating`: shadow-cyber-lg

### Input States

**Default:**
- Background: `--bg-elevated`
- Border: 1px solid `--border`
- Border radius: `rounded-md` (8px)
- Padding: 0.75rem 1rem
- Transition: 300ms

**Focus:**
- Border: 1px solid `--primary`
- Shadow: 0 0 0 2px primary-glow + 0 0 10px primary-glow
- Outline: None (using shadow instead)

**Error:**
- Border: 1px solid `--error`
- Shadow: Error glow on focus
- Shake animation on validation failure

**Success:**
- Border: 1px solid `--success`
- Shadow: Success glow on focus
- Optional checkmark icon

**Disabled:**
- Background: `--bg-surface`
- Opacity: 0.6
- Cursor: not-allowed

### Badge Variants

**Sizes:**
- `sm`: text-xs, px-2, py-0.5
- `md`: text-sm, px-2.5, py-1 (default)
- `lg`: text-base, px-3, py-1.5

**Colors:**
- `primary`: Cyan border + cyan text + cyan glow
- `secondary`: Magenta border + magenta text + magenta glow
- `success`: Green border + green text + green glow
- `warning`: Amber border + amber text + amber glow
- `error`: Red border + red text + red glow
- `neutral`: Gray border + gray text

**Variants:**
- `outline`: Transparent background, colored border
- `solid`: Colored background, white text
- `pulse`: Animated pulse glow (for OPEN status)

---

## Accessibility

### Focus Indicators

**Default Focus Ring:**
```css
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--primary-glow);
}
```

**Requirements:**
- Visible on all interactive elements
- High contrast (4.5:1 minimum)
- Works in high-contrast mode
- Works without color (outline shape visible)

### Color Contrast

**Minimum Ratios (WCAG 2.1 AA):**
- Large text (18pt+): 3:1
- Normal text: 4.5:1
- Interactive elements: 3:1

**Our Ratios:**
- `--text-primary` on `--bg-primary`: ~14:1 ✅
- `--text-secondary` on `--bg-primary`: ~7:1 ✅
- `--primary` on `--bg-primary`: ~8:1 ✅
- `--success` on `--bg-primary`: ~10:1 ✅

### Touch Targets

**Minimum Sizes (WCAG 2.5.5):**
- Buttons: 44×44px minimum
- Links: 44×44px minimum (or 24×24px if sufficient spacing)
- Form controls: 44×44px minimum

**Implementation:**
- All buttons: `min-h-[44px]`
- Interactive cards: `min-h-[44px]`
- Icon buttons: `w-11 h-11` (44px)

### Motion Preferences

**Respect `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Effect:**
- No glow animations
- No pulse effects
- No transforms on hover
- Instant transitions
- Auto scroll behavior

### Keyboard Navigation

**Requirements:**
- All interactive elements focusable
- Logical tab order
- Enter/Space activate buttons
- Escape closes modals
- Arrow keys for custom controls
- Skip links for navigation

### Screen Reader Support

**Requirements:**
- Semantic HTML elements
- ARIA labels where needed
- ARIA live regions for dynamic content
- Alt text for images
- Descriptive link text (not "click here")

---

## Usage Guidelines

### When to Use What

**Buttons:**
- Use `primary` for main CTAs (1 per section max)
- Use `secondary` for alternate actions
- Use `outline` for tertiary actions
- Use `sm` for tight spaces (tables, inline)
- Use `lg` for hero CTAs

**Cards:**
- Use `default` for content containers
- Use `interactive` for clickable items
- Use colored accents for status differentiation
- Use `elevated` for modals and dialogs

**Colors:**
- Use `primary` (cyan) for main actions, links
- Use `secondary` (magenta) for alternate actions
- Use `accent` (purple) for special features
- Use `success` (green) for positive states (OPEN, VERIFIED)
- Use `warning` (amber) for caution states (PENDING, IN_REVIEW)
- Use `error` (red) for error states (CLOSED, REJECTED)

**Typography:**
- Use monospace (JetBrains Mono) for headings, labels, technical content
- Use sans-serif (Inter) for body text, descriptions
- Use uppercase + wide tracking for labels
- Use normal case for content

**Spacing:**
- Use 4/8/12px for component internals
- Use 16/24px for component margins
- Use 32/48px for section spacing
- Use 64/96px for page-level spacing

### Common Mistakes to Avoid

❌ **Don't:**
- Mix multiple primary CTAs in same section
- Use glow effects on non-interactive elements
- Nest interactive cards
- Use color alone to convey meaning
- Ignore motion preferences
- Create custom colors outside the system
- Use `!important` unless absolutely necessary

✅ **Do:**
- Use semantic HTML
- Provide focus indicators
- Test with keyboard only
- Test with screen readers
- Respect user preferences
- Use design tokens from Tailwind config
- Follow spacing system consistently

---

## Implementation Checklist

### For New Components

- [ ] Uses design tokens from Tailwind config
- [ ] Supports all required variants
- [ ] Has proper focus indicators
- [ ] Meets 44px touch target minimum
- [ ] Respects `prefers-reduced-motion`
- [ ] Has ARIA labels where needed
- [ ] Keyboard navigable
- [ ] Works with screen readers
- [ ] Tested at different viewport sizes
- [ ] Documented in Storybook (if applicable)

### For New Pages

- [ ] Uses consistent spacing system
- [ ] Has semantic HTML structure
- [ ] Has skip links for navigation
- [ ] Has page title and meta description
- [ ] Keyboard navigable in logical order
- [ ] Meets color contrast requirements
- [ ] Respects motion preferences
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading states implemented
- [ ] Error states implemented

---

## Version History

**v2.0 (2025-10-27):**
- Formalized design system with comprehensive tokens
- Added systematic spacing scale (4px grid)
- Added elevation system with cyberpunk glow levels
- Added typography scale (1.250 modular scale)
- Added component patterns documentation
- Added accessibility guidelines
- Tailwind config integration planned

**v1.0 (Initial):**
- Basic cyberpunk color palette
- Initial component styles
- Animation library

---

## Resources

**Fonts:**
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Display/Code)
- [Inter](https://fonts.google.com/specimen/Inter) (Body)

**Color Tools:**
- [Colorable](https://colorable.jxnblk.com/) - Contrast checker
- [Coolors](https://coolors.co/) - Palette generator

**Accessibility:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)

**Design Inspiration:**
- [Stripe](https://stripe.com) - Professional polish
- [Linear](https://linear.app) - Elegant interactions
- [Vercel](https://vercel.com) - Clean aesthetics
- [Cyberpunk 2077](https://www.cyberpunk.net/) - Visual vibe

---

**Last updated:** 2025-10-27
**Maintained by:** Claude Code
**Target Quality:** 9+/10 (Stripe/Linear/Vercel-level)
