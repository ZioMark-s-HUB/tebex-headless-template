# Tebex Headless Store (Next.js + shadcn/ui)
## Live Demo: https://tebex-headless-template.vercel.app/

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

---
**Copyright (c) 2026 ZioMark-s-HUB**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to use,
copy, modify, and merge the Software for personal or internal business use,
subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

2. You may modify the Software for your own use.

3. You may not sell, sublicense, redistribute, publish, or commercially exploit
   the Software, in whole or in part, as a standalone product, template,
   starter, boilerplate, clone, or derivative work intended for resale.

4. You may not rebrand, repackage, or distribute this Software or any modified
   version of it as your own product for sale or commercial distribution.

5. This license does not grant permission to use the name, branding, logo, or
   identity of the original author or project except for proper attribution.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
