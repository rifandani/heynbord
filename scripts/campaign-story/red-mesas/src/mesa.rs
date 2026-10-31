//! Red Mesas props and impacts, on top of the shared fx toolkit. Ambient motion
//! repeats every LOOP seconds, like the rest of the toolkit.
use crate::fx::*;
use fframes::{
    FFramesContext, FontQuery, Frame, Shader, ShaderUniforms, Svgr,
    animation::{Easing, KeyFrame, KeyFramesAnimation},
};
use std::f32::consts::{PI, TAU};

/// A flash that peaks fast and fades.
pub fn flash(at: f32, peak: f32, fade: f32) -> Anim {
    keys(&[(at, at + 0.06, 0., peak, Easing::Linear), (at + 0.06, at + fade, peak, 0., Easing::EaseOut)])
}

/// A short push to `amount`, then a spring back to 1.
pub fn punch(at: f32, amount: f32) -> Anim {
    KeyFramesAnimation::new(vec![
        KeyFrame { start: at - 0.06, end: Some(at), from: 1.0, to: amount, easing: &Easing::Linear },
        KeyFrame { start: at, end: None, from: amount, to: 1.0, easing: &BOUNCY },
    ])
}

/// Map units to screen pixels for a camera pose.
pub fn project((cx, cy, z): (f32, f32, f32), (x, y): (f32, f32)) -> (f32, f32) {
    (640. + (x - cx) * 0.8 * z, 360. + (y - cy) * 0.8 * z)
}

/// 0 before `at`, then 0..1 over `length` seconds.
pub fn after(t: f32, at: f32, length: f32) -> f32 {
    ((t - at) / length).clamp(0., 1.)
}

pub fn ease_out(k: f32) -> f32 {
    1. - (1. - k).powi(3)
}

