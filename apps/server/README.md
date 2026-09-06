# server

NestJS back end for `kat-hu`.

## Commands

Run from the **repo root**:

| Command                       | Action                              |
| :---------------------------- | :---------------------------------- |
| `pnpm --filter server dev`    | Dev server on `:3000`, watch mode   |
| `pnpm --filter server build`  | Compile TypeScript to `dist/`       |
| `pnpm --filter server start`  | Run the compiled build              |
| `pnpm --filter server check`  | Type-check without emitting         |

Add a dependency with `pnpm --filter server add <pkg>`.

## Layout

```text
src/
├── main.ts             bootstrap + listen
├── app.module.ts       root module
├── app.controller.ts   routes
└── app.service.ts      business logic
```

## Routes

| Method | Path      | Response          |
| :----- | :-------- | :---------------- |
| `GET`  | `/health` | `{"status":"ok"}` |

## Notes

- Listens on `PORT` (default `3000`), chosen so it does not collide with the
  client's `4321`.
- CORS is enabled in `main.ts` so the Astro client can call the API in dev.
- This package is CommonJS (`"type": "commonjs"`) — Nest's
  `emitDecoratorMetadata` depends on it. The client is ESM; that difference is
  intentional and per-app.
