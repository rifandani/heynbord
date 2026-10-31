"""The ten Hero Model clips (decision 8), keyed in the axes of the figure.

A pose is a dict of bone -> [(axis, degrees), ...] in figure axes (see
`unit_model_kit.turn`), and "hips@loc" -> an offset in figure axes. Every key
is a complete pose: a bone that a pose leaves out returns to its rest.

Bone directions: a rotation about +X bends an upward bone (spine, neck)
forward and swings a downward bone (arm, leg) back. For a downward bone,
-X swings it forward. +Y swings a downward right limb outward and a left
limb inward; +Z turns to the figure's left.
"""
import unit_model_kit as kit

X, Y, Z = kit.X, kit.Y, kit.Z


def merge(*poses):
    result = {}
    for pose in poses:
        result.update(pose)
    return result


# The ready stance: weight a little on the right leg, the sword low and
# forward, the free hand open.
READY = {
    "hips": [(Y, -2), (Z, 4)],
    "spine": [(X, 2), (Z, -2)],
    "chest": [(X, -2), (Z, -3), (Y, 1)],
    "neck": [(X, 2)],
    "head": [(X, -2), (Z, 4), (Y, -2)],
    "shoulder.L": [],
    "shoulder.R": [],
    "upperarm.L": [(X, -6), (Y, -8)],
    "forearm.L": [(X, -18), (Z, 10)],
    "hand.L": [(Y, 8)],
    "upperarm.R": [(X, -14), (Y, 10)],
    "forearm.R": [(X, -28)],
    "hand.R": [(X, 12)],
    "thigh.L": [(Y, -4), (X, -3)],
    "shin.L": [(X, 5)],
    "foot.L": [(X, -2), (Z, 8)],
    "thigh.R": [(Y, 3)],
    "shin.R": [(X, 2)],
    "foot.R": [(Z, -6)],
    "banner": [(Z, 0)],
}


def over(base, **bones):
    """A copy of `base` with some bones replaced. Bone names use __ for '.'."""
    result = dict(base)
    for name, value in bones.items():
        result[name.replace("__", ".")] = value
    return result


def breath(base, amount, banner, sway=0.0):
    """A breath in or out, a small shift of weight and the banner moving in the wind."""
    return over(
        base,
        hips=base["hips"] + [(Y, sway), (Z, sway * .6)],
        spine=base["spine"] + [(Y, -sway * .5)],
        chest=base["chest"] + [(X, -amount), (Y, -sway * .4)],
        shoulder__L=[(Y, -amount * .6)],
        shoulder__R=[(Y, amount * .6)],
        head=base["head"] + [(X, amount * .5), (Z, sway * .8)],
        banner=[(Z, banner)],
    )


LOW = over(
    READY,
    **{"hips@loc": (0, .004, -.022)},
    hips=[(X, 6), (Y, -3)],
    spine=[(X, 12), (Z, -4)],
    chest=[(X, 10), (Z, -6)],
    neck=[(X, 2)],
    head=[(X, -10), (Z, 6), (Y, -4)],
    upperarm__L=[(X, -32), (Y, 24)],
    forearm__L=[(X, -78), (Z, 25)],
    hand__L=[(X, 10)],
    upperarm__R=[(X, -4), (Y, 8)],
    forearm__R=[(X, -14)],
    hand__R=[(X, 4)],
    thigh__L=[(Y, -5), (X, -16)],
    shin__L=[(X, 26)],
    foot__L=[(X, -10), (Z, 8)],
    thigh__R=[(Y, 4), (X, -10)],
    shin__R=[(X, 20)],
    foot__R=[(X, -10), (Z, -6)],
)