/// Sparks thrown up by an impact, `dt` seconds after it.
pub fn burst<'a>(x: f32, y: f32, dt: f32, life: f32, count: u32, seed: u32, speed: f32, fill: &'static str) -> Svgr<'a> {
    if !(0.0..life).contains(&dt) {
        return Svgr::empty();
    }
    let sparks = (0..count)
        .map(|k| {
            let a = lerp(-PI * 0.95, -PI * 0.05, rnd(k, seed));
            let v = speed * lerp(0.4, 1.0, rnd(k, seed + 1));
            let (vx, vy) = (a.cos() * v, a.sin() * v);
            let px = x + vx * dt;
            let py = y + vy * dt + 420. * dt * dt;
            let (tx, ty) = (px - vx * 0.03, py - (vy + 840. * dt) * 0.03);
            let o = 1. - dt / life;
            fframes::svgr!(<path d={format!("M{tx:.1} {ty:.1} L{px:.1} {py:.1}")} stroke={fill} stroke-width={1.2 + 1.6 * o} stroke-linecap="round" opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{sparks}</g>)
}

/// An irregular stone, as a closed path around the origin.
pub fn stone(seed: u32, r: f32) -> String {
    let n = 7;
    let pts = (0..n)
        .map(|i| {
            let a = TAU * i as f32 / n as f32 + rnd(i, seed) * 0.5;
            let rr = r * lerp(0.7, 1.15, rnd(i, seed + 1));
            (a.cos() * rr, a.sin() * rr * 0.85)
        })
        .collect::<Vec<_>>();
    path(&pts, true)
}

/// Stones thrown out by a blast, falling under gravity, spinning.
pub fn debris<'a>(x: f32, y: f32, dt: f32, life: f32, count: u32, seed: u32, speed: f32, spread: (f32, f32), size: f32) -> Svgr<'a> {
    if !(0.0..life).contains(&dt) {
        return Svgr::empty();
    }
    let rocks = (0..count)
        .map(|k| {
            let a = lerp(spread.0, spread.1, rnd(k, seed));
            let v = speed * lerp(0.35, 1.0, rnd(k, seed + 1));
            let px = x + a.cos() * v * dt;
            let py = y + a.sin() * v * dt + 900. * dt * dt;
            let r = size * lerp(0.4, 1.0, rnd(k, seed + 2));
            let spin = lerp(-720., 720., rnd(k, seed + 3)) * dt;
            let o = (1. - dt / life).min(1.) * 2.;
            fframes::svgr!(
                <g transform={format!("translate({px:.1} {py:.1}) rotate({spin:.0})")} opacity={o.min(1.)}>
                    <path d={stone(k + seed, r)} fill="#7a2c16" stroke="#2a0c04" stroke-width="1.2" />
                    <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", -r * 0.5, -r * 0.4, r * 0.4, -r * 0.5)} stroke="#d9774a" stroke-width="1.4" opacity="0.7" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{rocks}</g>)
}

/// Dust that rolls out sideways along the ground from an impact.
pub fn dust_burst<'a>(x: f32, y: f32, dt: f32, life: f32, count: u32, seed: u32, width: f32, fill: &'static str) -> Svgr<'a> {
    if !(0.0..life).contains(&dt) {
        return Svgr::empty();
    }
    let puffs = (0..count)
        .map(|k| {
            let dir = if k % 2 == 0 { 1. } else { -1. };
            let v = width * lerp(0.4, 1.0, rnd(k, seed));
            let px = x + dir * (width * 0.08 + v * (1. - (-dt * 3.2).exp()));
            let py = y - lerp(0., 46., rnd(k, seed + 1)) * dt - 4.;
            let r = lerp(16., 38., rnd(k, seed + 2)) * (0.5 + dt * 1.2) * width / 300.;
            fframes::svgr!(<circle cx={px} cy={py} r={r} fill={fill} opacity={0.6 * (1. - dt / life)} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{puffs}</g>)
}

/// An expanding ground ring, seen at an angle.
pub fn shock_ring<'a>(x: f32, y: f32, dt: f32, life: f32, rx: f32, ry: f32, color: &'static str) -> Svgr<'a> {
    let k = dt / life;
    if !(0.0..1.0).contains(&k) {
        return Svgr::empty();
    }
    let e = ease_out(k);
    fframes::svgr!(
        <g>
            <ellipse cx={x} cy={y} rx={8. + rx * e} ry={3. + ry * e} fill="none" stroke={color} stroke-width={2. + 18. * (1. - k)} opacity={0.85 * (1. - k)} />
            <ellipse cx={x} cy={y} rx={4. + rx * 0.6 * e} ry={2. + ry * 0.6 * e} fill="none" stroke="#fff1d0" stroke-width={1. + 6. * (1. - k)} opacity={0.6 * (1. - k)} />
        </g>
    )
}

/// A vulture seen from below, its body at the origin; `flap` is -1..1.
pub fn vulture(size: f32, flap: f32) -> String {
    let s = size;
    let f = flap * s * 0.32;
    format!(
        "M{:.1} {:.1} Q{:.1} {:.1} 0 {:.1} Q{:.1} {:.1} {:.1} {:.1} L{:.1} {:.1} Q{:.1} {:.1} {:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} Q{:.1} {:.1} {:.1} {:.1}Z",
        -s, f,
        -s * 0.45, -s * 0.18 + f * 0.6, -s * 0.06,
        s * 0.45, -s * 0.18 + f * 0.6, s, f,
        s * 0.82, f + s * 0.1,
        s * 0.4, s * 0.06, s * 0.12, s * 0.14,
        s * 0.1, s * 0.42, -s * 0.1, s * 0.42, -s * 0.12, s * 0.14,
        -s * 0.4, s * 0.06, -s * 0.82, f + s * 0.1,
    )
}

/// Vultures that circle once per LOOP; each casts a soft shadow on the ground.
pub fn vultures<'a>(t: f32, alpha: f32, flock: &[((f32, f32), (f32, f32), f32, f32)]) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let birds = flock
        .iter()
        .enumerate()
        .map(|(i, &((cx, cy), (rx, ry), size, phase))| {
            let a = TAU * (t / LOOP + phase);
            let (x, y) = (cx + a.cos() * rx, cy + a.sin() * ry);
            // They bank into the turn; the lean repeats with the orbit.
            let heading = 18. * a.cos();
            // Two strong flaps, then a glide, every LOOP.
            let flap = wave(t, 4., phase) * (0.5 + 0.5 * wave(t, 1., phase + 0.25)).max(0.);
            let body = vulture(size, flap);
            fframes::svgr!(
                <g opacity={alpha}>
                    <path d={body.clone()} transform={format!("translate({:.1} {:.1}) rotate({heading:.1}) scale(1 0.5)", x + 70., y + 150. + i as f32 * 20.)} fill="#3a1206" opacity="0.18" filter="url(#blur3)" />
                    <path d={body} transform={format!("translate({x:.1} {y:.1}) rotate({heading:.1})")} fill="#1e0d08" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{birds}</g>)
}

/// A dust devil: motes that spiral up a widening funnel, one turn per LOOP / 3.
pub fn dust_devil<'a>(t: f32, x: f32, y: f32, height: f32, alpha: f32) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let motes = (0..56u32)
        .map(|k| {
            let u = (t / (LOOP / 2.) + rnd(k, 901)).rem_euclid(1.);
            let a = TAU * (3. * t / LOOP + rnd(k, 902));
            let r = lerp(4., height * 0.32, u) * lerp(0.8, 1.2, rnd(k, 903));
            let px = x + a.cos() * r + 10. * wave(t, 1., 0.) * u;
            let py = y - u * height + a.sin() * r * 0.25;
            let o = alpha * (PI * u).sin() * (0.35 + 0.35 * (a.sin() * 0.5 + 0.5));
            fframes::svgr!(<circle cx={px} cy={py} r={lerp(1.5, 5., u)} fill="#e9a46a" opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{motes}</g>)
}

/// A goblin mine cart from the side, its floor center at the origin, about
/// 128 units wide. `spin` turns the wheels (degrees); `load` sits in the tub.
pub fn cart<'a>(spin: f32, load: Svgr<'a>) -> Svgr<'a> {
    let wheel = |x: f32| {
        fframes::svgr!(
            <g transform={format!("translate({x} 8) rotate({spin:.1})")}>
                <circle r="15" fill="#2a1d14" stroke="#120a06" stroke-width="3" />
                <circle r="11" fill="none" stroke="#7d6b58" stroke-width="2" />
                <path d="M-11 0 L11 0 M0 -11 L0 11 M-7.8 -7.8 L7.8 7.8 M-7.8 7.8 L7.8 -7.8" stroke="#5e4c3c" stroke-width="2" />
                <circle r="3.4" fill="#a08870" />
            </g>
        )
    };
    fframes::svgr!(
        <g>
            {load}
            <path d="M-64 -54 L64 -54 L52 0 L-52 0Z" fill="url(#g-cart)" stroke="#1e1008" stroke-width="3" stroke-linejoin="round" />
            <path d="M-58 -36 L58 -36 M-54 -18 L54 -18" stroke="#3a2210" stroke-width="2" opacity="0.7" />
            <path d="M-64 -54 L-56 -54 L-45 0 L-52 0Z M64 -54 L56 -54 L45 0 L52 0Z M-6 -54 L6 -54 L5 0 L-5 0Z" fill="url(#g-iron)" />
            <rect x="-68" y="-60" width="136" height="9" rx="2" fill="url(#g-iron)" stroke="#1e1008" stroke-width="2" />
            <circle cx="-48" cy="-45" r="2" fill="#e8d2a0" /><circle cx="48" cy="-45" r="2" fill="#e8d2a0" />
            <circle cx="-44" cy="-9" r="2" fill="#e8d2a0" /><circle cx="44" cy="-9" r="2" fill="#e8d2a0" />
            {wheel(-34.)}
            {wheel(34.)}
        </g>
    )
}

/// A heap of gold coins that fills the cart tub.
pub fn coin_heap<'a>(shine: f32) -> Svgr<'a> {
    let coins = (0..16u32)
        .map(|i| {
            let x = lerp(-54., 54., rnd(i, 41));
            let y = -56. - (1. - (x / 60.).powi(2)) * lerp(4., 22., rnd(i, 42));
            coin(x, y, lerp(7., 10., rnd(i, 43)), lerp(0.35, 0.6, rnd(i, 44)), lerp(-20., 20., rnd(i, 45)), false)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="-56" rx="60" ry="16" fill="#b97a1e" />
            {coins}
            {glint(14., -78., 4., shine)}
        </g>
    )
}

/// A glowcap mushroom, its foot at the origin. `glow` scales the light.
pub fn glowcap<'a>(size: f32, glow: f32, tint: u32) -> Svgr<'a> {
    let s = size;
    let (cap, halo) = match tint % 3 {
        0 => ("url(#g-glowcap)", "url(#g-cyan)"),
        1 => ("url(#g-glowcap-green)", "url(#g-cyan)"),
        _ => ("url(#g-glowcap-blue)", "url(#g-cyan)"),
    };
    fframes::svgr!(
        <g>
            <circle cx="0" cy={-s * 0.9} r={s * 1.9} fill={halo} opacity={0.55 * glow} />
            <path d={format!("M{:.1} 0 C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} L{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} 0Z", -s * 0.16, -s * 0.2, -s * 0.4, -s * 0.12, -s * 0.7, -s * 0.1, -s * 0.78, s * 0.1, -s * 0.78, s * 0.14, -s * 0.4, s * 0.2, -s * 0.2, s * 0.16)} fill="#d6f2e6" />
            <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}Z", -s * 0.62, -s * 0.7, -s * 0.6, -s * 1.28, s * 0.6, -s * 1.28, s * 0.62, -s * 0.7, s * 0.3, -s * 0.6, -s * 0.3, -s * 0.6, -s * 0.62, -s * 0.7)} fill={cap} />
            <circle cx={-s * 0.22} cy={-s * 0.98} r={s * 0.07} fill="#f2fffb" opacity="0.85" />
            <circle cx={s * 0.18} cy={-s * 1.06} r={s * 0.05} fill="#f2fffb" opacity="0.85" />
            <circle cx={s * 0.34} cy={-s * 0.86} r={s * 0.04} fill="#f2fffb" opacity="0.7" />
        </g>
    )
}

/// Snikkit's bucket crown from the front, centered at the origin, about 200 units
/// wide. `glint` lights its gems.
pub fn bucket_crown<'a>(shine: f32) -> Svgr<'a> {
    let spikes = (0..7)
        .map(|i| {
            let x = -84. + i as f32 * 28.;
            let h = if i % 2 == 0 { 60. } else { 42. };
            fframes::svgr!(
                <g>
                    <path d={format!("M{} -56 L{} {} L{} -56Z", x - 11., x, -56. - h, x + 11.)} fill="url(#g-crown)" stroke="#4a2a08" stroke-width="2" stroke-linejoin="round" />
                    <circle cx={x} cy={-60. - h} r="7" fill="url(#g-crown)" stroke="#4a2a08" stroke-width="1.5" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            {spikes}
            <path d="M-100 -60 L100 -60 L82 70 L-82 70Z" fill="url(#g-crown-body)" stroke="#3a1e06" stroke-width="3" stroke-linejoin="round" />
            <ellipse cx="0" cy="-60" rx="100" ry="14" fill="#5a3410" stroke="#3a1e06" stroke-width="3" />
            <path d="M-95 -24 L95 -24 M-89 24 L89 24" stroke="#3a1e06" stroke-width="5" opacity="0.6" />
            <path d="M-95 -27 L95 -27 M-89 21 L89 21" stroke="#ffe7a0" stroke-width="1.6" opacity="0.5" />
            <path d="M-54 -55 L-44 66 M54 -55 L44 66" stroke="#fff1c0" stroke-width="3" opacity="0.25" />
            <g>
                <path d="M0 -14 L13 0 L0 14 L-13 0Z" fill="#c8102e" stroke="#4a0610" stroke-width="2" />
                <circle cx="-48" cy="0" r="9" fill="#1f9a5a" stroke="#0a3a1e" stroke-width="2" />
                <circle cx="48" cy="0" r="9" fill="#2a6ad0" stroke="#0a1e4a" stroke-width="2" />
                <path d="M-4 -6 L2 -8" stroke="#fff" stroke-width="2" opacity={0.4 + 0.6 * shine} />
            </g>
            {(0..9).map(|i| { let x = -80. + i as f32 * 20.; fframes::svgr!(<circle cx={x} cy="-40" r="2.4" fill="#fff0c0" opacity="0.8" />) }).collect::<Vec<_>>()}
            {glint(-22., -40., 6., shine)}
        </g>
    )
}

/// The cut Accord Seal: a violet glow with three lanes and one slash.
pub fn cut_seal<'a>(x: f32, y: f32, r: f32, alpha: f32) -> Svgr<'a> {
    if alpha <= 0.01 {
        return Svgr::empty();
    }
    let mark = seal_lanes(r * 0.9, true);
    fframes::svgr!(
        <g transform={format!("translate({x:.1} {y:.1})")} opacity={alpha.min(1.)}>
            <circle r={r * 1.3} fill="url(#g-violet)" opacity="0.35" />
            <circle r={r} fill="none" stroke="#b46aff" stroke-width={r * 0.075} filter="url(#blur8)" />
            <circle r={r} fill="none" stroke="#f0dcff" stroke-width="1.8" />
            <circle r={r * 0.85} fill="none" stroke="#e4c8ff" stroke-width="1" opacity="0.7" />
            <path d={mark.clone()} fill="none" stroke="#a24cff" stroke-width={r * 0.075} stroke-linecap="round" filter="url(#blur8)" />
            <path d={mark} fill="none" stroke="#f6eaff" stroke-width="2.2" stroke-linecap="round" />
        </g>
    )
}

/// A two-line name plate in Cinzel; `reveal` 0..1 draws its underline.
pub fn name_plate<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, x: f32, y: f32, title: &'static str, name: &'static str, reveal: f32) -> Svgr<'a> {
    let font = FontQuery { family: "Cinzel", size: 64, weight: 900, ..Default::default() };
    let w = frame.text_width(ctx, font, name).unwrap_or(420) as f32;
    fframes::svgr!(
        <g>
            <text x={x + 4.} y={y - 74.} font-family="Cinzel" font-weight="900" font-size="26" letter-spacing="10" fill="#f0c86a">{title}</text>
            <text x={x + 3.} y={y + 4.} font-family="Cinzel" font-weight="900" font-size="64" fill="#1a0503" opacity="0.6">{name}</text>
            <text x={x} y={y} font-family="Cinzel" font-weight="900" font-size="64" fill="url(#g-mesa-title)" stroke="#2a0904" stroke-width="2">{name}</text>
            <path d={format!("M{} {} L{:.1} {}", x + 2., y + 22., x + 2. + w * reveal, y + 22.)} stroke="#e0602a" stroke-width="3" />
            <path d={format!("M{} {} L{:.1} {}", x + 2., y + 30., x + 2. + w * 0.6 * reveal, y + 30.)} stroke="#f0c86a" stroke-width="1.5" />
        </g>
    )
}

/// A card at the origin: its back, then its art; `flip` 0..1 turns it over.
pub fn card<'a>(art: &fframes::media::ImageData<'_>, flip: f32, back: Svgr<'a>) -> Svgr<'a> {
    let turn = (flip * PI).cos();
    let face = if turn >= 0. { back } else { card_front(art) };
    fframes::svgr!(<g transform={format!("scale({:.3} 1)", turn.abs().max(0.02))}>{face}</g>)
}

/// The back of a Red Mesas enemy card: a gold-painted stone in a rust frame.
pub fn mesa_card_back<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <g>
            <rect x="-50" y="-67" width="100" height="134" rx="9" fill="#3a1206" stroke="#d9a441" stroke-width="3" />
            <rect x="-41" y="-58" width="82" height="116" rx="5" fill="none" stroke="#a8401c" stroke-width="2" />
            <circle cx="0" cy="0" r="28" fill="#6a1c0c" stroke="#d9a441" stroke-width="2" />
            <path d={stone(77, 16.)} fill="#c0582a" stroke="#f0c86a" stroke-width="2" />
            <path d="M-8 -6 C-4 -12 6 -12 9 -5" stroke="#ffe08a" stroke-width="3" fill="none" stroke-linecap="round" />
        </g>
    )
}

