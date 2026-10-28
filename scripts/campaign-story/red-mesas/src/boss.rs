//! Boss: the Throne Hall, Snikkit, the trick, the buyer, the challenge.
use crate::fx::*;
use crate::mesa::*;
use crate::{CLIP_FRAMES, CROWN};
use fframes::{
    Color, Duration, FFramesContext, FontQuery, Frame, Scene, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::{PI, TAU};

// ---------------------------------------------------------------- 1. Hall

/// The scrap gate in map units: its door opening and six plates (x, y, w, h).
const DOOR: (f32, f32, f32, f32) = (1136., 146., 46., 56.);
const PLATE_AT: f32 = 1.5;
const RATTLE: [f32; 3] = [0.55, 0.85, 1.15];
/// Lanterns on the hall, lit in a chain, in map units.
const LANTERNS: [(f32, f32); 7] = [(1084., 150.), (1108., 118.), (1126., 150.), (1150., 132.), (1196., 132.), (1216., 116.), (1244., 152.)];
const LANTERN_AT: f32 = 2.0;
const ROCKET_AT: f32 = 3.15;
const POP_AT: f32 = 3.85;

#[derive(Debug)]
pub struct Hall {
    sh: Shaders,
    cam: Cam,
    plates: Vec<Anim>,
    spill: Anim,
    lanterns: Vec<Anim>,
    flash: Anim,
}

impl Hall {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            cam: camera(&[(0., 4.3, (1000., 440., 1.35), (1172., 205., 2.25))]),
            plates: (0..6).map(|i| tw(PLATE_AT + 0.11 * i as f32, PLATE_AT + 0.11 * i as f32 + 0.5, 0., 1., Easing::EaseIn)).collect(),
            spill: tw(PLATE_AT + 0.2, PLATE_AT + 1.3, 0., 1., Easing::EaseOut),
            lanterns: (0..LANTERNS.len()).map(|i| spring(LANTERN_AT + 0.13 * i as f32, 0., 1., BOUNCY)).collect(),
            flash: flash(POP_AT, 0.22, 0.6),
        }
    }
}

