/**
 * The old entry point of the Battle sounds. The Audio service in
 * `@/core/audio` owns the context and the Mix; this module keeps the import
 * path that the screens use until the cleanup PR moves them.
 */
export type { SoundName } from "@/core/audio/audio-sounds";
export { playSound, unlockAudio } from "@/core/audio/audio";