/// The rock strata of the cut-away view; `offset` moves it with the camera.
pub fn strata<'a>(shader: &Shader, frame: &Frame, offset: f32, glow: f32) -> Svgr<'a> {
    let layer = shader.draw(
        frame,
        ShaderUniforms::new().float("uOffset", offset).float("uGlow", glow).float("uPhase", loop_phase(frame.seconds())),
    );
    fframes::svgr!(<image href={layer.href()} x="0" y="0" width="1280" height="720" />)
}

/// The rock strata shader of the cut-away view, compiled once.
pub fn strata_shader() -> Shader {
    let noise = include_str!("../../hearthvale/src/shaders/noise.sksl");
    Shader::sksl(format!("{noise}\n{}", include_str!("shaders/strata.sksl")))
}

/// Shared static definitions of the Red Mesas scenes.
pub fn defs<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <defs>
            <radialGradient id="g-cyan">
                <stop offset="0" stop-color="#e8fffb" stop-opacity="1" />
                <stop offset="0.3" stop-color="#5ff2dc" stop-opacity="0.7" />
                <stop offset="1" stop-color="#0a8a8a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-glowcap" cx="0.45" cy="0.35" r="0.8">
                <stop offset="0" stop-color="#f4fffd" />
                <stop offset="0.35" stop-color="#7ff6e6" />
                <stop offset="1" stop-color="#138a92" />
            </radialGradient>
            <radialGradient id="g-glowcap-green" cx="0.45" cy="0.35" r="0.8">
                <stop offset="0" stop-color="#f6fff0" />
                <stop offset="0.35" stop-color="#9af59a" />
                <stop offset="1" stop-color="#1e8a52" />
            </radialGradient>
            <radialGradient id="g-glowcap-blue" cx="0.45" cy="0.35" r="0.8">
                <stop offset="0" stop-color="#f2f8ff" />
                <stop offset="0.35" stop-color="#8ad2ff" />
                <stop offset="1" stop-color="#2a5ab0" />
            </radialGradient>
            <linearGradient id="g-cart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#8a5a2e" />
                <stop offset="0.5" stop-color="#5e3a1c" />
                <stop offset="1" stop-color="#2e1a0c" />
            </linearGradient>
            <linearGradient id="g-iron" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#9a8a78" />
                <stop offset="0.5" stop-color="#5a4c40" />
                <stop offset="1" stop-color="#2a2018" />
            </linearGradient>
            <linearGradient id="g-crown" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#fff0b0" />
                <stop offset="0.45" stop-color="#e2a83a" />
                <stop offset="1" stop-color="#7a4a10" />
            </linearGradient>
            <linearGradient id="g-crown-body" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#6a3c10" />
                <stop offset="0.3" stop-color="#d89a36" />
                <stop offset="0.5" stop-color="#f6d27a" />
                <stop offset="0.75" stop-color="#b8782a" />
                <stop offset="1" stop-color="#5a300c" />
            </linearGradient>
            <linearGradient id="g-mesa-title" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff2d0" />
                <stop offset="0.45" stop-color="#f6a050" />
                <stop offset="1" stop-color="#a8301a" />
            </linearGradient>
            <linearGradient id="g-dawn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#5a9ad8" />
                <stop offset="0.6" stop-color="#f6c890" />
                <stop offset="1" stop-color="#f29a5a" />
            </linearGradient>
            <radialGradient id="g-sun">
                <stop offset="0" stop-color="#fffbe8" stop-opacity="1" />
                <stop offset="0.15" stop-color="#ffe7a0" stop-opacity="0.85" />
                <stop offset="0.5" stop-color="#ffb860" stop-opacity="0.25" />
                <stop offset="1" stop-color="#ff8a3a" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="g-sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#ffd890" stop-opacity="0" />
                <stop offset="0.5" stop-color="#fff0c8" stop-opacity="0.5" />
                <stop offset="1" stop-color="#ffd890" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="g-paint" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff2a8" />
                <stop offset="0.5" stop-color="#f2c04e" />
                <stop offset="1" stop-color="#b97a1e" />
            </linearGradient>
            <linearGradient id="g-rock" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#d8724a" />
                <stop offset="0.5" stop-color="#9a3a1e" />
                <stop offset="1" stop-color="#4e160a" />
            </linearGradient>
            <linearGradient id="g-tunnel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2a1208" />
                <stop offset="0.5" stop-color="#1a0a04" />
                <stop offset="1" stop-color="#3a1a0a" />
            </linearGradient>
            <linearGradient id="g-wood" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#4a2c14" />
                <stop offset="0.5" stop-color="#8a5a2e" />
                <stop offset="1" stop-color="#3a2010" />
            </linearGradient>
            <radialGradient id="g-fireball">
                <stop offset="0" stop-color="#fffbe0" stop-opacity="1" />
                <stop offset="0.3" stop-color="#ffd060" stop-opacity="0.95" />
                <stop offset="0.65" stop-color="#ff6a1a" stop-opacity="0.7" />
                <stop offset="1" stop-color="#8a1a04" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-smoke">
                <stop offset="0" stop-color="#5a4a42" stop-opacity="0.7" />
                <stop offset="1" stop-color="#2a1e18" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-steam">
                <stop offset="0" stop-color="#fffaf2" stop-opacity="0.8" />
                <stop offset="1" stop-color="#d8ccc0" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="g-epic" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffe08a" />
                <stop offset="0.4" stop-color="#ff7a2a" />
                <stop offset="0.7" stop-color="#c24aff" />
                <stop offset="1" stop-color="#ffe08a" />
            </linearGradient>
            <linearGradient id="g-red-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2a0806" />
                <stop offset="0.6" stop-color="#7a1e0c" />
                <stop offset="1" stop-color="#d8541e" />
            </linearGradient>
            <linearGradient id="g-sunset-mesa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3a1a48" />
                <stop offset="0.45" stop-color="#c8463a" />
                <stop offset="0.8" stop-color="#f6a050" />
                <stop offset="1" stop-color="#ffd890" />
            </linearGradient>
        </defs>
    )
}

