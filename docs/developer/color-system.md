# Color System and Dark Mode

This document outlines the color system implementation in Astro Editor, including dark mode support and theming architecture.

## Overview

The app uses a hybrid approach combining:
- **CSS Variables** for semantic theme tokens (shadcn/ui system)
- **Tailwind Dark Mode Classes** for explicit light/dark styling where needed
- **Custom Status Colors** for draft indicators and validation states

## CSS Variables (Primary System)

### Root Variables (Light Mode)
```css
:root {
  /* Core colors */
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 10%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(0 0% 10%);
  
  /* UI colors */
  --muted: hsl(0 0% 96%);
  --muted-foreground: hsl(0 0% 45%);
  --accent: hsl(0 0% 96%);
  --accent-foreground: hsl(0 0% 10%);
  
  /* Status colors */
  --color-draft: 37 99% 25%; /* orange-600 */
  --color-required: 0 84% 60%; /* red-500 */
  --color-warning: 45 93% 47%; /* yellow-500 */
}
```

### Dark Mode Variables
```css
.dark {
  /* Neutral greys (not blue-tinted) */
  --background: hsl(0 0% 7%);
  --foreground: hsl(0 0% 90%);
  --card: hsl(0 0% 9%);
  --muted: hsl(0 0% 12%);
  --muted-foreground: hsl(0 0% 60%);
  
  /* Adjusted status colors for dark mode */
  --color-draft: 33 100% 70%; /* Lighter orange */
  --color-required: 0 91% 71%; /* Lighter red */
  --color-warning: 48 96% 80%; /* Lighter yellow */
}
```

## Tailwind Dark Mode Classes

For components where CSS variables don't provide sufficient control, we use Tailwind's `dark:` variant classes:

### Text Colors
- **Primary text**: `text-gray-900 dark:text-white`
- **Secondary text**: `text-gray-700 dark:text-gray-300`
- **Muted text**: Uses `text-muted-foreground` (CSS variable)

### When to Use Each Approach

**Use CSS Variables (`text-foreground`, `text-muted-foreground`) for:**
- shadcn/ui components
- Text that should automatically adapt to theme
- Description text, helper text

**Use Tailwind Dark Classes (`text-gray-900 dark:text-white`) for:**
- Form field labels and input text
- Component titles and headings
- Navigation elements
- Any text that doesn't render correctly with CSS variables

## Component Implementation

### Form Components
All form inputs and labels use explicit dark mode classes:

```tsx
// Input/Textarea components
className="text-gray-900 dark:text-white placeholder:text-muted-foreground"

// Field labels
<label className="text-sm font-medium text-gray-900 dark:text-white">
  {label}
</label>
```

### Navigation Components
Sidebar and title bar elements use dark mode classes:

```tsx
// Collection titles, file names
<span className="font-medium text-gray-900 dark:text-white">
  {title}
</span>

// Icon buttons
<Button className="text-gray-700 dark:text-gray-300">
  <Icon />
</Button>
```

## Traffic Light Buttons

macOS-style window controls maintain consistent colors across both themes:

```css
/* Same colors in both light and dark mode */
.traffic-light-close {
  background: #ff5f57; /* Red */
  border-color: #e0443e;
}

.traffic-light-minimize {
  background: #ffbd2e; /* Yellow */
  border-color: #dea123;
}

.traffic-light-maximize {
  background: #28ca42; /* Green */
  border-color: #1aac29;
}
```

## Status Color System

### Draft Indicators
```css
/* Light mode */
--color-draft: 37 99% 25%; /* orange-600 */
--color-draft-bg: 33 100% 96%; /* orange-50 */

/* Dark mode */
--color-draft: 33 100% 70%; /* Lighter orange */
--color-draft-bg: 33 100% 8%; /* Dark orange background */
```

### Required Field Indicators
```css
/* Light mode */
--color-required: 0 84% 60%; /* red-500 */

/* Dark mode */
--color-required: 0 91% 71%; /* Lighter red */
```

### Usage in Components
```tsx
// Draft indicator
<span className="text-[var(--color-draft)]">(Draft)</span>

// Required field
<span className="text-[var(--color-required)]">*</span>
```

## Theme Provider Integration

The app uses a React context for theme management:

```tsx
// Theme Provider supports: 'light' | 'dark' | 'system'
<ThemeProvider defaultTheme="system" storageKey="astro-editor-theme">
  <App />
</ThemeProvider>
```

Themes persist to localStorage and respect system preferences when set to 'system'.

## Placeholder Text

Standardized across all input components:

```css
::placeholder {
  color: hsl(var(--muted-foreground));
  opacity: 1;
}
```

Components use `placeholder:text-muted-foreground` in Tailwind classes.

## Best Practices

### 1. Consistency
- Use CSS variables for semantic colors when possible
- Use Tailwind dark classes only when CSS variables don't work
- Maintain consistent text color patterns across similar components

### 2. Accessibility
- Ensure sufficient contrast ratios (WCAG guidelines)
- Test both light and dark modes thoroughly
- Use semantic color names rather than literal colors

### 3. Maintenance
- Keep color definitions centralized in CSS variables
- Document any custom color usage
- Test with system theme changes

## Color Testing

To verify dark mode implementation:

1. **Manual Testing**: Toggle between light/dark modes in preferences
2. **System Integration**: Test with OS theme changes
3. **Component Coverage**: Ensure all text is visible in both modes
4. **Form Fields**: Verify input text, labels, and placeholders work correctly

## Migration Notes

During the dark mode implementation, we moved from:
- Blue-tinted backgrounds → Neutral grey backgrounds
- CSS-only color system → Hybrid CSS variables + Tailwind classes
- Inconsistent text colors → Standardized text color patterns

This hybrid approach provides the flexibility needed for complex UI components while maintaining the benefits of a semantic color system.