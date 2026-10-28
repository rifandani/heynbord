//! Ending: the crown falls, the bite, the Warchief, the payment, the deep tunnel.
use crate::fx::*;
use crate::mesa::*;
use crate::CLIP_FRAMES;
use fframes::{
    Duration, FFramesContext, Frame, Scene, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::{PI, TAU};

/// Grukka's cut-out: 520 x 560, with his eye and open mouth in its pixels.
const GRUKKA: (f32, f32) = (520., 560.);
const EYE: (f32, f32) = (330., 200.);
const MOUTH: (f32, f32) = (343., 226.);

// ---------------------------------------------------------------- 1. Crown

const HIT_AT: f32 = 0.85;
const BOUNCE_AT: f32 = 1.35;
const TIP_AT: f32 = 1.4;
const ROLL_AT: f32 = 1.85;
const REST_AT: f32 = 3.9;
const FLOOR: f32 = 420.;

/// The bucket crown turning on its own axis by `roll` (radians), upright at the
/// origin. Lying on its side, this is how it rolls.
fn spinning_crown<'a>(roll: f32, shine: f32) -> Svgr<'a> {
    let item = |k: u32, n: u32| roll + TAU * k as f32 / n as f32;
    let back = (0..7u32)
        .filter(|&k| item(k, 7).cos() < 0.)
        .map(|k| {
            let a = item(k, 7);
            let (x, y) = (100. * a.sin(), -60. - 14. * a.cos());
            let h = if k % 2 == 0 { 62. } else { 44. };
            fframes::svgr!(<path d={format!("M{:.1} {y:.1} L{x:.1} {:.1} L{:.1} {y:.1}Z", x - 11., y - h, x + 11.)} fill="#8a5a1c" stroke="#4a2a08" stroke-width="2" />)
        })
        .collect::<Vec<_>>();
    let front = (0..7u32)
        .filter(|&k| item(k, 7).cos() >= 0.)
        .map(|k| {
            let a = item(k, 7);
            let (x, y) = (100. * a.sin(), -60. - 14. * a.cos());
            let h = if k % 2 == 0 { 62. } else { 44. };
            let w = 12. * (0.4 + 0.6 * a.cos());
            fframes::svgr!(
                <g>
                    <path d={format!("M{:.1} {y:.1} L{x:.1} {:.1} L{:.1} {y:.1}Z", x - w, y - h, x + w)} fill="url(#g-crown)" stroke="#4a2a08" stroke-width="2" stroke-linejoin="round" />
                    <circle cx={x} cy={y - h - 5.} r="7" fill="url(#g-crown)" stroke="#4a2a08" stroke-width="1.5" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    let gems = [("#c8102e", 0.), ("#1f9a5a", 2.1), ("#2a6ad0", 4.2)]
        .iter()
        .filter_map(|&(fill, off)| {
            let a = roll + off;
            if a.cos() < 0.1 {
                return None;
            }
            let x = 88. * a.sin();
            let w = 11. * a.cos();
            Some(fframes::svgr!(<g><ellipse cx={x} cy="0" rx={w * 1.3} ry="14" fill={fill} stroke="#1a0606" stroke-width="2.5" /><ellipse cx={x - w * 0.3} cy="-5" rx={w * 0.35} ry="4" fill="#fff" opacity="0.6" /></g>))
        })
        .collect::<Vec<_>>();
    let bands = (0..6u32)
        .filter_map(|k| {
            let a = item(k, 6) + 0.3;
            if a.cos() < 0. {
                return None;
            }
            let x = 92. * a.sin();
            Some(fframes::svgr!(<path d={format!("M{:.1} -56 L{:.1} 66", x, x * 0.84)} stroke="#fff1c0" stroke-width={3. * a.cos()} opacity="0.35" />))
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            {back}
            <path d="M-100 -60 L100 -60 L82 70 L-82 70Z" fill="url(#g-crown-body)" stroke="#3a1e06" stroke-width="3" stroke-linejoin="round" />
            <ellipse cx="0" cy="-60" rx="100" ry="14" fill="#5a3410" stroke="#3a1e06" stroke-width="3" />
            <ellipse cx="0" cy="-60" rx="100" ry="14" fill="none" stroke="#ffe7a0" stroke-width="2" opacity="0.6" />
            <path d="M-95 -24 L95 -24 M-89 24 L89 24" stroke="#3a1e06" stroke-width="5" opacity="0.6" />
            <path d="M-95 -27 L95 -27 M-89 21 L89 21" stroke="#ffe7a0" stroke-width="1.6" opacity="0.5" />
            {bands}
            {gems}
            {front}
            {glint(-30., -30., 7., shine)}
        </g>
    )
}

#[derive(Debug)]
pub struct Crown {
    sh: Shaders,
    fall: Anim,
    hop: Anim,
    tip: Anim,
    path: Anim,
    roll: Anim,
    squash: Anim,
    clear: Anim,
}

impl Crown {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            fall: tw(0.2, HIT_AT, -260., FLOOR, Easing::EaseIn),
            hop: keys(&[(HIT_AT, (HIT_AT + BOUNCE_AT) / 2., 0., -90., Easing::EaseOut), ((HIT_AT + BOUNCE_AT) / 2., BOUNCE_AT, -90., 0., Easing::EaseIn)]),
            tip: KeyFramesAnimation::new(vec![
                KeyFrame { start: TIP_AT, end: Some(ROLL_AT), from: 6., to: -90., easing: &Easing::EaseIn },
                KeyFrame { start: ROLL_AT, end: None, from: -90., to: -82., easing: &BOUNCY },
            ]),
            path: tw(ROLL_AT, REST_AT, 0., 1., Easing::EaseOut),
            roll: tw(ROLL_AT, REST_AT, 0., 13., Easing::EaseOut),
            squash: KeyFramesAnimation::new(vec![
                KeyFrame { start: HIT_AT, end: Some(HIT_AT + 0.05), from: 1., to: 0.84, easing: &Easing::Linear },
                KeyFrame { start: HIT_AT + 0.05, end: None, from: 0.84, to: 1., easing: &BOUNCY },
            ]),
            clear: tw(0., 2.5, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Crown {
    fn name(&self) -> &'static str {
        "EndingCrown"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(field) = ctx.get_image("red-mesas.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let clear = frame.animate(&self.clear);
        let painting = painting(&self.sh, &frame, field, Grade { gold: 0.18 * clear, heat: 0.45, dusk: 0.5 * (1. - clear), dark: 0.25 * (1. - clear), ..Default::default() });
        // Fall, hit, hop, tip onto its side, roll along a curve and rock to rest.
        let k = frame.animate(&self.path);
        let start = (540., FLOOR);
        let along = (lerp(start.0, 800., k), FLOOR + 50. * (PI * k * 0.9).sin() * k);
        let (x, y, rot, roll) = if t < TIP_AT {
            let y = if t < HIT_AT { frame.animate(&self.fall) } else { FLOOR + frame.animate(&self.hop) };
            (start.0, y, lerp(-24., 6., after(t, 0.2, HIT_AT - 0.2)), 0.3 * t)
        } else {
            let rock = if t > REST_AT { 5. * (-(t - REST_AT) * 4.5).exp() * ((t - REST_AT) * 9.).sin() } else { 0. };
            let heading = -40. * k;
            (along.0, along.1, frame.animate(&self.tip) + heading + rock, frame.animate(&self.roll))
        };
        let squash = frame.animate(&self.squash);
        let lying = after(t, TIP_AT, ROLL_AT - TIP_AT);
        // The crown's pivot: its bottom while upright, its side once it lies down.
        let pivot_y = lerp(70., 82., lying);
        let shine = if t > REST_AT { (-(loop_phase(t - 1.) - 0.3).powi(2) * 60.).exp() } else { 0.2 };
        let crown = fframes::svgr!(
            <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({:.3} {squash:.3}) translate(0 {:.1}) scale(1.2)", 2. - squash, -pivot_y * 1.2)}>
                {spinning_crown(roll, shine)}
            </g>
        );
        let shadow_w = lerp(130., 180., lying) * if t < HIT_AT { 0.4 + 0.6 * after(t, 0.2, HIT_AT - 0.2) } else { 1. };
        let dust = fframes::svgr!(
            <g>
                {dust_burst(start.0, FLOOR, t - HIT_AT, 1.4, 22, 501, 420., "url(#g-dust)")}
                {shock_ring(start.0, FLOOR, t - HIT_AT, 0.8, 260., 50., "#ffe2b0")}
                {dust_burst(start.0, FLOOR, t - BOUNCE_AT, 1.0, 12, 511, 240., "url(#g-dust)")}
                {dust_burst(along.0, along.1, t - ROLL_AT, 1.0, 12, 521, 200., "url(#g-dust)")}
            </g>
        );
        // A trail of dust behind it while it rolls.
        let trail = (0..14u32)
            .filter_map(|j| {
                let born = ROLL_AT + j as f32 * 0.14;
                let dt = t - born;
                if !(0.0..1.2).contains(&dt) {
                    return None;
                }
                let kk = ease_out(((born - ROLL_AT) / (REST_AT - ROLL_AT)).clamp(0., 1.));
                let (px, py) = (lerp(start.0, 800., kk), FLOOR + 50. * (PI * kk * 0.9).sin() * kk + 10.);
                Some(fframes::svgr!(<circle cx={px} cy={py - 20. * dt} r={14. + 30. * dt} fill="url(#g-dust)" opacity={0.6 * (1. - dt / 1.2)} />))
            })
            .collect::<Vec<_>>();
        let motes = Motes { count: 50, seed: 531, area: (0., 0., 1280., 720.), rise: 240., period: LOOP, size: (1., 2.8), sway: 40., fill: "url(#g-dust)" };
        let (kx, ky) = shake(t, HIT_AT, 10.);
        fframes::svgr!(
            <g transform={format!("translate({kx:.1} {ky:.1})")}>
                <g transform="scale(0.8)">{painting}</g>
                {rays(&self.sh, &frame, (200., -160.), 0.45 * clear, 1.2, (1.0, 0.9, 0.66))}
                <ellipse cx={x} cy={y + 8.} rx={shadow_w} ry={shadow_w * 0.24} fill="#2a0a02" opacity="0.4" filter="url(#blur8)" />
                {trail}
                {crown}
                {dust}
                {motes.draw(t, 0.7)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Bite

const BITE_AT: f32 = 1.95;
const BITE_SCALE: f32 = 1.35;
const BITE_ORIGIN: (f32, f32) = (115., 30.);

#[derive(Debug)]
pub struct Bite {
    sh: Shaders,
    rise: Anim,
    push: Anim,
    anger: Anim,
    halves: Anim,
}

impl Bite {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            rise: tw(0.5, 1.45, 0., 1., Easing::EaseOut),
            push: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0., end: Some(BITE_AT), from: 1., to: 1.04, easing: &Easing::EaseInOut },
                KeyFrame { start: BITE_AT, end: Some(BITE_AT + 0.08), from: 1.04, to: 1.1, easing: &Easing::EaseOut },
                KeyFrame { start: BITE_AT + 0.08, end: None, from: 1.1, to: 1.07, easing: &HEAVY },
            ]),
            anger: tw(BITE_AT + 0.25, BITE_AT + 0.7, 0., 1., Easing::EaseOut),
            halves: tw(BITE_AT, BITE_AT + 1.2, 0., 1., Easing::EaseIn),
        }
    }
}

impl Scene for Bite {
    fn name(&self) -> &'static str {
        "EndingBite"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(grukka), Some(map)) = (ctx.get_image("grukka.png"), ctx.get_image("red-mesas-region.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let to_screen = |(x, y): (f32, f32)| (BITE_ORIGIN.0 + x * BITE_SCALE, BITE_ORIGIN.1 + y * BITE_SCALE);
        let mouth = to_screen(MOUTH);
        let eye = to_screen(EYE);
        let anger = frame.animate(&self.anger);
        let push = frame.animate(&self.push);
        let bg = painting(&self.sh, &frame, map, Grade { dusk: 1., heat: 0.6, dark: 0.15 + 0.25 * anger, ..Default::default() });
        // The coin flips up to his tusks and sits there for a moment.
        let rise = frame.animate(&self.rise);
        let wobble = if t > 1.45 && t < BITE_AT { 2. * ((t - 1.45) * 30.).sin() } else { 0. };
        let coin_layer = if t < BITE_AT && rise > 0. {
            let x = lerp(1000., mouth.0 + 6., rise);
            let y = lerp(780., mouth.1 + 4., rise) - 140. * (PI * rise).sin() + wobble;
            let ratio = if rise < 1. { 0.12 + 0.88 * (rise * TAU * 2.5).cos().abs() } else { 0.95 };
            fframes::svgr!(<g>{coin(x, y, 34., ratio, 0., false)}{glint(x + 10., y - 10., 9., if rise >= 1. { 0.9 } else { 0.4 })}</g>)
        } else {
            Svgr::empty()
        };
        // Crunch: two halves fall away, gold flakes spray and red stone shows.
        let halves = frame.animate(&self.halves);
        let broken = if t >= BITE_AT && t < BITE_AT + 1.3 {
            let dt = t - BITE_AT;
            let piece = |side: f32| {
                let x = mouth.0 + 6. + side * (14. + 170. * dt);
                let y = mouth.1 + 4. - 90. * dt + 520. * dt * dt;
                let rot = side * 360. * dt;
                let clip = if side < 0. { "url(#half-left)" } else { "url(#half-right)" };
                fframes::svgr!(
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1})")} opacity={1. - halves * 0.6}>
                        <g clip-path={clip}>
                            <circle r="34" fill="url(#g-coin)" />
                            <circle r="27" fill="#d8582a" />
                            <circle r="27" fill="url(#g-rock)" opacity="0.7" />
                            <path d="M-20 -8 L-6 -14 M4 10 L18 4 M-14 14 L-2 18" stroke="#ffb07a" stroke-width="2.4" opacity="0.8" />
                        </g>
                        <path d="M0 -34 L-7 -14 L6 -2 L-5 14 L3 34" stroke="#3a0a02" stroke-width="3.4" fill="none" />
                    </g>
                )
            };
            fframes::svgr!(<g>{piece(-1.)}{piece(1.)}</g>)
        } else {
            Svgr::empty()
        };
        let flakes = (0..44u32)
            .filter_map(|k| {
                let dt = t - BITE_AT;
                if !(0.0..1.6).contains(&dt) {
                    return None;
                }
                let a = lerp(-PI * 0.95, -PI * 0.05, rnd(k, 541));
                let v = lerp(160., 420., rnd(k, 542));
                let x = mouth.0 + a.cos() * v * dt;
                let y = mouth.1 + a.sin() * v * dt + 500. * dt * dt;
                let spin = (dt * 14. + k as f32).cos();
                Some(fframes::svgr!(<path d={format!("M{:.1} {y:.1} L{x:.1} {:.1} L{:.1} {y:.1}Z", x - 8. * spin, y - 7., x + 8. * spin)} fill={if k % 3 == 0 { "#fff2b0" } else { "#f2c04e" }} opacity={1. - dt / 1.6} />))
            })
            .collect::<Vec<_>>();
        // His eye flares red; a red rim light pulses behind him.
        let eye_glow = anger * (0.8 + 0.2 * wave(t, 4., 0.));
        let rim = anger * (0.55 + 0.15 * wave(t, 1., 0.));
        let impact = if (BITE_AT..BITE_AT + 0.35).contains(&t) {
            let k = (t - BITE_AT) / 0.35;
            let rays = (0..10)
                .map(|i| {
                    let a = TAU * i as f32 / 10. + 0.3;
                    let (r0, r1) = (20. + 50. * k, 60. + 130. * k);
                    fframes::svgr!(<path d={format!("M{:.1} {:.1} L{:.1} {:.1}", mouth.0 + a.cos() * r0, mouth.1 + a.sin() * r0, mouth.0 + a.cos() * r1, mouth.1 + a.sin() * r1)} stroke="#fff6d6" stroke-width={6. * (1. - k)} stroke-linecap="round" />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(<g opacity={1. - k}><circle cx={mouth.0} cy={mouth.1} r={30. + 90. * k} fill="url(#g-gold)" />{rays}<circle cx={mouth.0} cy={mouth.1} r={50. + 80. * k} fill="url(#g-dust)" /></g>)
        } else {
            Svgr::empty()
        };
        let (kx, ky) = shake(t, BITE_AT, 12.);
        let growl = shake(t, BITE_AT + 0.4, 5.);
        let embers = Motes { count: 46, seed: 551, area: (0., 100., 1280., 640.), rise: 420., period: LOOP, size: (1., 3.), sway: 26., fill: "url(#g-ember)" };
        let flakes_loop = Motes { count: 18, seed: 561, area: (300., -700., 600., 700.), rise: -760., period: LOOP, size: (1.2, 2.6), sway: 30., fill: "#f6d06a" };
        let (gw, gh) = (GRUKKA.0 * BITE_SCALE, GRUKKA.1 * BITE_SCALE);
        fframes::svgr!(
            <g transform={format!("translate({:.1} {:.1})", kx + growl.0, ky + growl.1)}>
                <defs>
                    <clipPath id="half-left"><rect x="-31" y="-31" width="31" height="62" /></clipPath>
                    <clipPath id="half-right"><rect x="0" y="-31" width="31" height="62" /></clipPath>
                </defs>
                <g transform={cam_transform((900., 500., 1.6), (0., 0.))} filter="url(#blur8u)">{bg}</g>
                <rect width="1280" height="720" fill="url(#g-sunset-mesa)" opacity="0.35" />
                <circle cx={eye.0} cy={eye.1 + 60.} r="520" fill="url(#g-red)" opacity={rim} />
                <g transform={format!("translate({:.1} {:.1}) scale({push:.4}) translate({:.1} {:.1})", mouth.0, mouth.1, -mouth.0, -mouth.1)}>
                    <image href={grukka.href()} x={BITE_ORIGIN.0} y={BITE_ORIGIN.1} width={gw} height={gh} filter="url(#aura)" opacity={0.6 * anger} />
                    <image href={grukka.href()} x={BITE_ORIGIN.0} y={BITE_ORIGIN.1} width={gw} height={gh} />
                    <circle cx={eye.0} cy={eye.1} r={34. * eye_glow + 0.1} fill="url(#g-red)" opacity={eye_glow} />
                    <circle cx={eye.0} cy={eye.1} r={6. * eye_glow + 0.1} fill="#ffe0c0" opacity={eye_glow} />
                    {coin_layer}
                    {broken}
                    {flakes}
                </g>
                {debris(mouth.0, mouth.1 + 10., t - BITE_AT, 1.5, 22, 571, 340., (-PI * 0.3, PI * 1.1), 12.)}
                {impact}
                {embers.draw(t, 0.3 + 0.6 * anger)}
                {flakes_loop.draw(t, 0.6 * anger)}
                <rect y="420" width="1280" height="300" fill="url(#g-bottom-shade)" />
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Warchief

const ROAR_AT: f32 = 0.35;
const CROWN_AT: f32 = 2.25;
const FRAME_AT: f32 = 3.0;
const CHIEF_SCALE: f32 = 1.18;
const CHIEF_ORIGIN: (f32, f32) = (250., 26.);

#[derive(Debug)]
pub struct Warchief {
    sh: Shaders,
    roar: Anim,
    banners: Vec<Anim>,
    crown: Anim,
    tilt: Anim,
    frame_draw: Anim,
    gems: Anim,
    sweep: Anim,
}

impl Warchief {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            roar: punch(ROAR_AT + 0.05, 1.05),
            banners: (0..4).map(|i| spring(0.7 + 0.15 * i as f32, 420., 0., SOFT)).collect(),
            crown: KeyFramesAnimation::new(vec![
                KeyFrame { start: CROWN_AT - 0.45, end: Some(CROWN_AT), from: -360., to: 0., easing: &Easing::EaseIn },
                KeyFrame { start: CROWN_AT, end: None, from: -26., to: 0., easing: &BOUNCY },
            ]),
            tilt: KeyFramesAnimation::new(vec![
                KeyFrame { start: CROWN_AT - 0.45, end: Some(CROWN_AT), from: -30., to: 4., easing: &Easing::EaseIn },
                KeyFrame { start: CROWN_AT, end: None, from: 4., to: 14., easing: &BOUNCY },
            ]),
            frame_draw: tw(FRAME_AT, FRAME_AT + 0.9, 0., 1., Easing::EaseInOut),
            gems: spring(FRAME_AT + 0.8, 0., 1., BOUNCY),
            sweep: tw(FRAME_AT + 1.0, FRAME_AT + 1.8, -300., 1500., Easing::EaseInOut),
        }
    }
}

impl Scene for Warchief {
    fn name(&self) -> &'static str {
        "EndingWarchief"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(grukka), Some(map)) = (ctx.get_image("grukka.png"), ctx.get_image("red-mesas-region.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let at = |(x, y): (f32, f32)| (CHIEF_ORIGIN.0 + x * CHIEF_SCALE, CHIEF_ORIGIN.1 + y * CHIEF_SCALE);
        let mouth = at(MOUTH);
        let bg = painting(&self.sh, &frame, map, Grade { dusk: 0.85, heat: 0.5, dark: 0.2, ..Default::default() });
        // The roar: rings of sound and a jolt.
        let rings = (0..5)
            .filter_map(|k| {
                let dt = t - ROAR_AT - k as f32 * 0.14;
                if !(0.0..1.0).contains(&dt) {
                    return None;
                }
                let r = 40. + 520. * ease_out(dt);
                Some(fframes::svgr!(<circle cx={mouth.0} cy={mouth.1} r={r} fill="none" stroke="#ffd2a0" stroke-width={10. * (1. - dt)} opacity={0.6 * (1. - dt) * (dt / 0.1).min(1.)} />))
            })
            .collect::<Vec<_>>();
        let roar = frame.animate(&self.roar);
        let (kx, ky) = shake(t, ROAR_AT, 14.);
        // Orc banners rise behind him.
        let marks = |k: usize| {
            fframes::svgr!(<g transform={format!("scale({})", if k % 2 == 0 { 1. } else { -1. })}><path d="M-14 -16 Q-22 6 -6 18 L-4 8 Q-10 0 -6 -12Z M14 -16 Q22 6 6 18 L4 8 Q10 0 6 -12Z" fill="#f6e2c0" /></g>)
        };
        let banners = [(70., 0.), (185., 0.3), (1000., 0.55), (1120., 0.8)]
            .iter()
            .enumerate()
            .map(|(i, &(x, phase))| {
                let rise = frame.animate(&self.banners[i]);
                fframes::svgr!(<g transform={format!("translate({x} {:.1}) scale(1.05)", 700. + rise)}>{banner(t, 470., "#a8201a", "#e0a040", marks(i), phase)}</g>)
            })
            .collect::<Vec<_>>();
        // The bucket crown drops onto his horned helmet and sits crooked.
        let helmet = at((322., 132.));
        let drop = frame.animate(&self.crown);
        let tilt = frame.animate(&self.tilt);
        let shine = if t > FRAME_AT { (-(loop_phase(t - 1.) - 0.5).powi(2) * 50.).exp() } else { 0.3 };
        let crown = if t > CROWN_AT - 0.45 {
            fframes::svgr!(<g transform={format!("translate({:.1} {:.1}) rotate({tilt:.1}) scale(0.6) translate(0 -70)", helmet.0, helmet.1 + drop)}>{bucket_crown(shine)}</g>)
        } else {
            Svgr::empty()
        };
        let clank = shake(t, CROWN_AT, 5.);
        // The Epic card frame draws itself around him.
        let draw = frame.animate(&self.frame_draw);
        let (fx, fy, fw, fh) = (300., 24., 680., 676.);
        let perimeter = 2. * (fw + fh);
        let gems = frame.animate(&self.gems).max(0.);
        let pulse = 0.75 + 0.25 * wave(t, 2., 0.);
        let corner_gems = [(fx, fy), (fx + fw, fy), (fx, fy + fh), (fx + fw, fy + fh)]
            .iter()
            .map(|&(x, y)| {
                fframes::svgr!(
                    <g transform={format!("translate({x} {y}) scale({gems:.3}) rotate(45)")}>
                        <rect x="-13" y="-13" width="26" height="26" fill="#c24aff" stroke="#ffe08a" stroke-width="3" />
                        <rect x="-5" y="-9" width="6" height="6" fill="#fff" opacity="0.7" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let sweep = frame.animate(&self.sweep);
        let card_frame = if draw > 0. {
            fframes::svgr!(
                <g>
                    <rect x={fx} y={fy} width={fw} height={fh} rx="26" fill="none" stroke="#ff9a3a" stroke-width="22" opacity={0.4 * draw * pulse} filter="url(#blur8)" />
                    <rect x={fx} y={fy} width={fw} height={fh} rx="26" fill="none" stroke="url(#g-epic)" stroke-width="7" stroke-dasharray={perimeter} stroke-dashoffset={perimeter * (1. - draw)} />
                    <rect x={fx + 12.} y={fy + 12.} width={fw - 24.} height={fh - 24.} rx="18" fill="none" stroke="#ffe08a" stroke-width="1.6" opacity={0.7 * draw} />
                    {corner_gems}
                    <g clip-path="url(#chief-frame)" opacity="0.5"><rect x={sweep} y="-40" width="120" height="820" fill="url(#g-sweep)" transform="skewX(-18)" /></g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let embers = Motes { count: 50, seed: 581, area: (0., 100., 1280., 640.), rise: 460., period: LOOP, size: (1., 3.), sway: 26., fill: "url(#g-ember)" };
        let (gw, gh) = (GRUKKA.0 * CHIEF_SCALE, GRUKKA.1 * CHIEF_SCALE);
        let breathe = 1. + 0.008 * wave(t, 1., 0.);
        fframes::svgr!(
            <g transform={format!("translate({:.1} {:.1})", kx + clank.0, ky + clank.1)}>
                <defs>
                    <clipPath id="chief-frame"><rect x={fx} y={fy} width={fw} height={fh} rx="26" /></clipPath>
                </defs>
                <g transform={cam_transform((1040., 600., 1.5), (0., 0.))} filter="url(#blur8u)">{bg}</g>
                <rect width="1280" height="720" fill="url(#g-sunset-mesa)" opacity="0.3" />
                {banners}
                <circle cx="640" cy="330" r="460" fill="url(#g-ember)" opacity={0.35 + 0.25 * draw * pulse} />
                {rings}
                <g transform={format!("translate(640 700) scale({:.4}) translate(-640 -700)", roar * breathe)}>
                    <image href={grukka.href()} x={CHIEF_ORIGIN.0} y={CHIEF_ORIGIN.1} width={gw} height={gh} filter="url(#aura)" opacity="0.45" />
                    <image href={grukka.href()} x={CHIEF_ORIGIN.0} y={CHIEF_ORIGIN.1} width={gw} height={gh} />
                    {crown}
                </g>
                {dust_burst(640., 700., t - ROAR_AT, 1.4, 22, 591, 600., "url(#g-dust)")}
                {card_frame}
                {embers.draw(t, 0.8)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Payment

const LID_AT: f32 = 0.55;
const LETTER_AT: f32 = 2.2;
const SEAL_AT: f32 = 3.25;
const CRATE: (f32, f32) = (790., 470.);
const LETTER: (f32, f32) = (390., 400.);

#[derive(Debug)]
pub struct Payment {
    sh: Shaders,
    light: Anim,
    caps: Anim,
    letter: Anim,
    seal: Anim,
    stamp: Anim,
}

impl Payment {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            light: tw(LID_AT, LID_AT + 0.9, 0., 1., Easing::EaseOut),
            caps: spring(LID_AT + 0.1, 40., 0., SOFT),
            letter: tw(LETTER_AT, LETTER_AT + 0.8, 0., 1., Easing::EaseOut),
            seal: tw(SEAL_AT, SEAL_AT + 0.7, 0., 1., Easing::EaseOut),
            stamp: punch(SEAL_AT, 1.3),
        }
    }
}

impl Scene for Payment {
    fn name(&self) -> &'static str {
        "EndingPayment"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("cave-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let light = frame.animate(&self.light);
        let breathe = 0.85 + 0.15 * wave(t, 2., 0.) + 0.05 * wave(t, 5., 0.4);
        let (cx, cy) = CRATE;
        // The lid jumps off and spins away.
        let lid = if t < LID_AT {
            let jitter = if t > 0.15 { 2. * (t * 60.).sin() } else { 0. };
            fframes::svgr!(<g transform={format!("translate({cx} {:.1}) rotate({jitter:.1})", cy - 112.)}>{lid_shape()}</g>)
        } else if t < LID_AT + 1.0 {
            let dt = t - LID_AT;
            let x = cx + 300. * dt;
            let y = cy - 112. - 520. * dt + 700. * dt * dt;
            fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1}) rotate({:.1})", 260. * dt)}>{lid_shape()}</g>)
        } else {
            Svgr::empty()
        };
        let rise = frame.animate(&self.caps);
        let caps = if t > LID_AT {
            let row = (0..8u32)
                .map(|k| {
                    let x = cx - 140. + k as f32 * 40. + lerp(-8., 8., rnd(k, 601));
                    let size = lerp(48., 78., rnd(k, 602));
                    let y = cy - 92. + rise + lerp(-4., 10., rnd(k, 603)) + if k % 2 == 0 { 0. } else { -16. };
                    fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")}>{glowcap(size, breathe * light, k)}</g>)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(<g>{row}</g>)
        } else {
            Svgr::empty()
        };
        // The letter slides out from under the crate; its seal stamps and glows.
        let slide = frame.animate(&self.letter);
        let (lx, ly) = (lerp(cx - 40., LETTER.0, slide), lerp(cy + 70., LETTER.1, slide));
        let lrot = lerp(0., -7., slide);
        let seal = frame.animate(&self.seal);
        let stamp = frame.animate(&self.stamp);
        let pulse = 0.8 + 0.2 * wave(t, 1., 0.25);
        let ink = (0..6)
            .map(|k| {
                let y = -62. + k as f32 * 22.;
                let w = if k == 5 { 120. } else { lerp(170., 230., rnd(k, 611)) };
                let d = (0..12).map(|j| { let x = -115. + j as f32 * w / 11.; (x, y + 4. * ((j as f32 * 1.7 + k as f32).sin())) }).collect::<Vec<_>>();
                fframes::svgr!(<path d={path(&d, false)} stroke="#3a2210" stroke-width="2.4" fill="none" opacity="0.75" />)
            })
            .collect::<Vec<_>>();
        let letter = if t > LETTER_AT {
            fframes::svgr!(
                <g transform={format!("translate({lx:.1} {ly:.1}) rotate({lrot:.1})")}>
                    <rect x="-138" y="-96" width="290" height="200" rx="4" fill="#000" opacity="0.45" transform="translate(8 10)" />
                    <rect x="-140" y="-100" width="290" height="200" rx="4" fill="url(#g-parchment)" stroke="#8a6a3a" stroke-width="2" />
                    {ink}
                    <g transform={format!("translate(96 58) scale({:.3})", if seal > 0. { 1.25 * stamp } else { 0.01 })} opacity={if seal > 0. { 1. } else { 0. }}>
                        <circle r="64" fill="url(#g-violet)" opacity={0.6 * seal * pulse} />
                        <path d="M-38 -6 C-42 -30 -18 -44 4 -40 C30 -38 44 -16 38 8 C34 32 10 44 -14 38 C-36 32 -44 14 -38 -6Z" fill="url(#g-wax-seal)" stroke="#2a0412" stroke-width="2" />
                        <circle r="26" fill="none" stroke="#e4c8ff" stroke-width="1.6" opacity={0.5 + 0.5 * seal} />
                        <path d={seal_lanes(24., true)} stroke="#f6eaff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity={0.4 + 0.6 * seal} />
                        <path d={seal_lanes(24., true)} stroke="#b46aff" stroke-width="7" stroke-linecap="round" fill="none" opacity={0.5 * seal * pulse} filter="url(#blur3)" />
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let seal_screen = (LETTER.0 + 96. * (-7f32).to_radians().cos() - 58. * (-7f32).to_radians().sin(), LETTER.1 + 96. * (-7f32).to_radians().sin() + 58. * (-7f32).to_radians().cos());
        let smoke = (0..10u32)
            .map(|k| {
                let u = (t / LOOP + k as f32 / 10.).rem_euclid(1.);
                let x = seal_screen.0 + lerp(-20., 20., rnd(k, 621)) + 30. * (TAU * (u + rnd(k, 622))).sin();
                let y = seal_screen.1 - 20. - 200. * u;
                fframes::svgr!(<circle cx={x} cy={y} r={10. + 30. * u} fill="url(#g-violet)" opacity={0.35 * seal * (PI * u).sin()} />)
            })
            .collect::<Vec<_>>();
        let spores = Motes { count: 56, seed: 631, area: (cx - 260., 0., 520., 520.), rise: 420., period: LOOP, size: (1., 3.), sway: 24., fill: "url(#g-cyan)" };
        let planks = (0..4)
            .map(|k| {
                let y = cy - 92. + k as f32 * 46.;
                fframes::svgr!(<rect x={cx - 170.} y={y} width="340" height="42" rx="3" fill="url(#g-wood)" stroke="#1e1008" stroke-width="2" />)
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g transform={format!("translate(0 {:.1})", shake(t, SEAL_AT, 4.).1)}>
                <rect width="1280" height="720" fill="#070403" />
                <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.4" />
                <circle cx={cx} cy={cy - 140.} r={700. * light + 1.} fill="url(#g-cyan)" opacity={0.55 * light * breathe} />
                {rays(&self.sh, &frame, (cx, cy - 110.), 0.5 * light * breathe, 0.75, (0.45, 1.0, 0.92))}
                <ellipse cx={cx} cy={cy + 100.} rx="230" ry="26" fill="#000" opacity="0.6" />
                <path d={format!("M{} {} L{} {} L{} {} L{} {}Z", cx - 170., cy - 96., cx + 170., cy - 96., cx + 150., cy - 116., cx - 150., cy - 116.)} fill="#1a0e06" />
                {caps}
                {planks}
                <path d={format!("M{} {} L{} {} M{} {} L{} {}", cx - 160., cy - 90., cx - 160., cy + 92., cx + 160., cy - 90., cx + 160., cy + 92.)} stroke="url(#g-iron)" stroke-width="12" />
                {lid}
                {smoke}
                {letter}
                {spores.draw(t, light)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}

fn lid_shape<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <rect x="-176" y="-14" width="352" height="28" rx="4" fill="url(#g-wood)" stroke="#1e1008" stroke-width="2.5" />
            <path d="M-150 -14 L-150 14 M150 -14 L150 14" stroke="url(#g-iron)" stroke-width="10" />
        </g>
    )
}

// ---------------------------------------------------------------- 5. Tunnel

const STOP_AT: f32 = 3.2;
const IRIS: (f32, f32) = (640., 300.);

#[derive(Debug)]
pub struct Tunnel {
    sh: Shaders,
    travel: Anim,
    far: Anim,
    iris: Anim,
    ghost: Anim,
}

impl Tunnel {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            travel: KeyFramesAnimation::new(vec![
                KeyFrame { start: 0., end: Some(2.2), from: 0., to: 4.6, easing: &Easing::EaseIn },
                KeyFrame { start: 2.2, end: Some(STOP_AT), from: 4.6, to: 7.2, easing: &Easing::EaseOut },
            ]),
            far: tw(0.4, STOP_AT, 0.2, 1., Easing::EaseIn),
            iris: tw(STOP_AT - 0.2, STOP_AT + 0.8, 0., 1., Easing::EaseOut),
            ghost: tw(STOP_AT + 0.6, STOP_AT + 1.6, 0., 0.9, Easing::EaseInOut),
        }
    }
}

impl Scene for Tunnel {
    fn name(&self) -> &'static str {
        "EndingTunnel"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(hollows) = ctx.get_image("glowcap-hollows-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let travel = frame.animate(&self.travel);
        let far = frame.animate(&self.far);
        let iris = frame.animate(&self.iris);
        let breathe = 0.85 + 0.15 * wave(t, 2., 0.);
        let speed = if t < STOP_AT { (travel - 0.) / (t + 0.01) } else { 0. };
        let rumble = if t < STOP_AT { (2. * (t * 41.).sin() * speed.min(4.) * 0.4, 2. * (t * 37.).cos() * speed.min(4.) * 0.4) } else { (0., 0.) };
        let r = 260. * iris;
        let glimpse = if iris > 0. {
            let p = painting(&self.sh, &frame, hollows, Grade { gold: 0.15, ..Default::default() });
            fframes::svgr!(
                <g>
                    <defs>
                        <clipPath id="iris"><circle cx={IRIS.0} cy={IRIS.1} r={r.max(0.1)} /></clipPath>
                    </defs>
                    <circle cx={IRIS.0} cy={IRIS.1} r={r + 60.} fill="url(#g-cyan)" opacity={0.8 * breathe} />
                    <g clip-path="url(#iris)">
                        <g transform={format!("translate({} {}) scale({:.3}) translate(-800 -450)", IRIS.0, IRIS.1, 0.66 + 0.06 * iris)}>{p}</g>
                        <circle cx={IRIS.0} cy={IRIS.1} r={r.max(0.1)} fill="url(#g-cyan)" opacity={0.25 * (1. - iris) + 0.08} />
                    </g>
                    <circle cx={IRIS.0} cy={IRIS.1} r={r.max(0.1)} fill="none" stroke="#e8fffb" stroke-width="3" opacity={0.6 * iris} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let streaks = if t < STOP_AT {
            (0..30u32)
                .map(|k| {
                    let a = TAU * rnd(k, 641);
                    let u = (t * 1.6 + rnd(k, 642)).rem_euclid(1.);
                    let (r0, r1) = (80. + 700. * u, 80. + 700. * (u + 0.08 * speed.min(4.) / 4.).min(1.2));
                    fframes::svgr!(<path d={format!("M{:.1} {:.1} L{:.1} {:.1}", IRIS.0 + a.cos() * r0, IRIS.1 + a.sin() * r0, IRIS.0 + a.cos() * r1, IRIS.1 + a.sin() * r1)} stroke="#c8fff4" stroke-width="1.6" opacity={0.5 * u * far} />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let spores = Motes { count: 70, seed: 651, area: (140., 0., 1000., 760.), rise: 360., period: LOOP, size: (1., 3.2), sway: 30., fill: "url(#g-cyan)" };
        let ghost = frame.animate(&self.ghost) * (0.8 + 0.2 * wave(t, 1., 0.));
        fframes::svgr!(
            <g transform={format!("translate({:.1} {:.1})", rumble.0, rumble.1)}>
                {tunnel_view(t, IRIS, travel, far * (1. - 0.3 * iris), 0.85 * (1. - 0.4 * iris))}
                {glimpse}
                <circle cx={IRIS.0} cy={IRIS.1 - 30.} r="150" fill="#14061e" opacity={0.45 * ghost} filter="url(#blur18)" />
                {cut_seal(IRIS.0, IRIS.1 - 30., 96., ghost)}
                {streaks}
                {spores.draw(t, far)}
                <rect width="1280" height="720" fill="#e8fffb" opacity={0.25 * (1. - (iris - 0.2).abs() * 5.).max(0.) * if iris > 0. { 1. } else { 0. }} />
            </g>
        )
    }
}
