
# THE VOID — Integration Handoff for Orbit Staffing

> **IMPORTANT — PROJECT MIGRATION NOTICE (February 2025)**
> THE VOID has been migrated to a **new Replit project** to resolve prior connection issues. All previous API endpoints, secrets, and deployment URLs from the old project are no longer valid. This handoff document reflects the current, active project. If you had any saved references to the old project, please replace them with the details below.

## What is THE VOID?

THE VOID is a voice-first mental wellness platform by DarkWave Studios. Users record their frustrations (venting) and receive AI-generated responses from one of 5 personality modes (Smart-ass, Calming, Therapist, Hype Man, Roast Master). It's a subscription-based app with a premium glassmorphism design, built on React + Vite + Express + PostgreSQL.

**Live URL:** Published on Replit (`.replit.app` domain)
**Dev Domain:** `9558e4e6-8018-44f4-896d-d017366f8623-00-e3pv2virc2vr.janeway.replit.dev`

---

## Why This Matters to Orbit Staffing

THE VOID is part of the **DarkWave Studios ecosystem**. All DarkWave apps share a common identity system called **Trust Layer SSO**. This means members from any DarkWave app — including Orbit Staffing — can sign into THE VOID (and vice versa) using their Trust Layer credentials.

Orbit Staffing handles financials and staffing for DarkWave Studios. Connecting it to THE VOID's ecosystem enables cross-app member recognition, shared identity, and potential financial reporting on subscription revenue.

---

## Trust Layer SSO — How It Works

### Identity Format

Every user in the DarkWave ecosystem gets a **Trust Layer ID**:
- Format: `tl-{timestamp_base36}-{random}` (e.g., `tl-m5x7k2-a9b3c1d2`)
- Generated at registration time
- Unique across the entire ecosystem
- Stored on the `users` table as `trust_layer_id`

Premium VOID subscribers also get a **Void ID**:
- Format: `V-XXXXXXXX` (e.g., `V-A7K2M5X9`)
- Used as membership hallmark and affiliate referral code

### Authentication

Trust Layer SSO uses **JWT tokens** signed with a shared secret:
- Issuer: `trust-layer-sso`
- Expiry: 7 days
- Payload: `{ userId, trustLayerId, voidId? }`
- Passwords: bcrypt (12 rounds), min 8 chars, 1 uppercase, 1 special character

### Ecosystem Login

THE VOID already has an **ecosystem login endpoint** that accepts members from other DarkWave apps. Orbit Staffing should implement the same pattern.

**Endpoint:** `POST /api/chat/auth/ecosystem-login`

**Request body:**
```json
{
  "identifier": "tl-xxxx-xxxx OR user@email.com",
  "credential": "password OR 4-8 digit PIN"
}
```

**How credential detection works:**
1. If the credential is numeric and 4-8 digits, try it as a PIN first (compared against `ecosystemPinHash`)
2. Always fall back to full password (compared against `passwordHash`)
3. Users never have to specify which type — the system figures it out

**Response (success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "kathy.nguyen",
    "displayName": "Kathy Nguyen",
    "email": "kathy@happyeats.io",
    "avatarColor": "#06b6d4",
    "role": "member",
    "trustLayerId": "tl-kathy-he01",
    "voidId": null,
    "ecosystemApp": "Happy Eats"
  },
  "token": "eyJhbG..."
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "No ecosystem account found. Check your Trust Layer ID or email."
}
```

---

## Database Schema — What Orbit Staffing Needs

Add these columns to your users table for ecosystem compatibility:

```sql
trust_layer_id    TEXT UNIQUE,        -- tl-xxxx-xxxx format
ecosystem_pin_hash TEXT,              -- bcrypt hash of 4-8 digit PIN for quick login
ecosystem_app     TEXT                -- which app the user originally came from (e.g., "Orbit Staffing")
```

### Required Storage Methods

```typescript
// Look up user by Trust Layer ID
async getUserByTrustLayerId(trustLayerId: string): Promise<User | undefined>

