# THE VOID by DarkWave Studios

## Overview
Voice-first venting application where users record frustrations and receive AI-generated responses based on different personality modes (Smart-ass, Calming, Therapist, Hype Man, Roast Master). Dark glassmorphism design with Bento grid layout.

## Branding
- **App Name**: THE VOID
- **Studio**: DarkWave Studios (DarkwaveStudios.io)
- **Security**: Protected by TrustShield.tech
- **Infrastructure**: Powered by Trust Layer (dwtl.io)
- **Copyright**: DarkwaveStudios.io Copyright 2026

## Tech Stack
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **AI**: OpenAI (GPT-5.2 for responses, gpt-4o-mini-transcribe for transcription via integration)
- **Auth**: PIN-based whitelist system (master key: 0424, first-login PIN change) + Replit Auth (OIDC)
- **Design**: Glassmorphism, Bento grid, Space Grotesk + Outfit fonts

## Key Architecture
- Layout component wraps all pages with header, footer, animated background orbs
- Header: Slim sticky bar, "THE VOID" left, hamburger menu right (Sheet component)
- Footer: Full branding, legal links, crisis disclaimer
- Voice recording via MediaRecorder API (client/replit_integrations/audio/)
- Audio sent as base64 to /api/vents, transcribed, AI responds based on personality

## AI Safety Guardrails
- All AI personalities include a mandatory safety preamble that overrides personality behavior
- Rules: NEVER encourage self-harm, harming others (people OR animals), violence, illegal activity, or anything endangering life/freedom
- NEVER escalate negativity — AI must help users feel LIGHTER, not darker. Cathartic, fun, safe.
- Auto-detect: If user expresses self-harm/suicide/harm intent (toward people or animals), AI immediately provides crisis resources
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
- Master key: 0424 (always works, grants Developer access, skips first-login PIN change)
- First-login PIN change: new users must set their own PIN on first login (pinChanged field tracks this)
- Admin PIN resets (Developer portal) re-trigger first-login PIN change
- Whitelist management in Developer portal: add name + 4-digit PIN combos, change PIN, delete
- `whitelisted_users` table stores name + pin + pinChanged
- API: POST /api/auth/pin (validate), POST /api/auth/change-pin (self-service, requires currentPin), GET/POST /api/whitelist, DELETE /api/whitelist/:id, PATCH /api/whitelist/:id/pin

## Stripe Subscription System
- **Product**: THE VOID - Premium (`prod_U03iMZln0CXr0m`)
- **Price**: $9.99/month (`price_1T23bfRq977vVehdJ3Ho9j2R`)
- **Webhook**: Auto-created programmatically via Stripe API (`we_1T23gSRq977vVehdHZWObESq`)
- **Stripe Key**: Stored manually as STRIPE_SECRET_KEY secret (not via Replit integration)
- **Free tier**: 1 vent/day, all personalities, TTS responses
- **Premium tier**: Unlimited vents — $9.99/month
- **Tables**: `subscriptions` (userId, voidId, stripeCustomerId, stripeSubscriptionId, status), `daily_vent_usage` (userId, date, ventCount)
- **API**: POST /api/stripe/create-checkout, POST /api/stripe/create-portal, POST /api/stripe/webhook, GET /api/subscription/status
- **Frontend**: Upgrade prompt on RecordPage when limit reached, subscription card on SettingsPage

## Void ID System
- **Format**: `V-XXXXXXXX` (V- prefix + 8 random digits)
- **Purpose**: Unique member identifier for Trust Layer blockchain integration (dwtl.io)
- **Generation**: Auto-generated on checkout.session.completed webhook event
- **Storage**: `voidId` column on `subscriptions` table (varchar(12), unique)
- **Display**: Shown on Settings page for premium subscribers
- **Future**: Will be sent to Trust Layer (dwtl.io) as blockchain-verified membership reference

## Email System (Resend via Replit Integration)
- **Provider**: Resend (connected via Replit integration, API key auto-managed)
- **From**: dwsc.io domain (configured in Resend)
- **Trigger**: Subscription confirmation email sent on checkout.session.completed
- **Template**: Premium dark glassmorphism HTML email matching site design
- **Content**: Welcome message, subscription details, Void ID, Trust Layer/TrustShield branding, app page links
- **Module**: `server/email.ts` — generateVoidId(), sendSubscriptionConfirmationEmail()

