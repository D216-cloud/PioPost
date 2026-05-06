# PinPost

PinPost is a full-stack Next.js App Router application for previewing social media posts across Instagram, LinkedIn, X, and Facebook before publishing.

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- NextAuth (Google + credentials email/password)
- Zustand state management
- Framer Motion animations
- Lucide icons
- Sonner toast notifications
- next-themes dark mode

## Routes

- `/` landing page
- `/login` authentication page
- `/dashboard` protected editor + live preview

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and set values.

Required for auth:

- `NEXTAUTH_SECRET` or `AUTH_SECRET`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (or `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`)
- `NEXTAUTH_URL=http://localhost:3000`

## Production checks

```bash
npm run lint
npm run build
```

Both checks pass in the current implementation.
