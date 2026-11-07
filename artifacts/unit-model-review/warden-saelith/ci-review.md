# Unit Model Review: the first CI runs

This record is the evidence of issue 184. Both runs were on 2026-11-06, on `ubuntu-latest`, from base commit `23d61dcc`. The pull requests were scratch work, and they were closed with no merge.

| Run | Pull request | Change | Result |
| --- | --- | --- | --- |
| [Green, 42227939300](https://github.com/rifandani/heynbord/actions/runs/42227939300) | [#196](https://github.com/rifandani/heynbord/pull/196) | One docstring of `warden-saelith.py` | Pass, 11 Review Gates clean |
| [Red, 42227945103](https://github.com/rifandani/heynbord/actions/runs/42227945103) | [#197](https://github.com/rifandani/heynbord/pull/197) | `horns` added to `parts` in the Unit Spec | Fail, exit code 1 from `part-coverage` |

## Green run

All 3 jobs passed. `unit-model:changed` found `warden-saelith` only. The review job took 1 minute 49 seconds.

`gates.json` has `passed: true`, `exitCode: 0` and no input problems. The nearest value to a limit is `interior-difference`: the head band of the front view is 0.2696, and the limit is 0.28.

## Red run

The defect is a part that the Unit Spec lists and the model does not have. The Unit Spec check, the pack check, the Source Contract check, the Turnaround check and the capture passed, so the defect got to the Review Gates.

- `Run the Review Gates` failed with exit code 1.
- `part-coverage` reported `component-missing` for `horns`, with 34 parts in the Unit Spec and 33 parts in the model.
- The other 10 Review Gates passed.
- `Upload the review record` ran after the failure.
- `Unit Model Review`, the job for the required check, failed.

## Artifact list

Each run uploaded one artifact, `unit-model-review-warden-saelith`. Its size is 14.7 MB, and GitHub keeps it for 14 days. The folder is `artifacts/unit-model-review/warden-saelith/2026-11-06/`:

- `manifest.json`, `review-gate.json` and `gates.json`
- 6 view PNG files: `front`, `right`, `back`, `left`, `battle` and `close-up`
- 9 clip frame PNG files: `idle`, `attack` and `death`, each at 0, 50 and 100
- 4 cutout PNG files: `front-cutout`, `right-cutout`, `back-cutout` and `left-cutout`

The artifact also has `apps/web/vite.log`. It does not have `gate-inputs/`.

Both runs read the same files: Raw Export SHA-256 `e5a0fcda…` and Published Model SHA-256 `29aac266…`.

## Limit of this evidence

A failed run blocks a merge only after `Unit Model Review` is a required status check of `main`.
