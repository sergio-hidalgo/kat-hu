# kat-hu

pnpm-workspaces monorepo — one git repo holding an Astro client and a NestJS
server side by side.

## What this is

The website of **kathu**, a holistic floral therapy practice for *familias
multiespecie* — cats and the humans who care for them — run by a
**florapeuta**. Interface copy is Spanish; code is English.

| Part                                  | Stack                                               | State             |
| :------------------------------------ | :-------------------------------------------------- | :---------------- |
| Landing with a booking request form   | Astro (+ React island for the form)                 | planned           |
| About page                            | Astro + Sanity                                      | planned           |
| Blog `/drops`                         | Astro + Sanity, likes in Supabase                   | built, gaps below |
| Shop `/tienda`                        | Astro + Shopify Storefront API                      | planned           |
| Accounts (users, admins)              | Supabase Auth                                       | planned           |
| Admin area (switch blocks/pages live) | Astro + NestJS + Supabase                           | planned           |
| API                                   | NestJS — the only holder of the Supabase secret key | health only       |

Work is spec-driven: every feature is a numbered spec, implemented end to
end and closed with this README updated. The specs, the agent skills, the
issue log and the design references live in local-only folders (`specs/`,
`skills/`, `issues/`, `references/`, all gitignored) — this file is the
tracked record of what exists. See the "Roadmap" section for the order.

## Structure

```text
/
├── apps/
│   ├── client/   Astro front end   (dev :4321)
│   ├── server/   NestJS API        (dev :3000)
│   └── studio/   Sanity Studio     (dev :3333)
├── packages/     shared libraries (none yet)
├── package.json      workspace root — scripts only, no app deps
├── pnpm-workspace.yaml
└── pnpm-lock.yaml    the single lockfile for the whole repo
```

## Design system

The visual language is fixed and lives outside the app, in the local-only
`references/` folder: `kathu-style-guide.md` (the rules) and
`kathu-tokens.css` (the Tailwind v4 `@theme`). The app carries a
**byte-for-byte copy** of the tokens at
`apps/client/src/styles/kathu-tokens.css`; the copy follows the reference,
never the other way round.

- **Tailwind v4** through `@tailwindcss/vite`. Utilities inline in the
  `.astro` files — there are no `<style>` blocks and no hex values anywhere
  in `apps/client/src`.
- **Two typefaces**, self-hosted from `apps/client/public/fonts/`: Urbanist
  for `text-display`/`h1`/`h2`, Lora for everything else.
- **One grid, and everything is on it.** It is the full width of the screen
  and identical at every screen size: 12 columns, a gap between every pair,
  and the same gap at the left and right screen edges, with **column width,
  gap width and edge margin all equal**. The screen is therefore 25 equal
  units and one unit is `100% / 25`. `Grid` is the grid and owns the page
  margins; `Section` is only a band (vertical rhythm and surface) and is
  always full width. Elements say which columns they occupy —
  `col-span-12 md:col-span-6` — and **nothing chooses its own width**: no
  `max-width`, no `mx-auto`, no container variants. The 66ch reading measure
  for prose is not a container; it comes from the tokens' base layer.
- In development, press `g` on any page to toggle the grid overlay. It draws
  itself with the same `Grid`, so anything that does not line up is a defect.
  It ships nothing to production.
- `/estilo` renders every UI primitive in every state. It exists in `astro dev`
  only and returns 404 in a production build.

## Requirements

- Node `>=22.12.0`
- pnpm 11 (`corepack enable`)

## Getting started

```sh
pnpm install   # from the repo root
pnpm dev       # runs client and server together
```

## Commands

Run from the repo root:

| Command                          | Action                                  |
| :------------------------------- | :-------------------------------------- |
| `pnpm install`                   | Install every workspace's dependencies  |
| `pnpm dev`                       | Start client and server in parallel     |
| `pnpm dev:client`                | Start only the Astro dev server         |
| `pnpm dev:server`                | Start only the Nest dev server (watch)  |
| `pnpm dev:studio`                | Start only the Sanity Studio            |
| `pnpm build`                     | Build every app                         |
| `pnpm check`                     | Type-check every app                    |
| `pnpm test`                      | Run every app's tests (after spec 03)   |
| `pnpm --filter client favicons`  | Regenerate the favicon set from the logo |
| `pnpm --filter <app> <script>`   | Run a script in one app                 |
| `pnpm --filter <app> add <pkg>`  | Add a dependency to one app             |