## Analytics Dashboard
- **Location**: Developer portal (admin-only, requires master key)
- **API**: GET /api/analytics (requires x-master-key: 0424 header)
- **Metrics**: Total vents, vents today, vents this week, personality usage breakdown, peak hours (24h bar chart), 7-day trend, unique active users, whitelisted users, premium subscribers, avg vents/day, contact messages
- **Data Source**: Real-time queries against vents, subscriptions, daily_vent_usage, whitelisted_users, contact_messages tables
- **Refresh**: Auto-refreshes every 30 seconds
- **UI**: Glassmorphism stat cards with animated bar charts, personality usage bars, subscription breakdown

## Pages
- `/` - Main recording page (3-column Bento grid: Vent Log, Record Stage, Personality Selector)
- `/settings` - User preferences (default personality, audio, display settings)
- `/privacy` - Privacy Policy with full crisis resources
- `/terms` - Terms of Service with disclaimers and crisis resources
- `/contact` - Contact form (stored in DB, admin-viewable via x-master-key header)
- `/developer` - Admin dashboard (PIN: 0424)

## SEO & Legitimacy
- `robots.txt` — Allows indexing, blocks /developer and /api/
- `sitemap.xml` — Lists all public pages
- Open Graph tags (Facebook/LinkedIn) + Twitter Card tags
- `<title>` tag with brand + description
- Canonical URL tag
- JSON-LD structured data (SoftwareApplication schema with pricing)
- Meta author, meta robots
- Only 2 Google Fonts loaded (Space Grotesk + Outfit) — trimmed from 20+
- Contact page with form + direct email (team@dwsc.io)
- `contact_messages` table stores submissions, admin GET via x-master-key header

## Recent Changes
- Feb 18, 2026: Added Analytics Dashboard to Developer portal — real-time metrics (total vents, daily/weekly trends, personality usage, peak hours, subscription breakdown, user stats) with glassmorphism UI, animated bar charts, and live data from database
- Feb 18, 2026: Added DWTL Premium UI System skill file (.local/skills/premium-ui/SKILL.md) — mandatory design standards for glassmorphism, Bento grids, responsive design, animations
- Feb 18, 2026: Added voice preference setting — users can choose male, female, or default (personality-matched) voice for all AI responses
- Feb 18, 2026: Added Resend email system — premium glassmorphism subscription confirmation email with Void ID, Trust Layer/TrustShield branding, and app page links
- Feb 18, 2026: Added Void ID system — unique V-XXXXXXXX format member IDs generated on subscription, displayed on Settings page, ready for Trust Layer blockchain
- Feb 18, 2026: Added SEO legitimacy package — robots.txt, sitemap.xml, Twitter cards, JSON-LD structured data, canonical URLs, trimmed fonts, Contact page
- Feb 18, 2026: Added Stripe subscription system — Free (1 vent/day) + Premium ($9.99/mo unlimited), webhook auto-created, checkout/portal/usage tracking
- Feb 18, 2026: Added TTS voice responses — AI speaks back using OpenAI TTS with personality-specific voices (onyx, nova, alloy, echo, fable)
- Feb 18, 2026: Fixed vent isolation — each user's vents are now tied to their PIN userId, users only see their own vents
- Feb 18, 2026: Made vent history expandable — click any vent to see full transcript and response (no more truncation)
- Feb 18, 2026: Fixed Roast Master image — regenerated in landscape format for wide card layout
- Feb 18, 2026: Added Roast Master to Settings page personality selector
- Feb 18, 2026: Auto-play setting now defaults to on and actually plays TTS audio when vent completes
- Feb 17, 2026: Added 8 diverse hero images (Black, White, Hispanic, Asian x Male, Female) with random session-based rotation via sessionStorage
- Feb 17, 2026: Added proactive microphone permission flow — shows enable mic prompt, denied state with instructions, and unsupported browser message
- Feb 17, 2026: Added Roast Master personality — savage comedy roast comedian with vulgar humor and safety guardrails (no targeting identity/body, comedy not cruelty)
- Feb 16, 2026: Added first-login PIN change flow — users set their own PIN on first login
- Feb 16, 2026: Enhanced whitelist management: always-visible delete buttons, change PIN with inline editor
- Feb 15, 2026: Added PIN-based access control with whitelist management in Developer portal
- Feb 15, 2026: Added Master Roadmap carousel to Developer portal with database persistence and seeded initial items
- Feb 15, 2026: Added header, footer, Settings, Privacy, Terms, Developer pages with premium glassmorphism design
- Feb 15, 2026: Initial build with voice recording, AI personalities, Bento grid layout
