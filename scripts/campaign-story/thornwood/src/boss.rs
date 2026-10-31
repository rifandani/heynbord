//! Boss: the giant wakes, the Old Bramble, the cutters, the thorn in your hand, the challenge.
use crate::fx::*;
use crate::hollows::{amber, leaf, spline, taper};
use crate::mesa::{after, banner, burst, debris, dust_burst, ease_out, flash, project, punch, shock_ring};
use crate::opening::gash;
use crate::wood::*;
use crate::CLIP_FRAMES;
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Shader, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const AMBER: (f32, f32, f32) = (1.0, 0.7, 0.25);

/// A slow blink once per LOOP, at `phase`: 1 open, 0 closed.
fn blink(t: f32, phase: f32) -> f32 {
    let u = (loop_phase(t) - phase + 0.5).rem_euclid(1.);
    (((u - 0.5).abs() - 0.025) * 10.).clamp(0., 1.)
}

/// A rumble of the ground: a shake whose strength follows `amp`. Whole cycles
/// per LOOP, so a tremor in the hold loops without a seam.
fn rumble(t: f32, amp: f32) -> (f32, f32) {
    (amp * (0.6 * wave(t, 34., 0.) + 0.4 * wave(t, 20., 0.3)), amp * (0.6 * wave(t, 30., 0.6) + 0.4 * wave(t, 18., 0.1)))
}

// ---------------------------------------------------------------- 1. Wakes

const QUAKE_AT: f32 = 0.5;
const EYES_AT: [f32; 2] = [2.5, 2.75];
const ROAR_AT: f32 = 3.5;

#[derive(Debug)]
pub struct Wakes {
    sh: Shaders,
    cam: Cam,
    quake: Anim,
    writhe: Anim,
    flash: Anim,
}

impl Wakes {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 4.9, (980., 430., 1.3), (1192., 250., 2.15))]),
            quake: keys(&[(QUAKE_AT, QUAKE_AT + 0.4, 0., 7., Easing::EaseOut), (QUAKE_AT + 0.4, 3.0, 7., 4., Easing::Linear), (3.0, ROAR_AT, 4., 10., Easing::EaseIn), (ROAR_AT, 4.9, 10., 0., Easing::EaseOut)]),
            writhe: tw(QUAKE_AT, QUAKE_AT + 2.2, 0., 1., Easing::EaseOut),
            flash: flash(ROAR_AT, 0.18, 0.5),
        }
    }
}

/// An eye of the giant on the Region Map, in map units; `open` 0..1.
fn map_eye<'a>((x, y): (f32, f32), w: f32, open: f32, glow: f32) -> Svgr<'a> {
    let halo = fframes::svgr!(<ellipse cx={x} cy={y} rx={w * 3.4} ry={w * 2.2} fill="url(#g-eye-halo)" opacity={0.8 * glow * (0.55 + 0.45 * open.min(1.))} />);
    if open <= 0.02 {
        return halo;
    }
    let h = w * 0.42 * open;
    let d = format!("M{:.1} {y:.1} Q{x:.1} {:.1} {:.1} {y:.1} Q{x:.1} {:.1} {:.1} {y:.1}Z", x - w, y - h * 1.6, x + w, y + h * 1.1, x - w);
    fframes::svgr!(
        <g>
            {halo}
            <path d={d.clone()} fill="url(#g-eye)" />
            <ellipse cx={x} cy={y} rx={w * 0.14} ry={h * 0.8} fill="#2a0c02" opacity="0.85" />
            <path d={d} fill="none" stroke="#2a1406" stroke-width={w * 0.12} />
            <circle cx={x - w * 0.3} cy={y - h * 0.4} r={w * 0.1} fill="#fffbe8" opacity={0.8 * glow} />
        </g>
    )
}

