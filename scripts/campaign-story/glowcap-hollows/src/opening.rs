//! Opening: out of the dark, the grove at dusk, walls and traps, an arrow, your road.
use crate::fx::*;
use crate::hollows::*;
use crate::mesa::{after, burst, cut_seal, debris, dust_burst, flash, project, punch, tunnel_view};
use crate::{CLIP_FRAMES, STOPS, TRAIL};
use fframes::{Color, Duration, FFramesContext, Frame, Scene, Svgr, animation::Easing};
use std::f32::consts::{PI, TAU};

const CYAN: (f32, f32, f32) = (0.55, 1.0, 0.92);
const WARM: (f32, f32, f32) = (1.0, 0.86, 0.6);

/// Spores and fireflies of the hollows, over the full frame.
fn spores<'a>(t: f32, alpha: f32, seed: u32) -> Svgr<'a> {
    let spores = Motes { count: 46, seed, area: (0., 40., 1280., 720.), rise: 300., period: LOOP, size: (0.8, 2.4), sway: 34., fill: "url(#g-cyan)" };
    let flies = Motes { count: 22, seed: seed + 7, area: (0., 200., 1280., 560.), rise: 160., period: LOOP, size: (1.6, 3.6), sway: 60., fill: "url(#g-firefly)" };
    fframes::svgr!(<g>{spores.draw(t, alpha)}{flies.draw(t, alpha * 0.9)}</g>)
}

/// The glowing caps of the Region Map, each lit at its own time.
fn caps<'a>(t: f32, light_at: impl Fn(usize, (f32, f32)) -> f32) -> Svgr<'a> {
    let glows = CAPS
        .iter()
        .enumerate()
        .map(|(i, &(x, y, r, violet))| cap_glow(x, y, r, violet, bloom(t - light_at(i, (x, y))), t, i as u32))
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{glows}</g>)
}

// ---------------------------------------------------------------- 1. Exit

const TITLE: &str = "GLOWCAP HOLLOWS";
/// The Red Mesas ending stops on frame 269 of its tunnel shot.
const RM_END: f32 = 269. / 30.;
const IRIS: (f32, f32) = (640., 300.);
const SEAL: (f32, f32) = (640., 270.);
const BREAK_AT: f32 = 0.95;
const RUSH_AT: f32 = 1.15;
const OPEN_AT: f32 = 2.0;
const WAKE_AT: f32 = 2.15;
const WAKE_SPEED: f32 = 850.;
const TITLE_AT: f32 = 3.2;
const MAP_START: (f32, f32, f32) = (540., 560., 1.5);

#[derive(Debug)]
pub struct Exit {
    sh: Shaders,
    rush: Anim,
    cam: Cam,
    seal: Anim,
    flash: Anim,
    rule: Anim,
}

