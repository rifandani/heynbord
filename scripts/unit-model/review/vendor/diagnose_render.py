"""One function of `forge/stage4_review/diagnose_render.py`.

`interior_difference.py` imports only this function. The full file also needs
the image and spec pipeline of the skill, which the review does not use.
"""


def mask_is_inverted(warnings: list[str]) -> bool:
    """Return whether foreground extraction fell back to whole-frame coverage."""
    return any("tiny" in str(warning).lower() for warning in warnings)
