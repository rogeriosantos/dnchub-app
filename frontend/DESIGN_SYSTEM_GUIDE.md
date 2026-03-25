# FleetOptima Design System Quick Reference

A quick reference guide for developers working with the FleetOptima design system.

---

## Color Usage Guide

### When to Use Each Color

#### Primary Blue (`#0369a1`)
Use for:
- Primary action buttons
- Active navigation items
- Links and interactive elements
- Fleet-related features

```tsx
<Button className="bg-primary">Primary Action</Button>
<div className="text-primary">Primary Text</div>
```

#### Accent Cyan (`#06b6d4`)
Use for:
- Secondary highlights
- Driver-related features
- Energy and vitality indicators
- Gradient accents

```tsx
<div className="bg-gradient-ocean">Gradient Background</div>
<Badge className="bg-accent">New</Badge>
```

#### Success Green (`#16a34a`)
Use for:
- Active status indicators
- Positive metrics
- Completion states
- On-duty indicators

```tsx
<div className="text-success">Active</div>
<div className="bg-success/10">Success Background</div>
```

#### Warning Amber (`#f59e0b`)
Use for:
- Maintenance alerts
- Fuel cost indicators
- Caution states
- Pending actions

```tsx
<AlertTriangle className="text-warning" />
<Badge variant="secondary">Maintenance Due</Badge>
```

#### Destructive Red (`#dc2626`)
Use for:
- Error states
- Overdue items
- Critical alerts
- Delete actions

```tsx
<Button variant="destructive">Delete</Button>
<span className="text-destructive">Overdue</span>
```

---

## Component Patterns

### KPI Card

A card displaying a key performance indicator with icon, value, and trend.

```tsx
<Card className="card-float border-l-4 border-l-primary overflow-hidden relative">
  {/* Decorative background circle */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />

  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Metric Name
    </CardTitle>
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
  </CardHeader>

  <CardContent>
    <div className="text-3xl font-bold tabular-nums">123</div>
    <p className="text-sm text-muted-foreground mt-2">
      Additional context
    </p>
  </CardContent>
</Card>
```

### Card with Icon Header

Standard content card with icon badge and title.

```tsx
<Card className="card-float">
  <CardHeader className="pb-3">
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <CardTitle className="text-xl">Section Title</CardTitle>
        <CardDescription>Section description</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Animated List Item

Clickable list item with hover animations.

```tsx
<Link
  href="/path"
  className="group flex items-center justify-between rounded-xl border p-4
             hover:bg-accent/50 hover:border-primary/50
             transition-all duration-200 hover:shadow-md"
>
  <div className="flex items-center gap-3">
    {/* Status indicator */}
    <div className="relative h-3 w-3 rounded-full bg-success">
      <div className="absolute inset-0 rounded-full bg-success opacity-50 animate-ping" />
    </div>

    <div>
      <p className="font-semibold group-hover:text-primary transition-colors">
        Item Title
      </p>
      <p className="text-sm text-muted-foreground">
        Item description
      </p>
    </div>
  </div>

  <div className="text-right">
    <p className="text-sm tabular-nums font-medium">Value</p>
    <Badge variant="outline" className="text-xs">Status</Badge>
  </div>
</Link>
```

### Status Indicator

Animated pulsing status dot.

```tsx
{/* Active/Live indicator */}
<div className="relative h-2.5 w-2.5 rounded-full bg-success">
  <div className="absolute inset-0 rounded-full bg-success opacity-50 animate-ping" />
</div>

{/* Static indicator */}
<div className="h-2 w-2 rounded-full bg-primary" />
```

### Gradient Button

Primary action button with ocean gradient.

```tsx
<Button className="bg-gradient-ocean shadow-md hover:shadow-lg transition-all">
  <Plus className="mr-2 h-4 w-4" />
  Add New Item
</Button>
```

### Section Header

Page or section title with gradient text.

```tsx
<div className="space-y-1">
  <h1 className="text-3xl font-bold tracking-tight bg-gradient-ocean bg-clip-text text-transparent">
    Page Title
  </h1>
  <p className="text-muted-foreground text-base">
    Page description
  </p>
</div>
```

### Avatar with Gradient

User avatar with ocean gradient background.

```tsx
<div className="flex h-12 w-12 items-center justify-center rounded-xl
                bg-gradient-ocean text-white text-sm font-bold
                shadow-md group-hover:scale-110 transition-transform">
  {initials}
</div>
```

### Metadata Badge

Small pill-shaped metadata indicator.

```tsx
<div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md text-xs text-muted-foreground">
  <Calendar className="h-3.5 w-3.5" />
  <span>2024-01-15</span>
</div>
```

### Icon Badge

Icon with colored circular background.

```tsx
<div className="p-2 rounded-lg bg-primary/10">
  <Truck className="h-5 w-5 text-primary" />
</div>
```

---

## Utility Class Reference

### Layout & Spacing
```css
/* Card floating effect */
.card-float

/* Smooth transitions */
.transition-smooth

/* Glassmorphism */
.glass
```

### Colors & Gradients
```css
/* Ocean gradient (primary to accent) */
.gradient-ocean

/* Subtle background gradient */
.gradient-ocean-subtle

/* Color classes */
.text-primary
.text-accent
.text-success
.text-warning
.text-destructive
.bg-primary
.bg-accent
/* etc... */
```

### Effects
```css
/* Badge with glow */
.badge-glow

/* Status indicator with ping */
.status-dot

/* Loading skeleton */
.skeleton