impl Exit {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            rush: tw(RUSH_AT, OPEN_AT, 0., 1., Easing::EaseIn),
            cam: camera(&[(OPEN_AT, 4.8, MAP_START, (720., 480., 1.18))]),
            seal: keys(&[(0.3, BREAK_AT, 0.9, 1.25, Easing::EaseIn), (BREAK_AT, BREAK_AT + 0.25, 1.25, 0., Easing::EaseOut)]),
            flash: flash(OPEN_AT, 0.85, 0.7),
            rule: tw(TITLE_AT + 0.85, TITLE_AT + 1.5, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Exit {
    fn name(&self) -> &'static str {
        "OpeningExit"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("glowcap-hollows-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let rush = frame.animate(&self.rush);
        let grade = Grade { dusk: 0.3, dark: 0.2, gold: 0.12, ..Default::default() };
        // Before the cut: the last frame of the Red Mesas tunnel, then the rush into
        // the glimpse. The painting in the glimpse moves to the map camera.
        let tunnel = if t < OPEN_AT + 0.05 {
            let ta = t + RM_END;
            let zoom = 1. + 3.2 * rush * rush;
            let r = 260. * (1. + 3.6 * rush * rush);
            let (s, cx, cy) = (lerp(0.72, 0.8 * MAP_START.2, rush), lerp(800., MAP_START.0, rush), lerp(450., MAP_START.1, rush));
            let (ox, oy) = (lerp(IRIS.0, 640., rush), lerp(IRIS.1, 360., rush));
            // The Red Mesas ending grades the glimpse with gold only.
            let p = painting(&self.sh, &frame, map, Grade { dusk: 0.3 * rush, dark: 0.2 * rush, gold: lerp(0.15, 0.12, rush), ..Default::default() });
            let breathe = 0.85 + 0.15 * wave(ta, 2., 0.);
            let ghost = frame.animate(&self.seal);
            let spores = Motes { count: 70, seed: 651, area: (140., 0., 1000., 760.), rise: 360., period: LOOP, size: (1., 3.2), sway: 30., fill: "url(#g-cyan)" };
            fframes::svgr!(
                <g>
                    <g transform={format!("translate({} {}) scale({zoom:.3}) translate({} {})", IRIS.0, IRIS.1, -IRIS.0, -IRIS.1)} opacity={1. - rush * 0.6}>
                        {tunnel_view(ta, IRIS, 7.2, 0.7, 0.51)}
                    </g>
                    <defs>
                        <clipPath id="gh-iris"><circle cx={IRIS.0} cy={IRIS.1} r={r} /></clipPath>
                    </defs>
                    <circle cx={IRIS.0} cy={IRIS.1} r={r + 60.} fill="url(#g-cyan)" opacity={0.8 * breathe} />
                    <g clip-path="url(#gh-iris)">
                        <g transform={format!("translate({ox:.1} {oy:.1}) scale({s:.3}) translate({:.1} {:.1})", -cx, -cy)}>{p}</g>
                        <circle cx={IRIS.0} cy={IRIS.1} r={r} fill="url(#g-cyan)" opacity="0.08" />
                    </g>
                    <circle cx={IRIS.0} cy={IRIS.1} r={r} fill="none" stroke="#e8fffb" stroke-width={3. + 8. * rush} opacity="0.6" />
                    <circle cx={SEAL.0} cy={SEAL.1} r="150" fill="#14061e" opacity={0.4 * ghost.min(1.)} filter="url(#blur18)" />
                    {cut_seal(SEAL.0, SEAL.1, 96. * (1. + 0.15 * (ghost - 0.9).max(0.)), ghost)}
                    {spores.draw(ta, 1. - rush)}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The seal breaks into spores that fly past the camera with the rush.
        let shards = (0..64u32)
            .filter_map(|i| {
                let born = BREAK_AT + 0.2 * rnd(i, 11);
                let dt = t - born;
                if !(0.0..1.3).contains(&dt) {
                    return None;
                }
                let a = TAU * rnd(i, 12);
                let r0 = 96. * lerp(0.2, 1.0, rnd(i, 13));
                let fly = 1. + 2.6 * dt * dt + 0.6 * dt;
                let x = SEAL.0 + a.cos() * r0 * fly;
                let y = SEAL.1 + a.sin() * r0 * fly * 0.9 + 30. * dt;
                let k = dt / 1.3;
                let fill = if rnd(i, 14) > 0.5 { "#e4c8ff" } else { "#c8fff4" };
                Some(fframes::svgr!(<circle cx={x} cy={y} r={lerp(1.8, 5.5, k) * lerp(0.6, 1.2, rnd(i, 15))} fill={fill} opacity={(1. - k) * 0.9} />))
            })
            .collect::<Vec<_>>();
        // After the cut: the Region Map, where a ring of light wakes the glowcaps.
        let land = if t >= OPEN_AT - 0.05 {
            let cam = frame.animate(&self.cam);
            let p = painting(&self.sh, &frame, map, grade);
            let wake_r = WAKE_SPEED * (t - WAKE_AT).max(0.);
            let ring = if t > WAKE_AT && wake_r < 1600. {
                let o = 1. - wake_r / 1600.;
                fframes::svgr!(
                    <g>
                        <circle cx={TUNNEL.0} cy={TUNNEL.1} r={wake_r} fill="none" stroke="#8ff6e6" stroke-width="26" opacity={0.3 * o} filter="url(#blur8u)" />
                        <circle cx={TUNNEL.0} cy={TUNNEL.1} r={wake_r} fill="none" stroke="#e8fffb" stroke-width="3" opacity={0.75 * o} />
                    </g>
                )
            } else {
                Svgr::empty()
            };
            let lit = caps(t, |_, (x, y)| WAKE_AT + ((x - TUNNEL.0).powi(2) + (y - TUNNEL.1).powi(2)).sqrt() / WAKE_SPEED);
            let mouth = 0.6 + 0.4 * flicker(t, 0.3);
            fframes::svgr!(
                <g transform={cam_transform(cam, (0., 0.))}>
                    {p}
                    <circle cx={TUNNEL.0} cy={TUNNEL.1} r="90" fill="url(#g-hall-light)" opacity={0.55 * mouth} />
                    {lit}
                    {ring}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Spores fly together into the title, letter by letter.
        let (glyphs, total) = letters(&mut frame, ctx, TITLE, 80, 6., 640.);
        let base = 150.;
        let gather = glyphs
            .iter()
            .enumerate()
            .flat_map(|(i, (_, gx, w))| {
                let arrive = TITLE_AT + 0.05 * i as f32;
                let (tx, ty) = (gx + w / 2., base - 28.);
                (0..7u32).filter_map(move |k| {
                    let s = (i as u32) * 7 + k;
                    let u = ((t - (arrive - 0.75)) / 0.75).clamp(0., 1.);
                    if !(0.0..1.0).contains(&((t - (arrive - 0.75)) / 0.75)) {
                        return None;
                    }
                    let (sx, sy) = (lerp(-100., 1380., rnd(s, 31)), lerp(200., 700., rnd(s, 32)));
                    let e = u * u * (3. - 2. * u);
                    let bend = 120. * (PI * e).sin() * lerp(-1., 1., rnd(s, 33));
                    let (x, y) = (lerp(sx, tx, e) + bend * 0.3, lerp(sy, ty, e) - bend);
                    Some(fframes::svgr!(<circle cx={x} cy={y} r={lerp(3., 1.4, e)} fill="#c8fff4" opacity={0.3 + 0.7 * e} />))
                })
            })
            .collect::<Vec<_>>();
        let face = glyphs
            .iter()
            .enumerate()
            .map(|(i, (c, gx, w))| {
                let dt = t - (TITLE_AT + 0.05 * i as f32);
                if dt <= 0. || c == " " {
                    return Svgr::empty();
                }
                let settle = ((t - 4.3) / 0.7).clamp(0., 1.);
                let b = bloom(dt * 0.8);
                let s = lerp(0.55 + 0.45 * b.min(1.15), 1., settle);
                let cx = gx + w / 2.;
                let halo = lerp(0.35 + 0.65 * (-dt * 3.).exp(), 0.35, settle);
                fframes::svgr!(
                    <g transform={format!("translate({cx:.1} {:.1}) scale({s:.3}) translate({:.1} {:.1})", base - 28., -cx, 28. - base)} opacity={(dt / 0.2).min(1.)}>
                        <text x={*gx} y={base} font-family="Cinzel" font-weight="900" font-size="80" fill="#7ff6e6" opacity={halo} filter="url(#blur8)">{c.clone()}</text>
                        <text x={*gx + 3.} y={base + 5.} font-family="Cinzel" font-weight="900" font-size="80" fill="#02060a" opacity="0.6">{c.clone()}</text>
                        <text x={*gx} y={base} font-family="Cinzel" font-weight="900" font-size="80" fill="url(#g-hollows-title)" stroke="#06201a" stroke-width="2">{c.clone()}</text>
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let sweep = loop_phase(t - 1.0);
        let shine = if t > TITLE_AT + 1.0 {
            glint(lerp(640. - total / 2. - 40., 640. + total / 2. + 40., sweep.powf(0.6)), 104. + 30. * sweep, 6., (PI * sweep).sin() * 0.85)
        } else {
            Svgr::empty()
        };
        let rule = frame.animate(&self.rule) * (total / 2. + 20.);
        fframes::svgr!(
            <g>
                {land}
                {tunnel}
                {shards}
                <rect width="1280" height="260" fill="url(#g-dusk-hollows)" opacity={0.75 * after(t, TITLE_AT - 0.5, 0.6)} />
                {spores(t, after(t, OPEN_AT, 1.0), 701)}
                {gather}
                {face}
                {shine}
                <path d={format!("M{:.1} 178 L{:.1} 178", 640. - rule, 640. + rule)} stroke="#8ff6e6" stroke-width="2.5" opacity="0.9" />
                <path d={format!("M{:.1} 185 L{:.1} 185", 640. - rule * 0.6, 640. + rule * 0.6)} stroke="#e8fffb" stroke-width="1.2" opacity="0.7" />
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.6" />
                <rect width="1280" height="720" fill="#e8fffb" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Grove

const SIGNS_AT: [f32; 3] = [2.6, 3.1, 3.6];

#[derive(Debug)]
pub struct Grove {
    sh: Shaders,
    cam: Cam,
    dusk: Anim,
    dark: Anim,
    falls: Anim,
    root: Anim,
    heal: Anim,
}

/// A mushroom silhouette, its foot at the origin; `light` glows the rim and gills of its cap.
fn mushroom<'a>(h: f32, w: f32, lean: f32, fill: &'static str, light: f32) -> Svgr<'a> {
    let stem = format!(
        "M{:.1} 0 C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} L{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} 0Z",
        -w * 0.16, -w * 0.12, -h * 0.4, -w * 0.1 + lean, -h * 0.7, -w * 0.08 + lean, -h * 0.8,
        w * 0.08 + lean, -h * 0.8, w * 0.1 + lean, -h * 0.7, w * 0.14, -h * 0.4, w * 0.16
    );
    let (l, r, top, rim, under) = (-w / 2. + lean, w / 2. + lean, -h * 1.2, -h * 0.8, -h * 0.75);
    let cap = format!(
        "M{l:.1} {rim:.1} C{:.1} {:.1} {:.1} {top:.1} {lean:.1} {top:.1} C{:.1} {top:.1} {:.1} {:.1} {r:.1} {rim:.1} C{:.1} {under:.1} {:.1} {under:.1} {l:.1} {rim:.1}Z",
        l + w * 0.02, rim - h * 0.26, l + w * 0.2, r - w * 0.2, r - w * 0.02, rim - h * 0.26, r - w * 0.3, l + w * 0.3
    );
    let top_edge = format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {top:.1} {lean:.1} {top:.1} C{:.1} {top:.1} {:.1} {:.1} {:.1} {:.1}", l + w * 0.04, rim - h * 0.06, l + w * 0.06, rim - h * 0.28, l + w * 0.22, r - w * 0.22, r - w * 0.06, rim - h * 0.28, r - w * 0.04, rim - h * 0.06);
    let spots = (0..5)
        .map(|k| {
            let u = lerp(0.2, 0.8, k as f32 / 4.);
            let x = lerp(l, r, u);
            let y = top + (h * 0.4) * ((u - 0.5) * 2.).powi(2) * 0.8 + h * 0.08;
            fframes::svgr!(<ellipse cx={x} cy={y} rx={w * 0.035} ry={w * 0.022} fill="#bff6ff" opacity={0.3 * light} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <path d={stem} fill={fill} />
            <path d={format!("M{:.1} {rim:.1} L{:.1} {rim:.1} L{:.1} {:.1} L{:.1} {:.1}Z", l + w * 0.2, r - w * 0.2, w * 0.12 + lean * 0.3, -h * 0.3, -w * 0.12 + lean * 0.3, -h * 0.3)} fill="url(#g-cyan)" opacity={0.22 * light} filter="url(#blur18)" />
            <ellipse cx={lean} cy={under} rx={w * 0.46} ry={h * 0.06} fill="#8ff6e6" opacity={0.6 * light} filter="url(#blur8u)" />
            <path d={cap} fill={fill} />
            {spots}
            <path d={top_edge} fill="none" stroke="#8ff6e6" stroke-width="2" opacity={0.15 + 0.5 * light} />
        </g>
    )
}

impl Grove {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 5.0, (440., 520., 1.85), (860., 450., 1.7))]),
            dusk: tw(0.2, 2.2, 0.15, 0.75, Easing::EaseInOut),
            dark: tw(0.2, 2.2, 0.08, 0.42, Easing::EaseInOut),
            falls: tw(1.5, 2.6, 0., 1., Easing::EaseOut),
            root: tw(SIGNS_AT[2], SIGNS_AT[2] + 1.0, 0., 1., Easing::EaseOut),
            heal: tw(SIGNS_AT[0] + 0.1, SIGNS_AT[0] + 0.8, 0., 1., Easing::EaseInOut),
        }
    }
}

impl Scene for Grove {
    fn name(&self) -> &'static str {
        "OpeningGrove"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("glowcap-hollows-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let p = painting(&self.sh, &frame, map, Grade { dusk: frame.animate(&self.dusk), dark: frame.animate(&self.dark), heat: 0.15, ..Default::default() });
        // The caps light in a chain from left to right.
        let lit = caps(t, |_, (x, _)| 0.7 + ((x - 300.) / 900.).max(0.) * 2.3);
        let falls_k = frame.animate(&self.falls);
        let falls = FALLS
            .iter()
            .enumerate()
            .map(|(i, &(x, y, h))| {
                let o = falls_k * (0.85 + 0.15 * wave(t, 2., i as f32 * 0.2));
                fframes::svgr!(
                    <g opacity={o}>
                        <ellipse cx={x} cy={y + h * 0.5} rx="22" ry={h * 0.7} fill="url(#g-cyan)" opacity="0.55" />
                        <path d={format!("M{:.1} {y:.1} L{:.1} {:.1} M{x:.1} {y:.1} L{x:.1} {:.1} M{:.1} {y:.1} L{:.1} {:.1}", x - 6., x - 7., y + h, y + h, x + 6., x + 7., y + h)} stroke="#e8fffb" stroke-width="2" stroke-dasharray="6 14" stroke-dashoffset={-t * 30.} opacity="0.8" />
                        <ellipse cx={x} cy={y + h} rx="26" ry="7" fill="#e8fffb" opacity={0.25 + 0.1 * wave(t, 4., i as f32 * 0.3)} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // Two soft foreground caps: one leaves at the left, one comes in at the right.
        let fg_dx = -(cam.0 - 440.) * 0.8 * cam.2 * 0.6;
        let fg = [(150., 770., 430., 300., 6., 1.1), (1500., 780., 460., 320., -10., 2.9)]
            .iter()
            .map(|&(x, y, h, w, lean, at)| {
                let light = bloom(t - at).min(1.) * (0.85 + 0.15 * wave(t, 1., x * 0.001));
                fframes::svgr!(<g transform={format!("translate({:.1} {y})", x + fg_dx)} filter="url(#blur3)">{mushroom(h, w, lean, "#06040c", light)}</g>)
            })
            .collect::<Vec<_>>();
        let ferns = (0..14u32)
            .map(|k| {
                let x = k as f32 * 150. + 20. + fg_dx * 1.1;
                let h = lerp(50., 110., rnd(k, 81));
                let sway = 5. * wave(t, 1., rnd(k, 82));
                let blades = (0..5)
                    .map(|b| {
                        let a = lerp(-55., 55., b as f32 / 4.) + sway;
                        fframes::svgr!(<path d={leaf(h * lerp(0.7, 1.0, rnd(b, k)))} transform={format!("rotate({a:.1})")} fill="#05070a" />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(<g transform={format!("translate({x:.1} 742)")}>{blades}</g>)
            })
            .collect::<Vec<_>>();
        // Three signs of the Elves: a wound that closes, a drop of poison, a root.
        let heal = frame.animate(&self.heal);
        let heal_k = after(t, SIGNS_AT[0] - 0.3, 0.4);
        let gash = 1. - heal;
        let mend = bloom(t - SIGNS_AT[0] - 0.8).min(1.) * (1. - after(t, SIGNS_AT[0] + 0.8, 0.9));
        let healing = fframes::svgr!(
            <g transform={format!("translate(300 690) rotate({:.1})", -28. + 3. * wave(t, 1., 0.1))} opacity={heal_k}>
                <path d={leaf(220.)} fill="none" stroke="#5ff2a8" stroke-width="10" opacity="0.45" filter="url(#blur8)" />
                <path d={leaf(220.)} fill="url(#g-leaf-dark)" stroke="#8ff6c8" stroke-width="2.5" />
                <path d="M0 -12 L0 -206 M0 -60 L-40 -96 M0 -60 L40 -96 M0 -110 L-34 -142 M0 -110 L34 -142 M0 -156 L-22 -180 M0 -156 L22 -180" stroke="#8ff6c8" stroke-width="2" opacity="0.6" fill="none" />
                <path d="M-50 -86 L40 -146" stroke="#f0ffd8" stroke-width={8. * gash + 0.1} stroke-linecap="round" opacity={gash} />
                <path d="M-50 -86 L40 -146" stroke="#b8ff7a" stroke-width={22. * gash + 0.1} stroke-linecap="round" opacity={0.35 * gash} filter="url(#blur8)" />
                <circle cx="-4" cy="-116" r={(110. * mend).max(0.1)} fill="url(#g-poison)" opacity={0.9 * mend} />
                {burst(-4., -116., t - SIGNS_AT[0] - 0.8, 0.7, 16, 721, 160., "#d8ffb0")}
            </g>
        );
        let drip_u = ((t - SIGNS_AT[1]) / LOOP).rem_euclid(1.);
        let drop = if t > SIGNS_AT[1] {
            let (form, fall) = (after(drip_u, 0., 0.45), after(drip_u, 0.45, 0.2));
            let y = -12. + 170. * fall * fall;
            let splash = after(drip_u, 0.65, 0.2);
            let ring = if (0.65..0.85).contains(&drip_u) {
                fframes::svgr!(<ellipse cx="0" cy="158" rx={4. + 40. * splash} ry={1.5 + 10. * splash} fill="none" stroke="#b8ff7a" stroke-width="2.5" opacity={1. - splash} />)
            } else {
                Svgr::empty()
            };
            let r = 4. + 6. * form;
            let show = after(drip_u, 0., 0.08) * (1. - after(drip_u, 0.62, 0.03));
            fframes::svgr!(
                <g>
                    <circle cx="0" cy={y} r={r * 4.} fill="url(#g-poison)" opacity={show} />
                    <path d={format!("M0 {:.1} C{:.1} {:.1} {:.1} {:.1} 0 {:.1} C{:.1} {:.1} {:.1} {:.1} 0 {:.1}Z", y - r * 2.2, r, y - r, r, y + r, y + r, -r, y + r, -r, y - r, y - r * 2.2)} fill="#c8ff8a" opacity={show} />
                    {ring}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let thorn_k = after(t, SIGNS_AT[1] - 0.35, 0.4);
        let branch = "M-220 -80 C-130 -40 -60 -54 20 -26 C90 -4 150 -40 260 -16";
        let poison = fframes::svgr!(
            <g transform="translate(1000 520)" opacity={thorn_k}>
                <path d={branch} fill="none" stroke="#8ff6e6" stroke-width="22" opacity="0.18" filter="url(#blur8)" />
                <path d={branch} fill="none" stroke="#06040a" stroke-width="16" stroke-linecap="round" />
                <path d={branch} fill="none" stroke="#8ff6e6" stroke-width="1.6" opacity="0.6" transform="translate(0 -7)" />
                <path d={thorn(46.)} transform="translate(0 -20) rotate(180)" fill="#06040a" stroke="#8ff6e6" stroke-width="1.2" stroke-opacity="0.6" />
                <path d={thorn(34.)} transform="translate(-110 -46) rotate(168)" fill="#06040a" stroke="#8ff6e6" stroke-width="1" stroke-opacity="0.5" />
                <path d={thorn(30.)} transform="translate(140 -24) rotate(192)" fill="#06040a" stroke="#8ff6e6" stroke-width="1" stroke-opacity="0.5" />
                <path d={thorn(26.)} transform="translate(-60 -60) rotate(-10)" fill="#06040a" />
                <g transform="translate(-4 24)">{drop}</g>
            </g>
        );
        let root_k = frame.animate(&self.root);
        let sway = 10. * wave(t, 1., 0.4);
        let curl = [(590., 770.), (630., 690.), (596., 610.), (650. + sway * 0.4, 552.), (716. + sway, 574.), (708. + sway, 636.), (668. + sway * 0.6, 640.)];
        let center = spline(&curl, 6);
        let roots = if root_k > 0. {
            let body = taper(&center, 44., 6., root_k);
            fframes::svgr!(
                <g>
                    <path d={body.clone()} fill="none" stroke="#5ff2a8" stroke-width="14" opacity="0.3" filter="url(#blur8)" />
                    <path d={body.clone()} fill="#0a0806" />
                    <path d={body} fill="none" stroke="#8ff6c8" stroke-width="2" opacity="0.8" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {p}
                    {falls}
                    {lit}
                </g>
                {spores(t, 0.3 + 0.7 * after(t, 1.0, 1.5), 721)}
                {fg}
                {ferns}
                {healing}
                {poison}
                {roots}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.75" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Walls

const FLARE_AT: f32 = 1.25;
const WALL_AT: [f32; 3] = [1.9, 2.25, 2.6];
const SNAP_AT: f32 = 3.75;
/// (center x, foot y, width, height, seed) of each wall section, in screen units.
const SECTIONS: [(f32, f32, f32, f32, u32); 3] = [(230., 712., 540., 330., 3), (1060., 700., 500., 300., 9), (640., 742., 470., 250., 17)];

#[derive(Debug)]
pub struct Walls {
    sh: Shaders,
    cam: Cam,
    dark: Anim,
    rises: Vec<Anim>,
    close: Anim,
    flash: Anim,
    trap_in: Anim,
}

impl Walls {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 1.6, (1040., 292., 1.6), (1092., 262., 3.0))]),
            dark: tw(1.7, 2.3, 0.15, 0.42, Easing::EaseInOut),
            rises: WALL_AT.iter().map(|&at| spring(at, 440., 0., BOUNCY)).collect(),
            close: tw(SNAP_AT - 0.1, SNAP_AT, 0., 1., Easing::EaseIn),
            flash: flash(SNAP_AT, 0.2, 0.4),
            trap_in: tw(3.0, 3.4, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Walls {
    fn name(&self) -> &'static str {
        "OpeningWalls"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("glowcap-hollows-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let slam = WALL_AT.iter().map(|&at| shake(t, at, 9.)).fold((0., 0.), |a, b| (a.0 + b.0, a.1 + b.1));
        let snap = shake(t, SNAP_AT, 12.);
        let kick = (slam.0 + snap.0, slam.1 + snap.1);
        let p = painting(&self.sh, &frame, map, Grade { dusk: 0.45, dark: frame.animate(&self.dark), ..Default::default() });
        // The glowcap in her hand flares: the price of the walls.
        let fk = bloom(t - FLARE_AT);
        let pulse = 0.8 + 0.2 * wave(t, 2., 0.);
        let flare = fframes::svgr!(
            <g>
                <circle cx={LADY_CAP.0} cy={LADY_CAP.1} r={(30. * fk.min(1.3)).max(0.1)} fill="url(#g-cyan)" opacity={0.85 * fk.min(1.) * pulse} />
                <circle cx={LADY_CAP.0} cy={LADY_CAP.1} r={3. + 2. * fk.min(1.)} fill="#f2fffc" opacity={fk.min(1.)} />
            </g>
        );
        let cap_screen = project(cam, LADY_CAP);
        let walls = SECTIONS
            .iter()
            .enumerate()
            .map(|(i, &(x, y, w, h, seed))| {
                let rise = frame.animate(&self.rises[i]);
                let dt = t - WALL_AT[i];
                if dt < 0. {
                    return Svgr::empty();
                }
                fframes::svgr!(
                    <g>
                        <g transform={format!("translate({x} {:.1})", y + rise)}>{palisade(seed, w, h, t)}</g>
                        {dust_burst(x, y, dt, 1.4, 20, seed + 40, w * 0.9, "url(#g-moss-dust)")}
                        {debris(x, y - 20., dt, 1.2, 12, seed + 50, 520., (-PI * 0.95, -PI * 0.05), 7.)}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let trap_k = frame.animate(&self.trap_in);
        let trap = if trap_k > 0. {
            fframes::svgr!(
                <g>
                    <g transform={format!("translate(640 {:.1}) scale(1.05)", 690. + 30. * (1. - trap_k))} opacity={trap_k}>{jaw_trap(frame.animate(&self.close))}</g>
                    {burst(640., 650., t - SNAP_AT, 0.7, 26, 911, 380., "url(#g-ember)")}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let motes = Motes { count: 40, seed: 741, area: (0., 200., 1280., 520.), rise: 240., period: LOOP, size: (0.8, 2.4), sway: 30., fill: "url(#g-cyan)" };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, kick)}>
                    {p}
                    {flare}
                </g>
                {rays(&self.sh, &frame, cap_screen, 0.35 * fk.min(1.) * pulse, 0.5, CYAN)}
                {motes.draw(t, 0.8)}
                <g transform={format!("translate({:.1} {:.1})", kick.0 * 1.4, kick.1 * 1.4)}>
                    {walls}
                    {trap}
                </g>
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
                <rect width="1280" height="720" fill="#fff6e0" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Arrow

const SHOOT_AT: f32 = 1.9;
const HIT_AT: f32 = 2.3;
const FROM: (f32, f32) = (760., 300.);
const HIT: (f32, f32) = (196., 368.);
/// (x, y, size, open time, blink phase) of each pair of eyes.
const EYES: [(f32, f32, f32, f32, f32); 9] = [
    (420., 330., 16., 0.4, 0.1), (520., 250., 12., 0.6, 0.55), (760., 300., 15., 0.8, 0.3), (880., 222., 11., 1.0, 0.8),
    (966., 360., 15., 1.2, 0.05), (330., 430., 12., 1.35, 0.42), (650., 386., 10., 1.5, 0.68), (1010., 270., 10., 1.65, 0.22), (566., 450., 13., 1.75, 0.9),
];
const POINTS: [(f32, f32, f32); 6] = [(470., 352., 0.1), (600., 262., 0.35), (840., 330., 0.6), (930., 250., 0.15), (720., 420., 0.82), (1000., 392., 0.5)];

#[derive(Debug)]
pub struct Arrow {
    sh: Shaders,
    flight: Anim,
    punch: Anim,
    flash: Anim,
    bow: Anim,
}

impl Arrow {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            flight: tw(SHOOT_AT, HIT_AT, 0., 1., Easing::EaseIn),
            punch: punch(HIT_AT, 1.035),
            flash: flash(HIT_AT, 0.16, 0.35),
            bow: tw(1.35, 1.9, 0., 1., Easing::EaseInOut),
        }
    }
}

/// A deep hollow at dusk: layers of giant mushroom silhouettes in violet fog.
/// `glow` lights the caps; the eyes of the Elves hide in the middle layer.
fn dusk_forest<'a>(sh: &Shaders, frame: &Frame, t: f32, glow: f32) -> (Svgr<'a>, Svgr<'a>) {
    let far = [(250., 470., 300., 240., 8.), (470., 440., 220., 170., -6.), (700., 455., 340., 280., 10.), (930., 445., 260., 200., -8.), (1110., 470., 300., 240., 6.)]
        .iter()
        .enumerate()
        .map(|(i, &(x, y, h, w, lean))| {
            let halo = if i % 2 == 0 { "url(#g-violet-soft)" } else { "url(#g-cyan)" };
            fframes::svgr!(
                <g transform={format!("translate({x} {y})")}>
                    <circle cx={lean} cy={-h * 0.84} r={w * 0.7} fill={halo} opacity={0.35 * glow * (0.85 + 0.15 * wave(t, 1., i as f32 * 0.2))} />
                    {mushroom(h, w, lean, "#2a2350", 0.35 * glow)}
                </g>
            )
        })
        .collect::<Vec<_>>();
    let mid = [(330., 562., 420., 330., -10.), (600., 600., 260., 200., 4.), (860., 576., 480., 380., 12.)]
        .iter()
        .map(|&(x, y, h, w, lean)| fframes::svgr!(<g transform={format!("translate({x} {y})")}>{mushroom(h, w, lean, "#120d22", 0.75 * glow)}</g>))
        .collect::<Vec<_>>();
    let near = (0..16u32)
        .map(|k| {
            let x = 160. + k as f32 * 64. + lerp(-20., 20., rnd(k, 91));
            let h = lerp(60., 130., rnd(k, 92));
            let sway = 4. * wave(t, 1., rnd(k, 93));
            let blades = (0..5)
                .map(|b| fframes::svgr!(<path d={leaf(h * lerp(0.7, 1.0, rnd(b, k + 40)))} transform={format!("rotate({:.1})", lerp(-60., 60., b as f32 / 4.) + sway)} fill="#05030a" />))
                .collect::<Vec<_>>();
            fframes::svgr!(<g transform={format!("translate({x:.1} {:.1})", 650. + lerp(-10., 10., rnd(k, 94)))}>{blades}</g>)
        })
        .collect::<Vec<_>>();
    let fog = Fog { density: 0.5, soft: 0.3, light: Color::hex("#7a6aaa"), shade: Color::hex("#1a1430"), dir: (-0.5, 0.05), scale: 1.4, seed: 31.0 };
    let back = fframes::svgr!(
        <g>
            <defs>
                <linearGradient id="gh-dusk-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#0e0a26" />
                    <stop offset="0.45" stop-color="#2a1e4c" />
                    <stop offset="0.7" stop-color="#4a3060" />
                    <stop offset="1" stop-color="#140e22" />
                </linearGradient>
            </defs>
            <rect width="1280" height="720" fill="url(#gh-dusk-sky)" />
            <path d="M0 420 C160 380 280 400 420 370 C560 340 700 390 860 360 C1000 335 1140 380 1280 360 L1280 720 L0 720Z" fill="#1c1636" />
            {far}
            {fog.draw(sh, frame, 0.65, (0., 230., 1280., 320.))}
            <path d="M0 540 C200 520 420 548 640 530 C860 514 1060 546 1280 528 L1280 720 L0 720Z" fill="#0b0816" />
            {mid}
        </g>
    );
    (back, fframes::svgr!(<g>{near}</g>))
}

/// The timbers of the tunnel mouth, lit by a lantern on the left post.
fn timbers<'a>(t: f32) -> Svgr<'a> {
    let f = flicker(t, 0.27);
    fframes::svgr!(
        <g>
            <path d="M-20 -20 L80 -20 L74 740 L-20 740Z M1200 -20 L1300 -20 L1300 740 L1206 740Z" fill="#05030a" />
            <path d="M-20 650 L1300 650 L1300 740 L-20 740Z" fill="#07050c" />
            <path d="M200 740 L560 652 M1080 740 L720 652" stroke="#4a3a2a" stroke-width="5" opacity="0.6" />
            <path d="M120 720 L1160 720 M260 690 L1020 690 M380 666 L900 666" stroke="#1e140c" stroke-width="10" opacity="0.8" />
            <rect x="72" y="-20" width="120" height="760" fill="url(#g-log)" stroke="#0a0604" stroke-width="3" />
            <rect x="1090" y="-20" width="120" height="760" fill="url(#g-log)" stroke="#0a0604" stroke-width="3" />
            <rect x="40" y="0" width="1200" height="96" fill="url(#g-log)" stroke="#0a0604" stroke-width="3" />
            <path d="M60 96 L1220 96" stroke="#0a0604" stroke-width="6" />
            <path d="M110 120 L118 700 M1130 120 L1124 700 M90 40 L1190 46" stroke="#c8925a" stroke-width="2" opacity="0.18" />
            <circle cx="232" cy="190" r={260. + 30. * f} fill="url(#g-candle)" opacity={0.5 + 0.2 * f} />
            <path d="M192 160 L232 160 L232 176" stroke="#2a1a10" stroke-width="4" fill="none" />
            <rect x="218" y="176" width="28" height="38" rx="4" fill="#ffcf7a" stroke="#3a2412" stroke-width="3" opacity={0.75 + 0.25 * f} />
        </g>
    )
}

impl Scene for Arrow {
    fn name(&self) -> &'static str {
        "OpeningArrow"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let (back, near) = dusk_forest(&self.sh, &frame, t, 0.4 + 0.6 * after(t, 0.2, 1.5));
        let drift = 1.06 - 0.04 * after(t, 0., 5.).powf(0.7);
        let eyes_layer = EYES
            .iter()
            .map(|&(x, y, s, at, phase)| {
                let open = bloom(t - at).min(1.);
                // One quick blink in each loop.
                let u = (loop_phase(t) - phase).rem_euclid(1.);
                let blink = if u < 0.05 { (u / 0.05 * PI).cos().abs().max(0.05) } else { 1. };
                eyes(x, y, s, open * blink)
            })
            .collect::<Vec<_>>();
        let points = POINTS
            .iter()
            .map(|&(x, y, phase)| {
                let k = after(t, 3.0 + phase, 0.4);
                let u = (loop_phase(t) - phase).rem_euclid(1.);
                let tw = (1. - (u - 0.2).abs() * 6.).max(0.);
                fframes::svgr!(
                    <g opacity={k}>
                        <path d={format!("M{x:.1} {:.1} L{:.1} {y:.1} L{x:.1} {:.1}Z", y - 5., x - 12., y + 5.)} fill="#cfe8d8" />
                        {glint(x, y, 3., 0.25 + 0.75 * tw)}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The bow bends where the arrow comes from.
        let bend = frame.animate(&self.bow);
        let bow = if t < HIT_AT + 0.4 {
            let pull = 14. * bend * if t < SHOOT_AT { 1. } else { (1. - (t - SHOOT_AT) * 8.).max(0.) };
            fframes::svgr!(
                <path d={format!("M{} {} Q{:.1} {} {} {}", FROM.0 + 10., FROM.1 - 40., FROM.0 + 30. + pull, FROM.1, FROM.0 + 10., FROM.1 + 40.)} fill="none" stroke="#e8fffb" stroke-width="2" opacity={0.7 * bend * (1. - after(t, HIT_AT, 0.4))} />
            )
        } else {
            Svgr::empty()
        };
        let u = frame.animate(&self.flight);
        let arrow_layer = if t >= SHOOT_AT && t < HIT_AT {
            let (x, y) = (lerp(FROM.0, HIT.0, u.powf(0.8)), lerp(FROM.1, HIT.1, u.powf(0.8)));
            let s = lerp(0.12, 2.6, u * u);
            let ang = (HIT.1 - FROM.1).atan2(HIT.0 - FROM.0).to_degrees();
            let back = (lerp(FROM.0, HIT.0, (u - 0.25).max(0.).powf(0.8)), lerp(FROM.1, HIT.1, (u - 0.25).max(0.).powf(0.8)));
            fframes::svgr!(
                <g>
                    <path d={format!("M{:.1} {:.1} L{x:.1} {y:.1}", back.0, back.1)} stroke="#c8fff4" stroke-width={2. + 10. * u} stroke-linecap="round" opacity="0.35" filter="url(#blur3)" />
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({ang:.1}) scale({s:.3})")}>{arrow(150., 0.6)}</g>
                </g>
            )
        } else if t >= HIT_AT {
            let dt = t - HIT_AT;
            let quiver = 5. * (-dt * 2.2).exp() * (dt * 45.).sin();
            fframes::svgr!(<g transform={format!("translate({} {}) rotate({:.2}) scale(2.6)", HIT.0, HIT.1, 192. + quiver)}>{arrow(150., 0.7 + 0.3 * wave(t, 2., 0.))}</g>)
        } else {
            Svgr::empty()
        };
        // A drop of poison runs down the arrowhead and falls, once in each loop.
        let du = ((t - 3.0) / LOOP).rem_euclid(1.);
        let drip = if t > 3.0 {
            let (hx, hy) = (HIT.0 + 46., HIT.1 + 12.);
            let form = after(du, 0., 0.45);
            let fall = after(du, 0.45, 0.25);
            let y = hy + 4. + 270. * fall * fall;
            let splash = after(du, 0.7, 0.18);
            let ring = if (0.7..0.88).contains(&du) {
                fframes::svgr!(<ellipse cx={hx} cy="650" rx={4. + 26. * splash} ry={1.5 + 6. * splash} fill="none" stroke="#b8ff7a" stroke-width="2" opacity={1. - splash} />)
            } else {
                Svgr::empty()
            };
            let show = after(du, 0., 0.08) * (1. - after(du, 0.67, 0.03));
            fframes::svgr!(
                <g>
                    <circle cx={hx} cy={y} r={14. * form} fill="url(#g-poison)" opacity={show} />
                    <circle cx={hx} cy={y} r={2. + 3. * form} fill="#b8ff7a" opacity={show} />
                    {ring}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let (kx, ky) = shake(t, HIT_AT, 12.);
        let zoom = frame.animate(&self.punch) * drift;
        let splinters = burst(HIT.0 + 4., HIT.1, t - HIT_AT, 0.8, 26, 431, 340., "#c8925a");
        let chips = debris(HIT.0 + 6., HIT.1, t - HIT_AT, 0.9, 8, 433, 300., (-PI * 0.6, PI * 0.1), 5.);
        fframes::svgr!(
            <g transform={format!("translate({kx:.1} {ky:.1})")}>
                <g transform={format!("translate(640 360) scale({zoom:.4}) translate(-640 -360)")}>
                    {back}
                    {spores(t, 0.7, 761)}
                    {eyes_layer}
                    {points}
                    {bow}
                    {near}
                </g>
                {timbers(t)}
                {drip}
                {arrow_layer}
                {splinters}
                {chips}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#fff0d8" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Road

const WISP_END: f32 = 4.2;

#[derive(Debug)]
pub struct Road {
    sh: Shaders,
    cam: Cam,
    progress: Anim,
    track: Track,
    stops: Vec<f32>,
    caps: Vec<f32>,
    windows: Anim,
}

impl Road {
    pub fn new(sh: Shaders) -> Self {
        let track = Track::new(TRAIL.to_vec());
        // The fraction of the Trail at each clearing.
        let stops = STOPS
            .iter()
            .map(|s| {
                let i = TRAIL.iter().position(|p| p == s).unwrap_or(0);
                track.lengths[i] / track.total()
            })
            .collect();
        // Each cap near the Trail lights with its nearest Trail point; the far caps stay dark.
        let caps = CAPS
            .iter()
            .map(|&(x, y, _, _)| {
                let (i, d) = TRAIL
                    .iter()
                    .enumerate()
                    .map(|(i, p)| (i, ((p.0 - x).powi(2) + (p.1 - y).powi(2)).sqrt()))
                    .fold((0, f32::MAX), |a, b| if b.1 < a.1 { b } else { a });
                if d < 240. { track.lengths[i] / track.total() } else { 2. }
            })
            .collect();
        Self {
            sh,
            cam: camera(&[
                (0., 1.6, (530., 610., 1.55), (560., 580., 1.45)),
                (1.6, 3.2, (560., 580., 1.45), (1020., 580., 1.42)),
                (3.2, 4.8, (1020., 580., 1.42), (1090., 330., 1.6)),
            ]),
            progress: tw(0.25, WISP_END, 0., 1., Easing::EaseInOut),
            track,
            stops,
            caps,
            windows: tw(WISP_END + 0.2, WISP_END + 0.6, 0., 1., Easing::EaseOut),
        }
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
        let Some(map) = ctx.get_image("glowcap-hollows-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let pr = frame.animate(&self.progress);
        let p = painting(&self.sh, &frame, map, Grade { dusk: 0.65, dark: 0.38, ..Default::default() });
        // The ribbon of light behind the wisp.
        let target = pr * self.track.total();
        let mut pts = vec![];
        for (i, pt) in self.track.points.iter().enumerate() {
            if self.track.lengths[i] <= target {
                pts.push(*pt);
            }
        }
        pts.push(self.track.at(pr));
        let ribbon = if pts.len() > 1 && pr > 0. {
            let d = smooth(&pts);
            fframes::svgr!(
                <g>
                    <path d={d.clone()} fill="none" stroke="#5ff2dc" stroke-width="18" opacity="0.3" filter="url(#blur8u)" />
                    <path d={d.clone()} fill="none" stroke="#bffcf2" stroke-width="3.5" opacity="0.85" />
                    <path d={d} fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4 26" stroke-dashoffset={-t * 45.} opacity="0.9" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Each clearing blooms when the wisp passes it.
        let clearings = STOPS
            .iter()
            .zip(&self.stops)
            .enumerate()
            .map(|(i, (&(x, y), &f))| {
                let at = if pr >= f { f } else { 2. };
                let lit = if pr >= f {
                    // The time when the wisp passed, from the progress curve.
                    let dt = (pr - at) * 3.2;
                    bloom(dt)
                } else {
                    0.
                };
                if lit <= 0. {
                    return Svgr::empty();
                }
                let ring = ((pr - f) * 6.).min(1.);
                let breathe = 0.8 + 0.2 * wave(t, 1., i as f32 * 0.1);
                fframes::svgr!(
                    <g>
                        <ellipse cx={x} cy={y} rx={70. * lit.min(1.2)} ry={36. * lit.min(1.2)} fill="url(#g-cyan)" opacity={0.6 * breathe} />
                        <ellipse cx={x} cy={y} rx={20. + 90. * ring} ry={10. + 46. * ring} fill="none" stroke="#e8fffb" stroke-width="3" opacity={0.8 * (1. - ring)} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // The wisp follows the Trail, then circles the hall.
        let orbit = |t: f32| {
            let a = TAU * (t / LOOP) + 1.2;
            (DOOR.0 + a.cos() * 70., DOOR.1 + 20. + a.sin() * 26.)
        };
        let k = after(t, WISP_END, 0.6);
        let k = k * k * (3. - 2. * k);
        let end = self.track.at(pr);
        let o = orbit(t);
        let wisp = (lerp(end.0, o.0, k), lerp(end.1, o.1, k));
        let trail_sparks = (0..10u32)
            .map(|j| {
                let back = self.track.at((pr - 0.006 * j as f32).max(0.));
                let pos = if k > 0. { orbit(t - 0.05 * j as f32) } else { back };
                let pos = (lerp(back.0, pos.0, k), lerp(back.1, pos.1, k));
                fframes::svgr!(<circle cx={pos.0} cy={pos.1} r={4. - j as f32 * 0.3} fill="#c8fff4" opacity={0.6 * (1. - j as f32 / 10.)} />)
            })
            .collect::<Vec<_>>();
        let win = frame.animate(&self.windows);
        let windows = WINDOWS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| fframes::svgr!(<circle cx={x} cy={y} r={(34. * win).max(0.1)} fill="url(#g-hall-light)" opacity={0.9 * win * (0.8 + 0.2 * flicker(t, i as f32 * 0.3))} />))
            .collect::<Vec<_>>();
        // A cap near the Trail lights when the wisp passes it.
        let lit = CAPS
            .iter()
            .zip(&self.caps)
            .enumerate()
            .map(|(i, (&(x, y, r, violet), &f))| cap_glow(x, y, r, violet, bloom((pr - f) * 3.2), t, i as u32))
            .collect::<Vec<_>>();
        let door = project(cam, DOOR);
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, (0., 0.))}>
                    {p}
                    {lit}
                    {clearings}
                    {ribbon}
                    {windows}
                    {trail_sparks}
                    <circle cx={wisp.0} cy={wisp.1} r="44" fill="url(#g-cyan)" opacity="0.9" />
                    <circle cx={wisp.0} cy={wisp.1} r="6" fill="#ffffff" />
                </g>
                {rays(&self.sh, &frame, door, 0.4 * win, 0.6, WARM)}
                {spores(t, 0.8, 781)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
            </g>
        )
    }
}
