# Oddly Brilliant Component Usage Guide

**Version:** 2.0
**Last Updated:** 2025-10-27
**For Developers:** Complete guide to using the component library

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Common Components](#common-components)
3. [Animation Components](#animation-components)
4. [Hooks](#hooks)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## Getting Started

### Installation

All components are available through centralized exports:

```tsx
// Common UI components
import { Button, Card, Input, Badge, Toast } from '@/components/common';

// Animation components
import { FadeInOnScroll, ParallaxSection } from '@/components/animations';

// Hooks
import { useToast, useScrollAnimation } from '@/hooks/useScrollAnimation';
```

### Setup Requirements

**Toast System:**
```tsx
// Wrap your app with ToastProvider
import { ToastProvider } from '@/components/common';

function App() {
  return (
    <ToastProvider position="top-right" maxToasts={3}>
      <YourApp />
    </ToastProvider>
  );
}
```

---

## Common Components

### Button

Professional button component with multiple variants, sizes, and states.

**Import:**
```tsx
import { Button } from '@/components/common';
```

**Basic Usage:**
```tsx
<Button variant="primary" size="md">
  Click Me
</Button>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'success' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `icon` | `ReactNode` | - | Optional icon |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |

**Examples:**

```tsx
// Primary button with icon
<Button variant="primary" icon={<PlusIcon />}>
  Create Challenge
</Button>

// Loading state
<Button loading>Saving...</Button>

// Success button (large)
<Button variant="success" size="lg">
  Complete
</Button>

// Danger button (small)
<Button variant="danger" size="sm">
  Delete
</Button>
```

**Best Practices:**
- Use `primary` for main CTA (1 per section max)
- Use `secondary` for alternate actions
- Use `outline` for tertiary actions
- Use `success` for positive confirmations
- Use `danger` for destructive actions
- Always provide `loading` state for async actions

---

### Card

Container component with colored variants and elevation levels.

**Import:**
```tsx
import { Card } from '@/components/common';
```

**Basic Usage:**
```tsx
<Card>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'cyan' \| 'magenta' \| 'purple' \| 'green'` | `'default'` | Color accent |
| `elevation` | `'flat' \| 'default' \| 'elevated' \| 'floating'` | `'default'` | Shadow depth |
| `interactive` | `boolean` | `false` | Clickable with hover effects |
| `onClick` | `() => void` | - | Click handler (if interactive) |

**Examples:**

```tsx
// Status card with colored border
<Card variant="green" elevation="elevated">
  <Badge variant="success">OPEN</Badge>
  <h3>Challenge Title</h3>
</Card>

// Interactive card (clickable)
<Card interactive onClick={() => navigate('/details')}>
  <p>Click to view details</p>
</Card>

// Floating card (high elevation)
<Card variant="cyan" elevation="floating">
  <p>Important content</p>
</Card>
```

**Best Practices:**
- Use `variant` to match status colors (green=open, cyan=active, etc.)
- Use `elevation` to establish visual hierarchy
- Add `interactive` for clickable cards
- Ensure keyboard navigation works (Enter/Space)

---

### Input

Form input with label, icons, and state feedback.

**Import:**
```tsx
import { Input } from '@/components/common';
```

**Basic Usage:**
```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Field label |
| `error` | `string` | - | Error message |
| `success` | `string` | - | Success message |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input size |
| `leftIcon` | `ReactNode` | - | Icon on left |
| `rightIcon` | `ReactNode` | - | Icon on right |
| `helperText` | `string` | - | Helper text below input |

**Examples:**

```tsx
// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With success
<Input
  label="Email"
  value="user@example.com"
  success="Email verified"
/>

// With icons
<Input
  label="Search"
  leftIcon={<SearchIcon />}
  placeholder="Search challenges..."
/>

// With helper text
<Input
  label="Bounty Amount"
  type="number"
  helperText="Minimum $100 USD"
/>
```

**Best Practices:**
- Always provide `label` for accessibility
- Use `error` for validation feedback
- Use `success` to confirm valid input
- Use `helperText` for instructions
- Use `leftIcon` for search/filter inputs

---

### Badge

Status indicators and labels with glow effects.

**Import:**
```tsx
import { Badge } from '@/components/common';
```

**Basic Usage:**
```tsx
<Badge variant="success">OPEN</Badge>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | Color scheme |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `style` | `'outline' \| 'solid'` | `'outline'` | Fill style |
| `pulse` | `boolean` | `false` | Animated pulse |

**Examples:**

```tsx
// Status badges
<Badge variant="success" pulse>OPEN</Badge>
<Badge variant="warning">PENDING</Badge>
<Badge variant="error">CLOSED</Badge>

// Solid style
<Badge variant="primary" style="solid">
  NEW
</Badge>

// Small size for compact displays
<Badge variant="neutral" size="sm">
  v2.0
</Badge>
```

**Best Practices:**
- Use `success` for OPEN/ACTIVE states
- Use `warning` for PENDING/IN_REVIEW states
- Use `error` for CLOSED/REJECTED states
- Add `pulse` for urgent/live states
- Use `solid` for emphasis

---

### Toast

Global notification system for user feedback.

**Import:**
```tsx
import { useToast } from '@/components/common';
```

**Basic Usage:**
```tsx
function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleSubmit = async () => {
    try {
      await api.submit();
      success('Challenge created successfully!');
    } catch (err) {
      error('Failed to create challenge');
    }
  };

  return <Button onClick={handleSubmit}>Submit</Button>;
}
```

**API:**
```tsx
const toast = useToast();

// Show different variants
toast.success('Success message', 5000); // duration optional
toast.error('Error message');
toast.warning('Warning message');
toast.info('Info message');

// Or use generic showToast
toast.showToast('Custom message', 'success', 3000);
```

**Provider Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-right' \| 'top-center' \| 'top-left' \| 'bottom-right' \| 'bottom-center' \| 'bottom-left'` | `'top-right'` | Toast position |
| `maxToasts` | `number` | `3` | Max concurrent toasts |

**Best Practices:**
- Use `success` for completed actions
- Use `error` for failed operations
- Use `warning` for cautionary messages
- Use `info` for general notifications
- Keep messages concise (1-2 lines)
- Don't overuse (reserve for important feedback)

---

### LoadingSkeleton

Placeholder components for loading states.

**Import:**
```tsx
import {
  LoadingSkeleton,
  CardSkeleton,
  TextSkeleton,
  ListItemSkeleton,
  TableRowSkeleton,
  ButtonSkeleton
} from '@/components/common';
```

**Basic Usage:**
```tsx
// Generic skeleton
<LoadingSkeleton variant="rectangular" width="100%" height="200px" />

// Pre-composed skeletons
<CardSkeleton />
<TextSkeleton lines={3} title />
<ListItemSkeleton />
<TableRowSkeleton columns={4} />
<ButtonSkeleton size="lg" />
```

**LoadingSkeleton Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'card' \| 'button'` | `'rectangular'` | Shape |
| `width` | `string` | - | Custom width |
| `height` | `string` | - | Custom height |

**Examples:**

```tsx
// Loading state for challenge list
{loading ? (
  <div className="grid grid-cols-3 gap-6">
    {[1,2,3,4,5,6].map(i => (
      <CardSkeleton key={i} />
    ))}
  </div>
) : (
  <ChallengeList challenges={challenges} />
)}

// Loading state for text content
{loading ? (
  <TextSkeleton lines={5} title />
) : (
  <div>
    <h2>{title}</h2>
    <p>{content}</p>
  </div>
)}
```

**Best Practices:**
- Use skeletons instead of generic spinners
- Match skeleton layout to actual content
- Show shimmer animation for feedback
- Maintain layout to prevent shift
- Use pre-composed variants when possible

---

## Animation Components

### FadeInOnScroll

Fade in content when it scrolls into view.

**Import:**
```tsx
import { FadeInOnScroll, StaggeredFadeIn } from '@/components/animations';
```

**Basic Usage:**
```tsx
<FadeInOnScroll direction="up">
  <Card>Content fades in from bottom</Card>
</FadeInOnScroll>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `'up' \| 'down' \| 'left' \| 'right' \| 'none'` | `'up'` | Animation direction |
| `delay` | `number` | `0` | Delay in ms |
| `threshold` | `number` | `0.1` | Intersection threshold |

**Examples:**

```tsx
// Fade up from bottom (default)
<FadeInOnScroll>
  <h2>Heading</h2>
</FadeInOnScroll>

// Fade from left
<FadeInOnScroll direction="left">
  <img src="..." />
</FadeInOnScroll>

// Delayed animation
<FadeInOnScroll delay={300}>
  <p>Appears 300ms after scroll</p>
</FadeInOnScroll>

// Staggered list
<StaggeredFadeIn staggerDelay={100}>
  {items.map(item => (
    <Card key={item.id}>{item.name}</Card>
  ))}
</StaggeredFadeIn>
```

**Best Practices:**
- Use `up` for most content (natural reading flow)
- Use `left/right` for horizontal layouts
- Keep `threshold` at 0.1 (triggers before fully visible)
- Use `StaggeredFadeIn` for lists/grids
- Stagger delay: 100ms works well

---

### ParallaxSection

Create depth with parallax scrolling effects.

**Import:**
```tsx
import { ParallaxSection, ParallaxLayer } from '@/components/animations';
```

**Basic Usage:**
```tsx
<ParallaxSection speed={0.5}>
  <h1>Scrolls slower than page</h1>
</ParallaxSection>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `speed` | `number` | `0.5` | Parallax speed multiplier |

**Examples:**

```tsx
// Background layer (slow)
<ParallaxSection speed={0.3}>
  <div className="background-image" />
</ParallaxSection>

// Foreground layer (normal speed = 1)
<div>Main content</div>

// Multi-layer parallax
<div className="relative">
  <ParallaxLayer speed={0.2} zIndex={0}>
    <div>Background</div>
  </ParallaxLayer>
  <ParallaxLayer speed={0.5} zIndex={1}>
    <div>Middle</div>
  </ParallaxLayer>
  <div className="relative z-10">
    Foreground content
  </div>
</div>
```

**Best Practices:**
- Speed < 1 = slower than scroll (background effect)
- Speed > 1 = faster than scroll (foreground effect)
- Use 0.3-0.7 for subtle effects
- Don't overuse (1-2 sections per page)
- Test on mobile (disable if performance issues)

---

### Ambient Background Effects

Add atmosphere with subtle background animations.

**Import:**
```tsx
import {
  FloatingParticles,
  AnimatedGrid,
  ScanlineOverlay,
  GlowSpots,
  CanvasParticles
} from '@/components/animations';
```

**Usage:**

```tsx
// Floating particles
<FloatingParticles count={20} />

// Animated grid
<AnimatedGrid
  color="rgba(0, 217, 255, 0.05)"
  opacity={1}
  speed={20}
/>

// Scanline overlay
<ScanlineOverlay speed={8} opacity={0.02} />

// Glow spots
<GlowSpots count={3} />

// Canvas particles (performant)
<CanvasParticles
  particleCount={50}
  color="#00d9ff"
/>
```

**Best Practices:**
- Use on hero sections or landing pages
- Keep `count` low (20-50 particles)
- Adjust `opacity` for subtle effect
- Combine 2-3 effects max
- Test performance on low-end devices
- Use `CanvasParticles` for better performance

---

## Hooks

### useToast

Global toast notification hook.

**Import:**
```tsx
import { useToast } from '@/components/common';
```

**API:**
```tsx
const { success, error, warning, info, showToast } = useToast();

success(message: string, duration?: number): void
error(message: string, duration?: number): void
warning(message: string, duration?: number): void
info(message: string, duration?: number): void
showToast(message: string, variant: ToastVariant, duration?: number): void
```

**Example:**
```tsx
function SubmitButton() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.submit();
      success('Submitted successfully!');
    } catch (err) {
      error('Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return <Button loading={loading} onClick={handleSubmit}>Submit</Button>;
}
```

---

### useScrollAnimation

Scroll-triggered animation hook.

**Import:**
```tsx
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
```

**API:**
```tsx
const { ref, isVisible } = useScrollAnimation({
  threshold: 0.1,
  rootMargin: '0px',
  triggerOnce: true,
  delay: 0,
});
```

**Example:**
```tsx
function AnimatedCard() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <Card>Content</Card>
    </div>
  );
}
```

---

### useSuccessAnimation

Success celebration animations hook.

**Import:**
```tsx
import { useSuccessAnimation } from '@/components/common';
```

**API:**
```tsx
const {
  showCheckmark,
  showConfetti,
  triggerCheckmark,
  triggerConfetti,
  CheckmarkComponent,
  ConfettiComponent,
} = useSuccessAnimation();
```

**Example:**
```tsx
function ChallengeComplete() {
  const { triggerConfetti, ConfettiComponent } = useSuccessAnimation();

  const handleComplete = () => {
    triggerConfetti();
    // ... completion logic
  };

  return (
    <>
      <Button onClick={handleComplete}>Complete Challenge</Button>
      {ConfettiComponent}
    </>
  );
}
```

---

## Best Practices

### Performance

1. **Use LoadingSkeleton for perceived performance**
   - Shows layout immediately
   - Reduces perceived wait time
   - Better UX than spinners

2. **Lazy load animations**
   - Don't animate everything on initial load
   - Use scroll-triggered animations
   - Stagger animations (100-200ms)

3. **GPU-accelerated animations**
   - Use `transform` and `opacity` only
   - Avoid `width`, `height`, `margin`
   - Maintain 60fps

4. **Respect prefers-reduced-motion**
   - All animations automatically disabled
   - Users with motion sensitivity protected
   - WCAG 2.1 compliant

### Accessibility

1. **Keyboard Navigation**
   - All interactive components focusable
   - Tab order logical
   - Enter/Space work on custom controls

2. **Screen Readers**
   - Toasts have aria-live regions
   - Loading states have aria-labels
   - Semantic HTML used throughout

3. **Color Contrast**
   - All text meets WCAG AA (4.5:1)
   - Success/error states have icons
   - Not relying on color alone

4. **Touch Targets**
   - 44px minimum height
   - Adequate spacing between targets
   - Mobile-friendly

### Code Organization

1. **Centralized Imports**
   ```tsx
   // Good
   import { Button, Card, Toast } from '@/components/common';

   // Avoid
   import { Button } from '@/components/common/Button';
   import { Card } from '@/components/common/Card';
   ```

2. **Type Safety**
   ```tsx
   // Export types with components
   import { Button, type ButtonVariant } from '@/components/common';

   const variant: ButtonVariant = 'primary'; // Type-safe
   ```

3. **Composition Over Configuration**
   ```tsx
   // Good - compose components
   <Card variant="cyan">
     <Badge variant="success">OPEN</Badge>
     <h3>Title</h3>
   </Card>

   // Avoid - too many props
   <Card variant="cyan" badge="success" badgeText="OPEN" title="Title" />
   ```

---

## Examples

### Complete Form with Validation

```tsx
import { Input, Button, useToast } from '@/components/common';
import { useForm } from 'react-hook-form';