/* Thin scrollbar */
.scrollbar-thin

/* Focus ring */
.focus-ring
```

### Typography
```css
/* Tabular numbers (for financial data) */
.tabular-nums

/* Text clipping for gradients */
.bg-clip-text .text-transparent
```

---

## Spacing Scale

Use consistent spacing based on 8px grid:

```tsx
gap-1    // 4px
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px
gap-6    // 24px
gap-8    // 32px
gap-12   // 48px
```

---

## Border Radius

```tsx
rounded-md   // 6px - small elements
rounded-lg   // 8px - buttons, inputs
rounded-xl   // 12px - cards, containers
rounded-2xl  // 16px - large cards
rounded-full // 9999px - avatars, badges, status dots
```

---

## Shadow Elevation

```tsx
shadow-sm   // Subtle elevation
shadow-md   // Default cards
shadow-lg   // Floating cards, hover states
shadow-xl   // Modals, popovers
shadow-2xl  // Highest elevation
```

---

## Icon Sizes

```tsx
h-3 w-3     // Small icons in badges (12px)
h-4 w-4     // Default button/inline icons (16px)
h-5 w-5     // Card header icons (20px)
h-6 w-6     // Logo, large icons (24px)
```

---

## Typography Scale

```tsx
text-xs     // 12px - badges, metadata
text-sm     // 14px - body text, descriptions
text-base   // 16px - default body
text-lg     // 18px - large body
text-xl     // 20px - card titles
text-2xl    // 24px - section headers
text-3xl    // 30px - KPI values
text-4xl    // 36px - page titles
```

---

## Animation Timing

```tsx
duration-200  // Snappy interactions (buttons, icons)
duration-300  // Smooth transitions (cards, modals)
duration-500  // Slower animations (page transitions)
```

---

## Responsive Breakpoints

```tsx
sm:   // 640px - Small tablets
md:   // 768px - Tablets
lg:   // 1024px - Small laptops
xl:   // 1280px - Laptops
2xl:  // 1536px - Large screens
```

### Common Responsive Patterns

```tsx
{/* Mobile-first stacking to grid */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

{/* Responsive text sizing */}
<h1 className="text-3xl lg:text-5xl">

{/* Hide on mobile */}
<div className="hidden sm:block">

{/* Full width on mobile, constrained on desktop */}
<div className="w-full lg:w-4/5">
```

---

## Dark Mode

All components automatically adapt to dark mode via CSS variables. To force dark mode testing:

```tsx
// Add to <html> element
<html className="dark">
```

### Dark Mode Specific Styles

```tsx
// Background patterns
.dark:bg-background
.dark:text-foreground

// Conditional styling
className="bg-white dark:bg-gray-900"
className="text-gray-900 dark:text-white"
```

---

## Accessibility

### Focus States
All interactive elements have visible focus states via `focus-visible:ring-2 focus-visible:ring-ring`.

### ARIA Labels
Always include for icon-only buttons:

```tsx
<Button variant="ghost" size="icon">
  <Bell className="h-5 w-5" />
  <span className="sr-only">Notifications</span>
</Button>
```

### Color Contrast
- Text on background: 21:1
- Muted text: 4.5:1 (WCAG AA)
- Interactive elements: 3:1

---

## Common Combinations

### Success Indicator
```tsx
<span className="inline-flex items-center gap-1 text-success font-medium">
  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
  Active
</span>
```

### Warning with Icon
```tsx
<span className="inline-flex items-center gap-1.5 text-destructive font-medium">
  <AlertTriangle className="h-4 w-4 animate-pulse" />
  3 overdue
</span>
```

### Trend Indicator
```tsx
<div className="flex items-center gap-1.5">
  <div className="p-1 rounded bg-success/10">
    <TrendingDown className="h-3.5 w-3.5 text-success" />
  </div>
  <span className="text-success font-medium">12.5%</span>
  <span className="text-muted-foreground">from last month</span>
</div>
```

---

## Best Practices

### Do's
- Use `card-float` for all content cards
- Include decorative circles in KPI cards
- Use `group` with `group-hover:` for list items
- Apply `transition-all duration-200` for smooth interactions
- Use `tabular-nums` for financial/numeric data
- Include animated status dots for live data
- Use gradient text for page titles
- Add icon badges to card headers

### Don'ts
- Don't use arbitrary color values - use theme colors
- Don't stack multiple shadows - use elevation scale
- Don't animate all properties - stick to transform/opacity
- Don't forget hover states on interactive elements
- Don't use hardcoded sizes - use spacing scale
- Don't mix rounded corner styles - stay consistent
- Don't forget dark mode considerations

---

## Quick Start Template

```tsx
// Page structure
export default function NewPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-ocean bg-clip-text text-transparent">
            Page Title
          </h1>
          <p className="text-muted-foreground text-base">Page description</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
            Secondary
          </Button>
          <Button className="bg-gradient-ocean shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Primary Action
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="card-float lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Section Title</CardTitle>
                <CardDescription>Section description</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Main content */}
          </CardContent>
        </Card>

        <Card className="card-float">
          <CardHeader className="pb-3">
            {/* Sidebar card */}
          </CardHeader>
          <CardContent>
            {/* Sidebar content */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Support

For questions or clarifications about the design system, refer to:
- `UI_ENHANCEMENTS.md` - Comprehensive documentation
- `globals.css` - Color variables and utility classes
- Component examples in `/app/(dashboard)/dashboard/page.tsx`