/// The deep tunnel in perspective, with its vanishing point at `vp`. `travel`
/// moves the camera along the rails (in arch spacings); `far` lights the far
/// end cyan; `warm` is the lantern light near the camera.
pub fn tunnel_view<'a>(t: f32, vp: (f32, f32), travel: f32, far: f32, warm: f32) -> Svgr<'a> {
    let (vx, vy) = vp;
    // Depth z of each arch; a smaller z is nearer. Arches wrap as the camera moves.
    let spacing = 1.1;
    let count = 12;
    let mut arches = (0..count)
        .map(|k| {
            let z = 0.55 + (k as f32 * spacing - travel).rem_euclid(spacing * count as f32);
            (k, z)
        })
        .collect::<Vec<_>>();
    arches.sort_by(|a, b| b.1.total_cmp(&a.1));
    let frames = arches
        .iter()
        .map(|&(k, z)| {
            let s = 1. / z;
            let w = 760. * s;
            let floor = vy + 330. * s;
            let top = vy - 330. * s;
            let fade = (1. - (z - 0.55) / (spacing * count as f32)).clamp(0., 1.);
            let near = (1.6 - z).clamp(0., 1.);
            let shade = (fade.powf(1.6) * (0.35 + 0.65 * warm.max(far * 0.8))).min(1.);
            let thick = 46. * s;
            let cyan = far * fade.powf(0.6) * (1. - fade).powf(0.3);
            let lean = 0.08 * rnd(k as u32, 301);
            fframes::svgr!(
                <g opacity={(fade * 1.4).min(1.) * (1. - near * 0.3) * ((z - 0.55) / 0.35).clamp(0., 1.)}>
                    <path d={format!("M{:.1} {floor:.1} L{:.1} {top:.1} L{:.1} {top:.1} L{:.1} {floor:.1}", vx - w, vx - w * (0.86 + lean), vx + w * 0.86, vx + w)} fill="none" stroke="#1a0c06" stroke-width={thick + 6. * s} stroke-linejoin="round" />
                    <path d={format!("M{:.1} {floor:.1} L{:.1} {top:.1} L{:.1} {top:.1} L{:.1} {floor:.1}", vx - w, vx - w * (0.86 + lean), vx + w * 0.86, vx + w)} fill="none" stroke="url(#g-wood)" stroke-width={thick} stroke-linejoin="round" opacity={shade} />
                    <path d={format!("M{:.1} {top:.1} L{:.1} {top:.1}", vx - w * 0.9, vx + w * 0.9)} stroke="#5ff2dc" stroke-width={thick * 0.25} opacity={cyan * 0.8} />
                </g>
            )
        })
        .collect::<Vec<_>>();
    // Rails and sleepers converge on the vanishing point.
    let rail = |side: f32| {
        let pts = (0..24).map(|i| {
            let z = 0.45 + i as f32 * 0.6;
            (vx + side * 150. / z, vy + 330. / z)
        });
        path(&pts.collect::<Vec<_>>(), false)
    };
    let sleepers = (0..20)
        .map(|i| {
            let z = 0.5 + ((i as f32 * 0.55 - travel * 0.5).rem_euclid(11.));
            let s = 1. / z;
            let y = vy + 336. * s;
            let fade = (1. - z / 11.).clamp(0., 1.);
            fframes::svgr!(<path d={format!("M{:.1} {y:.1} L{:.1} {y:.1}", vx - 230. * s, vx + 230. * s)} stroke="#3a2210" stroke-width={(26. * s).max(0.5)} opacity={fade * 0.9} />)
        })
        .collect::<Vec<_>>();
    let glow_r = 120. + 520. * far;
    fframes::svgr!(
        <g>
            <rect x="-40" y="-40" width="1360" height="800" fill="#120804" />
            <circle cx={vx} cy={vy + 40.} r="900" fill="url(#g-candle)" opacity={0.5 * warm} />
            <circle cx={vx} cy={vy} r={glow_r} fill="url(#g-cyan)" opacity={(far * 0.9).min(0.95)} />
            <circle cx={vx} cy={vy} r={60. + 60. * far} fill="#e8fffb" opacity={0.7 * far} filter="url(#blur18)" />
            {sleepers}
            <path d={rail(-1.)} fill="none" stroke="#b8a48a" stroke-width="3" />
            <path d={rail(1.)} fill="none" stroke="#b8a48a" stroke-width="3" />
            {frames}
            <rect x="-40" y="-40" width="1360" height="800" fill="url(#g-vignette)" opacity="0.9" />
            {Motes { count: 30, seed: 311, area: (vx - 500., vy - 300., 1000., 700.), rise: 200., period: LOOP, size: (0.8, 2.), sway: 20., fill: "#e0a070" }.draw(t, 0.5 * warm)}
        </g>
    )
}

/// A banner on a pole, its foot at the origin.
pub fn banner<'a>(t: f32, height: f32, cloth: &'static str, edge: &'static str, mark: Svgr<'a>, phase: f32) -> Svgr<'a> {
    let w = |k: f32| 7. * wave(t, 2., phase + k);
    let top = -height;
    let flag = format!(
        "M3 {top:.1} C40 {:.1} 80 {:.1} 118 {:.1} L118 {:.1} L96 {:.1} L80 {:.1} C50 {:.1} 30 {:.1} 3 {:.1}Z",
        top + w(0.), top + 6. + w(0.15), top + 2. + w(0.3),
        top + 150. + w(0.4), top + 132. + w(0.35), top + 156. + w(0.3), top + 152. + w(0.2), top + 156. + w(0.1), top + 152.
    );
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx="26" ry="7" fill="#000" opacity="0.45" />
            <rect x="-4" y={top - 8.} width="8" height={height + 10.} rx="3" fill="#4a2c12" />
            <path d={flag} fill={cloth} stroke={edge} stroke-width="3" />
            <g transform={format!("translate(60 {:.1})", top + 76. + w(0.25))}>{mark}</g>
            <circle cx="0" cy={top - 10.} r="7" fill={edge} />
        </g>
    )
}
