---
status: deprecated
---

# Local DEV Feature Flags via TanStack Devtools

Spa gated developer-only surfaces behind local Feature Flags. Flags defaulted ON in development and OFF otherwise. Overrides lived in the browser and were toggled from a TanStack Devtools panel. Production builds never mounted Devtools and never honored an ON override.

This decision is reversed. Spa has no client-side Feature Flags. The Component Catalog is available in development. A production build answers 404 for `/master-design`.
