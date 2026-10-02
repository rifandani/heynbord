# spa

React SPA.

## Language

### Internationalization

**Locale**: A lowercase BCP-47 language tag that selects which Message Catalog to use (`en-us`, `id-id`). _Avoid_: language, languageCode, lng, resolvedLanguage

**Message Catalog**: The set of Translation Keys and strings for one Locale, owned in `apps/spa/src/core/libs/i18n`. _Avoid_: resources, locale JSON, dictionary, i18n file

**Translation Key**: A flat identifier into a Message Catalog (e.g. `welcome`, `title`). _Avoid_: nested namespaces, i18next paths

**Translation Provider**: React glue that holds Locale state and exposes `t` / `setLocale`. _Avoid_: I18nextProvider, react-i18next

### Errors

**Error Envelope**: The `{ message }` body the API returns on a failed request. Present on most failures, absent on some — a caller may never assume it parsed. _Avoid_: error response, error body, error payload

### Component Catalog

**Component Catalog**: The single page at `/master-design` that displays every core UI component for visual inspection by developers and designers. Access is gated by the `componentCatalog` Feature Flag. _Avoid_: master design, styleguide, storybook, docs site

**Component Entry**: One component's place in the Component Catalog — its Category membership, its nav item, and its section of the page. _Avoid_: item, doc, page

**Variant Showcase**: One rendered example within a Component Entry, demonstrating a single combination of a component's props. _Avoid_: demo, example, story

**Category**: A named grouping of Component Entries (Buttons, Overlays, Charts, …) that determines both nav grouping and page order. _Avoid_: group, section, tag

### Feature Flags

**Feature Flag**: A named boolean that gates a product surface for local development. Defaults ON in development and OFF otherwise; a developer may override the default via the Feature Flags Devtools panel, and that override persists across reloads until reset. Production builds never honor an ON override for gated surfaces. _Avoid_: kill switch, remote config, experiment, A/B test
