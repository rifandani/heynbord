/**
 * The old entry point of the music. The Audio service in `@/core/audio` owns
 * the loop and the sting; this module keeps the import path that the Play
 * screen uses until the cleanup PR moves it.
 */
export { playMusicSting, playMusicTrack } from "@/core/audio/audio";
