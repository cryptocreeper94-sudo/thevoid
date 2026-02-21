---
name: void-ui-protocol
description: THE VOID UI/UX design protocol and rules. Use whenever building, modifying, or reviewing any UI component, page, or layout in THE VOID app. Covers layout rules, visual effects, loading states, card styling, animations, and design constraints.
---

# THE VOID — UI Protocol

## HARD RULES (Never Break These)

1. **NO vertical stacking layouts** — content must never stack in a single column list
2. **NO horizontal box layouts** — no plain side-by-side boxes
3. **Carousel-based UI** — all lists, galleries, collections, and repeating content use swipeable carousels with dot indicators, touch swipe support, and smooth slide animations
4. **NO images with text/words** — no images containing text (copyright/clarity concerns)
5. **Images must be imported as JS variables** — Vite requirement, never use string paths like `/images/foo.png`
6. **Premium glassmorphism aesthetic on ALL pages** — no exceptions

## Layout System

- **3-Column Bento Grid** — primary layout pattern for dashboards and feature displays
- **Accordion Dropdowns** — for expandable content sections, FAQ, settings groups
- **Carousel** — for any repeating content (features, cards, entries, history)
- Cards should be uniform height within carousels
- Touch swipe gestures on all carousels (track startX/startY, threshold 40px)
- Dot indicators below carousels showing current position
- Auto-advance where appropriate (4-5 second intervals)

## Card Styling

- All cards use glassmorphism: `backdrop-blur-xl`, `border border-white/10`, `bg-gradient-to-br` with color-tinted gradients
- **Photorealistic images on cards** unless explicitly stated otherwise by user
- Cards should have gradient backgrounds matching their theme color
- Rounded corners: `rounded-2xl`
- Consistent padding: `p-6` to `p-10`
- Hover effects with subtle scale and glow

## Visual Effects & Animations

### Animated Background Orbs
Floating radial gradient orbs behind content:
```jsx
<motion.div
  animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
  style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }}
/>
```
Use cyan and purple as primary orb colors. Vary duration (8-12s) and delay for multiple orbs.

### Skeleton / Shimmer Loading States
Always show skeleton loaders while data loads — never blank screens:
```jsx
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-white/5 rounded-xl w-3/4" />
  <div className="h-4 bg-white/5 rounded-lg w-1/2" />
  <div className="h-32 bg-white/5 rounded-2xl" />
</div>
```
- Use `animate-pulse` with `bg-white/5` on dark backgrounds
- Match skeleton shapes to actual content layout
- Include skeleton for cards, text blocks, charts, and images

### Loading Bars / Progress Indicators
```jsx
<div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
  <motion.div
    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
    initial={{ width: "0%" }}
    animate={{ width: "100%" }}
    transition={{ duration: 2, ease: "easeInOut" }}
  />
</div>
```

### Fade-In on Scroll
All sections use viewport-triggered animations:
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

### Carousel Slide Transitions
```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentIndex}
    initial={{ opacity: 0, x: 80 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -80 }}
    transition={{ duration: 0.35, ease: "easeInOut" }}
  >
```

### Drop Shadows for Text Over Media
When text sits on top of video or images:
```
className="drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
```

## Color Palette

- Primary: Cyan (`cyan-400`, `cyan-500`)
- Secondary: Purple (`purple-400`, `purple-500`, `purple-600`)
- Accent: Pink, Fuchsia, Violet for variety
- Background: Pure black (`bg-black`, `#0a0a0a`)
- Text: White with opacity levels (`text-white`, `text-white/70`, `text-white/40`, `text-white/20`)
- Borders: `border-white/10`
- Glass fill: `bg-white/5` to `bg-white/10`

## Typography

- Display font: Space Grotesk (`font-display`)
- Body font: Outfit
- Headings: `font-bold` or `font-black`, `tracking-wide`
- Section labels: `text-xs tracking-[0.3em] uppercase` in accent color
- Body text: `text-sm` or `text-xs` with reduced opacity

## Glassmorphism Recipe

```jsx
<div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-{color}-500/20 via-{color}-600/10 to-transparent backdrop-blur-xl p-8">
```
- Always include: `backdrop-blur-xl`, `border-white/10`, gradient background
- Vary the gradient start color to match the card's theme

## Video Flyover Hero Pattern

Two stacked `<video>` elements with crossfade:
- ES module imports (never string paths)
- `playsInline`, `muted={true}`, `autoPlay` for mobile compatibility
- `key` prop on each video forces React to create fresh elements on swap
- Opacity-based crossfade (no black flash)
- `.catch(() => {})` on `.play()` for autoplay blocks

## Interactive Elements

- Buttons: Gradient backgrounds (`from-cyan-500 to-purple-600`), `min-h-12`, `shadow-lg`
- Ghost buttons: `text-white/80 font-medium` with drop shadows
- Dot navigation: Active = wider pill shape (`w-6 h-1.5`), inactive = small circle (`w-1.5 h-1.5`)
- All interactive elements need `data-testid` attributes

## Page Structure

Every page follows:
1. Global `Layout` component with sticky header, hamburger nav, footer
2. Animated background orbs
3. Content in glassmorphism containers
4. Carousel-based content where applicable
5. Skeleton loaders during data fetch
6. Framer Motion entrance animations
