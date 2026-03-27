# THE VOID

An immersive social experience platform — digital gathering spaces, interactive rooms, and community engagement with Trust Layer SSO.

**Live:** [intothevoid.app](https://intothevoid.app)

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite 7 (Radix UI) |
| Backend | Express + TypeScript |
| Database | PostgreSQL (Drizzle ORM) |
| Auth | Trust Layer SSO (JWT) |
| Deployment | Render (Ohio) |

## Structure

```
thevoid/
├── server/
│   ├── routes.ts            # 2,647 lines — API routes
│   └── trustlayer-sso.ts    # SSO integration
├── client/                  # React SPA
├── shared/                  # Drizzle schema
└── render.yaml
```

## Development

```bash
npm install
npm run dev
npm run db:push
```
