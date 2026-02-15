# THE VOID by DarkWave Studios

## Overview
Voice-first venting application where users record frustrations and receive AI-generated responses based on different personality modes (Smart-ass, Calming, Therapist, Hype Man). Dark glassmorphism design with Bento grid layout.

## Branding
- **App Name**: THE VOID
- **Studio**: DarkWave Studios (DarkwaveStudios.io)
- **Security**: Protected by TrustShield.tech
- **Infrastructure**: Powered by Trust Layer (dwtl.io)
- **Copyright**: DarkwaveStudios.io Copyright 2026

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **AI**: OpenAI (GPT-4o for responses, Whisper for transcription)
- **Auth**: PIN-based whitelist system (master key: 0424) + Replit Auth (OIDC)
- **Design**: Glassmorphism, Bento grid, Space Grotesk + Outfit fonts

## Pages
- `/` - Main recording page (3-column Bento grid: Vent Log, Record Stage, Personality Selector)
- `/settings` - User preferences (default personality, audio, display settings)
- `/privacy` - Privacy Policy with full crisis resources
- `/terms` - Terms of Service with disclaimers and crisis resources
- `/developer` - Admin dashboard (PIN: 0424)

## Key Architecture
- Layout component wraps all pages with header, footer, animated background orbs
- Header: Slim sticky bar, "THE VOID" left, hamburger menu right (Sheet component)
- Footer: Full branding, legal links, crisis disclaimer
- Voice recording via MediaRecorder API (client/replit_integrations/audio/)
- Audio sent as base64 to /api/vents, transcribed, AI responds based on personality

## AI Safety Guardrails
- All AI personalities include a mandatory safety preamble that overrides personality behavior
- Rules: NEVER encourage self-harm, harming others, violence, illegal activity, or anything endangering life/freedom
- Auto-detect: If user expresses self-harm/suicide/harm intent, AI immediately provides crisis resources
- Crisis resources provided: 988 Lifeline, Crisis Text Line (741741), SAMHSA (1-800-662-4357), 911
- Each personality has additional safety-specific language (e.g., Hype Man channels energy toward growth not revenge)
- Safety preamble defined in `server/routes.ts` as `SAFETY_PREAMBLE` constant

## Crisis Resources (Required on Privacy & Terms pages)
988 Suicide & Crisis Lifeline, Crisis Text Line (741741), SAMHSA (1-800-662-4357), IMAlive, Veterans Crisis Line, Trevor Project, Childhelp, NAMI Helpline

## Roadmap System
- Database-backed roadmap in Developer portal (`roadmap_items` table)
- Carousel-based UI (no vertical stacking, no horizontal box rows)
- CRUD: Add, cycle status (planned/in-progress/completed), delete items
- Categories: feature, integration, design, infrastructure, monetization, security, performance
- Priorities: low, medium, high, critical
- Filter tabs by status with item counts
- API: GET/POST /api/roadmap, PATCH/DELETE /api/roadmap/:id

## User Preferences
- NO vertical stacking layouts
- NO horizontal box layouts — use carousel-based UI
- NO images with text/words (copyright/clarity concerns)
- Images must be imported as JS variables (Vite requirement)
- Premium glassmorphism aesthetic on all pages

## PIN Access System
- Main app (/, /settings) protected by PIN gate — users must enter 4-digit PIN to access
- Privacy, Terms, Developer pages are publicly accessible (no PIN required)
- Master key: 0424 (always works, grants Developer access)
- Whitelist management in Developer portal: add name + 4-digit PIN combos
- `whitelisted_users` table stores name + pin
- API: POST /api/auth/pin (validate), GET/POST /api/whitelist, DELETE /api/whitelist/:id

## Recent Changes
- Feb 15, 2026: Added PIN-based access control with whitelist management in Developer portal
- Feb 15, 2026: Added Master Roadmap carousel to Developer portal with database persistence and seeded initial items
- Feb 15, 2026: Added header, footer, Settings, Privacy, Terms, Developer pages with premium glassmorphism design
- Feb 15, 2026: Initial build with voice recording, AI personalities, Bento grid layout