// Look up user by email (for ecosystem login fallback)
async getUserByEmail(email: string): Promise<User | undefined>
```

---

## Implementing Ecosystem Login on Orbit Staffing

### Step 1: Add the endpoint

```typescript
app.post("/api/auth/ecosystem-login", async (req, res) => {
  const { identifier, credential } = req.body;

  // Lookup: try Trust Layer ID first, then email
  let user;
  if (identifier.startsWith("tl-")) {
    user = await storage.getUserByTrustLayerId(identifier.trim());
  }
  if (!user) {
    user = await storage.getUserByEmail(identifier.trim().toLowerCase());
  }
  if (!user) {
    return res.status(401).json({ success: false, error: "No ecosystem account found." });
  }

  // Must be Trust Layer-linked
  if (!user.trustLayerId) {
    return res.status(401).json({ success: false, error: "Account not linked to Trust Layer." });
  }

  // Try PIN first (numeric, 4-8 digits), then password
  let authenticated = false;
  if (user.ecosystemPinHash && /^\d{4,8}$/.test(credential.trim())) {
    authenticated = await bcrypt.compare(credential.trim(), user.ecosystemPinHash);
  }
  if (!authenticated) {
    authenticated = await bcrypt.compare(credential.trim(), user.passwordHash);
  }

  if (!authenticated) {
    return res.status(401).json({ success: false, error: "Invalid credential." });
  }

  // Create session / JWT (use your existing session logic)
  const token = signToken(user.id, user.trustLayerId);
  return res.json({ success: true, user: sanitizeUser(user), token });
});
```

### Step 2: Add the frontend toggle

Add a "Sign in with Trust Layer" button on your login page that switches to ecosystem mode with two fields:
- **Trust Layer ID or Email** (text input)
- **Password or Ecosystem PIN** (password input)

Use your app's brand accent color for the Trust Layer button (THE VOID uses emerald).

### Step 3: Sanitize responses

**Always strip these fields from API responses:**
- `passwordHash`
- `ecosystemPinHash`

---

## THE VOID's Subscription Model

Orbit Staffing may need these details for financial tracking:

| Tier | Price | Details |
|------|-------|---------|
| Founders Rate | $9.99/month | First 1,000 subscribers, locked forever |
| Standard Rate | $14.99/month | After 1,000 founders claimed |
| Credit Packs | Variable | Additional vents beyond subscription |

- Payment processor: **Stripe**
- Subscription status tracked in `subscriptions` table
- Founders get a badge and their rate is preserved permanently
- Revenue endpoint for internal use: `/api/pricing/info`

---

## Current Ecosystem Apps

These apps are live or in development across the DarkWave ecosystem:

| App | Domain | Purpose |
|-----|--------|---------|
| THE VOID | intothevoid.replit.app | Voice-first mental wellness |
| Happy Eats | happyeats.io | Food/dining |
| TrustHome | trusthome.io | Home services |
| Signal | signal.dw | Real-time chat with crisis support |
| TrustVault | trustvault.replit.app | Encrypted media storage |
| Orbit Staffing | (your domain) | Staffing & bookkeeping |

When Orbit Staffing registers new users, set `ecosystemApp: "Orbit Staffing"` so other apps in the ecosystem can identify where the user originated.

---

## Security Notes

- All passwords: bcrypt, 12 salt rounds
- Ecosystem PINs: bcrypt-hashed, 4-8 numeric digits
- JWTs: HMAC-SHA256 signed, 7-day expiry
- Rate limiting: Apply auth rate limiter to ecosystem login endpoint
- Never log or return password/PIN hashes
- Validate all input with Zod schemas before processing

---

## Testing Checklist

Use these demo accounts (seeded in THE VOID) to verify cross-app login:

| Name | Email | PIN | Password | Trust Layer ID | From |
|------|-------|-----|----------|---------------|------|
| Kathy Nguyen | kathy@happyeats.io | 7724 | HappyEats@2025 | tl-kathy-he01 | Happy Eats |
| Marcus Chen | marcus@trusthome.io | 8832 | TrustHome@2025 | tl-marcus-th01 | TrustHome |
| Devon Blackwell | devon@signal.dw | 6619 | Signal@2025 | tl-devon-sig01 | Signal |

**Test these flows:**
1. Login with email + PIN
2. Login with Trust Layer ID + PIN
3. Login with email + full password
4. Login with Trust Layer ID + full password
5. Reject non-ecosystem user
6. Reject wrong PIN / wrong password
7. Reject empty or malformed payloads (no 500 errors)

---

## Reconnection Steps (New Project)

THE VOID moved to a new Replit project. To reconnect Orbit Staffing:

### 1. Update Your Stored API Base URL

Replace any saved base URL for THE VOID's API with the new deployment domain. Once published, the production URL will be on the `.replit.app` domain. During development, use:

```
https://9558e4e6-8018-44f4-896d-d017366f8623-00-e3pv2virc2vr.janeway.replit.dev
```

### 2. Verify Secrets Are In Place

THE VOID's new project already has these secrets configured:
- `ORBIT_STAFFING_API_KEY` — API key for authenticating requests from/to Orbit Staffing
- `ORBIT_STAFFING_API_SECRET` — API secret for signed requests
- `ORBIT_STAFFING_BASE_URL` — **This needs to be updated** to point to Orbit Staffing's current URL if it changed

On the Orbit Staffing side, update your stored secrets:
- `VOID_API_KEY` (or equivalent) — must match the `ORBIT_STAFFING_API_KEY` value stored in THE VOID
- `VOID_BASE_URL` — update to THE VOID's new deployment URL

### 3. Test the Connection

Once URLs and secrets are updated on both sides, verify connectivity:

**From Orbit Staffing → THE VOID:**
```bash
curl -X POST https://<VOID_DEPLOYMENT_URL>/api/chat/auth/ecosystem-login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "tl-kathy-he01", "credential": "7724"}'
```
Expected: `200 OK` with `{ "success": true, "user": { ... }, "token": "..." }`

**From THE VOID → Orbit Staffing:**
```bash
curl -X GET https://<ORBIT_STAFFING_URL>/api/health \
  -H "Authorization: Bearer <ORBIT_STAFFING_API_KEY>"
```
Expected: `200 OK` with health/status response

### 4. Confirm Ecosystem Login Works Both Ways

- A VOID user should be able to log into Orbit Staffing via Trust Layer SSO
- An Orbit Staffing user should be able to log into THE VOID's Signal Chat via ecosystem login
- Use the test accounts in the Testing Checklist section above to verify

### 5. Update Webhook URLs (If Applicable)

If Orbit Staffing sends webhooks to THE VOID (subscription events, staffing updates, etc.), update all webhook endpoint URLs to use THE VOID's new deployment domain.

---

## Contact

This handoff was generated from THE VOID's codebase. For questions about the Trust Layer SSO protocol or ecosystem integration, coordinate through the DarkWave Studios team.

*Last updated: February 24, 2025 — Project migration to new Replit environment*
