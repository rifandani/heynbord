# SEO (Search Engine Optimization)

Use the route `head()` with the helpers in `@/core/utils/seo`:

- `buildSeoHead` gives the title, description, Open Graph tags, Twitter tags, and one schema.org JSON-LD script.
- Use `buildSeoMeta` (meta tags only) for a page that must not have JSON-LD, for example a page with `noindex`.

## `sitemap.xml`

Everytime we add a new page, we need to update the `scripts/gen-sitemap` and regenerate the `sitemap.xml` by running:

```bash
bun sitemap:gen
```
