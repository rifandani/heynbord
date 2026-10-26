import type { ComponentProps } from "react";

/**
 * The small UI marks of the game, drawn as SVG paths here instead of an icon
 * library. A library import brings its whole index into a shared chunk, and
 * with it tens of kilobytes into the first bundle (issue 139).
 */

type MarkProps = ComponentProps<"svg">;

const BaseMark = ({ children, ...props }: MarkProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    {children}
  </svg>
);

/** A close mark: an X. */
export const CloseIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </BaseMark>
);

/** A left arrow. */
export const ArrowLeftIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </BaseMark>
);

/** A search mark: a lens and its handle. */
export const SearchIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.5-4.5" />
  </BaseMark>
);

/** A chevron that points left. Turned, one that points right. */
export const ChevronLeftIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M15 6l-6 6 6 6" />
  </BaseMark>
);

/** A chevron that points right. */
export const ChevronRightIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M9 6l6 6-6 6" />
  </BaseMark>
);

/** A minus mark. */
export const MinusIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M5 12h14" />
  </BaseMark>
);

/** A plus mark. */
export const PlusIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M12 5v14M5 12h14" />
  </BaseMark>
);
