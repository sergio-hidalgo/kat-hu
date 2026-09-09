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
- `/estilo` renders every UI primitive in every state, including the chrome's
  stripe, the band's three states and the back-to-top button. It exists in
  `astro dev` only and returns 404 in a production build.
- **Every interactive target is at least 44px**, and the height is on the
  control itself — padding on a wrapper is dead space around a link's own line
  box, which is 25.6px at `text-sm`. That is why the header's nav links and the
  footer's column links carry `min-h-11` rather than padding on their `li`.
- `/404` is the site's own not-found page: the chrome, a heading, one line
  saying what to do, and two ways back — *Ir al inicio* and *Leer los drops*.
  It is **transitional**. Spec 10 replaces it with the one that also answers a
  page the owner has switched off in `/admin`, which returns 404 rather than
  403.

### The site chrome

The header is an **advisory stripe** above a **band**, both inside one fixed
wrapper, and the band has three states driven by a single `data-band`
attribute:

| State    | When                                       | What you see                                                     |
| :------- | :----------------------------------------- | :--------------------------------------------------------------- |
| `top`    | the first 40px of the page                 | the stripe, and the band opaque with no rule                     |
| `glass`  | past 40px                                  | the stripe collapsed; the band translucent, blurred, Mist rule   |
| `hidden` | past one viewport and still scrolling down | the band slides away and the back-to-top button appears          |

Scrolling back up brings the band back as `glass` after 80px — a hysteresis,
so a trackpad twitch cannot flicker it — and the stripe returns only at the
very top of the page, because it belongs to the page rather than to the
header. Every difference between states is a CSS transition on a `data-*`
variant, so `prefers-reduced-motion` switches all of it off through the token
file. The decisions themselves are a pure function,
`src/lib/chrome-scroll.ts`, with its own tests; the back-to-top button is
visible exactly when the band is hidden, and returns focus to the header's
logo after it scrolls.

The band is **opaque and the lockup is always the violet one** — there is no
transparent-over-hero treatment and no knockout swap in the header. Its
height is written down once, in `src/components/site/header.ts`, which the
layout, the stripe and `/drops`' `scroll-margin-top` all import instead of
repeating a number.

The **logo is real text plus one inline SVG** (`.kathu-logo` from the design
system), never an image of the words: it is selectable, it scales with the
reader's font settings and it costs no image request. The two wordmark PNGs
remain in `src/assets/brand/` for email and social only.

On mobile the menu is a **full-screen white sheet** built on `<details>`, so
it opens and its links work with no JavaScript; the script adds the scroll
lock, Escape, the focus trap and the return of focus to the trigger.

The **stripe's text lives in `src/data/announcement.ts`**, together with an
`enabled` flag. Turning it off emits no stripe at all and the layout drops its
top padding to the band alone — decided on the server, so neither state costs
a layout shift. That flag is a placeholder for the visibility flag
`block:announcement`, which spec 10 will register in `packages/contracts`;
spec 08 can move the words themselves into Sanity without changing the shape.

The **footer** carries the cropped wordmark as a watermark, flush to its
bottom-left in violet-800 — 1.22:1 against the violet-900 surface, meant to
register as a change in the surface rather than as something to read. It is
decoration: `aria-hidden`, unselectable, cropped by the footer itself. The
surface, the padding and the watermark's placement all come from the design
system's `.kathu-footer` classes.

Its column links each stand 44px tall so they can be tapped — they were 25.6px
targets until spec 03e, which is below the floor for a finger. On a phone
**Navegación and Legal share one row**, as two four-column blocks starting at
grid columns 3 and 7: symmetric about the centre line, so the pair reads as one
centred block. Contacto keeps its own row, its single link being the longest
label in the footer. From `sm` (480px) the three columns share a row as before,
and `lg` is unchanged.

Measured at 390px: the footer was 858px before spec 03e, 908px with the bigger
targets alone, and **703px** once the two lists were paired — so the phone
footer ends up 155px shorter than it started, with targets that can be hit.
From `sm` up the targets cost 23px and nothing else moved.

## Requirements

- Node `^24.15.0 || >=26.0.0` — the range the test tooling supports (`jsdom`
  needs `24.15.0` on the Node 24 line; the odd-numbered lines are excluded on
  purpose). `.nvmrc` pins the exact version everyone develops and builds on,
  **24.20.0**; `nvm use` in the repo root picks it up.
- pnpm 11 (`corepack enable`)