function ChallengeForm() {
  const { success, error } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.createChallenge(data);
      success('Challenge created successfully!');
    } catch (err) {
      error('Failed to create challenge');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Challenge Title"
        error={errors.title?.message}
        {...register('title', { required: 'Title is required' })}
      />

      <Input
        label="Bounty Amount"
        type="number"
        helperText="Minimum $100 USD"
        error={errors.bounty?.message}
        {...register('bounty', { min: { value: 100, message: 'Minimum $100' } })}
      />

      <Button loading={isSubmitting} type="submit">
        Create Challenge
      </Button>
    </form>
  );
}
```

### Animated Challenge List

```tsx
import { Card, Badge, CardSkeleton } from '@/components/common';
import { FadeInOnScroll, StaggeredFadeIn } from '@/components/animations';

function ChallengeList({ challenges, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <StaggeredFadeIn staggerDelay={100}>
        {challenges.map(challenge => (
          <Card
            key={challenge.id}
            variant="cyan"
            interactive
            onClick={() => navigate(`/challenges/${challenge.id}`)}
          >
            <Badge variant="success" pulse>
              {challenge.status}
            </Badge>
            <h3>{challenge.title}</h3>
            <p>${challenge.bounty}</p>
          </Card>
        ))}
      </StaggeredFadeIn>
    </div>
  );
}
```

### Hero Section with Effects

```tsx
import { ParallaxSection, AnimatedGrid, GlowSpots } from '@/components/animations';
import { Button } from '@/components/common';

