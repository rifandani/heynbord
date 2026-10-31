//! Opening: into the Thornwood, the sleeping giant, the cuts, the ambush, your road.
use crate::fx::*;
use crate::hollows::{amber, bloom, caustic, caustic_shader, leaf, letters, spline, taper, thorn};
use crate::mesa::{after, burst, cut_seal, debris, dust_burst, ease_out, flash, project, punch, shock_ring};
use crate::wood::*;
use crate::{CLIP_FRAMES, STOPS, TRAIL};
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Shader, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const SUN: (f32, f32, f32) = (1.0, 0.86, 0.58);
const AMBER_DEEP: (f32, f32, f32) = (0.42, 0.14, 0.02);
const AMBER_LIGHT: (f32, f32, f32) = (1.0, 0.82, 0.42);

/// Dust and pollen in the light, over the full frame.
fn pollen<'a>(t: f32, alpha: f32, seed: u32) -> Svgr<'a> {
    let motes = Motes { count: 40, seed, area: (0., 40., 1280., 720.), rise: 180., period: LOOP, size: (0.8, 2.2), sway: 40., fill: "url(#g-gold)" };
    motes.draw(t, alpha)
}

/// A leaf of the Glowcap Hollows ending, which this moment continues.
fn hollows_leaves<'a>(t: f32, alpha: f32) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let (count, seed, size) = (12u32, 1001u32, 14.);
    let leaves = (0..count)
        .map(|k| {
            let u = (t / LOOP + rnd(k, seed)).rem_euclid(1.);
            let x = lerp(-40., 1320., rnd(k, seed + 1)) + 50. * (TAU * (u * 2. + rnd(k, seed + 2))).sin();
            let y = lerp(-40., 760., u);
            let spin = 360. * u * if rnd(k, seed + 3) > 0.5 { 1. } else { -1. } + 180. * rnd(k, seed + 4);
            let flip = (TAU * (u * 2. + rnd(k, seed + 5))).cos();
            let s = size * lerp(0.6, 1.2, rnd(k, seed + 6));
            let o = alpha * (PI * u).sin().powf(0.4);
            fframes::svgr!(<path d={leaf(s)} transform={format!("translate({x:.1} {y:.1}) rotate({spin:.0}) scale({flip:.2} 1)")} fill="url(#g-leaf)" opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{leaves}</g>)
}

// ---------------------------------------------------------------- 1. Forest

const TITLE: &str = "THORNWOOD";
/// The Glowcap Hollows ending stops on frame 269 of its Thornwood shot.
const GH_END: f32 = 269. / 30.;
const GH_CAM: (f32, f32, f32) = (962., 346., 1.32);
const MELT_AT: f32 = 0.35;
const MELT_END: f32 = 1.7;
const BRAMBLE_AT: f32 = 2.0;
const BIRDS_AT: f32 = 2.3;
const TITLE_Y: f32 = 168.;

#[derive(Debug)]
pub struct Forest {
    sh: Shaders,
    caustic: Shader,
    cam: Cam,
    melt: Anim,
    gold: Anim,
    seal: Anim,
    thorn_fall: Anim,
    rays: Anim,
    vines: Anim,
    fg: Anim,
}

impl Forest {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            caustic: caustic_shader(),
            cam: camera(&[(0.5, 4.8, GH_CAM, (780., 470., 1.24))]),
            melt: tw(MELT_AT, MELT_END, 0., 1., Easing::EaseIn),
            gold: tw(MELT_AT, MELT_END + 0.4, 0., 1., Easing::EaseInOut),
            seal: tw(0.45, 1.3, 1., 0., Easing::EaseIn),
            thorn_fall: tw(0.4, 1.5, 0., 1., Easing::EaseIn),
            rays: tw(1.0, 2.6, 0., 1., Easing::EaseInOut),
            vines: tw(BRAMBLE_AT, BRAMBLE_AT + 1.5, 0., 1., Easing::EaseOut),
            fg: tw(0.8, 3.0, 0., 1., Easing::EaseInOut),
        }
    }
}

/// The top edge of the melting amber, `b` is its height in the frame. Streams
/// of honey with round tips lag behind the sheet and grow longer as it runs.
fn drip_edge(b: f32, melt: f32, t: f32) -> (String, String) {
    let drips = (0..15u32)
        .map(|k| (lerp(-10., 1290., (k as f32 + 0.5 + 0.6 * (rnd(k, 41) - 0.5)) / 15.), lerp(9., 20., rnd(k, 42)), lerp(30., 230., rnd(k, 43).powf(1.4)) * (0.25 + 0.75 * melt)))
        .collect::<Vec<_>>();
    let mut pts = vec![];
    for i in 0..=200 {
        let x = -20. + 1320. * i as f32 / 200.;
        let mut lift = 0f32;
        for &(c, w, h) in &drips {
            let d = (x - c) / w;
            let stream = if d.abs() < 1. { (h - w).max(0.) + w * (1. - d * d).sqrt() } else { 0. };
            let fillet = h.min(30.) * (-(x - c).powi(2) / (2. * (w * 1.8).powi(2))).exp();
            lift = lift.max(stream).max(fillet);
        }
        pts.push((x, b - lift + 4. * (x * 0.013 + t * 2.).sin()));
    }
    let edge = path(&pts, false);
    let mut fill = edge.clone();
    fill.push_str("L1320 900 L-20 900Z");
    (edge, fill)
}

