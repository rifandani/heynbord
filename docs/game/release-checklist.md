# Game release checks

- [ ] Run the required lint, type and unit checks.
- [ ] Run `bun check:battle-budget`. All declared Stage/Deck fixtures, including the Hero-enabled fixture, must pass from one production build. Keep its JSON record with the release evidence.
- [ ] Check that changed Unit Models pass `bun unit-model:pack <name>` and that every Unit Model of the Battle loads before the Board shows. A failed load must show the retry, not a Cut-out Figure.
- [ ] Check the Battle on supported phone and desktop browsers. Keep the existing frame-rate and fewer-than-150 draw-call requirements.
- [ ] For audio changes, check playback, stereo, full duration and the loop boundary. Keep the supported codecs.
- [ ] If Hero Models are enabled, set `VITE_HERO_MODELS=1` in the release build and check the separate 10,000,000-byte appearance ceiling and the Hero release checks in [Hero Models](./hero-models.md).