def clip_poses():
    """name -> (frames, loop, [(frame, pose), ...])."""
    lunge = {
        "hips@loc": (0, -.01, -.012),
        "thigh.L": [(X, -22), (Y, -4)],
        "shin.L": [(X, 22)],
        "foot.L": [(X, 0)],
        "thigh.R": [(X, 12), (Y, 4)],
        "shin.R": [(X, 10)],
        "foot.R": [(X, -18)],
    }
    clips = {
        "idle": (48, True, [
            (0, breath(READY, 0, 6, 0)),
            (12, breath(READY, 2.2, 0, 1.6)),
            (24, breath(READY, 3.2, -6, 0)),
            (36, breath(READY, 1.2, 0, -1.6)),
            (48, breath(READY, 0, 6, 0)),
        ]),
        "lowHp": (48, True, [
            (0, breath(LOW, 0, 3)),
            (14, breath(LOW, 5, 0)),
            (24, breath(LOW, 6, -3)),
            (36, breath(LOW, 1.5, 0)),
            (48, breath(LOW, 0, 3)),
        ]),
        "summon": (24, False, [
            (0, READY),
            (5, over(READY, chest=[(X, 4), (Z, -14)], head=[(X, 6), (Z, -6)],
                     upperarm__L=[(X, 18), (Y, 10)], forearm__L=[(X, -70)], hand__L=[(X, 20)])),
            (10, merge(over(READY, spine=[(X, -2), (Z, 6)], chest=[(X, -6), (Z, 14)], head=[(X, -8), (Z, 10)],
                            upperarm__L=[(X, -92), (Y, -6)], forearm__L=[(X, -8), (Z, 30)], hand__L=[(X, -40)],
                            upperarm__R=[(X, 4), (Y, 20)], forearm__R=[(X, -30)]), lunge, {"banner": [(Z, -10)]})),
            (15, merge(over(READY, spine=[(X, -2), (Z, 6)], chest=[(X, -4), (Z, 12)], head=[(X, -6), (Z, 8)],
                            upperarm__L=[(X, -86), (Y, -4)], forearm__L=[(X, -12), (Z, 30)], hand__L=[(X, -34)],
                            upperarm__R=[(X, 2), (Y, 18)], forearm__R=[(X, -30)]), lunge, {"banner": [(Z, 6)]})),
            (24, READY),
        ]),
        "castWarrior": (24, False, [
            (0, READY),
            (6, over(READY, **{"hips@loc": (0, .004, -.008)}, spine=[(X, -4), (Z, -6)], chest=[(X, -6), (Z, -12)], head=[(X, -4), (Z, 10)],
                     upperarm__R=[(X, -150), (Y, 30)], forearm__R=[(X, -30)], hand__R=[(X, 10)],
                     upperarm__L=[(X, -40), (Y, -10)], forearm__L=[(X, -50)], banner=[(Z, 8)])),
            (11, over(READY, **{"hips@loc": (0, -.004, -.018)}, spine=[(X, 8), (Z, 8)], chest=[(X, 6), (Z, 16)], head=[(X, -10), (Z, -12)],
                      upperarm__R=[(X, -50), (Y, -10)], forearm__R=[(X, -10)], hand__R=[(X, 30)],
                      upperarm__L=[(X, 10), (Y, -30)], forearm__L=[(X, -30)],
                      thigh__L=[(X, -14), (Y, -6)], shin__L=[(X, 22)], foot__L=[(X, -8)],
                      thigh__R=[(X, -10), (Y, 6)], shin__R=[(X, 18)], foot__R=[(X, -8)], banner=[(Z, -12)])),
            (16, over(READY, **{"hips@loc": (0, -.002, -.016)}, spine=[(X, 7), (Z, 7)], chest=[(X, 5), (Z, 14)], head=[(X, -10), (Z, -10)],
                      upperarm__R=[(X, -46), (Y, -8)], forearm__R=[(X, -12)], hand__R=[(X, 26)],
                      upperarm__L=[(X, 8), (Y, -28)], forearm__L=[(X, -32)],
                      thigh__L=[(X, -13), (Y, -6)], shin__L=[(X, 20)], foot__L=[(X, -7)],
                      thigh__R=[(X, -9), (Y, 6)], shin__R=[(X, 16)], foot__R=[(X, -7)], banner=[(Z, 6)])),
            (24, READY),
        ]),
        "castRanger": (24, False, [
            (0, READY),
            (6, over(READY, chest=[(X, -2), (Z, 6)], head=[(Z, 24)],
                     upperarm__L=[(X, -30), (Y, -60)], forearm__L=[(X, -30)],
                     upperarm__R=[(X, -40), (Y, 50)], forearm__R=[(X, -70)])),
            (12, over(READY, spine=[(Y, 3)], chest=[(X, -4), (Z, 8), (Y, 3)], neck=[(Z, 14)], head=[(Z, 40), (X, -4)],
                      upperarm__L=[(X, -14), (Y, -76)], forearm__L=[(X, -10)], hand__L=[(X, -20)],
                      upperarm__R=[(X, -10), (Y, 74)], forearm__R=[(X, -128)], hand__R=[(X, 50)],
                      thigh__L=[(Y, -9)], thigh__R=[(Y, 8)], banner=[(Z, -8)])),
            (16, over(READY, spine=[(Y, 3)], chest=[(X, -5), (Z, 6), (Y, 3)], neck=[(Z, 14)], head=[(Z, 38), (X, -4)],
                      upperarm__L=[(X, -14), (Y, -74)], forearm__L=[(X, -10)], hand__L=[(X, -30)],
                      upperarm__R=[(X, -4), (Y, 80)], forearm__R=[(X, -70)], hand__R=[(X, 40)],
                      thigh__L=[(Y, -9)], thigh__R=[(Y, 8)], banner=[(Z, 8)])),
            (24, READY),
        ]),
        "castMage": (24, False, [
            (0, READY),
            (7, over(READY, **{"hips@loc": (0, 0, -.01)}, spine=[(X, 6)], chest=[(X, 8)], head=[(X, 12)],
                     upperarm__L=[(X, -36), (Y, 22)], forearm__L=[(X, -76), (Z, 30)], hand__L=[(X, -20)],
                     upperarm__R=[(X, -30), (Y, -6)], forearm__R=[(X, -64)],
                     thigh__L=[(X, -12)], shin__L=[(X, 20)], thigh__R=[(X, -12)], shin__R=[(X, 20)])),
            (13, over(READY, **{"hips@loc": (0, 0, .004)}, spine=[(X, -6)], chest=[(X, -12)], head=[(X, -18)],
                      upperarm__L=[(X, -158), (Y, -14)], forearm__L=[(X, -8)], hand__L=[(X, -30)],
                      upperarm__R=[(X, -16), (Y, 34)], forearm__R=[(X, -24)], hand__R=[(X, 30)], banner=[(Z, 10)])),
            (17, over(READY, spine=[(X, -5)], chest=[(X, -10)], head=[(X, -14)],
                      upperarm__L=[(X, -150), (Y, -12)], forearm__L=[(X, -10)], hand__L=[(X, -26)],
                      upperarm__R=[(X, -14), (Y, 32)], forearm__R=[(X, -26)], hand__R=[(X, 30)], banner=[(Z, -6)])),
            (24, READY),
        ]),
        "castPriest": (24, False, [
            (0, READY),
            (7, over(READY, spine=[(X, 6)], chest=[(X, 6)], neck=[(X, 10)], head=[(X, 14)],
                     upperarm__L=[(X, -26), (Y, 30)], forearm__L=[(X, -112), (Z, 40)], hand__L=[(X, 10)],
                     upperarm__R=[(X, -20), (Y, -6)], forearm__R=[(X, -70)])),
            (14, over(READY, **{"hips@loc": (0, 0, .004)}, spine=[(X, -4)], chest=[(X, -10)], neck=[(X, -4)], head=[(X, -14)],
                      upperarm__L=[(X, -24), (Y, -100)], forearm__L=[(X, -18)], hand__L=[(X, -36)],
                      upperarm__R=[(X, -14), (Y, 56)], forearm__R=[(X, -20)], hand__R=[(X, 0)], banner=[(Z, 8)])),
            (18, over(READY, spine=[(X, -3)], chest=[(X, -9)], neck=[(X, -3)], head=[(X, -12)],
                      upperarm__L=[(X, -22), (Y, -96)], forearm__L=[(X, -20)], hand__L=[(X, -32)],
                      upperarm__R=[(X, -12), (Y, 54)], forearm__R=[(X, -22)], hand__R=[(X, 0)], banner=[(Z, -4)])),
            (24, READY),
        ]),
        "hurt": (18, False, [
            (0, READY),
            (3, over(READY, **{"hips@loc": (0, .014, -.006)}, hips=[(X, -4)], spine=[(X, -12), (Z, 6)], chest=[(X, -12), (Z, 8)],
                     neck=[(X, -8)], head=[(X, -18), (Z, -10), (Y, 6)],
                     upperarm__L=[(X, 12), (Y, -26)], forearm__L=[(X, -30)], hand__L=[(X, -20)],
                     upperarm__R=[(X, 16), (Y, 24)], forearm__R=[(X, -40)],
                     thigh__L=[(X, 8), (Y, -6)], shin__L=[(X, 12)], banner=[(Z, -14)])),
            (8, over(LOW, **{"hips@loc": (0, .004, -.016)}, spine=[(X, 14)], chest=[(X, 10)], head=[(X, 10), (Z, 4)],
                     banner=[(Z, 10)])),
            (18, READY),
        ]),
        "victory": (36, False, [
            (0, READY),
            (8, over(READY, **{"hips@loc": (0, 0, -.022)}, spine=[(X, 10)], chest=[(X, 10)], head=[(X, 10)],
                     upperarm__R=[(X, -30), (Y, 4)], forearm__R=[(X, -60)],
                     upperarm__L=[(X, -20), (Y, 10)], forearm__L=[(X, -70)],
                     thigh__L=[(X, -20), (Y, -5)], shin__L=[(X, 34)], foot__L=[(X, -14)],
                     thigh__R=[(X, -20), (Y, 4)], shin__R=[(X, 34)], foot__R=[(X, -14)])),
            (16, over(READY, **{"hips@loc": (0, 0, .006)}, spine=[(X, -6)], chest=[(X, -12), (Z, 6)], neck=[(X, -6)], head=[(X, -14), (Z, -6)],
                      upperarm__R=[(X, -176), (Y, 8)], forearm__R=[(X, -6)], hand__R=[(X, 96)],
                      upperarm__L=[(X, -40), (Y, -40)], forearm__L=[(X, -116), (Y, 10)],
                      banner=[(Z, -12)])),
            (22, over(READY, spine=[(X, -4)], chest=[(X, -10), (Z, 5)], neck=[(X, -5)], head=[(X, -12), (Z, -6)],
                      upperarm__R=[(X, -170), (Y, 8)], forearm__R=[(X, -10)], hand__R=[(X, 92)],
                      upperarm__L=[(X, -36), (Y, -36)], forearm__L=[(X, -110), (Y, 10)],
                      banner=[(Z, 8)])),
            (36, over(READY, spine=[(X, -4)], chest=[(X, -10), (Z, 5)], neck=[(X, -5)], head=[(X, -12), (Z, -6)],
                      upperarm__R=[(X, -170), (Y, 8)], forearm__R=[(X, -10)], hand__R=[(X, 92)],
                      upperarm__L=[(X, -36), (Y, -36)], forearm__L=[(X, -110), (Y, 10)],
                      banner=[(Z, -2)])),
        ]),
        "defeat": (36, False, [
            (0, READY),
            (6, over(READY, **{"hips@loc": (0, .016, -.01)}, spine=[(X, -10)], chest=[(X, -10)], head=[(X, -16)],
                     upperarm__L=[(X, 14), (Y, -24)], upperarm__R=[(X, 16), (Y, 24)], forearm__R=[(X, -30)],
                     banner=[(Z, -12)])),
            (16, over(LOW, **{"hips@loc": (0, .01, -.12)},
                      spine=[(X, 18)], chest=[(X, 12)], head=[(X, 16)],
                      thigh__L=[(X, -40), (Y, -4)], shin__L=[(X, 80)], foot__L=[(X, -30)],
                      thigh__R=[(X, -50), (Y, 6)], shin__R=[(X, 70)], foot__R=[(X, -14)],
                      upperarm__R=[(X, -24), (Y, 12)], forearm__R=[(X, -40)], banner=[(Z, 10)])),
            (24, DEFEAT),
            (36, DEFEAT),
        ]),
    }
    return clips


