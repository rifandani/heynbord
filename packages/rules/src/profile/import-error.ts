import { Data } from "effect";
import type { Schema } from "effect";

/**
 * Why an import refused a file, one reason for each check (technical design
 * 5). The web app shows a message for each.
 */
export type ImportError = Data.TaggedEnum<{
  /** The file is not JSON, or it has no Profile and checksum. */
  UnreadableFile: Record<never, never>;
  /** The checksum is not the checksum of the Profile: the file is damaged or changed. */
  ChecksumMismatch: Record<never, never>;
  /** The Profile has no `schemaVersion` that this build knows. `null`: it has none. */
  UnknownVersion: { readonly version: Schema.Json };
  /** A newer build made the Profile. */
  NewerVersion: { readonly version: number; readonly current: number };
  /** The migration step from `version` failed. */
  MigrationFailed: { readonly version: number; readonly message: string };
  /** The Profile does not pass the Profile Schema, for example a negative Coin. */
  InvalidProfile: { readonly message: string };
}>;
export const ImportError = Data.taggedEnum<ImportError>();
