//! Ending: the banner falls, the vault, painted stone, the seal, the trail.
use crate::fx::*;
use crate::{CARD_ARTS, CARD_SPOTS, CLIP_FRAMES, MESA_STOPS, TRAIL};
use fframes::{
    Color, Duration, FFramesContext, Frame, Scene, ShaderUniforms, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::TAU;

fn flash(at: f32, peak: f32, fade: f32) -> Anim {
    keys(&[(at, at + 0.06, 0., peak, Easing::Linear), (at + 0.06, at + fade, peak, 0., Easing::EaseOut)])
}

// ---------------------------------------------------------------- 1. Banner

#[derive(Debug)]
pub struct Banner {
    sh: Shaders,
    cam: Cam,
    slash: Anim,
    slash_fade: Anim,
    flash: Anim,
    fall: Anim,
    tip: Anim,
    gone: Anim,
    sun: Anim,
    storm: Anim,
    burn: Vec<Anim>,
    road: Anim,
    rays: Anim,
    trail: String,
    track: Track,
}

const BANNER: (f32, f32) = (1180., 168.);

impl Banner {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(1.3, 4.4, (1150., 300., 1.75), (800., 450., 1.0))]),
            slash: tw(0.95, 1.12, 0., 1., Easing::EaseOut),
            slash_fade: tw(1.12, 1.7, 1., 0., Easing::EaseOut),
            flash: flash(1.12, 0.8, 0.9),
            fall: tw(1.15, 2.1, 0., 560., Easing::EaseIn),
            tip: tw(1.15, 2.1, 0., 32., Easing::EaseIn),
            gone: tw(1.7, 2.2, 1., 0., Easing::EaseIn),
            sun: tw(1.25, 3.4, 0., 2300., Easing::EaseIn),
            storm: tw(1.3, 2.9, 0.85, 0., Easing::EaseOut),
            burn: (0..4).map(|i| tw(2.4 + 0.3 * i as f32, 2.8 + 0.3 * i as f32, 0., 1., Easing::EaseIn)).collect(),
            road: tw(3.3, 4.3, 0., 1., Easing::EaseInOut),
            rays: tw(2.0, 3.6, 0., 0.62, Easing::EaseInOut),
            trail: smooth(TRAIL),
            track: Track::new(TRAIL.to_vec()),
        }
    }
}

