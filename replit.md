# THE VOID by DarkWave Studios

## Overview
THE VOID is a voice-first venting application where users record their frustrations and receive AI-generated responses tailored by different personality modes (Smart-ass, Calming, Therapist, Hype Man, Roast Master). The project aims to provide a cathartic, safe, and engaging platform for users to process emotions, leveraging advanced AI and a distinctive dark glassmorphism design with a Bento grid layout. It integrates robust security, subscription services, and a unique member identification system.

## User Preferences
- NO vertical stacking layouts
- NO horizontal box layouts — use carousel-based UI
- NO images with text/words (copyright/clarity concerns)
- Images must be imported as JS variables (Vite requirement)
- Premium glassmorphism aesthetic on all pages

## System Architecture
The application is built with a React + Vite frontend utilizing Tailwind CSS, Framer Motion, and shadcn/ui for a dark glassmorphism design and Bento grid layout. The backend is powered by Express.js, Drizzle ORM, and PostgreSQL. AI functionalities are handled by OpenAI, providing GPT-5.2 for responses and gpt-4o-mini-transcribe for transcription.

**Core Features & Design:**
- **UI/UX**: Features a consistent dark glassmorphism aesthetic with a Bento grid layout. Pages include a global `Layout` component with a sticky header, branding, navigation (hamburger menu), and a footer with legal links. Animated background orbs enhance the visual experience.
- **Voice Interaction**: Users record frustrations via the MediaRecorder API. Audio is sent as base64 to the backend, transcribed, and processed by AI.
- **AI Personalities**: Five distinct AI personalities offer varied response styles. All AI interactions are governed by strict safety guardrails, including mandatory safety preambles, and an auto-detection system for crisis situations, providing immediate access to crisis resources. AI responses can be delivered via text and OpenAI TTS, with personality-specific voices and user-selectable voice preferences.
- **Authentication**: A PIN-based whitelist system secures the main application areas, featuring a master key, first-login PIN change, and Replit Auth (OIDC).
- **Subscription & Monetization**: Implements Stripe with a Founders Pricing model. First 1,000 subscribers lock in $9.99/month forever (Founders Rate); after that, new subscribers pay $14.99/month. Includes a credit pack system for purchasing additional vents. Founders get a badge and their rate is preserved permanently. Pricing info endpoint at `/api/pricing/info` with live founder spots counter.
- **Void ID System**: Generates unique `V-XXXXXXXX` identifiers for premium subscribers. Serves as both a membership hallmark and affiliate referral code.
- **Blockchain Hallmark**: SHA-256 hash-chained stamps minted for each Void ID on the Trust Layer v1 network. Each stamp includes a block number, previous hash (chain integrity), and DW-STAMP-1.0 standard metadata. Verification endpoint at `/api/stamp/verify/:voidId`.
- **Affiliate Program**: Premium users share their Void ID as a referral code. Referred users who convert to Premium earn the referrer 5 bonus credits. Stats tracked at `/api/referral/stats/:userId`.
- **Trust Layer Bridge**: Void IDs are linked to Trust Layer SSO chat accounts, embedded in JWT tokens, enabling cross-ecosystem member recognition across DarkWave apps.
- **Conversation Threads**: Allows for multi-turn conversations with AI personalities, including text and voice input/output, and context retention.
- **Custom Personality Tuning**: Premium users can adjust AI personality traits like sarcasm and empathy via sliders.
- **Developer Tools**: An admin-only Developer portal provides a database-backed roadmap carousel and an analytics dashboard with real-time metrics.
- **Theming**: Supports a dark/light theme toggle with persistence, impacting glassmorphism component styling via CSS variables.
- **Security**: Features robust rate limiting across various API endpoints and integrates TrustShield.tech.
- **Email System**: Utilizes Resend (via Replit integration) for subscription confirmation emails, adhering to the premium design.
- **Signal Chat**: A real-time global chat system with crisis hotline integration, powered by Trust Layer SSO, using JWT-based authentication and WebSockets. Includes ecosystem login — members from any DarkWave app (Happy Eats, TrustHome, Signal, etc.) can sign in via Trust Layer ID or ecosystem email with either their full password or a short numeric PIN. Endpoint at `/api/chat/auth/ecosystem-login`. Schema columns: `ecosystemPinHash`, `ecosystemApp` on `chatUsers`.
- **Mission Page**: "From the Void" page at `/mission` explaining DarkWave Studios' origin story, values, and promises.
- **Gamification System**: Streak tracking (daily venting streaks), achievements (10 unlockable badges), daily prompts (rotated by day of week), and mood check-ins (before/after venting). Protected page at `/progress`. Backend routes under `/api/gamification/*`.
- **AI Blog**: SEO-optimized blog at `/blog` with 4 seed articles on mental wellness. Markdown-like content rendering, category badges, read time estimates. Backend routes at `/api/blog` and `/api/blog/:slug`. Meta descriptions and Open Graph tags for SEO.
- **Zen Zone**: Meditation page at `/zen` with guided breathing exercises (Box Breathing, 4-7-8, Calming Breath), ambient sound selector (Rain, Ocean, Forest, Fire), and customizable meditation timer (2-20 minutes).
- **Written Journal**: Full journaling experience at `/journal` with mood tagging (8 moods), optional AI personality responses on entries. Carousel-based entry history. Backend CRUD at `/api/journal`.
- **Mood Analytics**: Data visualization dashboard at `/mood-analytics` with custom SVG line charts (before/after mood), stat cards, and recent check-in carousel. Backend at `/api/mood/analytics`.
- **Vent Library**: Searchable/filterable archive at `/vent-library` of past venting sessions with personality filter, audio playback, full transcript/response modal view. Backend at `/api/vent-library`.
- **Daily Affirmations**: AI-generated personalized affirmations at `/affirmations` displayed as premium quote cards in carousel. Generate-on-demand via `/api/affirmations/generate`.
- **Crisis Toolkit**: Comprehensive safety page at `/crisis` with quick panic breathing animation, 5-4-3-2-1 grounding exercise, crisis hotlines (988, 741741, SAMHSA, 911), and editable safety plan (warning signals, coping strategies, support contacts, reasons). Backend at `/api/safety-plan`.
- **Virtual Rage Room**: Interactive stress-relief page at `/rage-room` with clickable destructible glass objects, Framer Motion smash animations with fragments, session stats, streak tracking. Client-side only.
- **Sleep Sounds**: Ambient soundscape mixer at `/sleep-sounds` using Web Audio API (Rain, Ocean, Crickets, Thunder, Wind, Fireplace), sleep timer with volume fade, and 4-7-8 breathing guide. Client-side audio generation.
- **PWA / Google Play Ready**: Full Progressive Web App setup with manifest.json (categories, shortcuts, maskable icons), service worker with offline fallback, branded offline.html page. Ready for TWA (Trusted Web Activity) packaging via Bubblewrap for Google Play Store distribution.
- **TrustVault Integration**: Encrypted ecosystem-wide media storage via TrustVault (trustvault.replit.app). Premium users' vent audio, voice journals, void echoes, and mood portraits are automatically archived to TrustVault with encrypted storage. Service client at `server/trustvault.ts` with auth, token caching, upload/retrieve/delete/batch methods. API routes: `/api/trustvault/media/:mediaId` (retrieve), `/api/trustvault/library/:userId` (browse), `/api/trustvault/health` (status), `/api/trustvault/webhook` (event receiver). Non-blocking uploads — failures log but don't break core flows. Free users: audio transcribed then discarded.

## Mobile App Packaging (Capacitor)
- **Capacitor** wraps the existing web app for native Android and iOS distribution
- App ID: `app.intothevoid.void`
- Web assets directory: `dist/public` (Vite build output)
- Native project directories: `android/` and `ios/`
- Installed plugins: `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/app`
- Build workflow: `npm run build` → `npx cap sync` → build native project in Android Studio / Xcode
- The web app continues to run independently via the existing Express + Vite setup — Capacitor is purely additive

## External Dependencies
- **AI Services**: OpenAI (GPT-5.2, gpt-4o-mini-transcribe for transcription)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Styling & Animation**: Tailwind CSS, Framer Motion, shadcn/ui
- **Payment Processing**: Stripe (for subscriptions and credit packs)
- **Email Service**: Resend (via Replit integration)
- **Security & Infrastructure**: TrustShield.tech, Trust Layer (dwtl.io)
- **Web Sockets**: `ws` for Signal Chat
- **Rate Limiting**: `express-rate-limit`
- **Font Hosting**: Google Fonts (Space Grotesk, Outfit)