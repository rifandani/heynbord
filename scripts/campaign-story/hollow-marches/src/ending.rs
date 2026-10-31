//! Ending: the thaw, loud, tower stone, Bone Rampart, Heynspire.
use crate::boss::{court, hall, hall_t};
use crate::cutouts::*;
use crate::fx::*;
use crate::marsh::*;
use crate::mesa::{after, cut_seal, dust_burst, ease_out, flash};
use crate::opening::beast_line;
use crate::wood::{bone_coin, purse};
use crate::CLIP_FRAMES;
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const MAP: &str = "hollow-marches-region.png";

/// Water drops that fall past the camera, once per LOOP.
fn drops<'a>(t: f32, alpha: f32, seed: u32) -> Svgr<'a> {
    let d = (0..18u32)
        .map(|k| {
            let u = (t / LOOP * if k % 2 == 0 { 2. } else { 1. } + rnd(k, seed)).rem_euclid(1.);
            let x = lerp(20., 1260., rnd(k, seed + 1));
            let y = lerp(-60., 780., u);
            let l = lerp(10., 26., rnd(k, seed + 2));
            fframes::svgr!(<path d={format!("M{x:.1} {:.1} L{x:.1} {y:.1}", y - l)} stroke="#e8f6ff" stroke-width="2.2" stroke-linecap="round" opacity={alpha * 0.6 * (PI * u).sin()} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{d}</g>)
}

// ---------------------------------------------------------------- 1. Thaw

const MELT_AT: f32 = 0.8;
const MELT_END: f32 = 2.8;
const THROUGH_AT: f32 = 2.3;
const THROUGH_END: f32 = 4.2;
const OUT_CAM: (f32, f32, f32) = (1185., 605., 2.1);

#[derive(Debug)]
pub struct Thaw {
    sh: Shaders,
    ms: MarshShaders,
    melt: Anim,
    through: Anim,
}

impl Thaw {
    pub fn new(sh: Shaders, ms: MarshShaders) -> Self {
        Self { sh, ms, melt: tw(MELT_AT, MELT_END, 0., 1., Easing::EaseInOut), through: tw(THROUGH_AT, THROUGH_END, 0., 1., Easing::EaseIn) }
    }
}

impl Scene for Thaw {
    fn name(&self) -> &'static str {
        "EndingThaw"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image(MAP) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let melt = frame.animate(&self.melt);
        let through = frame.animate(&self.through);
        // Outside: the marsh in dawn gold; the beasts walk home into the Ice Cave.
        let z = 1. + 0.12 * ease_out(through);
        let fog = Fog { density: 0.4, soft: 0.32, light: Color::hex("#fff2e0"), shade: Color::hex("#c8a890"), dir: (0.5, -0.12), scale: 1.4, seed: 29.0 };
        let outside = fframes::svgr!(
            <g transform={format!("translate(640 360) scale({z:.4}) translate(-640 -360)")}>
                <g transform={cam_transform(OUT_CAM, (0., 0.))}>
                    {painting(&self.sh, &frame, map, Grade { gold: 0.55, dusk: 0.0, ..Default::default() })}
                </g>
                <rect width="1280" height="720" fill="#ffb860" opacity="0.1" />
                {beast_line(ctx, OUT_CAM, t, 0., true, "url(#hm-dawn)")}
                {fog.draw(&self.sh, &frame, 0.42 + 0.06 * wave(t, 1., 0.2), (-40., 430., 1360., 330.))}
            </g>
        );
        // The window: frost ferns melt from the edges inward; the Queen's reflection.
        let glass = if through < 0.999 {
            let s = 1. + 3.2 * through * through;
            let ice = Ice { frost: 0.72, crack: 0.12, melt, scale: 1.1, offset: (0., 0.), tint: (0.78, 0.9, 1.0) };
            let reflection = fframes::svgr!(
                <g transform="translate(860 250) scale(-0.78 0.78)" opacity={0.22 * (1. - melt * 0.5)}>
                    {queen(&Queen::throne(t), t)}
                </g>
            );
            let runs = (0..12u32)
                .map(|k| {
                    let x = lerp(80., 1200., rnd(k, 51));
                    let start = MELT_AT + 1.6 * rnd(k, 52);
                    let u = ((t - start) / 1.6).clamp(0., 1.);
                    if u <= 0. {
                        return Svgr::empty();
                    }
                    let y0 = lerp(80., 300., rnd(k, 53));
                    let y1 = y0 + 420. * u;
                    fframes::svgr!(
                        <g>
                            <path d={format!("M{x:.1} {y0:.1} L{:.1} {y1:.1}", x + 4. * (y1 * 0.02).sin())} stroke="#e8f6ff" stroke-width="2" opacity="0.45" />
                            <circle cx={x} cy={y1} r="4" fill="#f4fbff" opacity="0.8" />
                        </g>
                    )
                })
                .collect::<Vec<_>>();
            let fade = 1. - smoothstep(0.55, 1., through);
            fframes::svgr!(
                <g transform={format!("translate(640 360) scale({s:.4}) translate(-640 -360)")} opacity={fade}>
                    {reflection}
                    <g opacity="0.88">{self.ice_or_empty(&frame, &ice, t)}</g>
                    {runs}
                    <path d="M640 -40 L640 760 M-40 250 L1320 250 M-40 520 L1320 520" stroke="#140e1c" stroke-width="16" />
                    <path d="M640 -40 L640 760 M-40 250 L1320 250 M-40 520 L1320 520" stroke="#efe4cc" stroke-width="3" opacity="0.5" />
                    <rect x="-40" y="-40" width="1360" height="800" fill="none" stroke="#120c18" stroke-width="80" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let motes = Motes { count: 40, seed: 4101, area: (0., 60., 1280., 700.), rise: 160., period: LOOP, size: (1., 2.6), sway: 30., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                {outside}
                {rays(&self.sh, &frame, (-160., -140.), 0.35 + 0.45 * melt, 1.2, DAWN)}
                {glass}
                {drops(t, after(t, THROUGH_END - 0.6, 0.8), 4111)}
                {motes.draw(t, 0.6 * after(t, 2.0, 1.5))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
            </g>
        )
    }
}

impl Thaw {
    fn ice_or_empty<'a>(&self, frame: &Frame, ice: &Ice, t: f32) -> Svgr<'a> {
        ice.draw(&self.ms, frame, loop_phase(t), 1., (0., 0., 1280., 720.))
    }
}

// ---------------------------------------------------------------- 2. Loud

const BOW_AT: f32 = 0.7;
const WAVE_AT: f32 = 3.4;

#[derive(Debug)]
pub struct Loud {
    sh: Shaders,
    ms: MarshShaders,
    truck: Anim,
}

impl Loud {
    pub fn new(sh: Shaders, ms: MarshShaders) -> Self {
        Self { sh, ms, truck: tw(0.4, 4.6, 520., 0., Easing::EaseInOut) }
    }
}

impl Scene for Loud {
    fn name(&self) -> &'static str {
        "EndingLoud"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let dx = frame.animate(&self.truck) + 6. * wave(t, 1., 0.);
        let s = 1.3;
        let back = hall(&self.sh, &self.ms, &frame, ctx, t, s, dx, 0.2 + 0.05 * wave(t, 1., 0.3), 1.);
        let bow: [f32; 4] = std::array::from_fn(|i| ease_out(after(t, BOW_AT + 0.45 * i as f32, 0.7)));
        let court_layer = fframes::svgr!(<g transform="translate(640 560) scale(0.86) translate(-640 -560)">{court(ctx, t, 560., &[0.; 4], &bow, "url(#hm-dawn)")}</g>);
        // The Queen raises one hand in a small, dry wave.
        let up = ease_out(after(t, WAVE_AT, 0.5));
        let mut p = Queen::throne(t);
        p.glow = 1. + 0.1 * wave(t, 1., 0.2);
        p.smile = 0.25 * up;
        p.tilt = -5. * up;
        p.arms[1] = Arm {
            elbow: (lerp(96., 104., up), lerp(214., 180., up)),
            wrist: (lerp(152., 120., up), lerp(232., 70., up)),
            hand: lerp(20., -80., up) + 10. * wave(t, 2., 0.) * up,
            curl: lerp(0.4, 0.15, up),
        };
        let queen_g = fframes::svgr!(
            <g transform="translate(640 262) scale(0.5)">
                <ellipse cx="0" cy="430" rx="260" ry="40" fill="#08040e" opacity="0.5" filter="url(#blur8)" />
                {throne()}
                {queen(&p, t)}
            </g>
        );
        // The mist falls away from the feet of the court.
        let mist = (0..4)
            .map(|i| {
                let x = [210., 430., 850., 1080.][i];
                let k = after(t, BOW_AT + 0.45 * i as f32, 1.2);
                let hold = 0.25 + 0.06 * wave(t, 1., i as f32 * 0.3);
                puff(x, 560. + 30. * k, 120. + 90. * k, 26. + 10. * k, lerp(0.6, hold, k), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let motes = Motes { count: 40, seed: 4201, area: (0., 60., 1280., 640.), rise: 140., period: LOOP, size: (0.8, 2.2), sway: 24., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                {back}
                <g transform={hall_t(s, dx)}>
                    {queen_g}
                    {court_layer}
                    {mist}
                </g>
                {motes.draw(t, 0.6)}
                <rect width="1280" height="720" fill="url(#hm-hall-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Stone

const SPILL_AT: f32 = 0.4;
const STONE_AT: f32 = 1.15;
const LIFT_AT: f32 = 2.2;
const TILT_AT: f32 = 2.3;
const SEAL_AT: f32 = 1.8;
/// The Queen's mask in world space; the floor is below, at y 650.
const MASK: (f32, f32) = (1010., -150.);
const QS: f32 = 1.55;
const PURSE_HAND: (f32, f32) = (640., 170.);
const STONE_HAND: (f32, f32) = (820., -170.);

#[derive(Debug)]
pub struct Stone {
    tilt: Anim,
    lift: Anim,
}

impl Stone {
    pub fn new(_sh: Shaders, _ms: MarshShaders) -> Self {
        Self { tilt: tw(TILT_AT, 4.6, 0., 400., Easing::EaseInOut), lift: tw(LIFT_AT, 3.9, 0., 1., Easing::EaseInOut) }
    }
}

impl Scene for Stone {
    fn name(&self) -> &'static str {
        "EndingStone"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let off = frame.animate(&self.tilt) + 3. * wave(t, 1., 0.);
        let mouth = (PURSE_HAND.0 - 6., PURSE_HAND.1 + 170.);
        // Coins of bone pour out of the purse and frost over on the floor.
        let coins = (0..9u32)
            .map(|k| {
                let at = SPILL_AT + 0.09 * k as f32;
                let dt = t - at;
                if dt < 0. {
                    return Svgr::empty();
                }
                let land = (lerp(380., 860., rnd(k, 11)), lerp(620., 690., rnd(k, 12)));
                let fall = 0.5;
                let (x, y, ratio) = if dt < fall {
                    let u = dt / fall;
                    (lerp(mouth.0, land.0, u), lerp(mouth.1, land.1, u * u), (TAU * u * 1.5).cos().abs().max(0.12))
                } else {
                    let b = dt - fall;
                    (land.0, land.1 - 18. * (-b * 6.).exp() * (b * 15.).sin().abs(), lerp((b * 16.).cos().abs().max(0.2), 0.36, (b / 0.6).min(1.)))
                };
                let frost = after(t, at + 0.8, 1.2);
                fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")}>{bone_coin(40., ratio, 30. * rnd(k, 13), 0.3 + 0.7 * frost)}</g>)
            })
            .collect::<Vec<_>>();
        let resting = [(430., 676., 0.34, 10.), (520., 690., 0.4, 60.), (800., 684., 0.36, 120.)]
            .iter()
            .map(|&(x, y, r, rot)| fframes::svgr!(<g transform={format!("translate({x:.1} {y:.1})")}>{bone_coin(40., r, rot, 1.)}</g>))
            .collect::<Vec<_>>();
        let mist = (0..6u32)
            .map(|k| {
                let u = (loop_phase(t) + k as f32 / 6.).rem_euclid(1.);
                let x = lerp(500., 940., rnd(k, 21));
                puff(x, 660. - 90. * u, 50. + 50. * u, 14. + 14. * u, 0.35 * (PI * u).sin() * after(t, 1.2, 1.), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        // The coin of tower stone: it falls last, stands face-up, then rises to her hand.
        let stone_k = t - STONE_AT;
        let lift = frame.animate(&self.lift);
        let stone = if stone_k > 0. {
            let rest = (600., 660.);
            let fall = 0.55;
            let (x, y, ratio) = if stone_k < fall {
                let u = stone_k / fall;
                (lerp(mouth.0, rest.0, u), lerp(mouth.1, rest.1, u * u), (TAU * u * 1.5).cos().abs().max(0.12))
            } else {
                let b = stone_k - fall;
                (rest.0, rest.1 - 16. * (-b * 6.).exp() * (b * 15.).sin().abs(), lerp(0.3, 0.86, (b / 0.6).min(1.)))
            };
            let hold = (STONE_HAND.0 + 3. * wave(t, 1., 0.3), STONE_HAND.1 + 4. * wave(t, 1., 0.1));
            let e = lift * lift * (3. - 2. * lift);
            let (sx, sy) = (lerp(x, hold.0, e), lerp(y, hold.1, e) - 120. * (PI * e).sin());
            let r = lerp(34., 30., e);
            let trail = (1..8)
                .map(|j| {
                    let ej = (e - 0.04 * j as f32).max(0.);
                    let (tx, ty) = (lerp(x, hold.0, ej), lerp(y, hold.1, ej) - 120. * (PI * ej).sin());
                    fframes::svgr!(<circle cx={tx} cy={ty} r={14. - j as f32} fill="url(#hm-eye)" opacity={0.5 * (1. - j as f32 / 8.) * (PI * e).sin()} />)
                })
                .collect::<Vec<_>>();
            let shine = 0.6 + 0.4 * wave(t, 1., 0.5);
            fframes::svgr!(
                <g>
                    {trail}
                    <circle cx={sx} cy={sy} r={r * 2.4} fill="url(#hm-gold-glow)" opacity={0.35 * shine} />
                    <g transform={format!("translate({sx:.1} {sy:.1})")}>{stone_coin(r, lerp(ratio, 0.95, e), -8. + 6. * wave(t, 1., 0.2), shine)}</g>
                    {glint(sx + r * 0.3, sy - r * 0.6, 5., (loop_phase(t * 2.) - 0.5).abs().powi(2) * 3.)}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The Queen, cautious: her eye lights narrow as she looks at the stone.
        let caution = ease_out(after(t, 3.4, 0.8));
        let mut p = Queen::throne(t);
        p.eyes = lerp(1., 0.5, caution);
        p.glow = lerp(1., 0.75, caution) + 0.05 * wave(t, 1., 0.);
        p.tilt = lerp(0., 6., caution);
        p.head = (0., 4. * caution);
        let local = |w: (f32, f32)| ((w.0 - MASK.0) / QS, (w.1 - MASK.1) / QS);
        let reach = ease_out(after(t, 2.8, 1.0));
        let stone_hand = local(STONE_HAND);
        p.arms[0] = Arm {
            elbow: (lerp(96., 40., reach), lerp(214., 150., reach)),
            wrist: (lerp(152., stone_hand.0 + 22., reach), lerp(232., stone_hand.1 + 34., reach)),
            hand: lerp(20., -120., reach),
            curl: lerp(0.4, 0.55, reach),
        };
        let purse_hand = local(PURSE_HAND);
        p.arms[1] = Arm { elbow: (-150., 215.), wrist: purse_hand, hand: 100., curl: 0.8 };
        p.arms.swap(0, 1);
        let seal = after(t, SEAL_AT, 0.4) * (0.8 + 0.2 * wave(t, 2., 0.));
        let sparks = (0..14u32)
            .map(|k| {
                let u = (loop_phase(t) + rnd(k, 31)).rem_euclid(1.);
                let (x, y) = (PURSE_HAND.0 - 2. + lerp(-30., 30., rnd(k, 32)), PURSE_HAND.1 + 100. - 80. * u);
                fframes::svgr!(<circle cx={x} cy={y} r={lerp(1., 2.4, rnd(k, 33))} fill="#e4c8ff" opacity={seal * (PI * u).sin()} />)
            })
            .collect::<Vec<_>>();
        let purse_g = fframes::svgr!(
            <g>
                <g transform={format!("translate({:.1} {:.1}) rotate(180) scale(1.25)", PURSE_HAND.0, PURSE_HAND.1 + 30.)}>{purse(t, 0.)}</g>
                <circle cx={PURSE_HAND.0 - 50.} cy={PURSE_HAND.1 + 100.} r="120" fill="url(#g-violet)" opacity={0.45 * seal} />
                {cut_seal(PURSE_HAND.0 - 50., PURSE_HAND.1 + 100., 24., seal)}
                {sparks}
            </g>
        );
        let back = fframes::svgr!(
            <g>
                <rect x="-100" y="-900" width="1480" height="1700" fill="url(#hm-dark-hall)" />
                <path d={lancet(1050., 120., 360., 760.)} fill="url(#hm-window-sky)" opacity="0.5" />
                <ellipse cx="1050" cy="-260" rx="420" ry="520" fill="url(#hm-ice-glow)" opacity="0.18" />
                <rect x="-100" y="560" width="1480" height="300" fill="url(#hm-floor)" />
                <ellipse cx="700" cy="660" rx="420" ry="60" fill="#e8f6ff" opacity="0.08" />
            </g>
        );
        let frost = Motes { count: 30, seed: 4301, area: (0., 0., 1280., 720.), rise: -110., period: LOOP, size: (0.8, 2.), sway: 30., fill: "url(#hm-ice-glow)" };
        fframes::svgr!(
            <g>
                <g transform={format!("translate(0 {off:.1})")}>
                    {back}
                    {resting}
                    {coins}
                    {mist}
                    <g transform={format!("translate({:.1} {:.1}) scale({QS})", MASK.0, MASK.1)}>{queen(&p, t)}</g>
                    {purse_g}
                    {stone}
                </g>
                {frost.draw(t, 0.5)}
                <rect width="1280" height="720" fill="url(#hm-hall-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Rampart

const COLS: usize = 4;
const ROWS: usize = 5;
const CARD: (f32, f32, f32, f32) = (460., 100., 360., 480.);
const FOLD_AT: f32 = 0.6;
const FRAME_AT: f32 = 2.75;
const KNEEL_AT: f32 = 3.1;

#[derive(Debug)]
pub struct Rampart {
    ms: MarshShaders,
    arc: Anim,
    frame: Anim,
    flash: Anim,
    kneel: Anim,
}

impl Rampart {
    pub fn new(_sh: Shaders, ms: MarshShaders) -> Self {
        Self {
            ms,
            arc: tw(0.4, 4.7, -1., 1., Easing::EaseInOut),
            frame: tw(FRAME_AT, FRAME_AT + 0.7, 0., 1., Easing::EaseInOut),
            flash: flash(FRAME_AT + 0.7, 0.3, 0.6),
            kneel: spring(KNEEL_AT, 0., 1., HEAVY),
        }
    }
}

impl Scene for Rampart {
    fn name(&self) -> &'static str {
        "EndingRampart"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(card), Some(colossus)) = (ctx.get_image("card-bone-rampart.png"), ctx.get_image("cut-mountain-colossus.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let arc = frame.animate(&self.arc);
        let (cx, cy, cw, ch) = CARD;
        let wall = bone_wall(&self.ms, &frame, (120., 40.), 1.6, (1.0, 0.94, 0.84), (0.3, 0.24, 0.3), 0.);
        // The blocks of the wall fold over one by one into the card art.
        let tiles = (0..COLS * ROWS)
            .map(|i| {
                let (c, r) = (i % COLS, i / COLS);
                let (tw_, th) = (cw / COLS as f32, ch / ROWS as f32);
                let (x, y) = (cx + c as f32 * tw_, cy + r as f32 * th);
                let start = FOLD_AT + 0.11 * (c + r) as f32 + 0.05 * rnd(i as u32, 7);
                let f = ((t - start) / 0.4).clamp(0., 1.);
                let sx = (PI * f).cos().abs().max(0.02);
                let lift = 10. * (PI * f).sin();
                let id = format!("hm-tile-{i}");
                let face = if f < 0.5 {
                    fframes::svgr!(<g clip-path={format!("url(#{id})")}>{wall.clone()}<rect x={x} y={y} width={tw_} height={th} fill="none" stroke="#3a2e30" stroke-width="3" /></g>)
                } else {
                    fframes::svgr!(<g clip-path={format!("url(#{id})")}><image href={card.href()} x={cx} y={cy} width={cw} height={ch} /></g>)
                };
                fframes::svgr!(
                    <g>
                        <defs><clipPath id={id.clone()}><rect x={x} y={y} width={tw_ + 0.6} height={th + 0.6} /></clipPath></defs>
                        <g transform={format!("translate({:.1} {:.1}) scale({sx:.3} 1) translate({:.1} {:.1})", x + tw_ / 2., y + th / 2. - lift, -x - tw_ / 2., -y - th / 2.)}>{face}</g>
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The Epic frame draws itself around the card and closes with a flash.
        let fk = frame.animate(&self.frame);
        let perimeter = 2. * (cw + ch + 48.);
        let border = fframes::svgr!(
            <g>
                <rect x={cx - 12.} y={cy - 12.} width={cw + 24.} height={ch + 24.} rx="22" fill="none" stroke="url(#g-epic)" stroke-width="10" stroke-dasharray={format!("{:.1} {:.1}", perimeter * fk, perimeter)} />
                <rect x={cx - 12.} y={cy - 12.} width={cw + 24.} height={ch + 24.} rx="22" fill="none" stroke="#ffd890" stroke-width="22" opacity={fk * (0.28 + 0.12 * wave(t, 2., 0.))} filter="url(#blur8)" />
            </g>
        );
        let sweep = loop_phase(t - 1.);
        let shine = if t > FRAME_AT + 0.7 {
            glint(cx - 12. + (cw + 24.) * sweep, cy - 12., 7., (PI * sweep).sin() * after(t, FRAME_AT + 0.7, 0.4))
        } else {
            Svgr::empty()
        };
        // Behind, the Mountain Colossus kneels in the mist.
        let kneel = frame.animate(&self.kneel);
        let col = fframes::svgr!(
            <g transform={format!("translate({:.1} 0)", 120. * arc)} filter="url(#blur3)">
                <g transform={format!("translate(1000 {:.1}) rotate({:.1}) scale(1 {:.3})", 760. + 90. * kneel, 4. * kneel, 1. - 0.12 * kneel)}>
                    {figure(colossus, MOUNTAIN_COLOSSUS, 0., 0., 640., true, "url(#hm-dark)", 0.85)}
                </g>
            </g>
        );
        let dust = dust_burst(980. + 120. * arc, 700., t - KNEEL_AT - 0.15, 1.6, 14, 4401, 420., "url(#hm-mist)");
        let swirl = (0..14u32)
            .map(|k| {
                let u = (t / LOOP + k as f32 / 14.).rem_euclid(1.);
                let a = TAU * (u + rnd(k, 41));
                let (x, y) = (640. + a.cos() * 290., 340. + a.sin() * 300. * 0.5);
                puff(x, y, 90., 30., 0.3 * (PI * u).sin(), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let bone_dust = Motes { count: 40, seed: 4411, area: (300., 60., 700., 620.), rise: 160., period: LOOP, size: (0.8, 2.4), sway: 24., fill: "#f4ead2" };
        let skew = -6. * arc;
        let sx = 1. - 0.06 * arc.abs();
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="url(#hm-rampart-bg)" />
                <ellipse cx="900" cy="260" rx="700" ry="420" fill="url(#hm-gold-glow)" opacity="0.4" />
                {col}
                {dust}
                {swirl}
                <g transform={format!("translate(640 340) skewY({skew:.2}) scale({sx:.3} 1) translate(-640 -340)")}>
                    <rect x={cx + 14.} y={cy + 20.} width={cw} height={ch} rx="14" fill="#000" opacity="0.5" filter="url(#blur18)" />
                    {tiles}
                    {border}
                    {shine}
                </g>
                {bone_dust.draw(t, 0.6)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
                <rect width="1280" height="720" fill="#fff4dc" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Heynspire

const TITLE: &str = "HEYNSPIRE";
const PART_AT: f32 = 1.6;
const ROAD_AT: f32 = 2.4;
const TITLE_AT: f32 = 3.5;
/// The base of Heynspire on the far hill, in map units above the top of the map.
const TOWER: (f32, f32) = (470., -24.);
const ROAD: [(f32, f32); 7] = [(1142., 262.), (1060., 236.), (930., 196.), (790., 140.), (650., 80.), (540., 20.), (474., -22.)];

#[derive(Debug)]
pub struct Heynspire {
    sh: Shaders,
    cam: Cam,
    part: Anim,
    road: Anim,
}

impl Heynspire {
    pub fn new(sh: Shaders, _ms: MarshShaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0.4, 4.7, (1150., 330., 1.6), (720., 60., 1.12))]),
            part: tw(PART_AT, 3.8, 0., 1., Easing::EaseInOut),
            road: tw(ROAD_AT, 4.3, 0., 1., Easing::EaseInOut),
        }
    }
}

impl Scene for Heynspire {
    fn name(&self) -> &'static str {
        "EndingHeynspire"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image(MAP) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let part = frame.animate(&self.part);
        // The sky and the far hills beyond the top of the map, in map units.
        let hills = fframes::svgr!(
            <g>
                <rect x="-200" y="-900" width="2000" height="940" fill="url(#hm-dawn-sky)" />
                <circle cx="760" cy="-60" r="260" fill="url(#hm-gold-glow)" opacity="0.7" />
                <path d="M-200 30 C100 -40 260 -90 470 -70 C640 -54 760 -10 900 -30 C1100 -60 1300 -40 1800 30Z" fill="#6a6a9a" opacity="0.8" />
                <path d="M-200 30 C0 0 200 -30 360 -26 C420 -40 520 -40 580 -24 C760 0 1000 -10 1800 30Z" fill="#4a4a7a" />
            </g>
        );
        let tower = fframes::svgr!(<g transform={format!("translate({:.1} {:.1}) scale(0.95)", TOWER.0, TOWER.1)}>{heynspire(t, 820., 0.6 + 0.4 * after(t, 2.6, 1.))}</g>);
        // The mist parts like a curtain to show the tower.
        let curtain = (0..18u32)
            .map(|k| {
                let side = if k % 2 == 0 { -1. } else { 1. };
                let base = TOWER.0 + side * lerp(20., 260., rnd(k, 51));
                let x = base + side * 520. * ease_out(part) + 14. * wave(t, 1., rnd(k, 52));
                let y = lerp(-420., 10., rnd(k, 53));
                puff(x, y, lerp(120., 220., rnd(k, 54)), lerp(50., 90., rnd(k, 55)), 0.75 * lerp(1., 0.3, part), "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        let band = (0..22u32)
            .map(|k| {
                let x = lerp(-150., 1750., k as f32 / 21.) + 30. * wave(t, 1., rnd(k, 61));
                let y = lerp(0., 50., rnd(k, 63)) + 8. * wave(t, 1., rnd(k, 62));
                puff(x, y, lerp(180., 280., rnd(k, 64)), lerp(50., 80., rnd(k, 65)), 0.9, "url(#hm-mist)")
            })
            .collect::<Vec<_>>();
        // The road turns toward Heynspire in a line of dawn light.
        let rk = frame.animate(&self.road);
        let track = Track::new(ROAD.to_vec());
        let pts = (0..=80).map(|i| i as f32 / 80.).take_while(|&v| v <= rk).map(|v| track.at(v)).collect::<Vec<_>>();
        let road = if pts.len() > 1 {
            let d = path(&pts, false);
            fframes::svgr!(
                <g>
                    <path d={d.clone()} stroke="#ffc870" stroke-width="18" fill="none" stroke-linecap="round" opacity="0.5" filter="url(#blur8u)" />
                    <path d={d.clone()} stroke="#fff0c8" stroke-width="5" fill="none" stroke-linecap="round" />
                    <path d={d} stroke="#ffffff" stroke-width="2" fill="none" stroke-dasharray="5 30" stroke-dashoffset={-70. * loop_phase(t)} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let head = track.at(rk);
        let head_glow = if rk > 0.01 && rk < 0.999 {
            fframes::svgr!(<circle cx={head.0} cy={head.1} r="30" fill="url(#hm-gold-glow)" />)
        } else {
            Svgr::empty()
        };
        let clouds = Fog { density: 0.55, soft: 0.3, light: Color::hex("#fff4ea"), shade: Color::hex("#b8a8c8"), dir: (0.4, -0.05), scale: 1.2, seed: 77.0 };
        let snow = Motes { count: 40, seed: 4501, area: (0., 0., 1280., 760.), rise: -260., period: LOOP, size: (1., 2.4), sway: 30., fill: "#f4f8ff" };
        let motes = Motes { count: 30, seed: 4511, area: (0., 100., 1280., 620.), rise: 140., period: LOOP, size: (0.8, 2.), sway: 24., fill: "url(#g-gold)" };
        let title = frost_title(&mut frame, ctx, TITLE, 870., 170., 80, t, TITLE_AT, 0.09);
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {hills}
                    {tower}
                    {painting(&self.sh, &frame, map, Grade { gold: 0.45, dusk: 0.05, ..Default::default() })}
                    {band}
                    {curtain}
                    {road}
                    {head_glow}
                </g>
                {clouds.draw(&self.sh, &frame, 0.7, (-40., -60., 1360., 230.))}
                {rays(&self.sh, &frame, (-160., -140.), 0.6, 1.2, DAWN)}
                <rect width="1280" height="320" fill="url(#hm-top-calm)" opacity={0.6 * after(t, TITLE_AT - 0.5, 0.8)} />
                {title}
                {snow.draw(t, 0.45)}
                {motes.draw(t, 0.5)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.65" />
            </g>
        )
    }
}

