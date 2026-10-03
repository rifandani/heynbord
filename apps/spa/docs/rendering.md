# Rendering

The app runs on [TanStack Start](https://tanstack.com/start). The server renders and streams the full HTML document for each request. Then React hydrates it.

## Rules

- Do not make a module-level router, `QueryClient`, or other per-user store. `getRouter()` in `src/router.tsx` makes new ones for each request. Get them with `useRouter()`, `useQueryClient()`, or the route `context`.
- Set `ssr` on each route:

  | Mode | Use it when |
  | --- | --- |
  | `true` | The page is public and must have content in the HTML. |
  | `"data-only"` | The server can load the data, but the component needs the browser (for example, WebGL). |
  | `false` | `beforeLoad` or `loader` reads browser-only state, for example `localStorage`. |

- Put server-only code in `*.server.ts`. Export server functions from `*.functions.ts`, and give each one a zod `.validator()`. The build fails if client code imports a `*.server.ts` file. See `src/core/providers/i18n/locale.*.ts`.
- Validate search params with a zod schema in `validateSearch`. See `src/routes/master-design.tsx`.
- In a loader, use `await` only for data that the first paint must have. Return other promises without `await`, so they stream.
- Use the route `head()` for meta tags. See [SEO](seo.md).
- Keep the CSRF middleware in `src/start.ts` if you add more request middleware.

## Offline (PWA)

Pages are network-first. The service worker keeps each page that the user opens. Offline, a page that the user did not open shows `public/offline.html`. A route that calls a server function in its `loader` does not work offline.

## Deployment

Nitro builds the server. It finds Vercel with no configuration. For a different runtime, set `NITRO_PRESET` (for example `bun` or `netlify`) for the build. For Node.js, use `bun run build`, then `bun run start`.

Response headers are Nitro `routeRules` in `vite.config.ts`.
