# Effect

All logic in `spa` that is not rendering is an Effect v4 program. Shared app state and server data are Effect Atoms. [ADR-0007](../../../docs/adr/0007-effect-is-the-application-runtime.md) gives the reasons. Use the `effect` skill and the vendored source in `repos/effect` for API questions.

## Folder structure

```text
src/
├── routes/                       # TanStack file routes. Keep them thin.
├── core/                         # Shared infrastructure only
│   ├── components/ui/            # UI kit
│   ├── hooks/                    # UI-only DOM hooks
│   ├── config/                   # app-config.ts (Config recipe), env.ts (startup binding)
│   ├── http/                     # ApiError, Error Envelope, failOnErrorStatus
│   ├── observability/            # LoggerLayer, reportError
│   └── runtime/
│       ├── client.ts             # appRuntime, storageRuntime (Atom runtimes)
│       ├── server.server.ts      # server ManagedRuntime, runServerFn
│       ├── server-fn.ts          # makeServerFnContract (the wire format)
│       ├── server-request.ts     # ServerRequest service, request snapshot
│       └── atom-hydration.ts     # SSR dehydrate and hydrate of atoms
└── features/<feature>/
    ├── <name>.ts                 # Schemas and pure domain functions
    ├── <name>.service.ts         # Context.Service + static layer
    ├── <name>-<role>.ts          # Effects with a server dependency (e.g. locale-cookie.ts)
    ├── <name>.functions.ts       # createServerFn transports
    ├── <name>.atoms.ts           # Atoms
    ├── use-<name>.ts             # React hooks over atoms
    ├── components/
    └── *.unit.test.ts
```

Name services as classes: `class CdnClient extends Context.Service<CdnClient, {...}>()("@heynbord/spa/CdnClient")`, with `static readonly layer`.

## State

- Shared, persisted or server-derived state is an atom. Ephemeral state of one component stays in React `useState`.
- Effectful atoms come from `appRuntime` (`appRuntime.atom(...)`, `appRuntime.fn(...)`). Components do not call `Effect.runPromise`.
- `Atom.kvs` atoms use `storageRuntime`. Give them `Atom.withServerValue(...)`, because the server has no `localStorage`.
- `Atom.withServerValue` applies only when a component reads that atom itself. An atom that reads a browser-only atom needs its own server value.
- An app-state atom that a component seeds (for example `localeAtom`) is `Atom.keepAlive`.
- Mark an atom `Atom.serializable({ key, schema })` when SSR must send its value to the browser.

## Server functions

A server function is a thin transport around an Effect:

```ts
const localeContract = makeServerFnContract({ failure: Schema.Never, success: Locale });

const persistLocaleFn = createServerFn({ method: "POST" })
  .validator(Schema.toStandardSchemaV1(Schema.Struct({ locale: Locale })))
  .handler(({ data }) => runServerFn(localeContract, persistLocaleCookie(data.locale)));

export const persistLocale = (locale: Locale) =>
  localeContract.call(() => persistLocaleFn({ data: { locale } }));
```

- The contract encodes the `Exit` of the Effect as a JSON string. A typed failure on the server is the same tagged error in the browser. A defect becomes "Internal server error" in the browser; the server logs the full cause.
- A call that does not complete, or a response that does not decode, fails with `ServerFnError`.
- Read the request through `ServerRequest`, not through TanStack's `getCookie` / `setCookie`. Those read an AsyncLocalStorage, and an Effect fiber can run in the context of another request. `runServerFn` takes a snapshot of the request before the Effect starts and applies cookie writes after it ends.

## Errors

- Define errors with `Schema.TaggedError`. Fail with `return yield* new MyError({...})`.
- An HTTP response with a non-2xx status becomes `ApiError { status, envelope, text }`. The Error Envelope is an `Option`, because some failures do not have one.
- `toErrorMessage` in `@/core/utils/error` gives the text to show a person.

## Tests

- Test Effects with `it.effect` from `@effect/vitest`. Use `it.live` when the test needs real time or the real scheduler (for example an atom that runs an Effect).
- Test atoms with `AtomRegistry.make()`: `registry.get`, `registry.set`, `registry.mount`, and `AtomRegistry.getResult` for an `AsyncResult` atom.
- Give a service its dependencies with `Effect.provide(layer)` or `Effect.provideService(Tag, fake)`. MSW stays the network boundary for `FetchHttpClient` ([ADR-0002](../../../docs/adr/0002-network-boundary-mocking-with-msw.md)).
- `*.functions.ts`, `*.server.ts`, `core/config/env.ts` and `use-*.ts` hooks are framework seams. Coverage leaves them out; put their logic in a tested sibling.