impl Scene for Banner {
    fn name(&self) -> &'static str {
        "EndingBanner"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("hearthvale-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let dark = painting(&self.sh, &frame, map, Grade { storm: 0.86, red: 0.55, ..Default::default() });
        let flash = frame.animate(&self.flash);
        let bright = painting(&self.sh, &frame, map, Grade { gold: 0.42, flash: flash * 0.4, flash_color: (1., 0.9, 0.6), ..Default::default() });
        let sun = frame.animate(&self.sun);
        let (bx, by) = BANNER;
        let sway = 2.5 * wave(t, 1., 0.);
        let cloth = format!(
            "M{} {by} L{} {by} L{} {} L{bx} {} L{} {}Z",
            bx - 45., bx + 45., bx + 45. + sway, by + 190., by + 165., bx - 45. + sway, by + 190.
        );
        let fall = frame.animate(&self.fall);
        let gone = frame.animate(&self.gone);
        let banner = if gone > 0. {
            let piece = fframes::svgr!(
                <g>
                    <path d={cloth.clone()} fill="#8e1414" stroke="#e0b250" stroke-width="3" />
                    <path d={format!("M{} {} L{} {}", bx - 36., by + 8., bx - 36., by + 170.)} stroke="#e0b250" stroke-width="1.5" opacity="0.6" />
                    <path d={HAT} transform={format!("translate({bx} {}) scale(1.05)", by + 88.)} fill="#f0c45a" stroke="#4a0a06" stroke-width="1.5" />
                </g>
            );
            let top = fframes::svgr!(
                <g>
                    <path d={cloth} fill="#8e1414" stroke="#e0b250" stroke-width="3" />
                </g>
            );
            fframes::svgr!(
                <g>
                    <defs>
                        <clipPath id="cut-top"><rect x={bx - 70.} y={by - 10.} width="140" height="36" /></clipPath>
                        <clipPath id="cut-bottom"><rect x={bx - 70.} y={by + 26.} width="140" height="200" /></clipPath>
                    </defs>
                    <path d={format!("M{} {by} L{} {by}", bx - 58., bx + 58.)} stroke="#4a2a10" stroke-width="6" stroke-linecap="round" />
                    <g clip-path="url(#cut-top)">{top}</g>
                    <g opacity={gone} transform={format!("translate(0 {fall:.1}) rotate({:.1} {bx} {})", frame.animate(&self.tip), by + 26.)}>
                        <g clip-path="url(#cut-bottom)">{piece}</g>
                    </g>
                </g>
            )
        } else {
            fframes::svgr!(<path d={format!("M{} {by} L{} {by}", bx - 58., bx + 58.)} stroke="#4a2a10" stroke-width="6" stroke-linecap="round" />)
        };
        let slash = frame.animate(&self.slash);
        let slash_layer = if slash > 0. {
            let d = format!("M{} {} Q{} {} {} {}", bx - 110., by - 10., bx + 30., by + 2., bx + 120., by + 70.);
            let len = 260.;
            fframes::svgr!(
                <g opacity={frame.animate(&self.slash_fade)}>
                    <path d={d.clone()} stroke="#ffcf5a" stroke-width="22" fill="none" filter="url(#blur8)" stroke-dasharray={len} stroke-dashoffset={len * (1. - slash)} stroke-linecap="round" />
                    <path d={d} stroke="#fffdf0" stroke-width="5" fill="none" stroke-dasharray={len} stroke-dashoffset={len * (1. - slash)} stroke-linecap="round" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let cards = CARD_SPOTS
            .iter()
            .enumerate()
            .map(|(i, spot)| {
                let b = frame.animate(&self.burn[i]);
                if b >= 1. {
                    let dt = t - (2.8 + 0.3 * i as f32);
                    if dt > 1.2 {
                        return Svgr::empty();
                    }
                    let sparks = (0..16u32)
                        .map(|k| {
                            let a = lerp(-2.6, -0.5, rnd(k, 200 + i as u32));
                            let v = lerp(60., 220., rnd(k, 210 + i as u32));
                            let x = spot.0 + a.cos() * v * dt;
                            let y = spot.1 + a.sin() * v * dt - 40. * dt * dt;
                            fframes::svgr!(<circle cx={x} cy={y} r={lerp(1.5, 4., rnd(k, 220))} fill="url(#g-ember)" opacity={1. - dt / 1.2} />)
                        })
                        .collect::<Vec<_>>();
                    let ring = (dt / 0.6).min(1.);
                    return fframes::svgr!(
                        <g>
                            <circle cx={spot.0} cy={spot.1} r={20. + 90. * ring} fill="none" stroke="#ffd36a" stroke-width={8. * (1. - ring)} opacity={1. - ring} />
                            {sparks}
                        </g>
                    );
                }
                let art = ctx.get_image(CARD_ARTS[i]).map(card_front).unwrap_or_default();
                let tilt = lerp(-9., 9., rnd(i as u32, 91));
                let s = 1. - 0.5 * b;
                fframes::svgr!(
                    <g opacity={1. - b}>
                        <ellipse cx={spot.0} cy={spot.1 + 6.} rx="80" ry="40" fill="url(#g-red)" opacity="0.6" />
                        <g transform={format!("translate({} {}) rotate({tilt:.1}) scale({s:.3})", spot.0, spot.1)}>
                            {art}
                            <rect x="-50" y="-67" width="100" height="134" rx="9" fill="#ffb23a" opacity={b * 0.8} />
                        </g>
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let road = frame.animate(&self.road);
        // Carts roll on the open road again; each fades at the ends of its run.
        let carts = (0..4u32)
            .map(|k| {
                let u = (t / LOOP + k as f32 / 4.).rem_euclid(1.0);
                let (x, y) = self.track.at(u);
                let o = (std::f32::consts::PI * u).sin().powf(0.5);
                fframes::svgr!(
                    <g transform={format!("translate({x:.1} {y:.1})")} opacity={o}>
                        <rect x="-13" y="-16" width="26" height="12" rx="2" fill="#8a5a2a" stroke="#3a2008" stroke-width="1.5" />
                        <path d="M-12 -16 Q0 -30 12 -16Z" fill="#f2e2c0" stroke="#7a6040" stroke-width="1" />
                        <circle cx="-8" cy="-3" r="4" fill="#3a2008" />
                        <circle cx="8" cy="-3" r="4" fill="#3a2008" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let flow = -t * 30. * 2. / LOOP;
        let storm = Fog { density: 0.62, soft: 0.2, light: Color::hex("#5a2a2a"), shade: Color::hex("#1a0c10"), dir: (-0.4, 0.05), scale: 1.6, seed: 4.0 };
        let motes = Motes { count: 60, seed: 131, area: (0., 0., 1280., 760.), rise: 620., period: LOOP, size: (1.3, 3.4), sway: 20., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <g transform={cam_transform(cam, shake(t, 1.12, 9.))}>
                    <defs>
                        <mask id="sun-mask"><circle cx={bx} cy={by + 60.} r={sun.max(0.5)} fill="url(#g-softdisc)" /></mask>
                    </defs>
                    {dark}
                    <g mask="url(#sun-mask)">{bright}</g>
                    <g opacity={road}>
                        <path d={self.trail.as_str()} fill="none" stroke="#ffc24a" stroke-width="20" stroke-linecap="round" filter="url(#blur8)" opacity="0.8" />
                        {carts}
                        <path d={self.trail.as_str()} fill="none" stroke="#fffbe6" stroke-width="2.4" stroke-dasharray="6 24" stroke-dashoffset={flow} />
                    </g>
                    {cards}
                    {banner}
                    {slash_layer}
                </g>
                {storm.draw(&self.sh, &frame, frame.animate(&self.storm), (-40., -60., 1360., 460.))}
                {rays(&self.sh, &frame, (-80., -140.), frame.animate(&self.rays), 1.2, (1.0, 0.88, 0.58))}
                {motes.draw(t, frame.animate(&self.rays) / 0.62)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.7" />
                <rect width="1280" height="720" fill="#fff4d0" opacity={flash} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Vault

struct PileCoin {
    x: f32,
    y: f32,
    rot: f32,
    fall: Anim,
    drift: Anim,
    land: f32,
}

pub struct PileCoinBox(PileCoin);
impl std::fmt::Debug for PileCoinBox {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("PileCoin")
    }
}

#[derive(Debug)]
pub struct Vault {
    push: Anim,
    coins: Vec<PileCoinBox>,
    roll: Anim,
    tilt: Anim,
    wobble: Anim,
}

const POUR_X: f32 = 700.;

impl Vault {
    pub fn new() -> Self {
        let mut coins = vec![];
        let mut i = 0u32;
        for layer in 0..7u32 {
            let n = 18 - 2 * layer;
            for j in 0..n {
                let off = j as f32 - (n as f32 - 1.) / 2.;
                let x = POUR_X + off * 48. * (1. - layer as f32 * 0.05) + lerp(-12., 12., rnd(i, 300));
                let y = 612. - layer as f32 * 21. + lerp(-8., 8., rnd(i, 301)) + off.abs().powf(1.4) * 0.9;
                let land = 0.3 + i as f32 * 0.022;
                coins.push(PileCoinBox(PileCoin {
                    x,
                    y,
                    rot: lerp(-16., 16., rnd(i, 302)),
                    fall: tw(land - 0.5, land, -90., y, Easing::EaseIn),
                    drift: tw(land - 0.5, land, POUR_X + lerp(-40., 40., rnd(i, 303)), x, Easing::EaseOut),
                    land,
                }));
                i += 1;
            }
        }
        Self {
            push: tw(0., 5., 1.0, 1.16, Easing::EaseInOut),
            coins,
            roll: tw(2.35, 3.4, 0., 1., Easing::EaseOut),
            tilt: tw(3.15, 3.6, 0., 1., Easing::EaseIn),
            wobble: KeyFramesAnimation::new(vec![KeyFrame {
                start: 3.55,
                end: None,
                from: 0.,
                to: 1.,
                easing: &Easing::Spring { mass: 1.0, stiffness: 110.0, damping: 7.0 },
            }]),
        }
    }
}

impl Scene for Vault {
    fn name(&self) -> &'static str {
        "EndingVault"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("vault-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let push = frame.animate(&self.push);
        let pile = self
            .coins
            .iter()
            .enumerate()
            .filter_map(|(i, PileCoinBox(c))| {
                if t < c.land - 0.5 {
                    return None;
                }
                let y = frame.animate(&c.fall);
                let x = frame.animate(&c.drift);
                let falling = t < c.land;
                let ratio = if falling { 0.15 + 0.85 * ((t - c.land) * 15. + i as f32).cos().abs() } else { 0.42 };
                let landed = t - c.land;
                let g = if (0.0..0.35).contains(&landed) { glint(c.x + 10., c.y - 6., 3.4, 1. - landed / 0.35) } else { Svgr::empty() };
                Some(fframes::svgr!(<g>{coin(x, y, 30., ratio, c.rot, i % 3 == 0)}{g}</g>))
            })
            .collect::<Vec<_>>();
        let twinkles = (0..16u32)
            .map(|k| {
                let c = &self.coins[(rnd(k, 310) * self.coins.len() as f32) as usize].0;
                let o = if t > 2.4 { wave(t, 2., rnd(k, 311)).max(0.).powi(10) } else { 0. };
                glint(c.x + lerp(-14., 14., rnd(k, 312)), c.y - 8., 3.6, o)
            })
            .collect::<Vec<_>>();
        // The light coin: it rolls out of the pile, wobbles and falls flat.
        let p = frame.animate(&self.roll);
        let hero = if t >= 2.35 {
            let x = lerp(1010., 560., p);
            let y = lerp(600., 640., p);
            let r = lerp(30., 112., p);
            let tilt = frame.animate(&self.tilt);
            let ratio = lerp(1., 0.42, tilt);
            let w = frame.animate(&self.wobble);
            let wobble = if t > 3.55 { 24. * (w - 1.) } else { 0. };
            let spin = -p * 540.;
            let lift = r * (1. - ratio) * 0.55;
            fframes::svgr!(
                <g>
                    <ellipse cx={x + 8.} cy={y + r * 0.36} rx={r * 1.05} ry={r * 0.3} fill="#000" opacity="0.5" filter="url(#blur8)" />
                    <g transform={format!("translate({x:.1} {y:.1}) rotate({wobble:.2}) translate({:.1} {:.1})", -x, -y - lift)}>
                        {coin(x, y, r, ratio, if tilt > 0. { 0. } else { spin }, true)}
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let motes = Motes { count: 46, seed: 151, area: (60., 80., 700., 520.), rise: 300., period: LOOP, size: (0.8, 2.4), sway: 24., fill: "url(#g-gold)" };
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#0b0604" />
                <g transform={format!("translate(640 360) scale({:.4}) translate(-640 -360)", 1.12 - (push - 1.) * 0.4)}>
                    <image href={bokeh.href()} x="0" y="0" width="1280" height="720" />
                </g>
                <g transform={format!("translate(660 600) scale({push:.4}) translate(-660 -600)")}>
                    <rect y="410" width="1280" height="340" fill="url(#g-desk)" />
                    <path d="M0 470 L1280 462" stroke="#6a4020" stroke-width="2" opacity="0.5" />
                    {candle(150., 300., t, 0., 0.)}
                    <ellipse cx={POUR_X} cy="622" rx="470" ry="62" fill="#000" opacity="0.5" filter="url(#blur8)" />
                    <ellipse cx={POUR_X} cy="560" rx="420" ry="120" fill="url(#g-candle)" opacity="0.6" />
                    {pile}
                    {twinkles}
                    {hero}
                </g>
                {motes.draw(t, 0.7)}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Stone

struct Flake {
    center: (f32, f32),
    shape: Vec<(f32, f32)>,
    pop: f32,
    vel: (f32, f32),
    spin: f32,
}

#[derive(Debug)]
pub struct Stone {
    sh: Shaders,
    rot: Anim,
    tilt: Anim,
    push: Anim,
    crack: Anim,
    glow: Anim,
    flakes: Vec<FlakeBox>,
    crack_d: String,
    crack_len: f32,
}

pub struct FlakeBox(Flake);
impl std::fmt::Debug for FlakeBox {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Flake")
    }
}

const R: f32 = 212.;

impl Stone {
    pub fn new(sh: Shaders) -> Self {
        let mut crack = vec![(-178.0f32, -112.0f32)];
        for i in 1..14u32 {
            let k = i as f32 / 13.;
            crack.push((lerp(-178., 182., k) + lerp(-10., 10., rnd(i, 400)), lerp(-112., 128., k) + lerp(-16., 16., rnd(i, 401))));
        }
        let track = Track::new(crack.clone());
        let mut d = path(&crack, false);
        let b0 = crack[5];
        d.push_str(&path(&[b0, (b0.0 + 26., b0.1 - 40.), (b0.0 + 40., b0.1 - 82.), (b0.0 + 70., b0.1 - 104.)], false));
        let b1 = crack[9];
        d.push_str(&path(&[b1, (b1.0 - 30., b1.1 + 36.), (b1.0 - 38., b1.1 + 72.)], false));
        let flakes = (0..36u32)
            .map(|i| {
                let k = rnd(i, 410);
                let base = track.at(k);
                let side = if i % 2 == 0 { 1. } else { -1. };
                let off = lerp(0., 96., rnd(i, 411).powf(0.8)) * side;
                // perpendicular to the crack direction (about 34 degrees)
                let n = (-0.55f32, 0.83f32);
                let center = (base.0 + n.0 * off, base.1 + n.1 * off);
                let size = lerp(30., 54., rnd(i, 412));
                let shape = (0..7u32)
                    .map(|v| {
                        let a = v as f32 / 7. * TAU + rnd(v, 413 + i) * 0.5;
                        let rr = size * lerp(0.6, 1.15, rnd(v, 430 + i));
                        (a.cos() * rr, a.sin() * rr)
                    })
                    .collect::<Vec<_>>();
                let dist = ((k - 0.5).abs() * 2.).min(1.) * 0.6 + (off.abs() / 96.) * 0.4;
                let pop = 1.15 + 2.1 * dist + rnd(i, 414) * 0.15;
                let out = side;
                Flake {
                    center,
                    shape,
                    pop,
                    vel: (n.0 * out * lerp(120., 260., rnd(i, 415)) + lerp(-60., 60., rnd(i, 416)), n.1 * out * lerp(80., 200., rnd(i, 417)) - 260.),
                    spin: lerp(-540., 540., rnd(i, 418)),
                }
            })
            .map(FlakeBox)
            .collect();
        Self {
            sh,
            rot: tw(0., 5., -14., -3., Easing::EaseOut),
            tilt: tw(0., 1.2, 0.62, 0.94, Easing::EaseOut),
            push: tw(0., 5., 0.95, 1.04, Easing::EaseOut),
            crack: tw(0.5, 1.1, 0., 1., Easing::EaseOut),
            glow: tw(2.8, 4.2, 0., 0.45, Easing::EaseInOut),
            flakes,
            crack_len: track.total() + 260.,
            crack_d: d,
        }
    }
}

impl Scene for Stone {
    fn name(&self) -> &'static str {
        "EndingStone"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("vault-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let glow = frame.animate(&self.glow) * (0.85 + 0.15 * wave(t, 1., 0.));
        let stone = self.sh.stone.draw(&frame, ShaderUniforms::new().float("uGlow", glow));
        let mut holes = vec![];
        let mut flying = vec![];
        let mut dust = vec![];
        for FlakeBox(f) in &self.flakes {
            let dt = t - f.pop;
            if dt < 0. {
                continue;
            }
            let at = |dx: f32, dy: f32| f.shape.iter().map(|(x, y)| (f.center.0 + x + dx, f.center.1 + y + dy)).collect::<Vec<_>>();
            holes.push(fframes::svgr!(<path d={path(&at(0., 0.), true)} fill="#000" />));
            if dt < 1.4 {
                let x = f.center.0 + f.vel.0 * dt;
                let y = f.center.1 + f.vel.1 * dt + 0.5 * 900. * dt * dt;
                let s = 1. + 0.9 * dt;
                let rot = f.spin * dt;
                flying.push(fframes::svgr!(
                    <path d={path(&f.shape, true)} transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({s:.3})")} fill="url(#g-coin)" stroke="#6a3c0c" stroke-width="1.5" opacity={(1. - dt / 1.4).powf(0.6)} />
                ));
            }
            if dt < 1.0 {
                for k in 0..5u32 {
                    let a = rnd(k, 450) * TAU;
                    let r = 6. + 44. * dt * lerp(0.6, 1.2, rnd(k, 451));
                    dust.push(fframes::svgr!(<circle cx={f.center.0 + a.cos() * r} cy={f.center.1 + a.sin() * r - 30. * dt} r={4. + 16. * dt} fill="url(#g-dust)" opacity={0.75 * (1. - dt)} />));
                }
            }
        }
        let crack = frame.animate(&self.crack);
        let rot = frame.animate(&self.rot);
        let push = frame.animate(&self.push);
        let dots = (0..40u32)
            .map(|i| {
                let a = i as f32 / 40. * TAU;
                fframes::svgr!(<circle cx={a.cos() * (R - 20.)} cy={a.sin() * (R - 20.)} r="3" fill="#ffe8a8" opacity="0.7" />)
            })
            .collect::<Vec<_>>();
        let motes = Motes { count: 44, seed: 171, area: (240., 60., 800., 640.), rise: 360., period: LOOP, size: (1.0, 2.8), sway: 26., fill: "url(#g-dust)" };
        let light = 0.6 + 0.4 * flicker(t, 0.7);
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#080403" />
                <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.6" />
                <circle cx="-40" cy="330" r="620" fill="url(#g-candle)" opacity={light} />
                <ellipse cx="660" cy="610" rx="280" ry="50" fill="#000" opacity="0.55" filter="url(#blur18)" />
                <g transform={format!("translate(640 372) scale({push:.4}) rotate({rot:.2}) scale(1 {:.3})", frame.animate(&self.tilt))}>
                    <defs>
                        <clipPath id="coin-clip"><circle r={R - 6.} /></clipPath>
                        <mask id="paint-mask"><circle r={R} fill="#fff" />{holes}</mask>
                    </defs>
                    <circle cy="16" r={R} fill="url(#g-coin-edge)" />
                    <g clip-path="url(#coin-clip)">
                        <image href={stone.href()} x={-R} y={-R} width={2. * R} height={2. * R} />
                    </g>
                    <g mask="url(#paint-mask)" transform="translate(3 4)">
                        <circle r={R} fill="#3a1606" />
                    </g>
                    <g mask="url(#paint-mask)">
                        <circle r={R} fill="url(#g-coin)" stroke="#6a3c0c" stroke-width="8" />
                        <circle r={R - 34.} fill="none" stroke="#ffe39a" stroke-width="3" opacity="0.7" />
                        <circle r={R - 42.} fill="none" stroke="#8a5a14" stroke-width="2" opacity="0.6" />
                        {dots}
                        <path d={HAT} transform="scale(3.4)" fill="#c88a22" stroke="#fff0b0" stroke-width="0.6" />
                        <ellipse cx="-60" cy="-80" rx="90" ry="40" fill="#fffbe6" opacity="0.18" transform="rotate(-30 -60 -80)" />
                    </g>
                    <path d={self.crack_d.as_str()} fill="none" stroke="#1e0a04" stroke-width="4" stroke-linejoin="round" stroke-dasharray={self.crack_len} stroke-dashoffset={self.crack_len * (1. - crack)} />
                    <path d={self.crack_d.as_str()} fill="none" stroke="#ffe7a0" stroke-width="1" opacity="0.5" transform="translate(1.5 1.5)" stroke-dasharray={self.crack_len} stroke-dashoffset={self.crack_len * (1. - crack)} />
                    {dust}
                    {flying}
                </g>
                {motes.draw(t, 0.8)}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Seal

#[derive(Debug)]
pub struct Seal {
    lx: Anim,
    ly: Anim,
    lr: Anim,
    lines: Vec<(String, f32, Anim)>,
    drop: Anim,
    sx: Anim,
    sy: Anim,
    stamp: Anim,
    shadow: Anim,
    glow: Anim,
    zoom: Anim,
    bend: Anim,
    dim: Anim,
    blob: String,
}

const SEAL_AT: (f32, f32) = (168., 112.);

/// One line of unreadable handwriting.
fn scribble(row: u32, y0: f32) -> (String, f32) {
    let end = 150. - rnd(row, 500) * 90.;
    let mut d = String::new();
    let mut len = 0.;
    let mut x = -226.;
    let mut w = 0u32;
    while x < end {
        let word = lerp(30., 74., rnd(w, 501 + row));
        let mut prev: Option<(f32, f32)> = None;
        let mut s = 0.;
        while s < word {
            let px = x + s;
            let py = y0 + 5. * (px * 0.42 + row as f32).sin() * (0.6 + 0.4 * (px * 0.11).sin()) + 3. * (px * 0.93 + w as f32).cos();
            match prev {
                None => d.push_str(&format!("M{px:.1} {py:.1} ")),
                Some(p) => {
                    d.push_str(&format!("L{px:.1} {py:.1} "));
                    len += ((px - p.0).powi(2) + (py - p.1).powi(2)).sqrt();
                }
            }
            prev = Some((px, py));
            s += 3.;
        }
        x += word + lerp(10., 18., rnd(w, 520 + row));
        w += 1;
    }
    (d, len)
}

impl Seal {
    pub fn new() -> Self {
        let blob = (0..16u32)
            .map(|i| {
                let a = i as f32 / 16. * TAU;
                let r = 66. * lerp(0.9, 1.1, rnd(i, 530));
                (a.cos() * r, a.sin() * r)
            })
            .collect::<Vec<_>>();
        Self {
            lx: spring(0.15, 1180., 690., SOFT),
            ly: spring(0.15, 840., 380., SOFT),
            lr: spring(0.15, 16., -5., SOFT),
            lines: (0..8u32)
                .map(|k| {
                    let (d, len) = scribble(k, -142. + 33. * k as f32);
                    let at = 0.95 + 0.22 * k as f32;
                    (d, len, tw(at, at + 0.42, 0., 1., Easing::EaseInOut))
                })
                .collect(),
            drop: tw(2.85, 3.05, -460., 0., Easing::EaseIn),
            sx: spring(3.05, 1.7, 1., BOUNCY),
            sy: spring(3.05, 0.4, 1., BOUNCY),
            stamp: tw(3.35, 3.5, 0., 1., Easing::EaseOut),
            shadow: keys(&[(3.12, 3.33, 0., 0.55, Easing::EaseIn), (3.33, 3.5, 0.55, 0., Easing::EaseOut)]),
            glow: tw(3.7, 4.4, 0., 1., Easing::EaseOut),
            zoom: tw(3.45, 5.0, 0., 1., Easing::EaseInOut),
            bend: KeyFramesAnimation::new(vec![
                KeyFrame { start: 3.7, end: Some(3.85), from: 0., to: -24., easing: &Easing::EaseOut },
                KeyFrame { start: 3.85, end: None, from: -24., to: 0., easing: &BOUNCY },
            ]),
            dim: keys(&[(3.7, 3.85, 0., 0.55, Easing::EaseOut), (3.85, 4.7, 0.55, 0., Easing::EaseInOut)]),
            blob: smooth(&{
                let mut b = blob.clone();
                b.push(blob[0]);
                b
            }),
        }
    }
}

impl Scene for Seal {
    fn name(&self) -> &'static str {
        "EndingSeal"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("vault-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let (lx, ly, lr) = (frame.animate(&self.lx), frame.animate(&self.ly), frame.animate(&self.lr));
        let ink = self
            .lines
            .iter()
            .map(|(d, len, anim)| {
                let p = frame.animate(anim);
                fframes::svgr!(<path d={d.as_str()} fill="none" stroke="#2b1608" stroke-width="2.1" stroke-linecap="round" stroke-dasharray={*len} stroke-dashoffset={len * (1. - p)} opacity={if p > 0. { 0.85 } else { 0. }} />)
            })
            .collect::<Vec<_>>();
        let (sx0, sy0) = SEAL_AT;
        let drop = frame.animate(&self.drop);
        let wax = if t < 2.85 {
            Svgr::empty()
        } else if t < 3.05 {
            fframes::svgr!(<ellipse cx={sx0} cy={sy0 + drop} rx="20" ry="26" fill="url(#g-wax-seal)" />)
        } else {
            let stamp = frame.animate(&self.stamp);
            let glow = frame.animate(&self.glow) * (0.75 + 0.25 * wave(t, 1., 0.));
            let mark = seal_lanes(40., true);
            fframes::svgr!(
                <g transform={format!("translate({sx0} {sy0})")}>
                    <g transform={format!("scale({:.3} {:.3})", frame.animate(&self.sx), frame.animate(&self.sy))}>
                        <path d={self.blob.as_str()} transform="translate(3 5)" fill="#000" opacity="0.4" filter="url(#blur3)" />
                        <path d={self.blob.as_str()} fill="url(#g-wax-seal)" />
                        <ellipse cx="-22" cy="-26" rx="20" ry="9" fill="#ffd0e0" opacity="0.18" transform="rotate(-30 -16 -20)" />
                    </g>
                    <g opacity={stamp}>
                        <circle r="46" fill="#3a0616" opacity="0.6" />
                        <circle r="46" fill="none" stroke="#1a0208" stroke-width="3" transform="translate(1.2 1.2)" />
                        <circle r="46" fill="none" stroke="#b0506a" stroke-width="1.4" transform="translate(-1 -1)" />
                        <path d={mark.clone()} fill="none" stroke="#1a0208" stroke-width="4.5" stroke-linecap="round" transform="translate(1.2 1.2)" />
                        <path d={mark.clone()} fill="none" stroke="#c0607a" stroke-width="1.6" stroke-linecap="round" transform="translate(-1 -1)" />
                    </g>
                    <g opacity={glow}>
                        <circle r="90" fill="url(#g-violet)" opacity="0.6" />
                        <path d={mark.clone()} fill="none" stroke="#c58cff" stroke-width="7" stroke-linecap="round" filter="url(#blur3)" />
                        <path d={mark} fill="none" stroke="#f4e6ff" stroke-width="1.6" stroke-linecap="round" />
                    </g>
                </g>
            )
        };
        let glow = frame.animate(&self.glow);
        let wisps = if glow > 0. {
            (0..5u32)
                .map(|k| {
                    let pts = (0..22)
                        .map(|s| {
                            let s = s as f32;
                            let x = sx0 + lerp(-26., 26., k as f32 / 4.) + 22. * (s / 21.) * (s * 0.33 + TAU * t / LOOP + k as f32 * 1.3).sin();
                            (x, sy0 - 20. - s * 13.)
                        })
                        .collect::<Vec<_>>();
                    fframes::svgr!(<path d={smooth(&pts)} fill="none" stroke="#a06ae8" stroke-width={5. - k as f32 * 0.5} stroke-linecap="round" filter="url(#blur3)" opacity={glow * 0.32} />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        let shadow = frame.animate(&self.shadow);
        let zoom = frame.animate(&self.zoom);
        fframes::svgr!(
            <g>
                <defs>
                    <linearGradient id="g-letter-shade" x1="0" y1="0" x2="1" y2="0.3">
                        <stop offset="0" stop-color="#fff2c8" stop-opacity="0.18" />
                        <stop offset="0.45" stop-color="#000" stop-opacity="0" />
                        <stop offset="1" stop-color="#000" stop-opacity="0.42" />
                    </linearGradient>
                </defs>
                <rect width="1280" height="720" fill="#060303" />
                <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.32" />
                <rect y="240" width="1280" height="480" fill="url(#g-desk)" />
                {candle(190., 330., t, frame.animate(&self.bend), frame.animate(&self.dim))}
                <g transform={format!("translate({:.1} {:.1}) scale({:.3}) translate(-867 -477)", lerp(867., 700., zoom), lerp(477., 400., zoom), lerp(1., 1.9, zoom))}>
                <g transform={format!("translate({lx:.1} {ly:.1}) rotate({lr:.2})")}>
                    <path d="M-262 -186 L276 -192 L282 200 L-270 196Z" transform="translate(10 16)" fill="#000" opacity="0.5" filter="url(#blur8)" />
                    <path d="M-266 -190 L272 -196 L278 196 L-272 192 L-268 40Z" fill="url(#g-parchment)" stroke="#7a5228" stroke-width="2" />
                    <path d="M-262 2 L276 -4" stroke="#8a6236" stroke-width="1.2" opacity="0.35" />
                    <path d="M-250 -176 L262 -180 M-254 178 L262 180" stroke="#fff2cc" stroke-width="1.2" opacity="0.35" />
                    {ink}
                    <circle cx={sx0} cy={sy0} r="72" fill="#000" opacity={shadow} filter="url(#blur8)" />
                    <path d="M-266 -190 L272 -196 L278 196 L-272 192 L-268 40Z" fill="url(#g-letter-shade)" />
                    {wax}
                    {wisps}
                </g>
                </g>
                <rect width="1280" height="720" fill="url(#g-vignette)" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Trail

#[derive(Debug)]
pub struct Trail {
    sh: Shaders,
    home: Cam,
    mesa_cam: Cam,
    home_fade: Anim,
    mesa_in: Anim,
    dust: Anim,
    ghost: Anim,
    glints: Vec<Anim>,
    mesa_trail: String,
}

impl Trail {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            home: camera(&[(0., 2.7, (800., 450., 1.16), (800., 430., 0.8))]),
            mesa_cam: camera(&[(2.1, 5.0, (1000., 540., 1.42), (880., 480., 1.14))]),
            home_fade: tw(2.15, 2.85, 1., 0., Easing::EaseInOut),
            mesa_in: tw(2.15, 2.85, 0., 1., Easing::EaseInOut),
            dust: keys(&[(1.4, 2.4, 0., 1., Easing::EaseIn), (2.4, 3.6, 1., 0.3, Easing::EaseOut)]),
            ghost: tw(3.4, 4.7, 0., 0.42, Easing::EaseInOut),
            glints: (0..MESA_STOPS.len()).map(|i| spring(3.0 + 0.14 * i as f32, 0.01, 1., BOUNCY)).collect(),
            mesa_trail: smooth(MESA_STOPS),
        }
    }
}

impl Scene for Trail {
    fn name(&self) -> &'static str {
        "EndingTrail"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(home), Some(mesa)) = (ctx.get_image("hearthvale-region.png"), ctx.get_image("red-mesas-region.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let fade = frame.animate(&self.home_fade);
        let home_layer = if fade > 0. {
            let p = painting(&self.sh, &frame, home, Grade { dusk: 0.85, gold: 0.2, ..Default::default() });
            fframes::svgr!(<g opacity={fade} transform={cam_transform(frame.animate(&self.home), (0., 0.))}><g mask="url(#map-edge)">{p}</g></g>)
        } else {
            Svgr::empty()
        };
        let mesa_in = frame.animate(&self.mesa_in);
        let mesa_cam = frame.animate(&self.mesa_cam);
        let glints = MESA_STOPS
            .iter()
            .enumerate()
            .map(|(i, s)| {
                let k = frame.animate(&self.glints[i]);
                if k <= 0.02 {
                    return Svgr::empty();
                }
                let twinkle = 0.55 + 0.45 * wave(t, 2., i as f32 * 0.13).max(0.);
                fframes::svgr!(
                    <g>
                        <circle cx={s.0} cy={s.1} r={58. * k} fill="url(#g-gold)" opacity={0.8 * twinkle} />
                        <ellipse cx={s.0} cy={s.1} rx={9. * k} ry={5. * k} fill="#f6c84e" stroke="#7a4a10" stroke-width="1.5" />
                        {glint(s.0 + 4., s.1 - 6., 3.2 * k, twinkle)}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let mesa_layer = if mesa_in > 0. {
            let p = painting(&self.sh, &frame, mesa, Grade { dusk: 0.55, ..Default::default() });
            let flow = -t * 30. * 2. / LOOP;
            fframes::svgr!(
                <g opacity={mesa_in} transform={cam_transform(mesa_cam, (0., 0.))}>
                    {p}
                    <path d={self.mesa_trail.as_str()} fill="none" stroke="#ffd36a" stroke-width="2.4" stroke-dasharray="6 24" stroke-dashoffset={flow} opacity={0.8 * frame.animate(&self.glints[MESA_STOPS.len() - 1]).min(1.)} />
                    {glints}
                </g>
            )
        } else {
            Svgr::empty()
        };
        let dust = Fog { density: 0.74, soft: 0.22, light: Color::hex("#e8955c"), shade: Color::hex("#7a2a14"), dir: (-0.7, 0.05), scale: 1.5, seed: 21.0 };
        let sky = Fog { density: 0.5, soft: 0.25, light: Color::hex("#ffd2a0"), shade: Color::hex("#a0546a"), dir: (0.2, 0.0), scale: 1.2, seed: 2.0 };
        let ghost = frame.animate(&self.ghost) * 1.9 * (0.8 + 0.2 * wave(t, 1., 0.));
        let mark = seal_lanes(118., true);
        let motes = Motes { count: 46, seed: 191, area: (0., 0., 1280., 760.), rise: 260., period: LOOP, size: (1., 2.8), sway: 60., fill: "url(#g-dust)" };
        fframes::svgr!(
            <g>
                <defs>
                    <radialGradient id="g-map-edge" cx="0.5" cy="0.5" r="0.62">
                        <stop offset="0.68" stop-color="#fff" />
                        <stop offset="1" stop-color="#000" />
                    </radialGradient>
                    <mask id="map-edge"><rect width="1600" height="900" fill="url(#g-map-edge)" /></mask>
                    <linearGradient id="g-night-band" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#14061e" stop-opacity="0.85" />
                        <stop offset="1" stop-color="#14061e" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <rect width="1280" height="720" fill="url(#g-sunset)" />
                {sky.draw(&self.sh, &frame, 1., (0., 0., 1280., 720.))}
                {home_layer}
                {mesa_layer}
                <rect width="1280" height="320" fill="url(#g-night-band)" opacity={mesa_in * frame.animate(&self.ghost) / 0.42} />
                <g opacity={ghost}>
                    <g transform="translate(640 150)">
                        <circle r="170" fill="url(#g-violet)" opacity="0.35" />
                        <circle r="132" fill="none" stroke="#b46aff" stroke-width="10" filter="url(#blur8)" />
                        <circle r="132" fill="none" stroke="#f0dcff" stroke-width="1.8" />
                        <circle r="112" fill="none" stroke="#e4c8ff" stroke-width="1" opacity="0.7" />
                        <path d={mark.clone()} fill="none" stroke="#a24cff" stroke-width="10" stroke-linecap="round" filter="url(#blur8)" />
                        <path d={mark} fill="none" stroke="#f6eaff" stroke-width="2.2" stroke-linecap="round" />
                    </g>
                </g>
                {dust.draw(&self.sh, &frame, frame.animate(&self.dust), (0., 0., 1280., 720.))}
                {motes.draw(t, if t > 2.4 { 0.8 } else { 0. })}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}