/// Dark leaves out of focus in the foreground, framing a corner.
fn foliage<'a>(x: f32, y: f32, size: f32, t: f32, seed: u32, flip: f32) -> Svgr<'a> {
    let leaves = (0..14u32)
        .map(|k| {
            let a = lerp(-1.4, 0.2, rnd(k, seed)) * flip + if flip < 0. { PI } else { 0. };
            let r = size * lerp(0.1, 0.9, rnd(k, seed + 1));
            let (lx, ly) = (x + a.cos() * r, y + a.sin() * r);
            let sway = 5. * wave(t, 1., rnd(k, seed + 2));
            let fill = if rnd(k, seed + 3) > 0.5 { "#0e2410" } else { "#183a16" };
            fframes::svgr!(<path d={leaf(size * lerp(0.35, 0.6, rnd(k, seed + 4)))} transform={format!("translate({lx:.1} {ly:.1}) rotate({:.0})", a.to_degrees() + 90. + sway)} fill={fill} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g filter="url(#blur8)" opacity="0.92">{leaves}</g>)
}

impl Scene for Forest {
    fn name(&self) -> &'static str {
        "OpeningForest"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("thornwood-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        // Time on the clock of the Glowcap Hollows ending, for continuity.
        let ta = t + GH_END;
        let cam = frame.animate(&self.cam);
        let gold = frame.animate(&self.gold);
        let melt = frame.animate(&self.melt);
        let grade = Grade { gold: lerp(0.55, 0.12, gold), dusk: lerp(0.15, 0., gold), ..Default::default() };
        let world = painting(&self.sh, &frame, map, grade);
        // The amber of the last moment, as a sheet that runs down and off the frame.
        let b = lerp(-120., 980., melt);
        let (edge, fill) = drip_edge(b, melt, t);
        let sheet = if melt < 1. {
            fframes::svgr!(
                <g>
                    <defs><clipPath id="tw-honey"><path d={fill.clone()} /></clipPath></defs>
                    <g clip-path="url(#tw-honey)">
                        <rect width="1280" height="720" fill="#ff9a2a" opacity="0.16" />
                        {caustic(&self.caustic, &frame, 1.4, AMBER_DEEP, AMBER_LIGHT, 0.14, (0., 0., 1280., 720.))}
                        <rect width="1280" height="720" fill="url(#tw-amber-edge)" />
                        <rect width="1280" height="720" fill="#c8640a" opacity={0.25 * melt} />
                    </g>
                    <path d={edge.clone()} fill="none" stroke="#ffd890" stroke-width="10" opacity={0.5 * (1. - melt * 0.5) * after(t, MELT_AT, 0.2)} filter="url(#blur8)" />
                    <path d={edge} fill="none" stroke="#fff4c8" stroke-width="2.5" opacity={0.8 * after(t, MELT_AT, 0.2)} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The thorn of the last moment spins and falls away with the honey.
        let fall = frame.animate(&self.thorn_fall);
        let thorn_layer = if fall < 1. {
            let bob = 8. * wave(ta, 1., 0.2);
            let spin = -20. + 10. * wave(ta, 1., 0.5) + 260. * fall * fall;
            fframes::svgr!(
                <g transform={format!("translate({:.1} {:.1}) rotate({spin:.1}) scale({:.3})", 470. - 60. * fall, 330. + bob + 520. * fall * fall, 0.8 + 0.5 * fall)} opacity={1. - fall}>
                    <path d={thorn(150.)} fill="none" stroke="#b46aff" stroke-width="10" opacity="0.4" filter="url(#blur8)" />
                    <path d={thorn(150.)} fill="#120806" stroke="#e4c8ff" stroke-width="1.5" stroke-opacity="0.6" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The seal burns away into golden motes.
        let seal_k = frame.animate(&self.seal);
        let seal = seal_k * (0.42 + 0.12 * wave(ta, 1., 0.));
        let embers = (0..40u32)
            .filter_map(|i| {
                let born = 0.5 + 0.7 * rnd(i, 21);
                let dt = t - born;
                if !(0.0..1.6).contains(&dt) {
                    return None;
                }
                let a = TAU * rnd(i, 22);
                let r = 72. * lerp(0.3, 1.0, rnd(i, 23));
                let x = 640. + a.cos() * r + 30. * dt * lerp(-1., 1., rnd(i, 24));
                let y = 170. + a.sin() * r - 90. * dt;
                let k = dt / 1.6;
                Some(fframes::svgr!(<circle cx={x} cy={y} r={lerp(2.6, 1., k)} fill={if rnd(i, 25) > 0.5 { "#ffd890" } else { "#e4c8ff" }} opacity={1. - k} />))
            })
            .collect::<Vec<_>>();
        // The eye glint of the last moment.
        let eye = {
            let (ex, ey) = project(GH_CAM, (1218., 205.));
            let u = (loop_phase(ta) - 0.7).rem_euclid(1.);
            let k = (1. - (u - 0.06).abs() * 12.).max(0.) * (1. - melt);
            glint(ex, ey, 5., k)
        };
        let bubbles = Motes { count: 34, seed: 981, area: (0., 0., 1280., 760.), rise: 320., period: LOOP, size: (1.5, 4.), sway: 16., fill: "url(#g-amber-core)" };
        // Brambles grow in from both sides; each letter of the title grows as a tip passes it.
        let (glyphs, total) = letters(&mut frame, ctx, TITLE, 96, 10., 640.);
        let grow = frame.animate(&self.vines);
        let x0 = 640. - total / 2. - 60.;
        let x1 = 640. + total / 2. + 60.;
        let vine = |side: f32| {
            let pts = (0..=40)
                .map(|k| {
                    let u = k as f32 / 40.;
                    let x = if side < 0. { lerp(-40., 640. + 20., u) } else { lerp(1320., 640. - 20., u) };
                    (x, TITLE_Y + 22. + 12. * (u * TAU * 2.2 + side).sin() + 3. * wave(t, 1., u + side))
                })
                .collect::<Vec<_>>();
            bramble(&pts, 13., 5., grow * 0.98, t, if side < 0. { 61 } else { 67 })
        };
        let reach = |x: f32| {
            // The time at which a tip reaches x, from either side.
            let from_left = (x + 40.) / (680.);
            let from_right = (1320. - x) / 680.;
            BRAMBLE_AT + 1.5 * (from_left.min(from_right)).clamp(0., 1.).powf(1.6)
        };
        let face = glyphs
            .iter()
            .enumerate()
            .map(|(i, (c, gx, w))| {
                let cx = gx + w / 2.;
                let dt = t - reach(cx) + 0.05;
                if dt <= 0. {
                    return Svgr::empty();
                }
                let settle = ((t - 4.3) / 0.7).clamp(0., 1.);
                let s = lerp(0.4 + 0.6 * bloom(dt * 0.9).min(1.15), 1., settle);
                let rise = lerp(18. * (1. - bloom(dt).min(1.)), 0., settle);
                let halo = lerp(0.3 + 0.6 * (-dt * 3.).exp(), 0.3, settle);
                let leaf_k = ((dt - 0.25) / 0.5).clamp(0., 1.);
                let sway = 6. * wave(t, 1., i as f32 * 0.13);
                let red = if i % 2 == 0 { "#d8401c" } else { "#f08a2a" };
                fframes::svgr!(
                    <g transform={format!("translate({cx:.1} {:.1}) scale({s:.3}) translate({:.1} {:.1})", TITLE_Y - 30. + rise, -cx, 30. - TITLE_Y)} opacity={(dt / 0.15).min(1.)}>
                        <text x={*gx} y={TITLE_Y} font-family="Cinzel" font-weight="900" font-size="96" fill="#ffd060" opacity={halo} filter="url(#blur8)">{c.clone()}</text>
                        <text x={*gx + 3.} y={TITLE_Y + 5.} font-family="Cinzel" font-weight="900" font-size="96" fill="#0a1406" opacity="0.65">{c.clone()}</text>
                        <text x={*gx} y={TITLE_Y} font-family="Cinzel" font-weight="900" font-size="96" fill="url(#g-thorn-title)" stroke="#1a2a0a" stroke-width="2">{c.clone()}</text>
                        <path d={leaf(18. * leaf_k + 0.1)} transform={format!("translate({:.1} {:.1}) rotate({:.0})", gx + w * 0.85, TITLE_Y - 66., 30. + sway)} fill={red} stroke="#3a0a04" stroke-width="1" opacity={leaf_k} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let sweep = loop_phase(t - 1.0);
        let shine = if t > 4.0 {
            glint(lerp(x0, x1, sweep.powf(0.6)), TITLE_Y - 70. + 50. * sweep, 6., (PI * sweep).sin() * 0.8 * after(t, 4.0, 0.5))
        } else {
            Svgr::empty()
        };
        let rays_k = frame.animate(&self.rays);
        // Birds burst out of the trees at the right and circle over the forest.
        let birds = flock(t, BIRDS_AT, (930., 470.), (620., 290.), 16, 77, 17., "#1a1006", 2.5);
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>{world}</g>
                {rays(&self.sh, &frame, (-160., -140.), 0.85 * rays_k, 1.2, SUN)}
                <rect width="1280" height="720" fill="url(#g-sun-left)" opacity={0.6 * rays_k} />
                {sheet}
                {eye}
                <g opacity={1. - melt}>{bubbles.draw(ta, 0.7)}</g>
                {hollows_leaves(ta, 0.7 * (1. - gold))}
                <circle cx="640" cy="170" r="140" fill="#14061e" opacity={0.35 * seal} filter="url(#blur18)" />
                {cut_seal(640., 170., 72., seal)}
                {embers}
                {thorn_layer}
                {birds}
                {falling(t, 0.9 * gold, 16, 1201, 15., (0., 0., 1280., 720.))}
                <rect width="1280" height="270" fill="url(#tw-top-calm)" opacity={0.95 * after(t, BRAMBLE_AT - 0.4, 0.8)} />
                {vine(-1.)}
                {vine(1.)}
                {face}
                {shine}
                {pollen(t, 0.6 * rays_k, 1301)}
                <g transform={format!("translate({:.1} 0)", -60. * (1. - frame.animate(&self.fg)))} opacity={frame.animate(&self.fg)}>{foliage(-40., 780., 210., t, 1701, 1.)}</g>
                <g transform={format!("translate({:.1} 0)", 60. * (1. - frame.animate(&self.fg)))} opacity={frame.animate(&self.fg)}>{foliage(1320., 790., 190., t, 1711, -1.)}</g>
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity={0.55 * gold} />
                <defs>
                    <radialGradient id="tw-amber-edge" cx="0.5" cy="0.5" r="0.72">
                        <stop offset="0.55" stop-color="#ffb43a" stop-opacity="0" />
                        <stop offset="0.85" stop-color="#d8700a" stop-opacity="0.55" />
                        <stop offset="1" stop-color="#5a2402" stop-opacity="0.95" />
                    </radialGradient>
                    <linearGradient id="tw-top-calm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#0c1806" stop-opacity="0.75" />
                        <stop offset="1" stop-color="#0c1806" stop-opacity="0" />
                    </linearGradient>
                </defs>
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Giant

const SONG_AT: f32 = 0.6;
const SONG_LEN: f32 = 2.2;
const CAVE_EYES: [(f32, f32, f32, bool); 4] = [(-16., 2., 2.6, false), (14., -6., 3.0, true), (-2., 12., 3.35, false), (24., 10., 3.7, false)];

#[derive(Debug)]
pub struct Giant {
    sh: Shaders,
    cam: Cam,
    sleep: Anim,
}

impl Giant {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 5.0, (760., 600., 1.5), (1050., 330., 1.72))]),
            sleep: tw(SONG_AT + 1.4, SONG_AT + 3.2, 1., 0.25, Easing::EaseInOut),
        }
    }
}

/// A ribbon of song from `from` to the giant's crown, in map units: three thin
/// strands that wave, with notes of light; `grow` 0..1.
fn song<'a>(from: (f32, f32), bend: f32, grow: f32, t: f32, seed: u32) -> Svgr<'a> {
    if grow <= 0. {
        return Svgr::empty();
    }
    let to = (FACE.0 - 40. + 30. * rnd(seed, 1), FACE.1 - 90.);
    let strand = |offset: f32, phase: f32| {
        let pts = (0..=40)
            .map(|i| {
                let u = i as f32 / 40.;
                let lift = 90. * (PI * u).sin();
                let w = (14. + 10. * offset.abs()) * (PI * u).sin() * (TAU * (u * 2.5) - TAU * t / LOOP + phase).sin();
                (lerp(from.0, to.0, u) + bend * (PI * u).sin() + w * 0.6, lerp(from.1, to.1, u) - lift + w + offset * 5.)
            })
            .collect::<Vec<_>>();
        let keep = ((pts.len() - 1) as f32 * grow) as usize;
        path(&pts[..=keep.max(1)], false)
    };
    let id = format!("tw-song-{seed}");
    let strands = [(-1., 0.0, 2.2, 0.55), (0., 0.33, 3.2, 0.95), (1., 0.66, 2.0, 0.5)]
        .iter()
        .map(|&(o, ph, w, a)| fframes::svgr!(<path d={strand(o, ph)} fill="none" stroke={format!("url(#{id})")} stroke-width={w} stroke-linecap="round" opacity={a} />))
        .collect::<Vec<_>>();
    let notes = (0..8u32)
        .filter_map(|k| {
            let u = ((t / LOOP) * 2. + k as f32 / 8.).rem_euclid(1.);
            if u > grow {
                return None;
            }
            let lift = 90. * (PI * u).sin();
            let (x, y) = (lerp(from.0, to.0, u) + bend * (PI * u).sin(), lerp(from.1, to.1, u) - lift);
            Some(glint(x, y, 2.2 + 1.2 * rnd(k, seed), 0.9 * (PI * u).sin()))
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <defs>
                <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={from.0} y1={from.1} x2={to.0} y2={to.1}>
                    <stop offset="0" stop-color="#ffe7a0" stop-opacity="0" />
                    <stop offset="0.25" stop-color="#fff4c8" stop-opacity="1" />
                    <stop offset="0.8" stop-color="#ffd860" stop-opacity="1" />
                    <stop offset="1" stop-color="#ffd860" stop-opacity="0" />
                </linearGradient>
            </defs>
            <g filter="url(#blur3u)" opacity="0.8">{strands.clone()}</g>
            {strands}
            {notes}
        </g>
    )
}

/// The song gathers into a slow ring of sparkles around the giant's crown.
fn crown_sparkles<'a>(t: f32, alpha: f32) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let sparks = (0..16u32)
        .map(|k| {
            let a = TAU * (t / LOOP + k as f32 / 16.);
            let (x, y) = (FACE.0 + 150. * a.cos(), FACE.1 - 70. + 46. * a.sin());
            let front = 0.5 + 0.5 * a.sin();
            glint(x, y, 2. + 2. * front, alpha * (0.35 + 0.65 * front) * (0.7 + 0.3 * wave(t, 4., rnd(k, 9))))
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{sparks}</g>)
}

impl Scene for Giant {
    fn name(&self) -> &'static str {
        "OpeningGiant"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("thornwood-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        // The giant breathes once per LOOP: in for two seconds, out for two.
        let breath = 0.5 + 0.5 * wave(t, 1., 0.75);
        let world = painting(&self.sh, &frame, map, Grade { gold: 0.2, dusk: 0.12, ..Default::default() });
        // A wave of light runs out from the giant with each breath out.
        let u = loop_phase(t - 0.5);
        let wave_r = 80. + 1100. * u;
        let ring = fframes::svgr!(
            <circle cx={FACE.0} cy={FACE.1} r={wave_r} fill="none" stroke="#ffe7a0" stroke-width={60. * (1. - u) + 10.} opacity={0.16 * (1. - u) * (PI * u).sin().powf(0.3)} filter="url(#blur8u)" />
        );
        let grow = |delay: f32| ((t - SONG_AT - delay) / SONG_LEN).clamp(0., 1.);
        let songs = fframes::svgr!(
            <g>
                {song(LANTERN_TREE, -60., ease_out(grow(0.)), t, 3)}
                {song(VILLAGE, 80., ease_out(grow(0.35)), t, 5)}
                {song((700., 690.), 40., ease_out(grow(0.7)), t, 7)}
                {crown_sparkles(t, after(t, SONG_AT + SONG_LEN, 0.8))}
            </g>
        );
        let sleep = frame.animate(&self.sleep);
        let eye_glow = (0.15 + 0.6 * sleep) * (0.7 + 0.3 * breath);
        let (ex, ey) = EYE_R;
        let eye = fframes::svgr!(
            <g>
                <ellipse cx={ex} cy={ey} rx="30" ry="18" fill="url(#g-eye-halo)" opacity={eye_glow} />
                <ellipse cx={ex} cy={ey - 2.} rx="16" ry={2. + 7. * sleep} fill="#ffd860" opacity={0.5 * eye_glow} filter="url(#blur3)" />
            </g>
        );
        // Beast eyes open in the dark of the Web Cave and glow with each breath.
        let eyes = CAVE_EYES
            .iter()
            .enumerate()
            .map(|(i, &(dx, dy, at, red))| {
                let open = ((t - at) / 0.25).clamp(0., 1.);
                let blink_u = (loop_phase(t + i as f32 * 0.37) - 0.5).abs();
                let blink = if t > at + 0.6 { (blink_u * 30.).min(1.) } else { 1. };
                let glow = open * blink * (0.6 + 0.4 * breath);
                beast_eyes(WEB_CAVE.0 + dx * 1.3, WEB_CAVE.1 + dy, 8., glow, red)
            })
            .collect::<Vec<_>>();
        let crown = (0..18u32)
            .filter_map(|k| {
                // Leaves lift off the crown with each breath out.
                let u = (loop_phase(t) + rnd(k, 3)).rem_euclid(1.);
                let x = FACE.0 + lerp(-150., 150., rnd(k, 4)) + 60. * u;
                let y = FACE.1 - 140. + lerp(-20., 20., rnd(k, 5)) - 40. * u + 160. * u * u;
                let o = (PI * u).sin() * 0.9;
                let fill = LEAF_FILLS[(rnd(k, 6) * 4.) as usize % 4];
                Some(fframes::svgr!(<path d={leaf(9.)} transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", 360. * u + 90. * rnd(k, 7))} fill={fill} opacity={o} />))
            })
            .collect::<Vec<_>>();
        let push = 1. + 0.006 * breath;
        let cam = (cam.0, cam.1, cam.2 * push);
        let fog = Fog { density: 0.35, soft: 0.3, light: Color::hex("#fff2d0"), shade: Color::hex("#9ab07a"), dir: (0.3, -0.1), scale: 1.4, seed: 7.0 };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {world}
                    {ring}
                    <ellipse cx={WEB_CAVE.0} cy={WEB_CAVE.1 + 4.} rx="54" ry="30" fill="#050302" opacity="0.7" filter="url(#blur8u)" />
                    {eyes}
                    {eye}
                    {songs}
                    {crown}
                </g>
                {fog.draw(&self.sh, &frame, 0.22, (-40., 520., 1360., 240.))}
                {rays(&self.sh, &frame, (-160., -140.), 0.35 + 0.1 * breath, 1.1, SUN)}
                {pollen(t, 0.5, 1311)}
                {falling(t, 0.6, 10, 1221, 12., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.6" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Cuts

/// Three cuts below the giant's left eye, in face space: (start, end, time).
const CUTS: [((f32, f32), (f32, f32), f32); 3] = [((170., 470.), (270., 560.), 1.4), ((300., 450.), (410., 572.), 2.0), ((440., 482.), (520., 556.), 2.6)];
const THORN_DROP: f32 = 3.2;
const CUT_CAM: (f32, f32, f32) = (330., 515., 1.8);

#[derive(Debug)]
pub struct Cuts {
    bark: Shader,
    cam: Cam,
    green: Anim,
    twitch: Vec<Anim>,
}

impl Cuts {
    pub fn new(_sh: Shaders) -> Self {
        Self {
            bark: bark_shader(),
            cam: camera(&[(0., 5.0, (300., 530., 1.7), CUT_CAM)]),
            green: tw(0.3, 1.1, 0., 1., Easing::EaseOut),
            twitch: CUTS.iter().map(|c| keys(&[(c.2 + 0.05, c.2 + 0.18, 0., 1., Easing::EaseOut), (c.2 + 0.18, c.2 + 0.8, 1., 0., Easing::EaseInOut)])).collect(),
        }
    }
}

/// A cut in the bark from `a` to `b`, `open` 0..1, `fill` 0..1 of amber, in face space.
pub fn gash<'a>(a: (f32, f32), b: (f32, f32), open: f32, fill: f32, t: f32, seed: u32) -> Svgr<'a> {
    if open <= 0.03 {
        return Svgr::empty();
    }
    let (dx, dy) = (b.0 - a.0, b.1 - a.1);
    let len = (dx * dx + dy * dy).sqrt();
    let (nx, ny) = (-dy / len, dx / len);
    let reach = open.min(1.);
    let end = (lerp(a.0, b.0, reach), lerp(a.1, b.1, reach));
    // A ragged lens: the two lips of the cut, wider in the middle.
    let lip = |side: f32| {
        (0..=8)
            .map(|i| {
                let u = i as f32 / 8.;
                let w = 8. * reach * (PI * u).sin().max(0.).powf(0.8) * lerp(0.75, 1.15, rnd(i + if side > 0. { 0 } else { 9 }, seed));
                (lerp(a.0, end.0, u) + nx * w * side, lerp(a.1, end.1, u) + ny * w * side)
            })
            .collect::<Vec<_>>()
    };
    let mut pts = lip(1.);
    let mut back = lip(-1.);
    back.reverse();
    pts.extend(back);
    let lens = path(&pts, true);
    // Amber pools on the lower lip and runs down from the middle of the cut.
    let lower = if ny > 0. { 1. } else { -1. };
    let low = (lerp(a.0, end.0, 0.55) + nx * 6. * lower, lerp(a.1, end.1, 0.55) + ny * 6. * lower);
    let run = 6. + 90. * fill;
    let stream = (0..=6)
        .map(|i| {
            let u = i as f32 / 6.;
            (low.0 + 3.5 * (u * 5. + seed as f32).sin() * u, low.1 + run * u)
        })
        .collect::<Vec<_>>();
    let stream_d = taper(&stream, 7., 10., 1.);
    let tip = stream[6];
    let pool = {
        let mut lip = (0..=8)
            .map(|i| {
                let u = i as f32 / 8.;
                let w = 8. * reach * (PI * u).sin().max(0.) * lower;
                (lerp(a.0, end.0, u) + nx * w, lerp(a.1, end.1, u) + ny * w)
            })
            .collect::<Vec<_>>();
        let mut mid = (0..=8)
            .map(|i| {
                let u = i as f32 / 8.;
                let w = 8. * reach * (PI * u).sin().max(0.) * lower * (1. - 0.9 * fill);
                (lerp(a.0, end.0, u) + nx * w, lerp(a.1, end.1, u) + ny * w)
            })
            .collect::<Vec<_>>();
        mid.reverse();
        lip.extend(mid);
        path(&lip, true)
    };
    // A drop leaves the bulb twice in each LOOP.
    let u = ((t / LOOP) * 2. + rnd(seed, 1)).rem_euclid(1.);
    let drop = if fill > 0.6 {
        let y = tip.1 + 6. + 200. * u * u;
        fframes::svgr!(<ellipse cx={tip.0} cy={y} rx={4.5} ry={4.5 + 4. * u} fill="#ffb43a" opacity={(fill - 0.6) / 0.4 * (1. - u) * (u * 8.).min(1.)} />)
    } else {
        Svgr::empty()
    };
    let bulb = 5.5 + 2.5 * (PI * u).sin().powi(2) * (fill - 0.6).max(0.) / 0.4;
    fframes::svgr!(
        <g>
            <path d={lens.clone()} fill="#000" opacity="0.7" transform="translate(3 5)" filter="url(#blur3)" />
            <path d={lens.clone()} fill="#0e0602" />
            <path d={pool} fill="url(#g-amber)" opacity={fill} />
            <path d={lens} fill="none" stroke="#e8cc98" stroke-width="2.2" opacity="0.75" />
            <g opacity={fill.min(1.)}>
                <circle cx={low.0} cy={low.1 + run * 0.4} r={run * 0.5 + 26.} fill="url(#g-amber-halo)" opacity="0.4" />
                <path d={stream_d} fill="url(#g-amber)" />
                <circle cx={tip.0} cy={tip.1} r={bulb} fill="url(#g-amber)" />
                <circle cx={tip.0 - 2.} cy={tip.1 - 2.} r="1.6" fill="#fff6d8" />
            </g>
            {drop}
        </g>
    )
}

impl Scene for Cuts {
    fn name(&self) -> &'static str {
        "OpeningCuts"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let twitch = self.twitch.iter().map(|a| frame.animate(a)).sum::<f32>().min(1.2);
        let pose = Pose { open: 0.12 + 0.24 * twitch, anger: 0.4 * twitch, mouth: 0., glow: 0.2 + 0.6 * twitch, look: -0.3 };
        let green = frame.animate(&self.green) * (0.8 + 0.2 * flicker(t, 0.4));
        let layer = bark_layer(&self.bark, &frame, cam, (0.44, 0.5, 0.66), (0.01, 0.014, 0.03), 0.6);
        let to_screen = |(x, y): (f32, f32)| (640. + (x - cam.0) * cam.2, 360. + (y - cam.1) * cam.2);
        let cuts = CUTS
            .iter()
            .enumerate()
            .map(|(i, &(a, b, at))| {
                let open = ((t - at) / 0.12).clamp(0., 1.);
                let fill = ((t - at - 0.3) / 1.3).clamp(0., 1.);
                gash(a, b, open, ease_out(fill), t, i as u32 + 3)
            })
            .collect::<Vec<_>>();
        // A knife glints along each cut; splinters fly.
        let blades = CUTS
            .iter()
            .enumerate()
            .map(|(i, &(a, b, at))| {
                let dt = t - at + 0.12;
                let (sa, sb) = (to_screen(a), to_screen(b));
                let k = ease_out((dt / 0.24).clamp(0., 1.));
                let streak = if (0.0..0.4).contains(&dt) {
                    let (hx, hy) = (lerp(sa.0, sb.0, k), lerp(sa.1, sb.1, k));
                    let ang = (sb.1 - sa.1).atan2(sb.0 - sa.0).to_degrees();
                    let fade = 1. - dt / 0.4;
                    fframes::svgr!(
                        <g opacity={fade}>
                            <path d={format!("M{:.1} {:.1} L{hx:.1} {hy:.1}", sa.0, sa.1)} stroke="#e8fff0" stroke-width="4" stroke-linecap="round" filter="url(#blur3)" />
                            <g transform={format!("translate({hx:.1} {hy:.1}) rotate({ang:.0})")}>{knife(150., 1.)}</g>
                        </g>
                    )
                } else {
                    Svgr::empty()
                };
                let mid = to_screen(((a.0 + b.0) / 2., (a.1 + b.1) / 2.));
                fframes::svgr!(<g>{streak}{burst(mid.0, mid.1, t - at - 0.08, 0.7, 14, 40 + i as u32, 300., "#c8a070")}</g>)
            })
            .collect::<Vec<_>>();
        // In one drop under the middle cut, a black thorn turns into view.
        let tk = ((t - THORN_DROP) / 0.9).clamp(0., 1.);
        let thorn_drop = if tk > 0. {
            let (x, y) = to_screen((372., 700.));
            let bob = 5. * wave(t, 1., 0.3);
            fframes::svgr!(<g transform={format!("translate({x:.1} {:.1}) scale({:.3})", y + bob, 0.5 + 0.7 * ease_out(tk))} opacity={tk.min(1.)}>{amber(40., ease_out(tk), t, 17)}</g>)
        } else {
            Svgr::empty()
        };
        fframes::svgr!(
            <g>
                <image href={layer.href()} x="0" y="0" width="1280" height="720" />
                <g transform={view(cam)}>
                    <ellipse cx={F_EYE_L.0} cy={F_EYE_L.1 + 10.} rx="190" ry="120" fill="#010206" opacity="0.8" filter="url(#blur18)" />
                    {giant_eye(F_EYE_L, -1., pose, t)}
                </g>
                {carved(&layer, cam, &brow_shape(-1., pose.anger), "tw-cut-brow", (60., -40.), "url(#g-brow-shade)", (8., 30.))}
                <rect width="1280" height="720" fill="#0c1a40" opacity="0.22" />
                <circle cx="1280" cy="-60" r="900" fill="url(#tw-moon)" opacity="0.5" />
                <g transform={view(cam)}>{cuts}</g>
                <circle cx="-200" cy="500" r="900" fill="url(#g-witch)" opacity={0.42 * green} />
                <rect width="1280" height="720" fill="url(#tw-green-side)" opacity={green} />
                {blades}
                {thorn_drop}
                {falling(t, 0.4, 8, 1401, 14., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.95" />
                <defs>
                    <radialGradient id="tw-moon">
                        <stop offset="0" stop-color="#c8d8ff" stop-opacity="0.5" />
                        <stop offset="1" stop-color="#4a6aa8" stop-opacity="0" />
                    </radialGradient>
                    <linearGradient id="tw-green-side" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stop-color="#3aff7a" stop-opacity="0.16" />
                        <stop offset="0.6" stop-color="#3aff7a" stop-opacity="0" />
                    </linearGradient>
                </defs>
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Ambush

const HORN_AT: f32 = 0.2;
const HEDGE_AT: f32 = 0.85;
const CHARGE_AT: f32 = 2.15;
const HIT_AT: f32 = 3.1;
/// The cave mouth at the lower left of the Battle Painting, on screen.
const CAVE: (f32, f32) = (172., 612.);
const STAKES: [f32; 3] = [0.28, 0.5, 0.7];

#[derive(Debug)]
pub struct Ambush {
    sh: Shaders,
    charge: Anim,
    hedge: Anim,
    punch: Anim,
    flash: Anim,
}

impl Ambush {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            charge: tw(CHARGE_AT, HIT_AT, 0., 1., Easing::EaseIn),
            hedge: tw(HEDGE_AT, HEDGE_AT + 0.5, 0., 1., Easing::EaseOut),
            punch: punch(HIT_AT, 1.06),
            flash: flash(HIT_AT, 0.4, 0.5),
        }
    }
}

/// Where the charging boar is, and how big, at path position `u` 0..1.
fn boar_at(u: f32) -> (f32, f32, f32) {
    let s = 0.08 / (1. - 0.93 * u).max(0.06);
    (lerp(CAVE.0, 650., u.powf(0.8)), lerp(CAVE.1, 440., u.powf(0.9)), s.min(1.15))
}

/// A sharpened wooden stake, its foot at the origin, 100 units tall; `broken` 0..1.
fn stake<'a>(broken: f32) -> Svgr<'a> {
    if broken >= 1. {
        return fframes::svgr!(<path d="M-10 0 L-9 -22 L-3 -16 L2 -26 L9 -18 L10 0Z" fill="url(#g-log)" stroke="#140a05" stroke-width="2" />);
    }
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx="22" ry="5" fill="#000" opacity="0.4" />
            <path d="M-10 0 L-10 -82 L0 -104 L10 -82 L10 0Z" fill="url(#g-log)" stroke="#140a05" stroke-width="2.5" />
            <path d="M-4 -6 L-4 -78" stroke="#c8925a" stroke-width="2" opacity="0.4" />
            <path d="M-12 -40 L12 -46" stroke="#3a2412" stroke-width="5" />
        </g>
    )
}

impl Scene for Ambush {
    fn name(&self) -> &'static str {
        "OpeningAmbush"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(field), Some(boar)) = (ctx.get_image("thornwood.png"), ctx.get_image("card-bristleback-boar.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let world = painting(&self.sh, &frame, field, Grade { gold: 0.25, dark: 0.08, ..Default::default() });
        // The horn sounds from the treetops at the upper right; the leaves shake.
        let horn = sound_rings(1060., 40., t, HORN_AT, 0.28, 3, 420., "#fff2c8");
        let shake_leaves = falling(t + 1.3, after(t, HORN_AT, 0.3) * (1. - after(t, 2.4, 1.6)), 14, 1501, 14., (700., -60., 600., 400.));
        // Thorn hedges whip shut across the road at the far side of the glade.
        let hk = frame.animate(&self.hedge);
        let hedge = |side: f32, seed: u32| {
            let pts = (0..=16)
                .map(|k| {
                    let u = k as f32 / 16.;
                    let x = if side < 0. { lerp(360., 600., u) } else { lerp(860., 560., u) };
                    (x, 62. - 34. * (PI * u).sin() + 6. * wave(t, 1., u + side) + 6. * (u * 9.).sin())
                })
                .collect::<Vec<_>>();
            bramble(&pts, 15., 7., hk, t, seed)
        };
        // Beast eyes open in the cave mouth.
        let eyes = [(-24., -8., 1.35), (18., -2., 1.65), (-2., 14., 1.9)]
            .iter()
            .enumerate()
            .map(|(i, &(dx, dy, at))| {
                let open = ((t - at) / 0.2).clamp(0., 1.) * (1. - after(t, CHARGE_AT + 0.1, 0.3) * if i == 1 { 1. } else { 0. });
                beast_eyes(CAVE.0 + dx, CAVE.1 + dy, 7., open, i == 1)
            })
            .collect::<Vec<_>>();
        // The boar charges out of the cave at the camera, through three stakes in a line.
        let u = frame.animate(&self.charge);
        let stakes = STAKES
            .iter()
            .enumerate()
            .map(|(i, &su)| {
                let (x, y, s) = boar_at(su);
                let passed = t >= CHARGE_AT + (HIT_AT - CHARGE_AT) * su.sqrt();
                let pass_t = CHARGE_AT + (HIT_AT - CHARGE_AT) * su.sqrt();
                let gy = y + 230. * s;
                let wood = debris(x, gy - 60. * s, t - pass_t, 1.4, 14, 60 + i as u32 * 7, 900. * s.sqrt(), (-PI * 0.95, -PI * 0.05), 14. * s.sqrt());
                fframes::svgr!(
                    <g>
                        <g transform={format!("translate({x:.1} {gy:.1}) scale({:.3})", s * 4.2)}>{stake(if passed { 1. } else { 0. })}</g>
                        {wood}
                        {dust_burst(x, gy, t - pass_t, 1.2, 10, 70 + i as u32, 260. * s, "url(#g-moss-dust)")}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let boar_layer = if u > 0. {
            let (x, y, s) = boar_at(u);
            let breathe = 1. + 0.012 * wave(t, 2., 0.1) * after(t, HIT_AT + 0.4, 0.6);
            let s = s * breathe;
            let streaks = if u < 1. {
                let lines = (0..10u32)
                    .map(|k| {
                        let a = TAU * rnd(k, 91);
                        let r0 = 220. * s;
                        let (cx, cy) = (x + a.cos() * r0, y + a.sin() * r0 * 0.8);
                        fframes::svgr!(<path d={format!("M{cx:.1} {cy:.1} L{:.1} {:.1}", cx + a.cos() * 80. * s, cy + a.sin() * 64. * s)} stroke="#f6e8c8" stroke-width="2" opacity={0.5 * u} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(<g>{lines}</g>)
            } else {
                Svgr::empty()
            };
            // The card art, masked to the boar's head and shoulders.
            fframes::svgr!(
                <g>
                    <ellipse cx={x} cy={y + 250. * s} rx={240. * s} ry={46. * s} fill="#000" opacity="0.45" filter="url(#blur8)" />
                    <g transform={format!("translate({x:.1} {y:.1}) scale({s:.4})")}>
                        <g mask="url(#tw-boar-mask)">
                            <image href={boar.href()} x="-400" y="-430" width="600" height="800" />
                            <rect x="-400" y="-430" width="600" height="800" fill="url(#tw-boar-shade)" />
                            <rect x="-400" y="-430" width="600" height="800" fill="#2a1406" opacity={0.4 * (1. - u)} />
                        </g>
                        <circle cx="-40" cy="-44" r="18" fill="url(#g-red)" opacity={0.45 + 0.2 * wave(t, 2., 0.)} />
                        <circle cx="50" cy="-30" r="14" fill="url(#g-red)" opacity={0.35 + 0.2 * wave(t, 2., 0.2)} />
                    </g>
                    {streaks}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Steam from the boar's snout, twice per LOOP, after it stops.
        let steam = if t > HIT_AT {
            let (x, y, s) = boar_at(1.);
            let puffs = (0..6u32)
                .map(|k| {
                    let ph = ((t / LOOP) * 2. + k as f32 / 6.).rem_euclid(1.);
                    let side = if k % 2 == 0 { -1. } else { 1. };
                    let (px, py) = (x + (40. + side * 30. + 140. * ph * side) * s, y + (90. - 20. * ph) * s);
                    fframes::svgr!(<circle cx={px} cy={py} r={(20. + 70. * ph) * s} fill="url(#g-steam)" opacity={0.5 * (PI * ph).sin() * after(t, HIT_AT + 0.3, 0.5)} />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(<g>{puffs}</g>)
        } else {
            Svgr::empty()
        };
        let impact = fframes::svgr!(
            <g>
                {dust_burst(640., 700., t - HIT_AT, 1.6, 18, 81, 700., "url(#g-moss-dust)")}
                {burst(640., 600., t - HIT_AT, 0.9, 20, 83, 700., "#e8d8a8")}
                {shock_ring(650., 700., t - HIT_AT, 0.7, 600., 90., "#fff2c8")}
            </g>
        );
        let zoom = frame.animate(&self.punch);
        let (kx, ky) = shake(t, HIT_AT, 16.);
        let dust = Motes { count: 30, seed: 1551, area: (0., 300., 1280., 420.), rise: 120., period: LOOP, size: (1., 3.), sway: 30., fill: "url(#g-moss-dust)" };
        fframes::svgr!(
            <g>
                <defs>
                    <radialGradient id="tw-boar-fade" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0.45" stop-color="#fff" />
                        <stop offset="0.8" stop-color="#888" />
                        <stop offset="1" stop-color="#000" />
                    </radialGradient>
                    <mask id="tw-boar-mask" maskUnits="userSpaceOnUse" x="-450" y="-450" width="900" height="900">
                        <ellipse cx="-70" cy="30" rx="250" ry="270" fill="url(#tw-boar-fade)" />
                    </mask>
                    <radialGradient id="tw-boar-shade" gradientUnits="userSpaceOnUse" cx="-50" cy="40" r="280">
                        <stop offset="0.5" stop-color="#1a1408" stop-opacity="0" />
                        <stop offset="1" stop-color="#1a1408" stop-opacity="0.85" />
                    </radialGradient>
                </defs>
                <g transform={format!("translate(640 360) scale({zoom:.4}) translate(-640 -360) translate({kx:.1} {ky:.1})")}>
                    <g transform="scale(0.8)">{world}</g>
                    <rect width="1280" height="720" fill="url(#g-sun-left)" opacity="0.5" />
                    <ellipse cx={CAVE.0} cy={CAVE.1} rx="80" ry="54" fill="#030201" opacity="0.6" filter="url(#blur8)" />
                    {eyes}
                    {hedge(-1., 501)}
                    {hedge(1., 507)}
                    {horn}
                    {stakes}
                    {boar_layer}
                    {steam}
                    {impact}
                </g>
                {rays(&self.sh, &frame, (-160., -140.), 0.35, 1.1, SUN)}
                {shake_leaves}
                {falling(t, 0.5, 8, 1521, 13., (0., 0., 1280., 720.))}
                {dust.draw(t, 0.5)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
                <rect width="1280" height="720" fill="#fff6e0" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Road

const VINE_AT: f32 = 0.45;
const STOP_GAP: f32 = 0.36;
const FLARE_AT: f32 = 4.0;

#[derive(Debug)]
pub struct Road {
    sh: Shaders,
    track: Track,
    fractions: Vec<f32>,
    cam: Cam,
    flare: Anim,
}

impl Road {
    pub fn new(sh: Shaders) -> Self {
        let track = Track::new(TRAIL.to_vec());
        // The share of the Trail before each clearing.
        let fractions = STOPS
            .iter()
            .map(|s| {
                let i = TRAIL.iter().position(|p| p == s).unwrap_or(0);
                track.lengths[i] / track.total()
            })
            .collect();
        Self {
            sh,
            track,
            fractions,
            cam: camera(&[(0., 2.4, (560., 610., 1.6), (760., 570., 1.45)), (2.4, 4.9, (760., 570., 1.45), (930., 470., 1.28))]),
            flare: keys(&[(FLARE_AT, FLARE_AT + 0.15, 0., 1., Easing::EaseOut), (FLARE_AT + 0.15, 4.9, 1., 0.55, Easing::EaseInOut)]),
        }
    }
    /// The share of the Trail that the vine has covered.
    fn tip(&self, t: f32) -> f32 {
        let at = |k: usize| VINE_AT + STOP_GAP * k as f32;
        if t < at(0) {
            return self.fractions[0] * ease_out(((t - VINE_AT + 0.35) / 0.35).clamp(0., 1.));
        }
        for k in 0..9 {
            if t < at(k + 1) {
                let u = (t - at(k)) / STOP_GAP;
                return lerp(self.fractions[k], self.fractions[k + 1], u * u * (3. - 2. * u));
            }
        }
        1.
    }
}

impl Scene for Road {
    fn name(&self) -> &'static str {
        "OpeningRoad"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("thornwood-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let tip = self.tip(t);
        let world = painting(&self.sh, &frame, map, Grade { gold: 0.22, ..Default::default() });
        let center = spline(TRAIL, 4);
        let vine = bramble_in(&center, 10., 7., tip, t, 811, true);
        let glow_d = taper(&center, 30., 22., tip);
        // Light flows along the grown vine, two waves per LOOP.
        let n = center.len();
        let pulses = (0..14u32)
            .filter_map(|k| {
                let u = ((t / LOOP) * 1. + k as f32 / 14.).rem_euclid(1.);
                if u > tip {
                    return None;
                }
                let (x, y) = center[((n - 1) as f32 * u) as usize];
                Some(fframes::svgr!(<circle cx={x} cy={y} r="5" fill="#fff4c8" opacity={0.85 * (PI * (u / tip.max(0.01))).sin().max(0.15)} />))
            })
            .collect::<Vec<_>>();
        let tip_point = self.track.at(tip);
        let head = if tip < 1. && t > VINE_AT - 0.35 {
            fframes::svgr!(<g><circle cx={tip_point.0} cy={tip_point.1} r="36" fill="url(#g-gold)" /><circle cx={tip_point.0} cy={tip_point.1} r="5" fill="#fffef0" /></g>)
        } else {
            Svgr::empty()
        };
        // Each clearing blooms with a ring of leaves; the forest trembles.
        let mut tremor = (0., 0.);
        let mut passed = 0.;
        let clearings = STOPS
            .iter()
            .enumerate()
            .map(|(k, &(x, y))| {
                let at = VINE_AT + STOP_GAP * k as f32;
                let dt = t - at;
                let (sx, sy) = shake(t, at, 4.);
                tremor = (tremor.0 + sx, tremor.1 + sy);
                if dt <= 0. {
                    return Svgr::empty();
                }
                passed += 1.;
                let breathe = 0.75 + 0.25 * wave(t, 1., k as f32 * 0.1);
                let ring = if dt < 0.9 {
                    let a = dt / 0.9;
                    let leaves = (0..10u32)
                        .map(|j| {
                            let ang = TAU * j as f32 / 10. + rnd(j, k as u32);
                            let d = 14. + 70. * ease_out(a);
                            let fill = LEAF_FILLS[(j as usize + k) % 4];
                            fframes::svgr!(<path d={leaf(10.)} transform={format!("translate({:.1} {:.1}) rotate({:.0})", x + ang.cos() * d, y + ang.sin() * d * 0.5 - 20. * (PI * a).sin(), ang.to_degrees() + 400. * a)} fill={fill} opacity={1. - a} />)
                        })
                        .collect::<Vec<_>>();
                    fframes::svgr!(<g><ellipse cx={x} cy={y} rx={20. + 80. * a} ry={8. + 30. * a} fill="none" stroke="#fff2c8" stroke-width={8. * (1. - a)} opacity={1. - a} />{leaves}</g>)
                } else {
                    Svgr::empty()
                };
                fframes::svgr!(
                    <g>
                        <ellipse cx={x} cy={y} rx="62" ry="28" fill="url(#g-gold)" opacity={0.45 * breathe * bloom(dt).min(1.)} />
                        {ring}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The giant's eye opens a little more with each clearing, and flares at the end.
        let flare = frame.animate(&self.flare);
        let eye_glow = 0.08 * passed + 0.6 * flare + 0.08 * wave(t, 1., 0.) * after(t, FLARE_AT, 0.3);
        let (ex, ey) = EYE_R;
        let (lx, ly) = EYE_L;
        let eye = fframes::svgr!(
            <g>
                <circle cx={FACE.0} cy={FACE.1} r={160. + 200. * flare} fill="url(#g-eye-halo)" opacity={0.6 * flare} />
                <ellipse cx={ex} cy={ey} rx={34. + 22. * flare} ry={20. + 12. * flare} fill="url(#g-eye-halo)" opacity={eye_glow.min(1.)} />
                <ellipse cx={ex} cy={ey} rx="12" ry={3. + 5. * flare} fill="#fff4c0" opacity={eye_glow.min(1.)} filter="url(#blur3u)" />
                <ellipse cx={lx} cy={ly} rx={30. + 16. * flare} ry={16. + 10. * flare} fill="url(#g-eye-halo)" opacity={(eye_glow - 0.3).max(0.).min(1.)} />
                <ellipse cx={lx} cy={ly} rx="10" ry={2. + 4. * flare} fill="#fff4c0" opacity={(eye_glow - 0.3).max(0.).min(1.)} filter="url(#blur3u)" />
            </g>
        );
        let (fx, fy) = shake(t, FLARE_AT, 10.);
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (tremor.0 + fx, tremor.1 + fy))}>
                    {world}
                    <path d={glow_d} fill="#ff9a10" opacity="0.65" filter="url(#blur8u)" />
                    {vine}
                    {pulses}
                    {clearings}
                    {head}
                    {eye}
                </g>
                {rays(&self.sh, &frame, (-160., -140.), 0.4, 1.1, SUN)}
                {pollen(t, 0.5, 1601)}
                {falling(t, 0.55, 10, 1621, 13., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.6" />
            </g>
        )
    }
}