impl Scene for Wakes {
    fn name(&self) -> &'static str {
        "BossWakes"
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
        // Small tremors stay in the hold, once per LOOP.
        let tremor = 3. * (wave(t, 1., 0.1).max(0.)).powi(8) * after(t, 4.6, 0.4);
        let amp = frame.animate(&self.quake) + tremor;
        let quake = rumble(t, amp);
        let world = painting(&self.sh, &frame, map, Grade { gold: 0.15, dark: 0.1, dusk: 0.15, ..Default::default() });
        // The brambles on the hill writhe while the giant wakes.
        let writhe = frame.animate(&self.writhe);
        let brambles = [
            (&[(1020., 360.), (1060., 330.), (1100., 340.), (1130., 300.), (1110., 270.)][..], 0.),
            (&[(1300., 360.), (1270., 320.), (1300., 290.), (1340., 300.), (1350., 260.)][..], 0.4),
            (&[(1120., 380.), (1160., 350.), (1210., 360.), (1250., 340.), (1290., 360.)][..], 0.8),
        ]
        .iter()
        .enumerate()
        .map(|(i, (pts, ph))| {
            let sway = (6. + 10. * amp / 10.) * wave(t, 2., *ph);
            let moved = pts.iter().enumerate().map(|(j, &(x, y))| (x + sway * (j as f32 / 4.), y - sway * 0.5 * (j as f32 / 4.))).collect::<Vec<_>>();
            bramble(&spline(&moved, 6), 7., 2.5, writhe, t, 700 + i as u32)
        })
        .collect::<Vec<_>>();
        // The eyes open in the bark of the painted face, and amber light pours out.
        let open = |at: f32| ease_out(((t - at) / 0.5).clamp(0., 1.)) * blink(t, 0.6);
        let glow = after(t, EYES_AT[0], 0.6) * (0.85 + 0.15 * wave(t, 1., 0.)) + 0.6 * after(t, ROAR_AT - 0.1, 0.2) * (1. - after(t, ROAR_AT + 0.2, 1.0));
        let eyes = fframes::svgr!(
            <g>
                {map_eye(EYE_L, 15., open(EYES_AT[0]), glow)}
                {map_eye(EYE_R, 16., open(EYES_AT[1]), glow)}
            </g>
        );
        let (ex, ey) = project(cam, ((EYE_L.0 + EYE_R.0) / 2., (EYE_L.1 + EYE_R.1) / 2.));
        let (mx, my) = project(cam, (1210., 262.));
        let roar = sound_rings(mx, my, t, ROAR_AT, 0.15, 3, 700., "#ffe2a0");
        let birds = fframes::svgr!(
            <g>
                {flock(t, QUAKE_AT + 0.3, (900., 260.), (260., 120.), 16, 51, 16., "#1a1006", 2.6)}
                {flock(t, QUAKE_AT + 0.7, (1180., 160.), (1180., 40.), 12, 57, 14., "#1a1006", 2.4)}
            </g>
        );
        let rain = (amp / 10.).min(1.);
        let dust = Motes { count: 60, seed: 2101, area: (0., 200., 1280., 600.), rise: -260., period: LOOP, size: (1., 3.4), sway: 30., fill: "url(#g-moss-dust)" };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, quake)}>
                    {world}
                    {brambles}
                    {eyes}
                </g>
                {rays(&self.sh, &frame, (ex, ey), 0.75 * glow.min(1.), 0.9, AMBER)}
                {roar}
                {birds}
                {falling(t, 0.4 + 0.6 * rain, 26, 2111, 15., (0., -40., 1280., 760.))}
                {dust.draw(t, 0.8 * rain)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
                <rect width="1280" height="720" fill="#fff0c8" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Bramble

const NAME: &str = "THE OLD BRAMBLE";
const CRACK_AT: f32 = 1.2;
const PLATE_AT: f32 = 2.4;

#[derive(Debug)]
pub struct Bramble {
    bark: Shader,
    cam: Cam,
    open: Anim,
    mouth: Anim,
    anger: Anim,
    plate: Anim,
}

impl Bramble {
    pub fn new(_sh: Shaders) -> Self {
        Self {
            bark: bark_shader(),
            cam: camera(&[(0., 5.0, (640., 400., 1.12), (640., 380., 1.0))]),
            open: keys(&[(0.2, 0.9, 0.35, 1.0, Easing::EaseOut), (0.9, 2.2, 1.0, 0.82, Easing::EaseInOut)]),
            mouth: keys(&[(CRACK_AT, CRACK_AT + 0.35, 0., 0.7, Easing::EaseOut), (CRACK_AT + 0.35, 3.4, 0.7, 0.45, Easing::EaseInOut)]),
            anger: tw(2.0, 2.8, 0., 0.55, Easing::EaseInOut),
            plate: tw(PLATE_AT, PLATE_AT + 1.4, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Bramble {
    fn name(&self) -> &'static str {
        "BossBramble"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        // The mouth breathes in the hold.
        let mouth = frame.animate(&self.mouth) + 0.06 * wave(t, 1., 0.25) * after(t, 3.4, 0.5);
        let pose = Pose { open: frame.animate(&self.open), anger: frame.animate(&self.anger), mouth, glow: 0.95, look: 0.15 * wave(t, 1., 0.6) * after(t, 3.0, 1.0) };
        let face = giant_face(&self.bark, &frame, t, pose, cam, 1.);
        let to_screen = |(x, y): (f32, f32)| (640. + (x - cam.0) * cam.2, 360. + (y - cam.1) * cam.2);
        let (lx, ly) = to_screen((480., 600.));
        let (rx, ry) = to_screen((800., 600.));
        let splinters = fframes::svgr!(
            <g>
                {burst(lx, ly, t - CRACK_AT, 0.9, 16, 31, 420., "#c89a62")}
                {burst(rx, ry, t - CRACK_AT, 0.9, 16, 37, 420., "#c89a62")}
                {dust_burst(640., ry, t - CRACK_AT, 1.2, 10, 39, 420., "url(#g-moss-dust)")}
            </g>
        );
        let (sx, sy) = shake(t, CRACK_AT, 9.);
        let plate_k = frame.animate(&self.plate);
        let plate = thorn_plate(&mut frame, ctx, 640., 118., NAME, plate_k, t);
        let fog = Motes { count: 36, seed: 2201, area: (0., 60., 1280., 700.), rise: 200., period: LOOP, size: (1., 2.6), sway: 30., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform={format!("translate({sx:.1} {sy:.1})")}>{face}</g>
                {splinters}
                {falling(t, 0.85, 14, 2211, 16., (0., -20., 1280., 400.))}
                {fog.draw(t, 0.5)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                {plate}
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Cutters

/// The cutters walk in from the left and stop at the trunk: (stop x, delay).
const WALKERS: [(f32, f32); 4] = [(690., 0.0), (540., 0.25), (390., 0.5), (240., 0.75)];
const STOP_AT: f32 = 2.1;
/// The three cuts in the trunk, in screen space, and their times.
const TRUNK_CUTS: [((f32, f32), (f32, f32), f32); 3] = [((800., 380.), (860., 470.), 2.5), ((870., 330.), (930., 450.), 3.0), ((940., 400.), (990., 470.), 3.5)];
const TRUNK_EYE: (f32, f32) = (1040., 168.);

#[derive(Debug)]
pub struct Cutters {
    sh: Shaders,
    bark: Shader,
    walk: Vec<Anim>,
}

impl Cutters {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            bark: bark_shader(),
            walk: WALKERS.iter().map(|&(x, d)| tw(d * 0.4, STOP_AT + d * 0.3, -200. - 220. * d, x, Easing::EaseOut)).collect(),
        }
    }
}

/// A giant root arching over the ground in moonlight, its path in screen space.
fn night_root<'a>(pts: &[(f32, f32)], w0: f32, w1: f32) -> Svgr<'a> {
    let center = spline(pts, 6);
    let d = taper(&center, w0, w1, 1.);
    fframes::svgr!(
        <g>
            <path d={d.clone()} fill="#020308" />
            <path d={d} fill="none" stroke="#7a9ad8" stroke-width="2" opacity="0.35" />
        </g>
    )
}

impl Scene for Cutters {
    fn name(&self) -> &'static str {
        "BossCutters"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        // The trunk of the giant fills the right side, with one eye high in its bark.
        let cuts_done = TRUNK_CUTS.iter().filter(|c| t > c.2).count() as f32;
        let jolt = TRUNK_CUTS.iter().map(|c| ((t - c.2) * 6.).clamp(0., 1.) * (1. - ((t - c.2 - 0.2) * 2.).clamp(0., 1.))).sum::<f32>();
        let pose = Pose { open: 0.12 + 0.17 * cuts_done + 0.15 * jolt, anger: 0.2 * cuts_done, mouth: 0., glow: 0.3 + 0.22 * cuts_done + 0.3 * jolt, look: -0.6 };
        // The eye sits high in the trunk, at TRUNK_EYE on screen.
        let trunk_cam = (F_EYE_R.0 - (TRUNK_EYE.0 - 640.) / 1.25, F_EYE_R.1 - (TRUNK_EYE.1 - 360.) / 1.25, 1.25);
        let trunk_shape = "M760 -20 C740 120 720 260 744 360 C760 440 730 560 700 740 L1300 740 L1300 -20Z";
        let layer = bark_layer(&self.bark, &frame, trunk_cam, (0.4, 0.46, 0.66), (0.01, 0.012, 0.03), 0.5);
        let trunk = fframes::svgr!(
            <g>
                <defs><clipPath id="tw-trunk"><path d={trunk_shape} /></clipPath></defs>
                <g clip-path="url(#tw-trunk)">
                    <image href={layer.href()} x="0" y="0" width="1280" height="720" />
                    <g transform={view(trunk_cam)}>
                        <ellipse cx={F_EYE_R.0} cy={F_EYE_R.1 + 10.} rx="190" ry="120" fill="#010206" opacity="0.8" filter="url(#blur18)" />
                        {giant_eye(F_EYE_R, 1., pose, t)}
                    </g>
                    {carved(&layer, trunk_cam, &brow_shape(1., pose.anger), "tw-trunk-brow", (-50., 60.), "url(#g-brow-shade)", (8., 30.))}
                    <rect width="1280" height="720" fill="#0a1636" opacity="0.3" />
                </g>
                <path d={trunk_shape} fill="none" stroke="#8aa8e8" stroke-width="3" opacity="0.4" />
            </g>
        );
        let (tx, ty) = shake(t, 2.5, 4.);
        let (tx2, ty2) = shake(t, 3.0, 5.);
        let (tx3, ty3) = shake(t, 3.5, 6.);
        let quake = (tx + tx2 + tx3, ty + ty2 + ty3);
        let cuts = TRUNK_CUTS
            .iter()
            .enumerate()
            .map(|(i, &(a, b, at))| {
                let open = ((t - at) / 0.12).clamp(0., 1.);
                let fill = ((t - at - 0.2) / 1.0).clamp(0., 1.);
                fframes::svgr!(<g>{gash(a, b, open, ease_out(fill), t, 11 + i as u32)}{burst((a.0 + b.0) / 2., (a.1 + b.1) / 2., t - at, 0.6, 12, 90 + i as u32, 260., "#c8a070")}</g>)
            })
            .collect::<Vec<_>>();
        // Small hooded figures with lanterns of cold green fire walk to the trunk.
        let walkers = WALKERS
            .iter()
            .enumerate()
            .map(|(i, &(stop, _))| {
                let x = frame.animate(&self.walk[i]);
                let moving = (stop - x).abs() > 1.;
                let step = if moving { x / 90. } else { 0. };
                // The front two raise their knives for the cuts.
                let knife_k = if i < 2 { TRUNK_CUTS.iter().map(|c| { let d = t - c.2 + 0.25; if (0.0..0.5).contains(&d) { (PI * d / 0.5).sin() } else { 0. } }).sum::<f32>() } else { 0. };
                let bob = if moving { 0. } else { 1.5 * wave(t, 2., i as f32 * 0.3) };
                fframes::svgr!(<g transform={format!("translate({x:.1} {:.1}) scale({:.3})", 652. + bob, 1.55 - 0.08 * i as f32)}>{cutter(t, step, knife_k.min(1.), 1., 0.3 + i as f32 * 0.21)}</g>)
            })
            .collect::<Vec<_>>();
        let lanterns_glow = WALKERS
            .iter()
            .enumerate()
            .map(|(i, _)| {
                let x = frame.animate(&self.walk[i]);
                fframes::svgr!(<ellipse cx={x + 70.} cy="652" rx="170" ry="26" fill="#5aff8a" opacity={0.22 + 0.06 * flicker(t, i as f32)} filter="url(#blur8)" />)
            })
            .collect::<Vec<_>>();
        // Amber spills into the jars at the foot of the trunk.
        let jars = [(760., 664., 0.0), (836., 672., 0.4)]
            .iter()
            .map(|&(x, y, d)| fframes::svgr!(<g transform={format!("translate({x} {y})")}>{jar(64., after(t, 2.8 + d, 1.2), t, (x as u32) / 7)}</g>))
            .collect::<Vec<_>>();
        let fog = Fog { density: 0.45, soft: 0.3, light: Color::hex("#5a6a9a"), shade: Color::hex("#0a0e1e"), dir: (0.4, 0.0), scale: 1.6, seed: 31.0 };
        let stars = (0..40u32)
            .map(|k| {
                let (x, y) = (lerp(0., 760., rnd(k, 1)), lerp(0., 300., rnd(k, 2)));
                fframes::svgr!(<circle cx={x} cy={y} r={lerp(0.6, 1.6, rnd(k, 3))} fill="#dfe8ff" opacity={0.3 + 0.4 * (0.5 + 0.5 * wave(t, 2. + (rnd(k, 4) * 3.).floor(), rnd(k, 5)))} />)
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="url(#g-moon)" />
                {stars}
                <circle cx="210" cy="140" r="54" fill="#eef2ff" opacity="0.9" />
                <circle cx="210" cy="140" r="160" fill="url(#tw-moonglow)" />
                <g transform={format!("translate({:.1} {:.1})", quake.0, quake.1)}>
                    {night_root(&[(-40., 520.), (120., 470.), (300., 520.), (420., 600.), (520., 700.)], 70., 30.)}
                    {night_root(&[(380., 760.), (470., 600.), (620., 560.), (720., 620.), (780., 740.)], 60., 26.)}
                    {night_root(&[(-60., 680.), (200., 600.), (380., 640.), (520., 740.)], 56., 24.)}
                    <rect x="-20" y="640" width="1320" height="100" fill="#020308" />
                    {trunk}
                    {cuts}
                    {jars}
                </g>
                {lanterns_glow}
                {walkers}
                {fog.draw(&self.sh, &frame, 0.5, (-40., 560., 1360., 200.))}
                {falling(t, 0.35, 8, 2311, 13., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
                <defs>
                    <radialGradient id="tw-moonglow">
                        <stop offset="0" stop-color="#c8d8ff" stop-opacity="0.45" />
                        <stop offset="1" stop-color="#4a6aa8" stop-opacity="0" />
                    </radialGradient>
                </defs>
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Thorn

const RISE_AT: f32 = 0.25;
const FOCUS_AT: f32 = 1.6;
const SLAM_AT: f32 = 2.9;

#[derive(Debug)]
pub struct Thorn {
    bark: Shader,
    rise: Anim,
    focus: Anim,
    slam: Anim,
    open: Anim,
    punch: Anim,
}

impl Thorn {
    pub fn new(_sh: Shaders) -> Self {
        Self {
            bark: bark_shader(),
            rise: spring(RISE_AT, 420., 0., SOFT),
            focus: tw(FOCUS_AT, FOCUS_AT + 0.9, 1., 0., Easing::EaseInOut),
            slam: spring(SLAM_AT, 0., 1., BOUNCY),
            open: keys(&[(0., FOCUS_AT, 0.95, 1.05, Easing::EaseInOut), (SLAM_AT, SLAM_AT + 0.14, 1.05, 0.42, Easing::EaseIn)]),
            punch: punch(SLAM_AT + 0.1, 1.05),
        }
    }
}

impl Scene for Thorn {
    fn name(&self) -> &'static str {
        "BossThorn"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let slam = frame.animate(&self.slam).max(0.);
        // The angry eye quivers in the hold.
        let quiver = 0.05 * wave(t, 8., 0.) * after(t, SLAM_AT + 0.5, 0.5);
        let pose = Pose { open: frame.animate(&self.open), anger: slam.min(1.2), mouth: 0., glow: 1.0 + 0.2 * slam, look: -0.05 + quiver };
        let cam = (F_EYE_R.0 - 10., F_EYE_R.1 + 10., 3.0 * frame.animate(&self.punch));
        let blur = 9. * frame.animate(&self.focus);
        let eye = giant_face(&self.bark, &frame, t, pose, cam, 0.85);
        let rise = frame.animate(&self.rise);
        let bob = 6. * wave(t, 1., 0.1);
        let (sx, sy) = shake(t, SLAM_AT + 0.1, 12.);
        // The drop, backlit, with the thorn inside.
        let drop = fframes::svgr!(
            <g transform={format!("translate(520 {:.1})", 480. + rise + bob)}>
                <circle r="330" fill="url(#g-amber-halo)" opacity="0.35" />
                {amber(156., 1., t, 41)}
            </g>
        );
        let leaves = falling(t + 0.7, after(t, SLAM_AT, 0.2), 18, 2411, 18., (0., -80., 1280., 760.));
        fframes::svgr!(
            <g>
                <defs>
                    <filter id="tw-focus" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={blur.max(0.01)} /></filter>
                </defs>
                <g transform={format!("translate({sx:.1} {sy:.1})")}>
                    <g filter="url(#tw-focus)">{eye}</g>
                </g>
                <rect width="1280" height="720" fill="#3a1404" opacity={0.25 * (blur / 9.)} />
                {drop}
                {leaves}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Challenge

/// The three lanes recede from your side (left) toward the giant (right).
const NEAR: [(f32, f32); 3] = [(270., 92.), (410., 106.), (560., 120.)];
const FAR: [(f32, f32); 3] = [(232., 58.), (356., 66.), (482., 74.)];
const LANE_L: f32 = 140.;
const LANE_R: f32 = 900.;
const NEST_U: f32 = 0.78;
const COLOSSUS_U: f32 = 0.86;
const NEST_AT: f32 = 1.6;
const CRACK_AT_C: f32 = 2.2;
const RISE_C: f32 = 2.5;
const GLARE_AT: f32 = 3.3;

fn lane_at(i: usize, u: f32) -> (f32, f32, f32) {
    (lerp(LANE_L, LANE_R, u), lerp(NEAR[i].0, FAR[i].0, u), lerp(NEAR[i].1, FAR[i].1, u))
}

#[derive(Debug)]
pub struct Challenge {
    sh: Shaders,
    lanes: Vec<Anim>,
    hero_drop: Anim,
    nest: Anim,
    colossus: Anim,
    glare: Anim,
    punch: Anim,
    flash: Anim,
}

impl Challenge {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            lanes: (0..3).map(|i| tw(0.3 + 0.12 * i as f32, 1.1 + 0.12 * i as f32, 0., 1., Easing::EaseInOut)).collect(),
            hero_drop: tw(0.05, 0.35, -420., 0., Easing::EaseIn),
            nest: tw(NEST_AT - 0.35, NEST_AT, 0., 1., Easing::EaseIn),
            colossus: spring(RISE_C, 0., 1., HEAVY),
            glare: keys(&[(GLARE_AT - 0.1, GLARE_AT, 0., 1., Easing::Linear), (GLARE_AT, GLARE_AT + 1.2, 1., 0.45, Easing::EaseOut)]),
            punch: punch(GLARE_AT, 1.04),
            flash: flash(RISE_C + 0.1, 0.18, 0.45),
        }
    }
}

/// A card that falls into its lane, lands and throws a ring of leaves.
fn land_card<'a>(art: &fframes::media::ImageData<'_>, t: f32, at: f32, fall: f32, (cx, cy): (f32, f32), scale: f32) -> Svgr<'a> {
    if fall <= 0. {
        return Svgr::empty();
    }
    let x = lerp(cx + 100., cx, fall);
    let y = lerp(-200., cy, fall);
    let rot = lerp(24., -3., fall);
    let s = lerp(scale * 1.5, scale, fall);
    let ground = cy + 70. * scale / 1.2;
    let dt = t - at;
    let ring = if (0.0..0.9).contains(&dt) {
        let a = dt / 0.9;
        let leaves = (0..16u32)
            .map(|k| {
                let ang = TAU * k as f32 / 16. + rnd(k, 5);
                let d = (60. + 260. * ease_out(a)) * scale;
                let (lx, ly) = (cx + ang.cos() * d, ground + ang.sin() * d * 0.25 - 40. * (PI * a).sin());
                let fill = LEAF_FILLS[k as usize % 4];
                fframes::svgr!(<path d={leaf(16.)} transform={format!("translate({lx:.1} {ly:.1}) rotate({:.0})", ang.to_degrees() + 720. * a)} fill={fill} opacity={1. - a} />)
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                <ellipse cx={cx} cy={ground} rx={50. + 240. * a * scale} ry={12. + 46. * a * scale} fill="none" stroke="#fff2c8" stroke-width={12. * (1. - a)} opacity={1. - a} />
                {leaves}
            </g>
        )
    } else {
        Svgr::empty()
    };
    let pulse = if t > at { 0.5 * (0.75 + 0.25 * wave(t, 2., cx * 0.001)) } else { 0. };
    fframes::svgr!(
        <g>
            <ellipse cx={cx} cy={cy} rx={110. * scale} ry={130. * scale} fill="url(#g-gold)" opacity={pulse} />
            {ring}
            <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({s:.3})")}>
                <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                {card_front(art)}
            </g>
        </g>
    )
}

impl Scene for Challenge {
    fn name(&self) -> &'static str {
        "BossChallenge"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(field), Some(nest), Some(colossus)) = (
            ctx.get_image("thornwood.png"),
            ctx.get_image("card-bramble-nest.png"),
            ctx.get_image("card-mountain-colossus.png"),
        ) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let glare = frame.animate(&self.glare);
        let painting = painting(&self.sh, &frame, field, Grade { gold: 0.3, dusk: 0.35, dark: 0.22, ..Default::default() });
        let flow = (t / LOOP * 2.).rem_euclid(1.0);
        let lanes = (0..3)
            .map(|i| {
                let p = frame.animate(&self.lanes[i]);
                if p <= 0. {
                    return Svgr::empty();
                }
                let (nx, ny, nh) = lane_at(i, 0.);
                let (fx, fy, fh) = lane_at(i, 1.);
                let (hx, hy, hh) = lane_at(i, p.min(1.));
                let shape = format!("M{nx} {:.1} L{fx} {:.1} L{fx} {:.1} L{nx} {:.1}Z", ny - nh / 2., fy - fh / 2., fy + fh / 2., ny + nh / 2.);
                let edges = format!("M{nx} {:.1} L{fx} {:.1} M{nx} {:.1} L{fx} {:.1}", ny - nh / 2., fy - fh / 2., ny + nh / 2., fy + fh / 2.);
                let body = 0.1 + 0.15 * glare + 0.04 * wave(t, 2., i as f32 * 0.3);
                let head = if p < 1. {
                    fframes::svgr!(<g><circle cx={hx} cy={hy} r={hh} fill="url(#g-gold)" /><circle cx={hx} cy={hy} r="5" fill="#fffef4" /></g>)
                } else {
                    Svgr::empty()
                };
                let pulses = (0..4)
                    .flat_map(|k| {
                        let u = 0.5 * ((flow + k as f32 / 4.).rem_euclid(1.0));
                        [(u, "#fff4c8"), (1. - u, "#ffc070")]
                    })
                    .map(|(u, fill)| {
                        let (x, y, h) = lane_at(i, u);
                        let o = (PI * (u - 0.5).abs() * 2.).sin().max(0.).powf(0.6);
                        fframes::svgr!(<ellipse cx={x} cy={y} rx={h * 0.42} ry={h * 0.06} fill={fill} opacity={0.85 * o} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <defs>
                            <clipPath id={format!("tw-lane-{i}")}><rect x={LANE_L - 10.} y="0" width={(hx - LANE_L + 10.).max(0.1)} height="720" /></clipPath>
                        </defs>
                        <g clip-path={format!("url(#tw-lane-{i})")}>
                            <path d={shape} fill="url(#tw-lane-gold)" opacity={body} />
                            <path d={edges.clone()} stroke="url(#tw-lane-gold)" stroke-width="10" opacity={0.35 + 0.35 * glare} filter="url(#blur8u)" />
                            <path d={edges} stroke="url(#tw-lane-gold)" stroke-width="2.5" />
                            {pulses}
                        </g>
                        {head}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The Bramble Nest slams into the first Lane, and brambles burst up around it.
        let (nx, ny, _) = lane_at(0, NEST_U);
        let nest_card = land_card(nest, t, NEST_AT, frame.animate(&self.nest), (nx, ny), 0.82);
        let thicket = (0..5)
            .map(|k| {
                let grow = ((t - NEST_AT - 0.05 * k as f32) / 0.5).clamp(0., 1.);
                let a = lerp(-PI * 0.95, -PI * 0.05, k as f32 / 4.);
                let sway = 0.08 * wave(t, 1., k as f32 * 0.2);
                let pts = (0..=6)
                    .map(|j| {
                        let u = j as f32 / 6.;
                        let r = 30. + 90. * u;
                        (nx + (a + sway * u).cos() * r * 1.3, ny + 50. + (a + sway * u).sin() * r * 0.7 + 8. * (u * 7.).sin())
                    })
                    .collect::<Vec<_>>();
                bramble(&spline(&pts, 3), 8., 2., ease_out(grow), t, 960 + k)
            })
            .collect::<Vec<_>>();
        // The ground of the third Lane cracks, and the Colossus rises out of the rubble.
        let (cx, cy, _) = lane_at(2, COLOSSUS_U);
        let rise = frame.animate(&self.colossus);
        let crack_k = ((t - CRACK_AT_C) / 0.3).clamp(0., 1.);
        let crack = if crack_k > 0. {
            let d = (0..7)
                .map(|k| {
                    let a = TAU * k as f32 / 7. + rnd(k, 3);
                    let r = 90. * crack_k * lerp(0.6, 1.2, rnd(k, 4));
                    format!("M{cx:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} ", cy + 70., cx + a.cos() * r * 0.5, cy + 70. + a.sin() * r * 0.16, cx + a.cos() * r, cy + 70. + a.sin() * r * 0.3)
                })
                .collect::<String>();
            fframes::svgr!(<g><ellipse cx={cx} cy={cy + 70.} rx={100. * crack_k} ry={24. * crack_k} fill="#1a0c04" opacity="0.7" /><path d={d.clone()} stroke="#1a0c04" stroke-width="4" fill="none" /><path d={d} stroke="#ffc070" stroke-width="1.5" fill="none" opacity={0.6 * (1. - after(t, RISE_C, 0.6))} /></g>)
        } else {
            Svgr::empty()
        };
        let colossus_card = if rise > 0.001 {
            let s = 1.0;
            let y = cy + 70. - 80. * s * rise.min(1.2);
            fframes::svgr!(
                <g>
                    <defs><clipPath id="tw-ground"><rect x={cx - 120.} y={cy - 220.} width="240" height="292" /></clipPath></defs>
                    <ellipse cx={cx} cy={cy} rx="120" ry="140" fill="url(#g-gold)" opacity={0.45 * rise.min(1.) * (0.75 + 0.25 * wave(t, 2., 0.4))} />
                    <g clip-path="url(#tw-ground)">
                        <g transform={format!("translate({cx:.1} {y:.1}) scale({s:.3}) rotate({:.1})", -3. * (1. - rise.min(1.)))}>
                            <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                            {card_front(colossus)}
                            <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="url(#g-epic)" stroke-width="4" opacity={rise.min(1.)} />
                            <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="#ffc070" stroke-width="10" opacity={(0.3 + 0.15 * wave(t, 2., 0.)) * rise.min(1.)} filter="url(#blur8)" />
                        </g>
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let rubble = fframes::svgr!(
            <g>
                {debris(cx, cy + 60., t - RISE_C, 1.6, 22, 971, 520., (-PI * 0.9, -PI * 0.1), 12.)}
                {dust_burst(cx, cy + 74., t - RISE_C, 1.6, 14, 977, 320., "url(#g-moss-dust)")}
                {shock_ring(cx, cy + 74., t - RISE_C, 0.8, 300., 60., "#ffe2a0")}
            </g>
        );
        // The giant looms over the glade at the right, and its eyes flare.
        let pose = Pose { open: 0.55 + 0.35 * glare, anger: 0.9, mouth: 0., glow: 0.6 + 0.8 * glare, look: -0.5 };
        let looming = fframes::svgr!(
            <g>
                <ellipse cx="1180" cy="80" rx="420" ry="260" fill="#050302" opacity="0.75" filter="url(#blur18)" />
                <g transform="translate(1110 104) scale(0.36) translate(-640 -330)">
                    {giant_eye(F_EYE_L, -1., pose, t)}
                    {giant_eye(F_EYE_R, 1., pose, t)}
                </g>
            </g>
        );
        let hero_flag = fframes::svgr!(<circle r="18" fill="#fff4cc" stroke="#a8641a" stroke-width="3" />);
        let hero_drop = frame.animate(&self.hero_drop);
        let hero_banner = fframes::svgr!(<g transform={format!("translate(84 {:.1})", 590. + hero_drop)}>{banner(t, 400., "#f0b83c", "#7a4a0c", hero_flag, 0.)}</g>);
        let zoom = frame.animate(&self.punch);
        let (kx, ky) = shake(t, RISE_C, 14.);
        let (nkx, nky) = shake(t, NEST_AT, 8.);
        let (gx, gy) = shake(t, GLARE_AT, 6.);
        let dust = Motes { count: 40, seed: 2501, area: (0., 200., 1280., 520.), rise: 160., period: LOOP, size: (1., 3.), sway: 30., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="tw-lane-gold" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="900" y2="0">
                        <stop offset="0" stop-color="#fff2c8" />
                        <stop offset="0.48" stop-color="#ffe08a" />
                        <stop offset="0.52" stop-color="#ffb860" />
                        <stop offset="1" stop-color="#ff7a1a" />
                    </linearGradient>
                </defs>
                <g transform={format!("translate(640 360) scale({zoom:.4}) translate(-640 -360)")}>
                    <g transform={format!("translate({:.1} {:.1})", kx + nkx + gx, ky + nky + gy)}>
                        <g transform="scale(0.8)">{painting}</g>
                        <rect width="1280" height="720" fill="url(#g-top-shade)" />
                        {looming}
                        {lanes}
                        {crack}
                        {thicket}
                        {nest_card}
                        {colossus_card}
                        {rubble}
                        {hero_banner}
                    </g>
                </g>
                {rays(&self.sh, &frame, (1110., 104.), 0.5 * glare, 0.8, AMBER)}
                {dust.draw(t, 0.5 + 0.3 * glare)}
                {falling(t, 0.5, 10, 2511, 14., (0., 0., 1280., 720.))}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#fff4dc" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}
