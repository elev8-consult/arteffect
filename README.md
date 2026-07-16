# ArtEffect

Next.js App Router scaffold for an editorial commerce experience that showcases
limited art products, the current drop, commissioned artwork, the artist, the NGO
partner, and measurable impact.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS v4 design tokens
- shadcn/ui-compatible primitives
- Framer Motion client interactions
- Payload CMS 3 with Payload Auth
- PostgreSQL through Payload's Drizzle-backed Postgres adapter
- Local media uploads in `public/media`
- ESLint flat config

## Project Structure

```txt
app/                    App Router routes, metadata, sitemap, API health route
app/(payload)/          Payload Admin, REST, GraphQL, and server-function routes
components/layout/      Site header and footer
components/sections/    Homepage storytelling and interactive sections
components/ui/          shadcn-style primitives
data/                   Temporary typed content fixtures
lib/                    Shared utilities and site config
payload/                Payload collections, access rules, and migrations
types/                  Content model contracts
```

## Payload CMS

Payload runs inside the same Next.js process. The admin UI is mounted at
`/admin`, the Payload REST API is available under `/api`, GraphQL is mounted at
`/api/graphql`, and the normalized homepage payload is exposed at
`/api/showcase`.

Required runtime environment variables:

```bash
DATABASE_URL=postgres://...
PAYLOAD_SECRET=change-me
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Railway deployments automatically trust the platform's single ingress proxy
when resolving client addresses for mutation rate limits. On another platform,
set `RATE_LIMIT_TRUSTED_PROXY_HOPS` to the exact number of trusted proxies in
front of Next.js. Leave it unset (or set it to `0`) when requests reach the app
directly; forwarded address headers are then ignored.

`POSTGRES_URL` is also accepted as a database URL fallback for Railway-style
Postgres environments. If no database URL is present, the homepage uses
`data/showcase.ts` as a local development fallback.

The first Payload user can be created at `/admin/create-first-user`. After that,
all CMS writes require an authenticated Payload user; anonymous CMS reads are
limited to published showcase content.

## Dependency Policy

Commerce helpers such as quick view, quick add, add to cart, and payment
providers are implemented in the app when needed or added only from verified
packages. Do not add placeholder package names for those flows; unclaimed npm
names create a supply-chain risk during CI, Railway builds, and local installs.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run payload:generate-types
npm run payload:generate-schema
npm run payload:migrate:create
npm run payload:migrate
```

The content in `data/showcase.ts` remains as the local fallback and seed-shaped
reference for the Payload collections. Production content should be managed in
Payload with local uploads stored under `public/media`.