# Down on the left knee, the right foot planted, the sword point in the
# ground and the head bowed. It stays inside the Hero area.
DEFEAT = {
    "hips@loc": (0, .03, -.205),
    "hips": [(X, 4)],
    "spine": [(X, 16), (Z, -4)],
    "chest": [(X, 14), (Z, -6)],
    "neck": [(X, 12)],
    "head": [(X, 8), (Z, 8)],
    "shoulder.L": [(Y, 4)],
    "shoulder.R": [(Y, -4)],
    "upperarm.L": [(X, -46), (Y, 14)],
    "forearm.L": [(X, -30), (Z, 20)],
    "hand.L": [(X, 20)],
    "upperarm.R": [(X, -36), (Y, 10)],
    "forearm.R": [(X, -32)],
    "hand.R": [(X, 34)],
    "thigh.L": [(X, 10), (Y, -4)],
    "shin.L": [(X, 92)],
    "foot.L": [(X, 50)],
    "thigh.R": [(X, -84), (Y, 8)],
    "shin.R": [(X, 86)],
    "foot.R": [(X, -2)],
    "banner": [(Z, -4)],
}


def to_key(rig, pose):
    key = {}
    for name, value in pose.items():
        if name.endswith("@loc"):
            bone = name[:-4]
            key[name] = kit.shift(rig, bone, value)
        else:
            key[name] = kit.turn(rig, name, *value)
    return key


def bake(rig):
    actions = []
    for name, (frames, loop, keys) in clip_poses().items():
        clip = kit.Clip(name, frames, loop=loop)
        for frame, pose in keys:
            clip.key(frame, to_key(rig, pose))
        action = kit.bake_clip(rig, {}, clip)
        action["heynbord_hero"] = True
        action["heynbord_clip"] = name
        actions.append(action)
    return actions
