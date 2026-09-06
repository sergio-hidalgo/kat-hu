# client

Astro front end, from the `minimal` starter template.

## Structure

```text
apps/client/
├── public/            static assets, served from /
├── src/
│   └── pages/         each file here becomes a route
│       └── index.astro
├── astro.config.mjs
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in `src/pages/`. Each page is exposed
as a route based on its file name. Components conventionally go in
`src/components/`.

## Commands

Run from the repo root:

| Command                          | Action                                       |
| :------------------------------- | :------------------------------------------- |
| `pnpm --filter client dev`       | Dev server at `localhost:4321`               |
| `pnpm --filter client build`     | Build to `apps/client/dist/`                 |
| `pnpm --filter client preview`   | Preview the build locally                    |
| `pnpm --filter client astro ...` | Run the Astro CLI (`astro add`, `astro check`) |

Dependencies belong to this app, not the root: `pnpm --filter client add <pkg>`.

## Learn more

[Astro documentation](https://docs.astro.build) · [Discord](https://astro.build/chat)
