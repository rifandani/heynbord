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

/** A desktop screen: the Auto color mode. */
export const DesktopIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </BaseMark>
);

/** A sun: the Light color mode. */
export const SunIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </BaseMark>
);

/** A moon: the Dark color mode. */
export const MoonIcon = (props: MarkProps) => (
  <BaseMark {...props}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </BaseMark>
);