`<app>`: `client`, `server`, or `studio`.

## Server

The API answers on `http://localhost:3000`, with a health probe:

```sh
curl http://localhost:3000/health   # {"status":"ok"}
```

Override the port with the `PORT` environment variable.

## Content (Sanity CMS)

The client's `/drops` section reads its posts from Sanity at **build time**.
The app only reads — it holds no write token and cannot modify content.

```sh
cp apps/client/.env.example apps/client/.env   # then fill in the project ID
cp apps/studio/.env.example apps/studio/.env   # the same project ID
```

Get the project ID from `https://manage.sanity.io`. The dataset is normally
`production` and must be **public** (Project → API → Datasets), or an
unauthenticated read returns nothing. These values are not secrets — they
appear in the public image CDN URLs — but `.env` stays untracked regardless.

Both files must carry the **same** project ID and dataset, or the Studio edits
content the site never reads.

### The Studio

`apps/studio` is the editing UI. It is a separate app from the site: it is not
built or deployed with it, and the site never imports from it.

```sh
pnpm dev:studio                    # http://localhost:3333
pnpm --filter studio deploy        # hosts it at https://<name>.sanity.studio
```

Deploying gives the content editor a URL with SSO login and no terminal. Invite
them as an **Editor** from `https://manage.sanity.io`. Field labels are in
Spanish, in `apps/studio/schemaTypes/post.ts`.

### Schema contract

`/drops` queries document type `post` (set by `DOC_TYPE` in
`apps/client/src/data/posts.ts`) and reads the fields below, which are defined
in `apps/studio/schemaTypes/post.ts`. Renaming a field on one side without the
other silently empties the section — the two files are a contract.

| Field         | Type               | Required | Used for                                |
| :------------ | :----------------- | :------- | :-------------------------------------- |
| `title`       | `string`           | yes      | Card + page heading, `<title>`          |
| `slug`        | `slug`             | yes      | URL: `/drops/<slug>/`                   |
| `excerpt`     | `text`             | no       | Card summary; falls back to body start  |
| `publishedAt` | `datetime`         | no       | Ordering + date; falls back to created  |
| `mainImage`   | `image` (hotspot)  | no       | Card thumbnail + page hero              |
| `body`        | `array` of `block` | yes      | Post content (Portable Text)            |

Only `title`, `slug` and `body` are required; every other field degrades
gracefully, so an editor cannot break the build by leaving one blank. Drafts
are never published — the client reads with `perspective: 'published'`.

### Publishing requires a rebuild

The site is statically generated, so content is baked in at build time and new
posts appear only after a rebuild. Point a Sanity webhook (Project → API →
Webhooks) at the host's build hook so publishing triggers a deploy. For content
to appear the instant it is published, the client would need an SSR adapter and
`output: 'server'` — a hosting decision, not made here.

> **Planned change.** Spec 04 moves the site to on-demand rendering with the
> Node adapter, after which content appears on publish and no webhook or
> rebuild is needed. This section is retired when that spec closes.

## Likes (Supabase)

Like counts live in Supabase, not Sanity, so reader traffic never consumes CMS
bandwidth. The Astro app needs two more variables in `apps/client/.env`:

