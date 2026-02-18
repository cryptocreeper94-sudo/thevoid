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
- **Signal Chat**: A real-time global chat system with crisis hotline integration, powered by Trust Layer SSO, using JWT-based authentication and WebSockets.
- **Mission Page**: "From the Void" page at `/mission` explaining DarkWave Studios' origin story, values, and promises.
- **Gamification System**: Streak tracking (daily venting streaks), achievements (10 unlockable badges), daily prompts (rotated by day of week), and mood check-ins (before/after venting). Protected page at `/progress`. Backend routes under `/api/gamification/*`.
- **AI Blog**: SEO-optimized blog at `/blog` with 4 seed articles on mental wellness. Markdown-like content rendering, category badges, read time estimates. Backend routes at `/api/blog` and `/api/blog/:slug`. Meta descriptions and Open Graph tags for SEO.
- **Zen Zone**: Meditation page at `/zen` with guided breathing exercises (Box Breathing, 4-7-8, Calming Breath), ambient sound selector (Rain, Ocean, Forest, Fire), and customizable meditation timer (2-20 minutes).

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