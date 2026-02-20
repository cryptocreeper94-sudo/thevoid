# Premium UI/UX Protocol — DarkWave Studios

## Overview
This skill defines the premium UI/UX standards for all DarkWave Studios applications. Every page, component, and layout must follow these rules. No exceptions unless the user explicitly overrides.

## Design System

### Aesthetic
- **Glassmorphism**: All cards, panels, and containers use glass-morphism styling — semi-transparent backgrounds with backdrop blur, subtle borders (white/10 or white/5), and soft glow effects
- **Dark-first**: Deep dark backgrounds (near-black), light text, no light mode unless explicitly requested
- **Fonts**: Space Grotesk for display/headings, Outfit for body text
- **Color palette**: Cyan, purple, and red accents against dark backgrounds. Gradients are encouraged for visual depth.

### Layout Rules (STRICT)
- **NO vertical stacking layouts** — never stack cards/sections in a single column that scrolls vertically
- **NO horizontal box row layouts** — never place items in a static horizontal row of boxes
- **USE carousel-based UI** for any collection of items (roadmap, features, settings groups, etc.)
- **Bento grid layouts** for main pages — asymmetric, visually interesting grid arrangements
- Responsive: single column on mobile, multi-column grids on desktop (typically 12-column grid)

### Card Headers with Images
- Cards that serve as section headers use photo-realistic images with a gradient overlay
- Gradient: `bg-gradient-to-b from-black/20 via-black/40 to-black/90`
- **NO images with text/words on them** (copyright and clarity concerns)
- Images must be imported as JS variables (`import myImage from './assets/...'`), never referenced as URL paths (Vite requirement)

### Spacing & Consistency
- Consistent padding inside all glass cards (typically p-4 to p-6)
- Consistent gap spacing between grid items (gap-4 to gap-6)
- No two bordered/elevated elements should touch — always spacing between them
- Small rounded corners (rounded-xl for cards, rounded-lg for inner elements)

### Interactions
- Subtle transitions on hover/active — never dramatic transforms
- Use Framer Motion for enter/exit animations (fade + slight scale or slide)
- Buttons and interactive elements should have glass-style hover states (bg-white/5 to bg-white/10)
- **Haptic feedback** on all interactive elements (buttons, toggles, swipes, record actions) using the Vibration API (`navigator.vibrate()`). Light tap (10ms) for buttons, medium pulse (20ms) for toggles/selections, strong buzz (40ms) for important actions like recording start/stop. Always check for API support before firing.

### Text Hierarchy
- Primary text: white or near-white
- Secondary text: white/60 to white/70
- Tertiary/muted: white/30 to white/40
- Labels/tracking: uppercase, extra letter-spacing (tracking-widest or tracking-[0.2em])
- Never use text-primary class for general text

## Component Standards
- Use shadcn/ui components as base (Button, Card, Badge, etc.)
- Wrap shadcn Cards in custom GlassCard component with glassmorphism styling
- Use lucide-react icons for UI actions, react-icons/si for brand logos
- Icon buttons paired with colored background circles (e.g., `p-2 rounded-lg bg-cyan-500/20`)

## Safety & Legal (Required for apps with AI)
- All AI must include a safety preamble preventing harm to people, animals, or any living being
- Never escalate negativity — AI should help users feel lighter, not darker
- Crisis resources must be accessible: 988, Crisis Text Line (741741), SAMHSA (1-800-662-4357), 911
- Footer must include a disclaimer about the app's purpose and crisis contact info
- Privacy and Terms pages must include full crisis resource sections

## Branding
- Studio: DarkWave Studios (DarkwaveStudios.io)
- Security badge: Protected by TrustShield.tech
- Infrastructure: Powered by Trust Layer (dwtl.io)
- Copyright: DarkwaveStudios.io Copyright 2026

## Authentication Pattern
- PIN-based whitelist system for access control
- Master key for admin/developer access
- Future: Resend-based email auth

## What NOT To Do
- No light/flat designs unless explicitly requested
- No emoji anywhere in the UI
- No placeholder/mock data in production
- No vertical stacking of card collections
- No horizontal box row layouts
- No images containing text or words
- No dramatic hover animations or scale transforms
- Never nest a Card inside another Card
