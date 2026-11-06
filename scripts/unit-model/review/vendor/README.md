# Vendored Review Gates

These files are from the img2threejs skill. `SOURCE.json` gives the commit, the source path and the SHA-256 digest of each file. They use only the Python standard library. The license is in `LICENSE`.

Do not edit these files. `gates.test.ts` compares them with their digests. To change what a Review Gate does, change `unit_gates.py` or an adapter in `gates.ts`.

`diagnose_render.py` is not a full copy, so it has no digest. `interior_difference.py` imports only `mask_is_inverted` from that file, and the full file needs the image and spec pipeline of the skill.

To update, copy the files from a new release of the skill, then update `SOURCE.json`.