function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <AnimatedGrid opacity={0.5} />
      <GlowSpots count={3} />

      {/* Parallax background */}
      <ParallaxSection speed={0.3} className="absolute inset-0 z-0">
        <div className="bg-gradient-to-b from-cyan-500/20 to-transparent" />
      </ParallaxSection>

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-display mb-4">
          Oddly Brilliant
        </h1>
        <p className="text-xl mb-8">
          Where challenges meet bounties
        </p>
        <Button variant="primary" size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
}
```

---

## Troubleshooting

### Toast Not Showing

**Problem:** `useToast()` throws error
**Solution:** Wrap app with `<ToastProvider>`

```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

### Animations Not Working

**Problem:** Animations seem disabled
**Solution:** Check user's motion preferences

```tsx
// Animations respect prefers-reduced-motion automatically
// Test by disabling in browser DevTools
```

### Performance Issues

**Problem:** Page feels sluggish with animations
**Solution:** Reduce particle count, simplify effects

```tsx
// Reduce from 50 to 20
<FloatingParticles count={20} />

// Use CanvasParticles for better performance
<CanvasParticles particleCount={30} />
```

---

## Support

**Questions?** Check the [Design System Documentation](./DESIGN-SYSTEM.md)
**Issues?** Report at https://github.com/your-repo/issues
**Examples?** See `/examples` directory

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintained by:** Development Team