`pnpm-workspace.yaml` sets `engineStrict: true` (and `.npmrc` sets the same
thing under npm's name, for `npm`/`npx`), so `pnpm install` refuses to run on a
Node outside that range instead of failing later inside a test run. A shell that
does not load `nvm` — anything non-interactive: scripts, git hooks, editor
tasks — may resolve a different `node` than your terminal shows; check with
`command -v node` if an install is rejected unexpectedly.

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
| `pnpm test`                      | Run every app's tests                   |
| `pnpm --filter client favicons`  | Regenerate the favicon set from the logo |
| `pnpm --filter <app> <script>`   | Run a script in one app                 |
| `pnpm --filter <app> add <pkg>`  | Add a dependency to one app             |

`<app>`: `client`, `server`, or `studio`.

## Tests

**Vitest** in both apps, so one runner and one set of matchers across the
repo. `apps/studio` has no tests; its `test` script is a no-op line so
`pnpm -r test` stays uniform.

```sh
pnpm test                        # every workspace
pnpm --filter client test        # one app
pnpm --filter server test:watch  # watch mode while working
```

Tests sit next to the code they cover (`*.test.ts` in the client,
`*.spec.ts` in the server) and are fast and offline — no network, no real
Supabase, Sanity or Shopify, no wall-clock waits. Scripted test doubles
belong in `apps/client/src/test/mocks/` and `apps/server/test/mocks/`.

The server uses Vitest rather than Jest because NestJS 12 ships as ESM only,
and Jest can load ESM just on Node >= 24.9 — above this repo's Node floor.
Nest's own ESM scaffold makes the same choice.

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

### The banner

`/drops` opens on a full-bleed band — `src/assets/brand/banner_drops.jpg`
under the same violet-900 gradient the landing hero wears — carrying the
page's `<h1>`, *Mis drops*, and one lead line. It is built exactly like the
landing's hero: the image is a direct child of the `Section`, outside the
`Grid`, and `overHero` on the layout lets the band start at the top of the
document, so it runs under the fixed chrome and scrolls away beneath it
rather than pushing it down. The words inside clear the chrome by importing
`CHROME_PT` / `BAND_PT` from `src/components/site/header.ts` — the same one
place the layout and the `scroll-margin-top` read (issue I-007).

The band is shorter than the landing's `80vh` — `clamp(20rem, 30vw, 28rem)` —
because the source is 1584 × 419 (3.8:1). A viewport-tall crop of it would be
a sliver, and the file is not wide enough to serve past 1584px without the
browser upscaling it.

The photograph — lavender and dried oak under a pipette releasing a violet
drop — is chosen to sit in the palette rather than to be corrected into it:
under the overlay the band maps 90% onto the violet ramp, and Cloud clears
9.8:1 behind the `<h1>`.

Below `md` the crop is **anchored at 65% rather than centred**, so the pipette
— the reason the photograph belongs to this route — stays in frame on a phone
and the trim comes off the left instead of off both sides. `sizes` describes
the image rather than the viewport (`(max-width: 1066px) 1210px, 114vw`),
because an `object-cover` band lays the photograph out up to 3.2× wider than
the screen; `100vw` would hand a phone a 750px file to fill 1210px.

### How the cards look and arrive

A card is capped at **two lines of title and five lines of summary** (plus its
16:9 image), clamped visually with `line-clamp` — the whole text stays in the
markup, so search engines and screen readers get the full sentence and only
the box is capped. Cards with less text stay shorter, which is what keeps the
second block reading as a masonry.

The second block's heading and cards **arrive as you scroll**: a 10px rise and
a fade, once per card, over twice the design system's `--duration-slow` (640ms)
with its `--ease-out-soft` easing — an entrance is not a state change, so it
runs slower than the token scale's top step. The featured block fades in without moving. Changing page,
resizing, and the repaint that follows the like counts all show cards outright
— a reveal never replays, and nothing animates under a scroll that did not
happen. The policy is `src/lib/reveal.ts`; with `prefers-reduced-motion:
reduce`, or with JavaScript off, the whole page is simply visible.

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
| 03  | Test tooling (Vitest everywhere, `pnpm test`)                              | done     |
| 03b | Node runtime floor                                                        | done     |
| 03c | Drops dynamics (card shape, scroll motion)                                | done     |
| 03d | Header, footer and back-to-top rebuilt (stripe, band states, sheet,       |          |
|     | watermark, real-text lockup)                                              | done     |
| 03e | UI playbook retrofit (`ui-review.md` run over everything built before    |          |
|     | the gate existed; 44px targets, the site's own 404)                       | done     |
| 03f | Drops banner hero (`banner_drops.jpg`, restored `<h1>`)                    | done     |
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