```sh
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key is meant to be exposed in the browser. What protects the
data is the schema, not the key:

| Object | Who can do what |
| :----- | :-------------- |
| `public.post_likes` | `select` only for `anon`. Insert/update/delete are revoked, and RLS has no policy for them |
| `like_post(text)` | `security definer` RPC, `+1` on one row, returns the new total |
| `unlike_post(text)` | `security definer` RPC, `-1` floored at zero, returns the new total |

So the worst a visitor can do with the key is move one counter by one. Both
RPCs reject a `post_id` that is not `^[A-Za-z0-9._-]{1,128}$`.

A `localStorage` entry (`kat-hu:liked-posts`) remembers what this browser has
already liked, so a reload does not hand out a second like and a returning
reader sees their heart already filled. It is a courtesy guard, not
enforcement — it is per-browser and the reader can clear it. Stopping
determined repeat likes needs auth or rate limiting.

Counts are keyed by the Sanity document `_id`, not the slug, so renaming a
slug keeps the post's likes.

### How the ordering works

`/drops` shows the three most-liked posts under **Los que más gustan**, then
the rest by date under **Más recientes**. Counts are read twice: once at build
time, so the first paint is already sensibly ordered, and once in the browser
on each load, which refreshes the numbers and re-sorts the cards. There is no
realtime subscription — a reader sees new counts on refresh.

If Supabase is unreachable the counts fall back to zero and the page still
builds and renders; likes are additive, not load-bearing.

## Planned work — /drops

Deliberately not built yet. Listed roughly in the order they would pay off.

- [ ] **Live counts without a refresh.** Today counts are read at build time and
      again on each page load; a like by someone else shows up on the next
      refresh. A Supabase Realtime subscription on `post_likes` would push
      changes and let the featured row re-sort in place. Deferred on purpose —
      per-load reads are cheaper and the page has no other live behaviour.

- [ ] **Know whether a reader already liked a post, across sessions.** There is
      no auth and no session identity, so the site cannot answer this today.
      Needs either Supabase Auth (even anonymous sign-in) or a server-issued
      visitor id, plus a `post_likes_by_visitor` table keyed on
      `(visitor_id, post_id)` — which also turns the count into a derived value
      rather than a mutable counter.

- [ ] **Replace the `localStorage` guard with real enforcement.** Same work as
      the item above: `kat-hu:liked-posts` is per-browser and clearable, so it
      only stops casual double-liking. Until identity exists, the RPCs are open
      endpoints and a determined visitor can inflate a count. Rate limiting at
      the edge would narrow the gap without full auth.

- [ ] **Toast on like / unlike.** Confirmation that the click registered,
      and somewhere to surface the failure path the button currently only
      logs to the console.

- [ ] **Add type of post.** Add in the schema of Sanity and as badges in the
      frontend a set of possible values around the types of components or posts
      being articulos / trucos / consejos / guías.

- [ ] **Add topics of the post.** Add in the schema of Sanity and as badges in the
      frontend a set of possible values around the topics dealt with in the post,
      with a maximum of 3 selections, being estrés / agresividad / juego / etc.

## Roadmap

In dependency order. Each line is a spec; the number is the file in the
local `specs/` folder, and the branch that delivers it carries the same
name (`02-design-system-foundation`). Status here is updated when a spec
closes.

| #   | Spec                                                                      | Status   |
| :-- | :------------------------------------------------------------------------ | :------- |
| 01  | Client blog scaffolding: `/drops` on Sanity, Studio app, likes on         |          |
|     | Supabase (branch `01-client-blog-scafolding`, PR #1)                      | done     |
| 02  | Design system foundation (Tailwind v4, tokens, 12-column grid,            |          |
|     | header/footer, UI primitives, `/estilo`)                                  | done     |
| 03  | Test tooling (Vitest client/packages, Jest server, `pnpm test`)           | todo     |
| 04  | Runtime, contracts, Supabase base (Node adapter, React,                   |          |
|     | `packages/contracts`, Nest config/auth scaffold, migrations in repo)      | todo     |
| 05  | Landing page blocks                                                       | todo     |
| 06  | Booking request form (*reserva*)                                          | todo     |
| 06b | Booking email notifications                                               | deferred |
| 07  | About page                                                                | todo     |
| 08  | Blog `/drops` completion (kind, topics, toasts)                           | todo     |
| 09  | Auth with Supabase (profiles, roles, sessions)                            | todo     |
| 10  | Admin visibility area (`/admin`)                                          | todo     |
| 11  | Shop `/tienda` with Shopify                                               | todo     |
| 12  | Likes with identity                                                       | todo     |
| 13  | CI and deployment                                                         | todo     |

### Environment variables (all apps)

| App    | Variable                                                                         | Public | Since |
| :----- | :------------------------------------------------------------------------------- | :----- | :---- |
| client | `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`, `PUBLIC_SANITY_API_VERSION` | yes    | now   |
| client | `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`                         | yes    | now   |
| client | `PUBLIC_API_URL`                                                                 | yes    | 04    |
| client | `SHOPIFY_STORE_DOMAIN`, `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`, `SHOPIFY_API_VERSION` | token  | 11    |
| server | `PORT`, `CLIENT_ORIGIN`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`                   | never  | 04    |
| studio | `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`                              | n/a    | now   |

`PUBLIC_` variables are inlined into the browser bundle by Astro. The
Supabase secret key lives only in `apps/server/.env`.

## Adding a shared package

Shared code goes in `packages/*` (already matched by `pnpm-workspace.yaml`) and
is consumed with `"workspace:*"`. Apps must never import each other by relative
path.
