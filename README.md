# kat-hu

pnpm-workspaces monorepo — one git repo holding an Astro client and a NestJS
server side by side.

## Structure

```text
/
├── apps/
│   ├── client/   Astro front end   (dev :4321)
│   └── server/   NestJS API        (dev :3000)
├── packages/     shared libraries (none yet)
├── package.json      workspace root — scripts only, no app deps
├── pnpm-workspace.yaml
└── pnpm-lock.yaml    the single lockfile for the whole repo
```

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
| `pnpm build`                     | Build every app                         |
| `pnpm check`                     | Type-check every app                    |
| `pnpm --filter <app> <script>`   | Run a script in one app                 |
| `pnpm --filter <app> add <pkg>`  | Add a dependency to one app             |

`<app>` is `client` or `server`.

## Server

The API answers on `http://localhost:3000`, with a health probe:

```sh
curl http://localhost:3000/health   # {"status":"ok"}
```

Override the port with the `PORT` environment variable.

## Content (Sanity CMS)

The client's `/claves` section reads its posts from Sanity at **build time**.
The app only reads — it holds no write token and cannot modify content.

```sh
cp apps/client/.env.example apps/client/.env   # then fill in the project ID
```

Get the project ID from https://manage.sanity.io. The dataset is normally
`production` and must be **public** (Project → API → Datasets), or an
unauthenticated read returns nothing. These values are not secrets — they
appear in the public image CDN URLs — but `.env` stays untracked regardless.

### Schema contract

`/claves` queries document type `post` (set by `DOC_TYPE` in
`apps/client/src/data/posts.ts`) and reads these fields. Renaming a field in
the Studio without changing it here silently empties the section.

| Field         | Type               | Required | Used for                               |
| :------------ | :----------------- | :------- | :------------------------------------- |
| `title`       | `string`           | yes      | Card + page heading, `<title>`          |
| `slug`        | `slug`             | yes      | URL: `/claves/<slug>/`                  |
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

## Adding a shared package

Shared code goes in `packages/*` (already matched by `pnpm-workspace.yaml`) and
is consumed with `"workspace:*"`. Apps must never import each other by relative
path.