impl Scene for Hall {
    fn name(&self) -> &'static str {
        "BossHall"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(map) = ctx.get_image("red-mesas-region.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let cam = frame.animate(&self.cam);
        let spill = frame.animate(&self.spill);
        let breathe = if t > 3. { 0.85 + 0.15 * wave(t, 2., 0.1) + 0.05 * wave(t, 5., 0.4) } else { 1. };
        let painting = painting(&self.sh, &frame, map, Grade { dusk: 0.9, dark: 0.28, heat: 0.2, ..Default::default() });
        // The plates rattle, then lift into the arch one by one.
        let (dx, dy, dw, dh) = DOOR;
        let rattle = RATTLE.iter().map(|&at| shake(t, at, 1.6).0).sum::<f32>();
        let plates = (0..6)
            .map(|i| {
                let (col, row) = ((i % 3) as f32, (i / 3) as f32);
                let lift = frame.animate(&self.plates[i]);
                let (x, y) = (dx + col * dw / 3., dy + row * dh / 2. - lift * (dh + 10.));
                fframes::svgr!(
                    <g transform={format!("translate({:.2} {:.2})", x + rattle * (0.6 + 0.4 * row), y)}>
                        <rect x="0.4" y="0.4" width={dw / 3. - 0.8} height={dh / 2. - 0.8} rx="1.5" fill={if i % 2 == 0 { "#6a4a34" } else { "#5a3e2c" }} stroke="#1e120a" stroke-width="1" />
                        <path d={format!("M2 3 L{:.1} {:.1}", dw / 3. - 3., dh / 2. - 4.)} stroke="#a8784a" stroke-width="0.8" opacity="0.6" />
                        <circle cx="2.5" cy="2.5" r="0.9" fill="#d8b890" /><circle cx={dw / 3. - 2.5} cy="2.5" r="0.9" fill="#d8b890" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let lit = self.lanterns.iter().map(|a| frame.animate(a).clamp(0., 1.)).sum::<f32>() / LANTERNS.len() as f32;
        let lanterns = LANTERNS
            .iter()
            .enumerate()
            .map(|(i, &(x, y))| {
                let at = LANTERN_AT + 0.13 * i as f32;
                let k = frame.animate(&self.lanterns[i]).max(0.);
                let f = flicker(t, 0.3 + i as f32 * 0.21);
                if t < at {
                    return fframes::svgr!(<rect x={x - 1.5} y={y - 2.} width="3" height="4" fill="#2a1a10" />);
                }
                fframes::svgr!(
                    <g>
                        <circle cx={x} cy={y} r={(26. + 6. * f) * k.min(1.2)} fill="url(#g-candle)" opacity={0.95 * k.min(1.)} />
                        <circle cx={x} cy={y} r={(7. + 1.5 * f) * k.min(1.2)} fill="url(#g-ember)" opacity={k.min(1.)} />
                        <rect x={x - 2.2} y={y - 3.} width="4.4" height="6" rx="1.2" fill="#ffe6a0" opacity={k.min(1.)} />
                        {burst(x, y, t - at, 0.5, 6, 400 + i as u32 * 9, 26., "#ffe08a")}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let arch = format!("M{dx} {:.1} L{dx} {:.1} Q{:.1} {:.1} {:.1} {:.1} L{:.1} {:.1}Z", dy + dh, dy + 14., dx + dw / 2., dy - 8., dx + dw, dy + 14., dx + dw, dy + dh);
        let door = fframes::svgr!(
            <g>
                <ellipse cx={dx + dw / 2.} cy={dy + dh * 0.7} rx={60. * spill + 1.} ry={44. * spill + 1.} fill="url(#g-candle)" opacity={breathe} />
                <path d={arch.clone()} fill="url(#g-fireball)" opacity={0.75 * spill * breathe} />
                <path d={arch} fill="#fff0c0" opacity={0.25 * spill * breathe} filter="url(#blur3)" />
            </g>
        );
        // A goblin rocket climbs out of the gate and bursts over the crown.
        let (gx, gy) = project(cam, (dx + dw / 2., dy + dh * 0.5));
        let (cx, cy) = project(cam, CROWN);
        let pop = (cx - 120., (cy + 10.).max(110.));
        let rocket = if (ROCKET_AT..POP_AT).contains(&t) {
            let u = (t - ROCKET_AT) / (POP_AT - ROCKET_AT);
            let e = u * u * (3. - 2. * u);
            let px = lerp(gx, pop.0, e) + 40. * (PI * e).sin();
            let py = lerp(gy, pop.1, e);
            let trail = (1..14)
                .map(|k| {
                    let ue = ((u - k as f32 * 0.025).max(0.)).powi(2) * (3. - 2. * (u - k as f32 * 0.025).max(0.));
                    let tx = lerp(gx, pop.0, ue) + 40. * (PI * ue).sin();
                    let ty = lerp(gy, pop.1, ue);
                    fframes::svgr!(<circle cx={tx} cy={ty} r={3.5 - k as f32 * 0.2} fill="#ffd27a" opacity={1. - k as f32 / 14.} />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    {trail}
                    <circle cx={px} cy={py} r="18" fill="url(#g-ember)" />
                    <circle cx={px} cy={py} r="3.5" fill="#fffbe0" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        let firework = if (POP_AT..POP_AT + 1.12).contains(&t) {
            let dt = t - POP_AT;
            let life = 1.12;
            let sparks = (0..96u32)
                .map(|k| {
                    let a = TAU * k as f32 / 96. + rnd(k, 701) * 0.12;
                    let v = lerp(330., 560., rnd(k, 702)) * if k % 2 == 0 { 1. } else { 0.7 };
                    let drag = |d: f32| (1. - (-d * 3.).exp()) / 3.;
                    let (x, y) = (pop.0 + a.cos() * v * drag(dt), pop.1 + a.sin() * v * drag(dt) + 90. * dt * dt);
                    let d0 = (dt - 0.07).max(0.);
                    let (tx, ty) = (pop.0 + a.cos() * v * drag(d0), pop.1 + a.sin() * v * drag(d0) + 90. * d0 * d0);
                    let o = (1. - dt / life).powf(0.7) * (0.75 + 0.25 * (dt * 40. + k as f32).sin());
                    let fill = match k % 3 { 0 => "#fff6d2", 1 => "#ffc24a", _ => "#ff8a3a" };
                    fframes::svgr!(<path d={format!("M{tx:.1} {ty:.1} L{x:.1} {y:.1}")} stroke={fill} stroke-width="3.2" stroke-linecap="round" opacity={o} />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g>
                    <circle cx={pop.0} cy={pop.1} r={60. + 260. * (dt / 0.35).min(1.)} fill="url(#g-gold)" opacity={(1. - dt / 0.5).max(0.) * 0.9} />
                    <circle cx={pop.0} cy={pop.1} r={(18. * (1. - dt * 4.)).max(0.1)} fill="#ffffff" />
                    {sparks}
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Smoke from the crown's furnace, embers from the gate, in the loop.
        let (sx, sy) = project(cam, (1196., 12.));
        let smoke = (0..12u32)
            .map(|k| {
                let u = (t / LOOP + k as f32 / 12.).rem_euclid(1.);
                let x = sx + lerp(-20., 20., rnd(k, 711)) + 70. * u;
                let y = sy - 220. * u;
                fframes::svgr!(<circle cx={x} cy={y} r={20. + 60. * u} fill="url(#g-smoke)" opacity={0.7 * (PI * u).sin()} />)
            })
            .collect::<Vec<_>>();
        let embers = Motes { count: 34, seed: 721, area: (gx - 260., gy - 280., 520., 320.), rise: 260., period: LOOP, size: (0.9, 2.6), sway: 16., fill: "url(#g-ember)" };
        let sky = Fog { density: 0.5, soft: 0.25, light: Color::hex("#e89060"), shade: Color::hex("#4a1a2a"), dir: (-0.4, 0.0), scale: 1.4, seed: 31.0 };
        let jolt = (rattle * 0.4, 0.);
        fframes::svgr!(
            <g>
                <defs>
                    <clipPath id="hall-door"><path d={format!("M{dx} {:.1} L{dx} {:.1} Q{:.1} {:.1} {:.1} {:.1} L{:.1} {:.1}Z", dy + dh, dy + 14., dx + dw / 2., dy - 8., dx + dw, dy + 14., dx + dw, dy + dh)} /></clipPath>
                    <linearGradient id="g-hall-sky-fade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0.3" stop-color="#fff" />
                        <stop offset="1" stop-color="#000" />
                    </linearGradient>
                    <mask id="hall-sky"><rect x="-40" y="-40" width="1360" height="300" fill="url(#g-hall-sky-fade)" /></mask>
                </defs>
                <g transform={cam_transform(cam, jolt)}>
                    {painting}
                    <ellipse cx="1180" cy="150" rx="150" ry="80" fill="url(#g-candle)" opacity={0.6 * lit} />
                    {door}
                    <g clip-path="url(#hall-door)">{plates}</g>
                    {lanterns}
                </g>
                <g mask="url(#hall-sky)">{sky.draw(&self.sh, &frame, 0.6, (-40., -40., 1360., 300.))}</g>
                {smoke}
                {rays(&self.sh, &frame, (gx, gy), spill * 0.32 * breathe, 0.36, (1.0, 0.72, 0.4))}
                {embers.draw(t, spill)}
                {rocket}
                {firework}
                <rect width="1280" height="720" fill="url(#g-vignette)" />
                <rect width="1280" height="720" fill="#ffe8c0" opacity={frame.animate(&self.flash)} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 2. Snikkit

const ARRIVE_AT: f32 = 0.3;
const SKID_AT: f32 = 1.45;
const HALT_AT: f32 = 1.9;
const CREST_AT: f32 = 2.0;
const LETTERS_AT: f32 = 2.55;
const NAME: &str = "SNIKKIT";
/// The cart comes out of the side tunnel of the cave and rides at the camera.
const MOUTH: (f32, f32) = (1210., 452.);
const HOME: (f32, f32) = (880., 704.);
const SN_W: f32 = 520.;
const SN_H: f32 = 631.;

#[derive(Debug)]
pub struct Snikkit {
    sh: Shaders,
    ride: Anim,
    skid: Anim,
    tilt: Anim,
    crest: Anim,
    torch: Anim,
    letters: Vec<(Anim, Anim)>,
    title: Anim,
    underline: Anim,
}

impl Snikkit {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            ride: KeyFramesAnimation::new(vec![
                KeyFrame { start: ARRIVE_AT, end: Some(SKID_AT), from: 0., to: 0.82, easing: &Easing::EaseIn },
                KeyFrame { start: SKID_AT, end: Some(HALT_AT), from: 0.82, to: 1., easing: &Easing::EaseOut },
            ]),
            skid: tw(SKID_AT, HALT_AT, 0., 1., Easing::EaseOut),
            tilt: KeyFramesAnimation::new(vec![
                KeyFrame { start: SKID_AT, end: Some(HALT_AT), from: 0., to: 8., easing: &Easing::EaseOut },
                KeyFrame { start: HALT_AT, end: None, from: 8., to: 0., easing: &BOUNCY },
            ]),
            crest: tw(CREST_AT, CREST_AT + 0.8, 0., 1., Easing::EaseOut),
            torch: keys(&[(HALT_AT, HALT_AT + 0.12, 1., 2.0, Easing::EaseOut), (HALT_AT + 0.12, HALT_AT + 1.1, 2.0, 1., Easing::EaseInOut)]),
            letters: (0..NAME.len())
                .map(|i| {
                    let at = LETTERS_AT + 0.11 * i as f32;
                    (tw(at, at + 0.12, 2.2, 1., Easing::EaseIn), tw(at, at + 0.06, 0., 1., Easing::Linear))
                })
                .collect(),
            title: tw(LETTERS_AT - 0.2, LETTERS_AT + 0.1, 0., 1., Easing::EaseOut),
            underline: tw(LETTERS_AT + 0.8, LETTERS_AT + 1.4, 0., 1., Easing::EaseOut),
        }
    }
}

impl Scene for Snikkit {
    fn name(&self) -> &'static str {
        "BossSnikkit"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, mut frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let (Some(cave), Some(snikkit)) = (ctx.get_image("cave.png"), ctx.get_image("snikkit.png")) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let bg = painting(&self.sh, &frame, cave, Grade { dark: 0.42, dusk: 0.3, ..Default::default() });
        let ride = frame.animate(&self.ride);
        let skid = frame.animate(&self.skid);
        // Depth: far and small at the tunnel mouth, near and large at the front.
        let scale = lerp(0.18, 1., ride.powf(1.4));
        let feet = (lerp(MOUTH.0, HOME.0, ride) - 40. * skid * (1. - skid) * 4., lerp(MOUTH.1, HOME.1, ride));
        let moving = t > ARRIVE_AT && t < HALT_AT + 0.05;
        let bob = if moving { 4. * scale * (t * 38.).sin() } else { 2. * wave(t, 2., 0.3) };
        let breathe = 1. + 0.008 * wave(t, 1., 0.1);
        let tilt = frame.animate(&self.tilt) + if t > HALT_AT { 1. * wave(t, 2., 0.) } else { 0. };
        let (w, h) = (SN_W * scale * breathe, SN_H * scale * breathe);
        let (ox, oy) = (feet.0 - w * 0.6, feet.1 - h * 0.94 + bob);
        let torch = (ox + 500. / 560. * w, oy + 32. / 680. * h);
        let f = flicker(t, 0.21);
        let flare = frame.animate(&self.torch);
        // Sparks under the wheels; a long shower while it skids.
        let streaks = if moving && ride > 0.05 {
            let heavy = t > SKID_AT;
            (0..if heavy { 30 } else { 12 })
                .map(|k| {
                    let seed = (t * 30.) as u32 * 29 + k;
                    let len = lerp(20., if heavy { 150. } else { 60. }, rnd(seed, 1)) * scale;
                    let a = lerp(-0.6, 0.1, rnd(seed, 2)) + PI * 0.05;
                    let (sx, sy) = (feet.0 + lerp(-120., 60., rnd(seed, 3)) * scale, feet.1 - 4.);
                    fframes::svgr!(<path d={format!("M{sx:.1} {sy:.1} l{:.1} {:.1}", a.cos() * len, -a.sin().abs() * len * 0.5)} stroke="#ffd98a" stroke-width={lerp(1., 2.6, rnd(seed, 5))} stroke-linecap="round" opacity={lerp(0.5, 1., rnd(seed, 6))} />)
                })
                .collect::<Vec<_>>()
        } else {
            vec![]
        };
        // A crest of gold spikes, like his crown, opens behind him and turns slowly.
        let crest = frame.animate(&self.crest);
        let crest_layer = if crest > 0. {
            // Long and short spikes alternate, so one step is 60 degrees per loop.
            let spin = 60. * t / LOOP;
            let spikes = (0..12)
                .map(|i| {
                    let a = i as f32 * 30. + spin;
                    let long = if i % 2 == 0 { 300. } else { 240. };
                    fframes::svgr!(<path d={format!("M-16 -150 L0 {:.1} L16 -150Z", -150. - (long - 150.) * crest)} fill="url(#g-crown)" stroke="#7a4a10" stroke-width="2" transform={format!("rotate({a:.2})")} opacity="0.85" />)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(
                <g transform={format!("translate({:.1} 330) scale({:.3})", HOME.0 - 30., 0.6 + 0.4 * crest)}>
                    <circle r="330" fill="url(#g-candle)" opacity={0.75 * crest} />
                    {spikes}
                    <circle r="150" fill="none" stroke="#e0b250" stroke-width="5" opacity={crest} />
                    <circle r="160" fill="none" stroke="#fff0b0" stroke-width="1.5" opacity={0.6 * crest} />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // The name hammers in, letter by letter, with a puff for each blow.
        let font = FontQuery { family: "Cinzel", size: 76, weight: 900, ..Default::default() };
        let mut x = 80.;
        let mut glyphs = vec![];
        for (i, c) in NAME.chars().enumerate() {
            let s = c.to_string();
            let wdt = frame.text_width(ctx, font, &NAME[i..i + 1]).unwrap_or(50) as f32;
            let (slam, show) = (frame.animate(&self.letters[i].0), frame.animate(&self.letters[i].1));
            let at = LETTERS_AT + 0.11 * i as f32 + 0.12;
            let cx = x + wdt / 2.;
            if show > 0. {
                glyphs.push(fframes::svgr!(
                    <g transform={format!("translate({cx:.1} 316) scale({slam:.3}) translate({:.1} -316)", -cx)} opacity={show}>
                        <text x={x + 3.} y="320" font-family="Cinzel" font-weight="900" font-size="76" fill="#1a0503" opacity="0.6">{s.clone()}</text>
                        <text x={x} y="316" font-family="Cinzel" font-weight="900" font-size="76" fill="url(#g-mesa-title)" stroke="#2a0904" stroke-width="2.4">{s}</text>
                    </g>
                ));
                glyphs.push(dust_burst(cx, 318., t - at, 0.7, 6, 800 + i as u32, 70., "url(#g-dust)"));
            }
            x += wdt + 4.;
        }
        let name_w = x - 84.;
        let title = frame.animate(&self.title);
        let underline = frame.animate(&self.underline);
        let hammer = (0..NAME.len()).map(|i| shake(t, LETTERS_AT + 0.11 * i as f32 + 0.12, 2.5).1).sum::<f32>();
        let shake = shake(t, HALT_AT, 9.);
        let motes = Motes { count: 40, seed: 741, area: (500., 0., 760., 720.), rise: 300., period: LOOP, size: (0.8, 2.4), sway: 20., fill: "url(#g-ember)" };
        let fuses = [(318., 352.), (396., 362.)]
            .iter()
            .enumerate()
            .map(|(i, &(fx, fy))| {
                let (px, py) = (ox + fx / 560. * w, oy + fy / 680. * h);
                burst(px, py, loop_phase(t * 2. + i as f32 * 0.37) * 0.5, 0.5, 7, 330 + i as u32 * 7, 90. * scale, "#ffe08a")
            })
            .collect::<Vec<_>>();
        let rail = |side: f32| format!("M{:.1} {:.1} Q{:.1} {:.1} {:.1} 740", MOUTH.0 + side * 10., MOUTH.1 + 8., 1100. + side * 40., 560., HOME.0 - 40. + side * 120.);
        fframes::svgr!(
            <g transform={format!("translate({:.1} {:.1})", shake.0, shake.1 + hammer)}>
                <g transform="scale(0.8)">{bg}</g>
                <rect width="1280" height="720" fill="#120604" opacity={0.3 * (1. - crest)} />
                <circle cx={MOUTH.0} cy={MOUTH.1 - 20.} r="140" fill="url(#g-candle)" opacity={0.7 * (1. - ride)} />
                <path d={rail(-1.)} fill="none" stroke="#b8a48a" stroke-width="4" />
                <path d={rail(1.)} fill="none" stroke="#8a7a68" stroke-width="5" />
                {crest_layer}
                {rays(&self.sh, &frame, (HOME.0 - 30., -120.), 0.45 * crest, 1.0, (1.0, 0.86, 0.56))}
                <ellipse cx={feet.0 - 30.} cy={feet.1 + 4.} rx={240. * scale} ry={30. * scale} fill="#000" opacity="0.45" />
                <g transform={format!("rotate({tilt:.2} {:.1} {:.1})", feet.0, feet.1)}>
                    <image href={snikkit.href()} x={ox} y={oy} width={w} height={h} filter="url(#aura)" opacity={0.5 * after(t, HALT_AT, 0.6)} />
                    <image href={snikkit.href()} x={ox} y={oy} width={w} height={h} />
                    <circle cx={torch.0} cy={torch.1} r={(70. + 20. * f) * flare * scale} fill="url(#g-ember)" opacity="0.85" />
                    {fuses}
                </g>
                {streaks}
                {dust_burst(feet.0 - 40., feet.1, t - HALT_AT, 1.2, 20, 751, 360., "url(#g-dust)")}
                {motes.draw(t, after(t, HALT_AT, 1.))}
                <g opacity={title}>
                    <text x="86" y="222" font-family="Cinzel" font-weight="900" font-size="26" letter-spacing="10" fill="#f0c86a">"BOSS"</text>
                </g>
                {glyphs}
                <path d={format!("M84 342 L{:.1} 342", 84. + name_w * underline)} stroke="#e0602a" stroke-width="3" />
                <path d={format!("M84 350 L{:.1} 350", 84. + name_w * 0.6 * underline)} stroke="#f0c86a" stroke-width="1.5" />
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 3. Trick

/// The belt carries stones at SPEED; one stone every GAP, so two per loop.
const SPEED: f32 = 70.;
const GAP: f32 = 140.;
const BELT_Y: f32 = 352.;
const BELT_END: f32 = 520.;
const VAT: (f32, f32) = (640., 470.);
const STACK: (f32, f32) = (900., 480.);
const WHISTLE_AT: f32 = 0.25;

/// Distance the belt has moved: it speeds up from 0.3 s to 1.3 s.
fn belt(t: f32) -> f32 {
    if t < 0.3 {
        0.
    } else if t < 1.3 {
        SPEED * (t - 0.3).powi(2) / 2.
    } else {
        SPEED * (t - 0.8)
    }
}

#[derive(Debug)]
pub struct Trick {
    _sh: Shaders,
    stones: Vec<String>,
    lights: Anim,
}

impl Trick {
    pub fn new(sh: Shaders) -> Self {
        Self { _sh: sh, stones: (0..2).map(|i| stone(900 + i, 26.)).collect(), lights: tw(0., 0.8, 0., 1., Easing::EaseOut) }
    }
}

/// A gear with `teeth`, centered at the origin.
fn gear(r: f32, teeth: u32) -> String {
    let mut pts = vec![];
    for i in 0..teeth * 2 {
        let a0 = TAU * i as f32 / (teeth * 2) as f32;
        let rr = if i % 2 == 0 { r } else { r * 0.84 };
        pts.push(((a0 - 0.08).cos() * rr, (a0 - 0.08).sin() * rr));
        pts.push(((a0 + 0.08).cos() * rr, (a0 + 0.08).sin() * rr));
    }
    path(&pts, true)
}

impl Scene for Trick {
    fn name(&self) -> &'static str {
        "BossTrick"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let Some(bokeh) = ctx.get_image("cave-bokeh.png") else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let s = belt(t);
        let run = (s / (SPEED * 0.5)).min(1.);
        // Gears turn with the belt: one turn per loop, so their teeth repeat.
        let turn = s * 360. / (SPEED * LOOP);
        let gears = [(250., 200., 70., 12, 1.), (360., 140., 46., 8, -1.5), (1110., 230., 86., 12, -0.75), (980., 160., 52., 8, 1.25)]
            .iter()
            .map(|&(x, y, r, n, k)| {
                fframes::svgr!(
                    <g transform={format!("translate({x} {y}) rotate({:.2})", turn * k)}>
                        <path d={gear(r, n)} fill="#4a3a2c" stroke="#1e140c" stroke-width="3" />
                        <circle r={r * 0.62} fill="none" stroke="#7a6450" stroke-width="4" />
                        <path d={format!("M{:.1} 0 L{:.1} 0 M0 {:.1} L0 {:.1}", -r * 0.6, r * 0.6, -r * 0.6, r * 0.6)} stroke="#6a5644" stroke-width="7" />
                        <circle r={r * 0.16} fill="#a08870" stroke="#1e140c" stroke-width="2" />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        // Stones ride the belt and drop into the vat.
        let stones = (0..10)
            .filter_map(|k| {
                let x = -80. + (s + k as f32 * GAP).rem_euclid(GAP * 10.) - GAP * 1.5;
                let d = &self.stones[k % 2];
                if x < BELT_END {
                    if x < -60. {
                        return None;
                    }
                    let spin = x * 0.5;
                    return Some(fframes::svgr!(
                        <g transform={format!("translate({x:.1} {:.1}) rotate({spin:.1})", BELT_Y - 22.)}>
                            <path d={d.clone()} fill="url(#g-rock)" stroke="#2a0c04" stroke-width="2" />
                            <path d="M-8 -8 L4 -12" stroke="#f0a070" stroke-width="2" opacity="0.6" />
                        </g>
                    ));
                }
                // Over the edge: a short fall into the paint.
                let fall = (x - BELT_END) / SPEED;
                if fall > 0.62 {
                    return None;
                }
                let px = BELT_END + SPEED * fall + 30. * fall;
                let py = BELT_Y - 22. + 340. * fall * fall;
                Some(fframes::svgr!(
                    <g transform={format!("translate({px:.1} {py:.1}) rotate({:.1})", x * 0.5 + fall * 200.)}>
                        <path d={d.clone()} fill="url(#g-rock)" stroke="#2a0c04" stroke-width="2" />
                    </g>
                ))
            })
            .collect::<Vec<_>>();
        // A splash each time a stone hits the paint (two per loop).
        let splash_dt = ((s - GAP * 1.5 - 80. - BELT_END) / SPEED - 0.62).rem_euclid(GAP / SPEED);
        let splash = if t > 1.4 {
            let dt = splash_dt;
            let drops = (0..12u32)
                .map(|k| {
                    let a = lerp(-PI * 0.9, -PI * 0.1, rnd(k, 761));
                    let v = lerp(120., 260., rnd(k, 762));
                    let x = VAT.0 - 40. + a.cos() * v * dt;
                    let y = VAT.1 - 72. + a.sin() * v * dt + 700. * dt * dt;
                    let o = (1. - dt / 0.6).max(0.);
                    fframes::svgr!(<circle cx={x} cy={y} r={lerp(3., 6., rnd(k, 763)) * (dt / 0.08).min(1.)} fill="url(#g-paint)" opacity={o} />)
                })
                .collect::<Vec<_>>();
            let ring = if dt < 0.5 { fframes::svgr!(<ellipse cx={VAT.0 - 40.} cy={VAT.1 - 72.} rx={10. + 60. * dt * 2.} ry={3. + 12. * dt * 2.} fill="none" stroke="#fff2a8" stroke-width={4. * (1. - dt * 2.)} opacity={(dt / 0.06).min(1.)} />) } else { Svgr::empty() };
            fframes::svgr!(<g>{ring}{drops}</g>)
        } else {
            Svgr::empty()
        };
        // Coins jump out of the vat onto the stack, half a gap after each splash.
        let coin_dt = (splash_dt - GAP / SPEED / 2.).rem_euclid(GAP / SPEED);
        // Each landing coin presses the stack down by one coin into its tray, so
        // the stack keeps its height and loops without a jump.
        let since = if t >= 2.79 { (t - 0.79).rem_euclid(GAP / SPEED) } else { 1. };
        let sinking = since < 0.25;
        let shift = if sinking { 10. * ease_out(since / 0.25) } else { 0. };
        let stack = (0..if sinking { 12u32 } else { 11 })
            .map(|k| coin(STACK.0, STACK.1 - k as f32 * 10. + shift, 34., 0.28, 0., false))
            .collect::<Vec<_>>();
        let flying = if t > 1.8 && coin_dt < 0.8 {
            let u = coin_dt / 0.8;
            let top = STACK.1 - 11. * 10.;
            let x = lerp(VAT.0 + 60., STACK.0, u);
            let y = lerp(VAT.1 - 70., top, u) - 200. * (PI * u).sin();
            let ratio = 0.2 + 0.8 * (u * TAU * 1.5).cos().abs();
            let grow = (u / 0.2).min(1.);
            fframes::svgr!(<g opacity={grow}>{coin(x, y, 26. * (0.4 + 0.6 * grow), ratio, 0., false)}{glint(x + 8., y - 8., 6., (PI * u).sin())}</g>)
        } else {
            Svgr::empty()
        };
        // Steam: the whistle at the start, then a puff every half loop.
        let steam = (0..8u32)
            .map(|k| {
                let u = (t / (LOOP / 2.) + k as f32 / 8.).rem_euclid(1.);
                let x = 820. + 30. * u + lerp(-10., 10., rnd(k, 781));
                let y = 250. - 160. * u;
                fframes::svgr!(<circle cx={x} cy={y} r={14. + 46. * u} fill="url(#g-steam)" opacity={0.6 * (PI * u).sin() * run} />)
            })
            .collect::<Vec<_>>();
        let whistle = if (WHISTLE_AT..WHISTLE_AT + 1.0).contains(&t) {
            let u = (t - WHISTLE_AT) / 1.0;
            fframes::svgr!(<g>{(0..6u32).map(|k| { let v = (u * 1.4 - k as f32 * 0.07).clamp(0., 1.); fframes::svgr!(<circle cx={812. + 40. * v} cy={260. - 200. * v} r={10. + 60. * v} fill="url(#g-steam)" opacity={(1. - v) * 0.95} />) }).collect::<Vec<_>>()}</g>)
        } else {
            Svgr::empty()
        };
        // The paint bubbles; its glow lights the room.
        let bubbles = (0..7u32)
            .map(|k| {
                let u = (t / (LOOP / 2.) + rnd(k, 791)).rem_euclid(1.);
                let x = VAT.0 + lerp(-110., 110., rnd(k, 792));
                let r = 3. + 9. * u;
                fframes::svgr!(<circle cx={x} cy={VAT.1 - 76.} r={r} fill="none" stroke="#fff6c0" stroke-width="2" opacity={(1. - u) * 0.9} />)
            })
            .collect::<Vec<_>>();
        let lights = frame.animate(&self.lights);
        let belt_marks = (0..14)
            .map(|k| {
                let x = -40. + (s + k as f32 * 40.).rem_euclid(40. * 14.) - 40.;
                fframes::svgr!(<path d={format!("M{x:.1} {} L{:.1} {}", BELT_Y + 2., x + 12., BELT_Y + 2.)} stroke="#2a1a10" stroke-width="3" />)
            })
            .collect::<Vec<_>>();
        let rollers = (0..6)
            .map(|k| {
                let x = 20. + k as f32 * 100.;
                fframes::svgr!(<g transform={format!("translate({x} {}) rotate({:.1})", BELT_Y + 14., turn * 2.)}><circle r="12" fill="#4a3a2c" stroke="#1e140c" stroke-width="2" /><path d="M-10 0 L10 0" stroke="#8a7460" stroke-width="2" /></g>)
            })
            .collect::<Vec<_>>();
        let drips = (0..3u32)
            .map(|k| {
                let x = VAT.0 + [-120., 30., 110.][k as usize];
                let u = (t / LOOP + k as f32 * 0.37).rem_euclid(1.);
                // The drip grows, lets go of a drop, then pulls back, so it loops without a jump.
                let len = if u < 0.7 { 20. + 70. * u / 0.7 } else { 90. - 70. * (u - 0.7) / 0.3 };
                let fall = ((u - 0.7) / 0.3).max(0.);
                fframes::svgr!(
                    <g>
                        <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", x, VAT.1 - 86., x - 0.12 * (x - VAT.0) * 0.2, VAT.1 - 86. + len)} stroke="#f2c04e" stroke-width="7" stroke-linecap="round" />
                        <circle cx={x - 0.024 * (x - VAT.0)} cy={VAT.1 - 86. + len + 80. * fall * fall} r={if fall > 0. { 4.5 } else { 5.5 }} fill="#f6d06a" opacity={if fall > 0.9 { (1. - fall) * 10. } else { 1. }} />
                    </g>
                )
            })
            .collect::<Vec<_>>();
        fframes::svgr!(
            <g>
                <rect width="1280" height="720" fill="#0b0503" />
                <image href={bokeh.href()} x="0" y="0" width="1280" height="720" opacity="0.65" />
                <g transform="translate(640 330) scale(1.32) translate(-640 -330)">
                <g opacity="0.85">{gears}</g>
                <circle cx={VAT.0} cy={VAT.1 - 80.} r="420" fill="url(#g-gold)" opacity={0.3 * lights + 0.05 * wave(t, 2., 0.)} />
                <path d="M780 320 L780 230 L830 230 L830 210" fill="none" stroke="#3a2a20" stroke-width="18" />
                <path d="M780 320 L780 230 L830 230 L830 210" fill="none" stroke="#7a6450" stroke-width="6" />
                {steam}
                {whistle}
                <rect x="-20" y={BELT_Y} width={BELT_END + 40.} height="22" rx="10" fill="#3a2a20" stroke="#120a06" stroke-width="3" />
                {belt_marks}
                {rollers}
                {stones}
                <path d={format!("M{} {} L{} {} L{} {} L{} {}Z", VAT.0 - 170., VAT.1 - 90., VAT.0 + 170., VAT.1 - 90., VAT.0 + 140., VAT.1 + 130., VAT.0 - 140., VAT.1 + 130.)} fill="url(#g-iron)" stroke="#120a06" stroke-width="4" />
                <path d={format!("M{} {} L{} {}", VAT.0 - 160., VAT.1 - 20., VAT.0 + 160., VAT.1 - 20.)} stroke="#2a2018" stroke-width="8" />
                <path d={format!("M{} {} L{} {}", VAT.0 - 150., VAT.1 + 60., VAT.0 + 150., VAT.1 + 60.)} stroke="#2a2018" stroke-width="8" />
                <ellipse cx={VAT.0} cy={VAT.1 - 84.} rx="164" ry="24" fill="url(#g-paint)" />
                <ellipse cx={VAT.0} cy={VAT.1 - 90.} rx="172" ry="26" fill="none" stroke="#5a4a3a" stroke-width="7" />
                <g transform={format!("translate({} {}) scale(0.42)", VAT.0, VAT.1 + 18.)}>{bucket_crown(0.5 + 0.5 * wave(t, 1., 0.))}</g>
                {drips}
                {bubbles}
                {splash}
                <ellipse cx={STACK.0} cy={STACK.1 + 30.} rx="70" ry="14" fill="#000" opacity="0.5" />
                {stack}
                <path d={format!("M{} {} L{} {} L{} {} L{} {}Z", STACK.0 - 52., STACK.1 + 6., STACK.0 + 52., STACK.1 + 6., STACK.0 + 46., STACK.1 + 34., STACK.0 - 46., STACK.1 + 34.)} fill="url(#g-wood)" stroke="#1e1008" stroke-width="2.5" />
                {flying}
                </g>
                {Motes { count: 36, seed: 801, area: (300., 100., 700., 600.), rise: 260., period: LOOP, size: (0.8, 2.4), sway: 18., fill: "url(#g-gold)" }.draw(t, 0.8 * lights)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.85" />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 4. Buyer

const VP: (f32, f32) = (640., 300.);
const AWAY_AT: f32 = 0.3;
const GONE_AT: f32 = 1.9;
const BACK_AT: f32 = 2.7;
const HOME_AT: f32 = 4.3;

#[derive(Debug)]
pub struct Buyer {
    _sh: Shaders,
    away: Anim,
    back: Anim,
    glow: Anim,
}

impl Buyer {
    pub fn new(sh: Shaders) -> Self {
        Self {
            _sh: sh,
            away: tw(AWAY_AT, GONE_AT, 1.25, 12., Easing::EaseIn),
            back: KeyFramesAnimation::new(vec![
                KeyFrame { start: BACK_AT, end: Some(HOME_AT - 0.3), from: 14., to: 1.5, easing: &Easing::EaseOut },
                KeyFrame { start: HOME_AT - 0.3, end: None, from: 1.5, to: 1.45, easing: &SOFT },
            ]),
            glow: tw(1.8, 3.0, 0., 1., Easing::EaseInOut),
        }
    }
}

impl Scene for Buyer {
    fn name(&self) -> &'static str {
        "BossBuyer"
    }
    fn duration(&self) -> Duration<'_> {
        Duration::Frames(CLIP_FRAMES)
    }
    fn render_frame<'a>(&'a self, frame: Frame, _ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let glow = frame.animate(&self.glow);
        let returning = t >= BACK_AT;
        let z = if returning { frame.animate(&self.back) } else { frame.animate(&self.away) };
        let s = 1. / z;
        let (vx, vy) = VP;
        let floor = vy + 330. * s;
        let near = ((3. - z) / 2.).clamp(0., 1.);
        let breathe = 0.8 + 0.2 * wave(t, 2., 0.) + 0.08 * wave(t, 5., 0.3);
        // The cart carries gold away, and comes back full of glowcaps.
        let load = if returning {
            let caps = (0..7u32)
                .map(|k| {
                    let x = lerp(-48., 48., k as f32 / 6.) + lerp(-6., 6., rnd(k, 811));
                    let size = lerp(22., 34., rnd(k, 812));
                    fframes::svgr!(<g transform={format!("translate({x:.1} {:.1})", -54. + lerp(-4., 6., rnd(k, 813)))}>{glowcap(size, breathe, k)}</g>)
                })
                .collect::<Vec<_>>();
            fframes::svgr!(<g><ellipse cx="0" cy="-56" rx="60" ry="14" fill="#1e3a3a" />{caps}</g>)
        } else {
            coin_heap(0.6)
        };
        let fade = (1.4 - z / 10.).clamp(0., 1.);
        let lit = if returning { 1. } else { (1. - (z - 1.25) / 4.).clamp(0.15, 1.) };
        let spin = if returning { -(14. - z) * 120. } else { (z - 1.25) * 160. };
        let cart_layer = fframes::svgr!(
            <g opacity={fade}>
                <circle cx={vx} cy={floor - 60. * s} r={(700. * s).max(1.)} fill="url(#g-cyan)" opacity={if returning { 0.75 * breathe } else { 0. }} />
                <g transform={format!("translate({vx:.1} {floor:.1}) scale({:.4})", 2.2 * s)} opacity={lit}>
                    {cart(spin, load)}
                </g>
            </g>
        );
        let rumble = if returning && t < HOME_AT { shake(t, HOME_AT - 0.35, 5.) } else { (0., 0.) };
        // A violet light flickers deep in the tunnel, once per loop.
        let violet = if t > 3.5 { (-(loop_phase(t - 1.0) - 0.6).powi(2) * 90.).exp() * 0.55 } else { 0. };
        let spores = Motes { count: 60, seed: 821, area: (vx - 420., vy - 300., 840., 720.), rise: 380., period: LOOP, size: (1., 3.), sway: 26., fill: "url(#g-cyan)" };
        fframes::svgr!(
            <g transform={format!("translate({:.1} {:.1})", rumble.0, rumble.1)}>
                {tunnel_view(t, VP, 0., glow, 0.9)}
                <circle cx={vx} cy={vy} r="70" fill="url(#g-violet)" opacity={violet} />
                {cart_layer}
                {spores.draw(t, near * glow)}
                <rect width="1280" height="720" fill="#5ff2dc" opacity={0.06 * near * breathe} />
            </g>
        )
    }
}

// ---------------------------------------------------------------- 5. Challenge

/// The three lanes recede from your side (left) toward Snikkit (right):
/// (center y, height) at the near end and at the far end.
const NEAR: [(f32, f32); 3] = [(250., 84.), (362., 98.), (486., 112.)];
const FAR: [(f32, f32); 3] = [(214., 54.), (334., 62.), (454., 70.)];
const LANE_L: f32 = 150.;
const LANE_R: f32 = 880.;
const GUARD: f32 = 0.84;
const WALL_AT: [f32; 2] = [1.3, 1.6];
const SLAM_AT: f32 = 2.3;
const RISE_AT: f32 = 2.9;
const SURGE_AT: f32 = 3.6;

fn lane_at(i: usize, u: f32) -> (f32, f32, f32) {
    (lerp(LANE_L, LANE_R, u), lerp(NEAR[i].0, FAR[i].0, u), lerp(NEAR[i].1, FAR[i].1, u))
}

#[derive(Debug)]
pub struct Challenge {
    sh: Shaders,
    lanes: Vec<Anim>,
    hero_drop: Anim,
    walls: Vec<Anim>,
    fall: Anim,
    flash: Anim,
    rise: Anim,
    rise_in: Anim,
    surge: Anim,
    punch: Anim,
    ticks: Anim,
}

impl Challenge {
    pub fn new(sh: Shaders) -> Self {
        Self {
            sh,
            lanes: (0..3).map(|i| tw(0.3 + 0.12 * i as f32, 1.1 + 0.12 * i as f32, 0., 1., Easing::EaseInOut)).collect(),
            hero_drop: tw(0.05, 0.35, -420., 0., Easing::EaseIn),
            walls: WALL_AT.iter().map(|&at| tw(at - 0.3, at, 0., 1., Easing::EaseIn)).collect(),
            fall: tw(SLAM_AT - 0.42, SLAM_AT, 0., 1., Easing::EaseIn),
            flash: flash(SLAM_AT, 0.5, 0.5),
            rise: spring(RISE_AT, 90., 0., HEAVY),
            rise_in: tw(RISE_AT, RISE_AT + 0.45, 0., 1., Easing::EaseOut),
            surge: keys(&[(SURGE_AT - 0.1, SURGE_AT, 0., 1., Easing::Linear), (SURGE_AT, SURGE_AT + 1.0, 1., 0.35, Easing::EaseOut)]),
            punch: punch(SURGE_AT, 1.04),
            ticks: tw(1.2, 1.8, 0., 1., Easing::EaseOut),
        }
    }
}

/// A card that falls into its lane, slams and casts a ring of dust.
fn slam_card<'a>(art: &fframes::media::ImageData<'_>, t: f32, at: f32, fall: f32, (cx, cy): (f32, f32), scale: f32, glow: (&'static str, f32)) -> Svgr<'a> {
    if fall <= 0. {
        return Svgr::empty();
    }
    let x = lerp(cx + 100., cx, fall);
    let y = lerp(-200., cy, fall);
    let rot = lerp(24., -3., fall);
    let s = lerp(scale * 1.5, scale, fall);
    let ground = cy + 70. * scale / 1.2;
    let ring = if (at..at + 0.8).contains(&t) {
        let a = (t - at) / 0.8;
        fframes::svgr!(
            <g>
                <ellipse cx={cx} cy={ground} rx={50. + 240. * a * scale} ry={12. + 46. * a * scale} fill="none" stroke="#ffe2a0" stroke-width={12. * (1. - a)} opacity={1. - a} />
                <ellipse cx={cx} cy={ground} rx={70. + 280. * a * scale} ry={18. + 56. * a * scale} fill="url(#g-dust)" opacity={0.7 * (1. - a)} />
            </g>
        )
    } else {
        Svgr::empty()
    };
    let pulse = if t > at { glow.1 * (0.75 + 0.25 * wave(t, 2., cx * 0.001)) } else { 0. };
    fframes::svgr!(
        <g>
            <ellipse cx={cx} cy={cy} rx={110. * scale} ry={130. * scale} fill={glow.0} opacity={pulse} />
            {ring}
            <g transform={format!("translate({x:.1} {y:.1}) rotate({rot:.1}) scale({s:.3})")}>
                <rect x="-46" y="-60" width="100" height="134" rx="9" fill="#000" opacity="0.45" />
                {card_front(art)}
            </g>
            {burst(cx, ground - 10., t - at, 0.9, 22, 900 + cx as u32, 300., "url(#g-ember)")}
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
        let (Some(field), Some(snikkit), Some(grukka), Some(wall)) = (
            ctx.get_image("red-mesas.png"),
            ctx.get_image("snikkit.png"),
            ctx.get_image("card-warchief-grukka.png"),
            ctx.get_image("card-junk-barricade.png"),
        ) else {
            return Svgr::empty();
        };
        let t = frame.seconds();
        let surge = frame.animate(&self.surge);
        let painting = painting(&self.sh, &frame, field, Grade { dusk: 0.9, dark: 0.42, heat: 0.4, ..Default::default() });
        let ticks = frame.animate(&self.ticks);
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
                let body = 0.1 + 0.2 * surge + 0.04 * wave(t, 2., i as f32 * 0.3);
                let head = if p < 1. {
                    fframes::svgr!(<g><circle cx={hx} cy={hy} r={hh} fill="url(#g-gold)" /><circle cx={hx} cy={hy} r="5" fill="#fffef4" /></g>)
                } else {
                    Svgr::empty()
                };
                let cols = (1..11)
                    .map(|c| {
                        let (x, y, h) = lane_at(i, c as f32 / 11.);
                        fframes::svgr!(<path d={format!("M{x:.1} {:.1} L{x:.1} {:.1}", y - h / 2. + 4., y + h / 2. - 4.)} stroke="#fff2c8" stroke-width="1.5" opacity={0.25 * ticks} />)
                    })
                    .collect::<Vec<_>>();
                let pulses = (0..4)
                    .flat_map(|k| {
                        let u = 0.5 * ((flow + k as f32 / 4.).rem_euclid(1.0));
                        [(u, "#fff6d2"), (1. - u, "#ffb09a")]
                    })
                    .map(|(u, fill)| {
                        let (x, y, h) = lane_at(i, u);
                        let o = ticks * (PI * (u - 0.5).abs() * 2.).sin().max(0.).powf(0.6);
                        fframes::svgr!(<ellipse cx={x} cy={y} rx={h * 0.42} ry={h * 0.06} fill={fill} opacity={0.85 * o} />)
                    })
                    .collect::<Vec<_>>();
                fframes::svgr!(
                    <g>
                        <defs>
                            <clipPath id={format!("rm-lane-{i}")}><rect x={LANE_L - 10.} y="0" width={(hx - LANE_L + 10.).max(0.1)} height="720" /></clipPath>
                        </defs>
                        <g clip-path={format!("url(#rm-lane-{i})")}>
                            <path d={shape} fill="url(#g-lane)" opacity={body} />
                            <path d={edges.clone()} stroke="url(#g-lane)" stroke-width="10" opacity={0.35 + 0.4 * surge} filter="url(#blur8u)" />
                            <path d={edges} stroke="url(#g-lane)" stroke-width="2.5" />
                            {cols}
                            {pulses}
                        </g>
                        {head}
                    </g>
                )
            })
            .collect::<Vec<_>>();
        let hero_flag = fframes::svgr!(<circle r="18" fill="#fff4cc" stroke="#a8641a" stroke-width="3" />);
        let hero_drop = frame.animate(&self.hero_drop);
        let hero_banner = fframes::svgr!(<g transform={format!("translate(84 {:.1})", 560. + hero_drop)}>{banner(t, 380., "#f0b83c", "#7a4a0c", hero_flag, 0.)}</g>);
        // Junk Barricades slam into Lanes 1 and 3, then Grukka lands in the middle.
        let walls = [0usize, 2]
            .iter()
            .enumerate()
            .map(|(k, &lane)| {
                let (x, y, _) = lane_at(lane, GUARD);
                slam_card(wall, t, WALL_AT[k], frame.animate(&self.walls[k]), (x - 6., y), 0.86, ("url(#g-gold)", 0.35))
            })
            .collect::<Vec<_>>();
        let (gx, gy, _) = lane_at(1, GUARD);
        let warchief = slam_card(grukka, t, SLAM_AT, frame.animate(&self.fall), (gx, gy), 1.12, ("url(#g-ember)", 0.7));
        let epic = if t > SLAM_AT {
            let a = after(t, SLAM_AT, 0.6);
            fframes::svgr!(
                <g transform={format!("translate({gx:.1} {gy:.1}) rotate(-3) scale(1.12)")} opacity={a}>
                    <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="url(#g-epic)" stroke-width="4" />
                    <rect x="-53" y="-70" width="106" height="140" rx="11" fill="none" stroke="#ff9a3a" stroke-width="10" opacity={0.35 + 0.15 * wave(t, 2., 0.)} filter="url(#blur8)" />
                </g>
            )
        } else {
            Svgr::empty()
        };
        // Snikkit rises at the far end in a fire rim light.
        let rise_in = frame.animate(&self.rise_in);
        let rise = frame.animate(&self.rise);
        let breathe = 1. + 0.006 * wave(t, 1., 0.2);
        let f = flicker(t, 0.21);
        let boss = if rise_in > 0. {
            let fire = ((t - RISE_AT) / 0.9).clamp(0., 1.);
            let (bx, by, bw, bh) = (842., 190., 430., 522.);
            fframes::svgr!(
                <g>
                    <circle cx="1060" cy="330" r={120. + 320. * fire} fill="url(#g-red)" opacity={0.75 * (1. - fire) + 0.35} />
                    <g transform={format!("translate(0 {rise:.1}) translate(1060 712) scale({breathe:.4}) translate(-1060 -712)")} opacity={rise_in}>
                        <image href={snikkit.href()} x={bx} y={by} width={bw} height={bh} filter="url(#aura)" opacity="0.8" />
                        <image href={snikkit.href()} x={bx} y={by} width={bw} height={bh} />
                        <circle cx={bx + 500. / 560. * bw} cy={by + 32. / 680. * bh} r={60. + 16. * f} fill="url(#g-ember)" opacity="0.85" />
                    </g>
                </g>
            )
        } else {
            Svgr::empty()
        };
        let drums = [0.1, 0.55, 1.0, 1.45].iter().map(|&at| shake(t, at, 3.).1).sum::<f32>();
        let flash = frame.animate(&self.flash);
        let zoom = frame.animate(&self.punch);
        let (kx, ky) = shake(t, SLAM_AT, 14.);
        let sparks = Motes { count: 50, seed: 951, area: (0., 60., 1280., 700.), rise: 560., period: LOOP, size: (1.2, 3.2), sway: 20., fill: "url(#g-ember)" };
        let dust = Fog { density: 0.4, soft: 0.25, light: Color::hex("#8a3a1a"), shade: Color::hex("#2a0c06"), dir: (-0.35, 0.05), scale: 1.6, seed: 13.0 };
        fframes::svgr!(
            <g>
                <g transform={format!("translate(640 360) scale({zoom:.4}) translate(-640 -360)")}>
                    <g transform={format!("translate({kx:.1} {:.1})", ky + drums)}>
                        <g transform="scale(0.8)">{painting}</g>
                        <rect width="1280" height="720" fill="url(#g-red-sky)" opacity="0.3" />
                        <rect width="1280" height="720" fill="url(#g-top-shade)" />
                        {boss}
                        {lanes}
                        {walls}
                        {epic}
                        {warchief}
                        {hero_banner}
                    </g>
                </g>
                {dust.draw(&self.sh, &frame, 0.55, (-40., -60., 1360., 300.))}
                {sparks.draw(t, 0.4 + 0.5 * surge)}
                <rect width="1280" height="720" fill="url(#g-vignette)" opacity="0.8" />
                <rect width="1280" height="720" fill="#fff4d0" opacity={flash} />
            </g>
        )
    }
}
