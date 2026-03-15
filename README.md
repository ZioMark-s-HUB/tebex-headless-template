# Tebex Headless Store (Next.js + shadcn/ui)

Custom ecommerce storefront for Tebex using:
- Next.js App Router
- Tailwind CSS + shadcn/ui
- Tebex Headless API (listings, baskets, discounts, creator codes, auth)
- Tebex.js embedded checkout launcher

## Features

- Reusable site header + footer
- Light/Dark mode with `next-themes`
- Pages:
  - Home
  - Categories
  - Support
  - Cart
- Tebex flow implemented:
  - Listings fetch
  - Basket creation/retrieval
  - Add package to basket
  - Apply discount code
  - Apply creator code
  - Tebex auth URL generation
  - Checkout launch via `@tebexio/tebex.js`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set your Tebex values:

```bash
cp .env.example .env.local
```

3. Run the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Environment Variables

- `NEXT_PUBLIC_SITE_URL`: frontend base URL (e.g. `http://localhost:3000`)
- `TEBEX_PUBLIC_TOKEN`: your Tebex webstore identifier used in Headless API routes
- `TEBEX_PUBLIC_TOKEN`: Tebex public token for API auth
- `TEBEX_PRIVATE_KEY`: Tebex private key for API auth
- `DISCORD_CLIENT_ID`: Discord OAuth application client ID (for packages requiring `discord_id`)
- `DISCORD_CLIENT_SECRET`: Discord OAuth application client secret
- `DISCORD_REDIRECT_URI`: Discord OAuth callback URL (default: `http://localhost:3000/api/auth/discord/callback`)

## Tebex API Notes

This template calls Headless API through Next.js route handlers under `src/app/api/tebex/*`, keeping credentials on the server side.
