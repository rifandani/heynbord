//! Glowcap Hollows props, on top of the shared fx toolkit and the Red Mesas
//! props. Ambient motion repeats every LOOP seconds, like the rest of the toolkit.
use crate::fx::*;
use crate::mesa::glowcap;
use fframes::{FFramesContext, FontQuery, Frame, Shader, ShaderUniforms, Svgr};
use std::f32::consts::{PI, TAU};

/// The giant mushroom caps of the Region Map, in map units: (x, y, radius, violet).
/// A violet cap glows violet; the others glow cyan.
pub const CAPS: &[(f32, f32, f32, bool)] = &[
    (150., 450., 46., false),
    (215., 488., 44., true),
    (232., 292., 34., true),
    (212., 160., 26., true),
    (330., 372., 24., false),
    (500., 532., 44., true),
    (522., 226., 30., false),
    (442., 130., 18., true),
    (640., 322., 40., true),
    (810., 326., 26., false),
    (828., 362., 36., true),
    (862., 488., 28., true),
    (915., 500., 36., false),
    (970., 236., 18., true),
    (1032., 180., 38., true),
    (1050., 82., 60., false),
    (1300., 66., 36., false),
    (1360., 186., 40., true),
    (1046., 440., 42., false),
    (935., 726., 38., false),
    (1265., 590., 26., false),
    (1252., 776., 46., false),
    (1272., 842., 30., true),
    (515., 790., 24., true),
    (345., 680., 18., true),
];
/// The goblin tunnel exit at the start of the Trail, and the Grove Hall door.
pub const TUNNEL: (f32, f32) = (145., 735.);
pub const DOOR: (f32, f32) = (1186., 202.);
pub const WINDOWS: [(f32, f32); 3] = [(1126., 206.), (1186., 196.), (1252., 212.)];
/// The painted Lady Glimmerbough at her steps, and the glowcap in her hand.
pub const LADY: (f32, f32) = (1104., 262.);
pub const LADY_CAP: (f32, f32) = (1076., 254.);
/// The shelf-fungus steps of the Trail, from the lowest to the hall.
pub const STEPS: &[(f32, f32)] = &[
    (1384., 556.), (1386., 528.), (1378., 502.), (1300., 425.), (1276., 404.), (1254., 386.),
    (1230., 368.), (1208., 350.), (1186., 334.), (1168., 268.), (1174., 252.),
];
/// The waterfalls of the Region Map: (top x, top y, height).
pub const FALLS: &[(f32, f32, f32)] = &[(655., 560., 70.), (748., 690., 60.), (968., 455., 50.), (1440., 590., 50.), (588., 128., 50.)];

/// 0 before `dt` 0, then a fast rise with an overshoot that settles at 1.
pub fn bloom(dt: f32) -> f32 {
    if dt <= 0. {
        return 0.;
    }
    (1. - (-dt * 10.).exp()) * (1. + 0.55 * (-dt * 4.).exp())
}

/// A bloom that lands exactly on its rest value by LOOP_START, so the hold loops without a seam.
pub fn bloom_rest(t: f32, at: f32) -> f32 {
    let rest = if t >= at { 1. } else { 0. };
    lerp(bloom(t - at), rest, ((t - 4.3) / 0.7).clamp(0., 1.))
}

/// Samples a Catmull-Rom spline through the points, `n` samples per segment.
pub fn spline(points: &[(f32, f32)], n: usize) -> Vec<(f32, f32)> {
    let count = points.len();
    let mut out = vec![];
    for i in 0..count.saturating_sub(1) {
        let p0 = points[i.saturating_sub(1)];
        let p1 = points[i];
        let p2 = points[i + 1];
        let p3 = points[(i + 2).min(count - 1)];
        for s in 0..n {
            let u = s as f32 / n as f32;
            let (u2, u3) = (u * u, u * u * u);
            let f = |a: f32, b: f32, c: f32, d: f32| 0.5 * (2. * b + (-a + c) * u + (2. * a - 5. * b + 4. * c - d) * u2 + (-a + 3. * b - 3. * c + d) * u3);
            out.push((f(p0.0, p1.0, p2.0, p3.0), f(p0.1, p1.1, p2.1, p3.1)));
        }
    }
    if let Some(last) = points.last() {
        out.push(*last);
    }
    out
}

/// A closed outline along a center line, `w0` wide at the start and `w1` at the
/// end; `upto` 0..1 keeps the first part of the line (a growing root).
pub fn taper(center: &[(f32, f32)], w0: f32, w1: f32, upto: f32) -> String {
    let n = center.len();
    if n < 2 || upto <= 0.001 {
        return String::new();
    }
    let keep = ((n - 1) as f32 * upto.clamp(0., 1.)).max(1.);
    let whole = keep.floor() as usize;
    let mut pts: Vec<(f32, f32)> = center[..=whole.min(n - 1)].to_vec();
    if whole < n - 1 && keep > whole as f32 {
        let k = keep - whole as f32;
        let (a, b) = (center[whole], center[whole + 1]);
        pts.push((lerp(a.0, b.0, k), lerp(a.1, b.1, k)));
    }
    let m = pts.len();
    let mut left = vec![];
    let mut right = vec![];
    for i in 0..m {
        let a = pts[i.saturating_sub(1)];
        let b = pts[(i + 1).min(m - 1)];
        let (dx, dy) = (b.0 - a.0, b.1 - a.1);
        let l = (dx * dx + dy * dy).sqrt().max(0.001);
        let (nx, ny) = (-dy / l, dx / l);
        // The width follows the full length, so a growing root keeps its tip thin.
        let u = i as f32 / (m - 1).max(1) as f32 * upto;
        let w = lerp(w0, w1, u) * if i == m - 1 { 0.35 } else { 1. } / 2.;
        left.push((pts[i].0 + nx * w, pts[i].1 + ny * w));
        right.push((pts[i].0 - nx * w, pts[i].1 - ny * w));
    }
    right.reverse();
    left.extend(right);
    path(&left, true)
}

/// A root that grows along its center line, with bark streaks and small rootlets.
pub fn root<'a>(center: &[(f32, f32)], w0: f32, w1: f32, grow: f32, rim: f32) -> Svgr<'a> {
    if grow <= 0.001 {
        return Svgr::empty();
    }
    let body = taper(center, w0, w1, grow);
    let offset = |k: f32| center.iter().enumerate().map(|(i, &(x, y))| {
        let a = center[i.saturating_sub(1)];
        let b = center[(i + 1).min(center.len() - 1)];
        let (dx, dy) = (b.0 - a.0, b.1 - a.1);
        let l = (dx * dx + dy * dy).sqrt().max(0.001);
        let w = lerp(w0, w1, i as f32 / (center.len() - 1) as f32);
        (x - dy / l * w * k, y + dx / l * w * k)
    }).collect::<Vec<_>>();
    let streaks = [(-0.28, 0.12, "#c99a62", 0.35), (0.05, 0.08, "#1a0e06", 0.6), (0.22, 0.07, "#8a5e36", 0.4)]
        .iter()
        .map(|&(k, w, fill, o)| fframes::svgr!(<path d={taper(&offset(k), w0 * w, w1 * w, grow * 0.97)} fill={fill} opacity={o} />))
        .collect::<Vec<_>>();
    let n = center.len();
    let rootlets = (1..6)
        .filter(|j| (*j as f32) / 6. < grow - 0.05)
        .map(|j| {
            let i = (n - 1) * j / 6;
            let (x, y) = center[i];
            let b = center[(i + 1).min(n - 1)];
            let a = (b.1 - y).atan2(b.0 - x) + if j % 2 == 0 { 1.1 } else { -1.1 };
            let len = lerp(w0, w1, j as f32 / 6.) * 1.3;
            let pts = [(x, y), (x + a.cos() * len * 0.5, y + a.sin() * len * 0.5 + 4.), (x + a.cos() * len, y + a.sin() * len)];
            fframes::svgr!(<path d={taper(&spline(&pts, 4), lerp(w0, w1, j as f32 / 6.) * 0.3, 1.5, 1.)} fill="#3a2414" />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            {rootlets}
            <path d={body.clone()} fill="url(#g-root)" stroke="#140a04" stroke-width="2.5" stroke-linejoin="round" />
            {streaks}
            <path d={body} fill="none" stroke="#8ff6e6" stroke-width="1.6" opacity={rim} />
        </g>
    )
}

/// A leaf with its tip at (0, -size), its stem at the origin.
pub fn leaf(size: f32) -> String {
    let s = size;
    format!(
        "M0 0 C{:.1} {:.1} {:.1} {:.1} 0 {:.1} C{:.1} {:.1} {:.1} {:.1} 0 0Z",
        -s * 0.42, -s * 0.2, -s * 0.36, -s * 0.78, -s,
        s * 0.36, -s * 0.78, s * 0.42, -s * 0.2
    )
}

/// A slender curved black thorn, its base centered at the origin, `size` tall.
pub fn thorn(size: f32) -> String {
    let s = size;
    format!(
        "M{:.1} 0 C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} 0Z",
        -s * 0.16, -s * 0.12, -s * 0.42, s * 0.02, -s * 0.78, s * 0.34, -s,
        s * 0.1, -s * 0.72, s * 0.08, -s * 0.36, s * 0.16
    )
}

/// An Elf arrow pointing along +x, its tip at the origin, `len` long.
pub fn arrow<'a>(len: f32, glow: f32) -> Svgr<'a> {
    let tail = -len;
    let feathers = (0..2)
        .map(|k| {
            let side = if k == 0 { -1. } else { 1. };
            let d = format!(
                "M{:.1} 0 L{:.1} {:.1} L{:.1} {:.1} L{:.1} 0Z",
                tail + 4., tail - 6., side * 11., tail + 26., side * 11., tail + 36.
            );
            fframes::svgr!(<path d={d} fill="#d6f5e2" stroke="#2a6a4a" stroke-width="1" />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <path d={format!("M{tail:.1} 0 L-14 0")} stroke="#3a2412" stroke-width="5" stroke-linecap="round" />
            <path d={format!("M{tail:.1} -1 L-14 -1")} stroke="#c8925a" stroke-width="1.6" opacity="0.8" />
            {feathers}
            <path d="M0 0 C-6 -3 -12 -7 -20 -7 C-17 -3 -17 3 -20 7 C-12 7 -6 3 0 0Z" fill="#b8c8b0" stroke="#22301e" stroke-width="1.4" />
            <path d="M0 0 L-17 0" stroke="#3a7a4a" stroke-width="1.2" />
            <circle cx="-8" cy="0" r="14" fill="url(#g-poison)" opacity={glow} />
        </g>
    )
}

/// A pair of Elf eyes in the shade, `open` 0..1, `size` is the eye width.
pub fn eyes<'a>(x: f32, y: f32, size: f32, open: f32) -> Svgr<'a> {
    if open <= 0.02 {
        return Svgr::empty();
    }
    let eye = |cx: f32, dir: f32| {
        let w = size / 2.;
        let h = size * 0.24 * open;
        let d = format!(
            "M{:.1} {y:.1} Q{cx:.1} {:.1} {:.1} {:.1} Q{cx:.1} {:.1} {:.1} {y:.1}Z",
            cx - w, y - h * 1.6, cx + w, y - h * dir * 0.6, y + h * 1.2, cx - w
        );
        fframes::svgr!(<path d={d} fill="#e6fff8" />)
    };
    fframes::svgr!(
        <g>
            <ellipse cx={x} cy={y} rx={size * 2.4} ry={size * 1.1} fill="url(#g-cyan)" opacity={0.55 * open} />
            {eye(x - size * 0.95, 1.)}
            {eye(x + size * 0.95, -1.)}
        </g>
    )
}

/// One section of the goblin wall: sharpened logs bound with roots, with a
/// scrap plate. The foot of the wall is at the origin, `width` wide.
pub fn palisade<'a>(seed: u32, width: f32, height: f32, t: f32) -> Svgr<'a> {
    let count = (width / 46.).ceil() as u32;
    let step = width / count as f32;
    let logs = (0..count)
        .map(|i| {
            let x = -width / 2. + step * (i as f32 + 0.5) + lerp(-6., 6., rnd(i, seed));
            let h = height * lerp(0.78, 1.08, rnd(i, seed + 1));
            let w = step * lerp(0.82, 1.0, rnd(i, seed + 2));
            let lean = lerp(-4., 4., rnd(i, seed + 3));
            let d = format!(
                "M{:.1} 30 L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} 30Z",
                x - w / 2., x - w / 2. + lean * 0.5, -h + 26., x + lean, -h, x + w / 2. + lean * 0.5, -h + 26., x + w / 2.
            );
            fframes::svgr!(
                <g>
                    <path d={d} fill="url(#g-log)" stroke="#140a05" stroke-width="2.5" stroke-linejoin="round" />
                    <path d={format!("M{:.1} 20 L{:.1} {:.1}", x - w * 0.18, x - w * 0.18 + lean * 0.4, -h + 34.)} stroke="#c8925a" stroke-width="2" opacity="0.35" />
                    <path d={format!("M{:.1} {:.1} L{:.1} {:.1}", x + lean, -h, x + w / 2. + lean * 0.5, -h + 26.)} stroke="#8ff6e6" stroke-width="2" opacity="0.55" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    // Two root bands, a scrap plate and a goblin lamp that swings.
    let band = |y: f32, s: u32| {
        let pts = (0..=10)
            .map(|k| (-width / 2. - 6. + (width + 12.) * k as f32 / 10., y + 7. * (k as f32 * 1.7 + s as f32).sin()))
            .collect::<Vec<_>>();
        let center = spline(&pts, 4);
        fframes::svgr!(<path d={taper(&center, 13., 9., 1.)} fill="url(#g-root)" stroke="#140a05" stroke-width="1.6" />)
    };
    let px = lerp(-width * 0.3, width * 0.25, rnd(seed, 7));
    let swing = 14. * wave(t, 2., rnd(seed, 8));
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="22" rx={width * 0.56} ry="18" fill="#000" opacity="0.5" filter="url(#blur8)" />
            {logs}
            {band(-height * 0.3, seed)}
            {band(-height * 0.62, seed + 3)}
            <g transform={format!("translate({px:.1} {:.1}) rotate({:.1})", -height * 0.46, lerp(-8., 8., rnd(seed, 9)))}>
                <rect x="-34" y="-24" width="68" height="48" rx="4" fill="url(#g-iron)" stroke="#120a06" stroke-width="2.5" />
                <path d="M-26 -14 L22 -18 M-24 10 L28 6" stroke="#7a3a1a" stroke-width="3" opacity="0.6" />
                <circle cx="-26" cy="-16" r="2.6" fill="#d8c8a8" /><circle cx="26" cy="-16" r="2.6" fill="#d8c8a8" />
                <circle cx="-26" cy="16" r="2.6" fill="#d8c8a8" /><circle cx="26" cy="16" r="2.6" fill="#d8c8a8" />
            </g>
            <g transform={format!("translate({:.1} {:.1}) rotate({swing:.1})", px + 70., -height * 0.66)}>
                <path d="M0 0 L0 26" stroke="#2a1a10" stroke-width="2" />
                <circle cx="0" cy="38" r="40" fill="url(#g-cyan)" opacity={0.5 + 0.12 * flicker(t, rnd(seed, 10))} />
                <g transform="translate(0 48) scale(0.55)">{glowcap(24., 0.8, seed)}</g>
            </g>
        </g>
    )
}

/// A goblin jaw trap from the front, its hinge at the origin; `close` 0..1.
pub fn jaw_trap<'a>(close: f32) -> Svgr<'a> {
    let jaw = |flip: f32, offset: f32| {
        let s = lerp(0.18, 1., close);
        let teeth = (0..9)
            .map(|k| {
                let a = PI * (k as f32 + 0.5 + offset) / 9.;
                let (x, y) = (-a.cos() * 78., -a.sin() * 78.);
                let (tx, ty) = (-a.cos() * 44., -a.sin() * 44.);
                format!("M{:.1} {:.1} L{tx:.1} {ty:.1} L{:.1} {:.1}Z", x - 10. * a.sin(), y + 10. * a.cos(), x + 10. * a.sin(), y - 10. * a.cos())
            })
            .collect::<String>();
        fframes::svgr!(
            <g transform={format!("scale({flip} {s:.3})")}>
                <path d={teeth} fill="#d8ccb4" stroke="#1a120a" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M-92 0 A92 92 0 0 1 92 0 L76 0 A76 76 0 0 0 -76 0Z" fill="#3a2e26" stroke="#0e0804" stroke-width="3" />
                <path d="M-86 -6 A86 86 0 0 1 86 -6" fill="none" stroke="#c8b8a0" stroke-width="2" opacity="0.5" />
            </g>
        )
    };
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="8" rx="120" ry="22" fill="#000" opacity="0.55" filter="url(#blur8)" />
            <ellipse cx="0" cy="2" rx="96" ry="18" fill="#2a2018" stroke="#0e0804" stroke-width="3" />
            {jaw(1., 0.)}
            {jaw(-1., 0.5)}
            <rect x="-14" y="-6" width="28" height="12" rx="3" fill="#5a4c40" stroke="#120a06" stroke-width="2" />
        </g>
    )
}

/// A folded letter, centered on the origin, with the cut seal in its middle.
pub fn letter<'a>(w: f32, h: f32, seal: f32, t: f32) -> Svgr<'a> {
    let lines = (0..4)
        .map(|k| {
            let y = -h * 0.32 + k as f32 * h * 0.14;
            let x1 = w * lerp(0.18, 0.36, rnd(k, 77));
            fframes::svgr!(<path d={format!("M{:.1} {y:.1} C{:.1} {:.1} {:.1} {:.1} {x1:.1} {y:.1}", -w * 0.36, -w * 0.1, y - 3., w * 0.05, y + 3.)} stroke="#6a4a2a" stroke-width="2" fill="none" opacity="0.55" />)
        })
        .collect::<Vec<_>>();
    let glow = seal * (0.85 + 0.15 * wave(t, 2., 0.1));
    fframes::svgr!(
        <g>
            <rect x={-w / 2. + 6.} y={-h / 2. + 10.} width={w} height={h} rx="4" fill="#000" opacity="0.45" filter="url(#blur8)" />
            <rect x={-w / 2.} y={-h / 2.} width={w} height={h} rx="4" fill="url(#g-parchment)" stroke="#7a5a30" stroke-width="2" />
            <path d={format!("M{:.1} {:.1} L0 {:.1} L{:.1} {:.1}", -w / 2., -h / 2., h * 0.06, w / 2., -h / 2.)} fill="none" stroke="#a8804a" stroke-width="1.5" opacity="0.7" />
            {lines}
            <circle cx="0" cy={h * 0.22} r={w * 0.13} fill="url(#g-wax-seal)" stroke="#2a0412" stroke-width="2" />
            {crate::mesa::cut_seal(0., h * 0.22, w * 0.1, glow)}
        </g>
    )
}

/// A coin of painted stone with a crack, from the Red Mesas.
pub fn cracked_coin<'a>(r: f32) -> Svgr<'a> {
    let crack = format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}", -r * 0.1, -r, r * 0.08, -r * 0.45, -r * 0.12, -r * 0.1, r * 0.14, r * 0.35, -r * 0.02, r);
    fframes::svgr!(
        <g>
            {coin(0., 0., r, 0.62, -8., false)}
            <g transform="scale(1 0.62) rotate(-8)">
                <path d={crack.clone()} fill="none" stroke="#9a3a1e" stroke-width={r * 0.2} stroke-linejoin="round" />
                <path d={crack} fill="none" stroke="#3a0c04" stroke-width={r * 0.06} />
                <path d={format!("M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z", r * 0.2, -r * 0.6, r * 0.55, -r * 0.5, r * 0.32, -r * 0.2)} fill="#b8502a" opacity="0.85" />
            </g>
        </g>
    )
}

/// A drop of Thornwood amber, centered on the origin, `r` its radius. `turn`
/// turns the black thorn inside into view (0 edge-on, 1 side-on).
pub fn amber<'a>(r: f32, turn: f32, t: f32, seed: u32) -> Svgr<'a> {
    let pts = (0..14)
        .map(|i| {
            let a = TAU * i as f32 / 14.;
            let k = lerp(0.9, 1.06, rnd(i, seed)) * if (0.6..2.4).contains(&a) { 1.04 } else { 1. };
            (a.cos() * r * k, a.sin() * r * k * 0.92)
        })
        .collect::<Vec<_>>();
    let mut ring = pts.clone();
    ring.push(pts[0]);
    ring.push(pts[1]);
    let shape = crate::fx::smooth(&ring);
    let thorn_size = r * 0.85;
    let spin = 18. * wave(t, 1., rnd(seed, 3));
    let bubbles = (0..7u32)
        .map(|k| {
            let u = (t / LOOP + rnd(k, seed + 20)).rem_euclid(1.);
            let x = lerp(-0.5, 0.5, rnd(k, seed + 21)) * r + 4. * wave(t, 2., rnd(k, seed + 22));
            let y = lerp(0.55, -0.55, u) * r;
            let o = (PI * u).sin() * 0.6;
            fframes::svgr!(<circle cx={x} cy={y} r={r * lerp(0.015, 0.04, rnd(k, seed + 23))} fill="none" stroke="#fff4c8" stroke-width="1.2" opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <circle r={r * 1.8} fill="url(#g-amber-halo)" opacity="0.7" />
            <path d={shape.clone()} fill="url(#g-amber)" />
            <circle cx={r * 0.08} cy={r * 0.12} r={r * 0.62} fill="url(#g-amber-core)" opacity={0.85 + 0.15 * wave(t, 1., rnd(seed, 4))} />
            {bubbles}
            <g transform={format!("rotate({:.1}) scale({:.3} 1) translate({:.1} {:.1})", 24. + spin, turn.max(0.06), -thorn_size * 0.12, thorn_size * 0.5)}>
                <path d={thorn(thorn_size)} fill="#120806" />
                <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", -thorn_size * 0.16, -thorn_size * 0.1, -thorn_size * 0.2, -thorn_size * 0.5, -thorn_size * 0.5, -thorn_size * 0.82, -thorn_size * 0.72, -thorn_size * 0.95)} fill="none" stroke="#a04a7a" stroke-width={(r * 0.012).max(0.8)} opacity={0.5 * turn} />
            </g>
            <path d={shape} fill="none" stroke="#7a3a08" stroke-width={(r * 0.03).max(1.)} opacity="0.7" />
            <ellipse cx={-r * 0.36} cy={-r * 0.42} rx={r * 0.26} ry={r * 0.12} transform={format!("rotate(-32 {:.1} {:.1})", -r * 0.36, -r * 0.42)} fill="#fffbe8" opacity="0.55" />
            <circle cx={-r * 0.52} cy={-r * 0.2} r={r * 0.04} fill="#fffbe8" opacity="0.7" />
        </g>
    )
}

/// Lady Glimmerbough, backlit, her feet at the origin and about 600 units tall.
/// `eyes` opens her eyes; `staff` tilts her staff (degrees); `bloom` lights the
/// glowcap on her staff.
pub fn glimmerbough<'a>(t: f32, eyes: f32, staff: f32, bloom: f32) -> Svgr<'a> {
    let hem = 7. * wave(t, 1., 0.1);
    let hair = 9. * wave(t, 1., 0.32);
    let hair2 = 6. * wave(t, 2., 0.6);
    // The mantle ends in a hem of leaf points.
    let mut hem_pts = String::new();
    for k in 0..=12 {
        let x = lerp(-176., 176., k as f32 / 12.) + hem * (1. - (k as f32 / 6. - 1.).abs());
        let y = if k % 2 == 0 { 0. } else { -30. };
        hem_pts.push_str(&format!("L{x:.1} {y:.1} "));
    }
    let mantle = format!(
        "M-58 -472 C-108 -446 -128 -300 -146 -130 C-156 -60 -166 -20 -176 0 {hem_pts} C166 -20 156 -60 146 -130 C128 -300 108 -446 58 -472Z"
    );
    let dress = "M-44 -440 C-66 -310 -92 -150 -106 -4 L106 -4 C92 -150 66 -310 44 -440Z";
    let back_hair = format!(
        "M-30 -552 C-64 -544 -80 -470 -88 -380 C-96 -300 {:.1} -250 {:.1} -214 C-40 -240 40 -240 {:.1} -214 C{:.1} -250 96 -300 88 -380 C80 -470 64 -544 30 -552Z",
        -84. + hair, -66. + hair, 66. + hair, 84. + hair
    );
    // Front hair: thin strands that flow over the shoulders and curl at their ends.
    let strands = (0..6)
        .map(|k| {
            let side = if k < 3 { -1. } else { 1. };
            let j = (k % 3) as f32;
            let sw = hair2 * (1. + j * 0.4);
            let pts = [
                (side * (14. + j * 5.), -546.),
                (side * (30. + j * 8.), -500.),
                (side * (44. + j * 10.) + sw * 0.4, -440.),
                (side * (40. + j * 12.) + sw, -380. + j * 14.),
                (side * (52. + j * 12.) + sw * 1.2, -330. + j * 20.),
                (side * (64. + j * 8.) + sw * 1.4, -318. + j * 20.),
            ];
            taper(&spline(&pts, 5), 11. - j * 2., 2., 1.)
        })
        .collect::<Vec<_>>();
    let strands = strands
        .into_iter()
        .map(|d| fframes::svgr!(<g><path d={d.clone()} fill="url(#g-hair)" /><path d={d} fill="none" stroke="#e8fffb" stroke-width="0.8" opacity="0.6" /></g>))
        .collect::<Vec<_>>();
    // Shoulder plates of overlapping leaves.
    let pauldrons = (0..10)
        .map(|k| {
            let side = if k < 5 { -1. } else { 1. };
            let j = (k % 5) as f32;
            let (x, y) = (side * (44. + j * 13.), -462. + j * 9.);
            fframes::svgr!(<path d={leaf(46. - j * 3.)} transform={format!("translate({x:.1} {y:.1}) rotate({:.1})", side * (115. + j * 8.))} fill="url(#g-leaf-dark)" stroke="#5ff2a8" stroke-width="1.1" stroke-opacity="0.6" />)
        })
        .collect::<Vec<_>>();
    let collar = (0..7)
        .map(|k| {
            let a = lerp(-62., 62., k as f32 / 6.);
            fframes::svgr!(<path d={leaf(48.)} transform={format!("translate({:.1} -462) rotate({a:.1})", a * 0.5)} fill="url(#g-leaf-dark)" stroke="#5ff2a8" stroke-width="1.2" stroke-opacity="0.55" />)
        })
        .collect::<Vec<_>>();
    let circlet = (0..5)
        .map(|k| {
            let x = lerp(-18., 18., k as f32 / 4.);
            let a = lerp(-30., 30., k as f32 / 4.);
            let s = if k == 2 { 16. } else { 10. };
            fframes::svgr!(<path d={leaf(s)} transform={format!("translate({x:.1} {:.1}) rotate({a:.1})", -546. + (x / 18.).powi(2) * 4.)} fill="#f0d27a" stroke="#6a4a10" stroke-width="0.8" />)
        })
        .collect::<Vec<_>>();
    let rim = "#8ff6e6";
    let eye_glow = if eyes > 0.01 {
        fframes::svgr!(
            <g opacity={eyes.min(1.)}>
                <ellipse cx="0" cy="-522" rx={60. * eyes} ry="3" fill="#bffcf2" opacity="0.5" filter="url(#blur3)" />
                <circle cx="-10" cy="-522" r="9" fill="url(#g-cyan)" />
                <circle cx="10" cy="-522" r="9" fill="url(#g-cyan)" />
                <circle cx="-10" cy="-522" r="2.4" fill="#f2fffc" />
                <circle cx="10" cy="-522" r="2.4" fill="#f2fffc" />
            </g>
        )
    } else {
        Svgr::empty()
    };
    let cap_glow = 0.55 + 0.45 * bloom.min(1.3);
    let staff_path = "M-118 4 C-122 -120 -112 -260 -122 -380 C-130 -480 -120 -560 -128 -640 C-134 -660 -146 -668 -140 -684 C-130 -690 -118 -680 -122 -662";
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="4" rx="240" ry="26" fill="#000" opacity="0.55" filter="url(#blur8)" />
            <path d={back_hair.clone()} fill="url(#g-hair)" />
            <path d={back_hair} fill="none" stroke="#e8fffb" stroke-width="2.5" opacity="0.8" />
            <path d={mantle.clone()} fill="url(#g-lady)" />
            <path d={mantle.clone()} fill="none" stroke={rim} stroke-width="10" opacity="0.35" filter="url(#blur8)" />
            <path d={mantle} fill="none" stroke={rim} stroke-width="2" opacity="0.85" />
            <path d={dress} fill="url(#g-dress)" />
            <path d="M0 -430 C-14 -340 12 -260 -6 -170 C-18 -100 10 -40 0 -6" fill="none" stroke="#5ff2a8" stroke-width="2.4" opacity="0.55" />
            <path d="M-6 -300 C-30 -306 -36 -290 -40 -280 M4 -200 C28 -206 34 -190 38 -180" fill="none" stroke="#5ff2a8" stroke-width="1.8" opacity="0.5" />
            <path d="M58 -452 C88 -400 104 -330 98 -270 C120 -240 132 -200 128 -170 C100 -190 80 -200 66 -232 C70 -300 64 -380 40 -440Z" fill="url(#g-lady)" stroke={rim} stroke-width="1.6" stroke-opacity="0.7" />
            <rect x="-10" y="-494" width="20" height="30" fill="#140c22" />
            {pauldrons}
            {collar}
            <ellipse cx="0" cy="-520" rx="25" ry="33" fill="url(#g-face)" />
            <path d="M-22 -530 L-74 -566 L-25 -508Z" fill="#1e1430" stroke={rim} stroke-width="1.6" />
            <path d="M22 -530 L74 -566 L25 -508Z" fill="#1e1430" stroke={rim} stroke-width="1.6" />
            <path d="M-27 -528 C-30 -566 30 -566 27 -528 C18 -550 -18 -550 -27 -528Z" fill="url(#g-hair)" />
            {strands}
            <ellipse cx="-9" cy="-512" rx="9" ry="14" fill="#8ff6e6" opacity="0.12" />
            {circlet}
            {eye_glow}
            <g transform={format!("rotate({staff:.1} -120 -330)")}>
                <path d={staff_path} fill="none" stroke="#1e120a" stroke-width="11" stroke-linecap="round" />
                <path d={staff_path} fill="none" stroke="#8a6440" stroke-width="3" opacity="0.6" />
                <path d="M-58 -452 C-90 -420 -108 -380 -114 -336 C-130 -320 -146 -290 -150 -262 C-124 -280 -108 -296 -98 -320 C-84 -370 -72 -410 -44 -440Z" fill="url(#g-lady)" stroke={rim} stroke-width="1.6" stroke-opacity="0.7" />
                <ellipse cx="-121" cy="-336" rx="9" ry="12" fill="#3a2c52" stroke="#8ff6e6" stroke-width="1" stroke-opacity="0.6" />
                <circle cx="-124" cy="-700" r={90. + 60. * bloom} fill="url(#g-cyan)" opacity={0.5 * cap_glow} />
                <g transform={format!("translate(-124 -668) scale({:.3})", 0.9 + 0.25 * bloom.min(1.3))}>{glowcap(52., cap_glow, 0)}</g>
            </g>
        </g>
    )
}

/// Letters of a Cinzel line, centered on `cx`: (letter, x) and the total width.
pub fn letters<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, text: &'a str, size: usize, spacing: f32, cx: f32) -> (Vec<(String, f32, f32)>, f32) {
    let font = FontQuery { family: "Cinzel", size, weight: 900, ..Default::default() };
    let widths = text
        .char_indices()
        .map(|(i, c)| if c == ' ' { size as f32 * 0.32 } else { frame.text_width(ctx, font, &text[i..i + c.len_utf8()]).unwrap_or(60) as f32 })
        .collect::<Vec<_>>();
    let total = widths.iter().sum::<f32>() + spacing * (widths.len() as f32 - 1.);
    let mut x = cx - total / 2.;
    let mut out = vec![];
    for (i, c) in text.chars().enumerate() {
        out.push((c.to_string(), x, widths[i]));
        x += widths[i] + spacing;
    }
    (out, total)
}

/// A name plate whose letters grow out of a vine; `grow` 0..1 runs the vine and
/// the letters, and `title` sits above the name.
pub fn vine_plate<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, x: f32, y: f32, title: &'static str, name: &'static str, grow: f32, t: f32) -> Svgr<'a> {
    let (glyphs, total) = letters(frame, ctx, name, 60, 3., x);
    let x0 = x - total / 2.;
    let n = glyphs.len() as f32;
    let face = glyphs
        .iter()
        .enumerate()
        .map(|(i, (c, gx, w))| {
            let k = ((grow * (n + 3.) - i as f32) / 3.).clamp(0., 1.);
            let s = bloom(k * 0.6).min(1.2);
            let cx = gx + w / 2.;
            fframes::svgr!(
                <g transform={format!("translate({cx:.1} {y:.1}) scale({s:.3}) translate({:.1} {:.1})", -cx, -y)} opacity={k.min(1.)}>
                    <text x={*gx + 2.} y={y + 4.} font-family="Cinzel" font-weight="900" font-size="60" fill="#05020a" opacity="0.7">{c.clone()}</text>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size="60" fill="url(#g-hollows-title)" stroke="#0e1a14" stroke-width="1.6">{c.clone()}</text>
                </g>
            )
        })
        .collect::<Vec<_>>();
    // The vine under the name, with leaves that open as it passes.
    let vine_pts = (0..=24)
        .map(|k| {
            let u = k as f32 / 24.;
            (x0 - 10. + (total + 20.) * u, y + 20. + 5. * (u * TAU * 2.).sin())
        })
        .collect::<Vec<_>>();
    let vine = taper(&vine_pts, 5., 2., grow);
    let leaves = (0..8)
        .map(|k| {
            let u = (k as f32 + 0.5) / 8.;
            let open = ((grow - u) * 6.).clamp(0., 1.);
            let (lx, ly) = (x0 - 10. + (total + 20.) * u, y + 20. + 5. * (u * TAU * 2.).sin());
            let side = if k % 2 == 0 { -1. } else { 1. };
            let sway = 6. * wave(t, 1., u);
            fframes::svgr!(<path d={leaf(16. * open)} transform={format!("translate({lx:.1} {ly:.1}) rotate({:.1})", side * 120. + sway)} fill="url(#g-leaf)" opacity={open} />)
        })
        .collect::<Vec<_>>();
    let title_k = ((grow - 0.4) * 2.).clamp(0., 1.);
    fframes::svgr!(
        <g>
            <text x={x} y={y - 66.} text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="24" letter-spacing="12" fill="#bff6e6" opacity={title_k}>{title}</text>
            {face}
            <path d={vine} fill="#3aa86a" />
            {leaves}
        </g>
    )
}

/// The caustic light shader, compiled once.
pub fn caustic_shader() -> Shader {
    let noise = include_str!("../../hearthvale/src/shaders/noise.sksl");
    Shader::sksl(format!("{noise}\n{}", include_str!("shaders/caustic.sksl")))
}

/// Slow folds of light over the frame (or a rect), in two colors.
pub fn caustic<'a>(shader: &Shader, frame: &Frame, scale: f32, deep: (f32, f32, f32), light: (f32, f32, f32), opacity: f32, rect: (f32, f32, f32, f32)) -> Svgr<'a> {
    if opacity <= 0.001 {
        return Svgr::empty();
    }
    let layer = shader.draw(
        frame,
        ShaderUniforms::new()
            .float("uPhase", loop_phase(frame.seconds()))
            .float("uScale", scale)
            .float3("uDeep", deep.0, deep.1, deep.2)
            .float3("uLight", light.0, light.1, light.2)
            .float("uOpacity", opacity.min(1.)),
    );
    let (x, y, w, h) = rect;
    fframes::svgr!(<image href={layer.href()} x={x} y={y} width={w} height={h} />)
}

/// The glow of one giant mushroom cap of the Region Map, in map units.
pub fn cap_glow<'a>(x: f32, y: f32, r: f32, violet: bool, k: f32, t: f32, seed: u32) -> Svgr<'a> {
    if k <= 0.01 {
        return Svgr::empty();
    }
    let breathe = 0.82 + 0.18 * wave(t, 1., rnd(seed, 61));
    let (halo, core) = if violet { ("url(#g-violet-soft)", "#f2dcff") } else { ("url(#g-cyan)", "#e8fffb") };
    fframes::svgr!(
        <g>
            <circle cx={x} cy={y + r * 0.2} r={r * 2.6 * k.min(1.2)} fill={halo} opacity={0.55 * k.min(1.) * breathe} />
            <ellipse cx={x} cy={y} rx={r * 0.9} ry={r * 0.45} fill={core} opacity={0.22 * k.min(1.) * breathe} filter="url(#blur8u)" />
        </g>
    )
}

/// Shared static definitions of the Glowcap Hollows scenes.
pub fn defs<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <defs>
            <filter id="blur3u" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="3" /></filter>
            <radialGradient id="g-violet-soft">
                <stop offset="0" stop-color="#f6e8ff" stop-opacity="0.95" />
                <stop offset="0.3" stop-color="#c58aff" stop-opacity="0.6" />
                <stop offset="1" stop-color="#5a1ab0" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-moss-dust">
                <stop offset="0" stop-color="#8a9a5a" stop-opacity="0.85" />
                <stop offset="1" stop-color="#3a4a22" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-firefly">
                <stop offset="0" stop-color="#fbffd8" stop-opacity="1" />
                <stop offset="0.35" stop-color="#d8ff7a" stop-opacity="0.7" />
                <stop offset="1" stop-color="#7ad84a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-poison">
                <stop offset="0" stop-color="#eaffc8" stop-opacity="0.9" />
                <stop offset="0.4" stop-color="#8ae84a" stop-opacity="0.5" />
                <stop offset="1" stop-color="#3a8a1a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-amber" cx="0.4" cy="0.36" r="0.75">
                <stop offset="0" stop-color="#ffe7a0" />
                <stop offset="0.35" stop-color="#f6a024" />
                <stop offset="0.75" stop-color="#c25a0a" />
                <stop offset="1" stop-color="#6a2604" />
            </radialGradient>
            <radialGradient id="g-amber-core">
                <stop offset="0" stop-color="#fff6c8" stop-opacity="0.85" />
                <stop offset="0.5" stop-color="#ffc24a" stop-opacity="0.35" />
                <stop offset="1" stop-color="#ff9a1a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-amber-halo">
                <stop offset="0.45" stop-color="#ffb43a" stop-opacity="0.55" />
                <stop offset="1" stop-color="#ff7a10" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="g-root" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#7a5230" />
                <stop offset="0.45" stop-color="#4a2e16" />
                <stop offset="1" stop-color="#1e1008" />
            </linearGradient>
            <linearGradient id="g-root-night" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#05030a" />
                <stop offset="0.6" stop-color="#140e22" />
                <stop offset="0.85" stop-color="#1e2e2a" />
                <stop offset="1" stop-color="#07050c" />
            </linearGradient>
            <linearGradient id="g-log" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#2a180c" />
                <stop offset="0.4" stop-color="#6a4626" />
                <stop offset="0.7" stop-color="#4a2e16" />
                <stop offset="1" stop-color="#1e1008" />
            </linearGradient>
            <linearGradient id="g-leaf" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#2a8a4a" />
                <stop offset="1" stop-color="#bff6a0" />
            </linearGradient>
            <linearGradient id="g-leaf-dark" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#0e1a14" />
                <stop offset="1" stop-color="#1e4a34" />
            </linearGradient>
            <linearGradient id="g-lady" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#22183a" />
                <stop offset="0.6" stop-color="#140e26" />
                <stop offset="1" stop-color="#0a0614" />
            </linearGradient>
            <linearGradient id="g-dress" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#160f28" />
                <stop offset="0.5" stop-color="#2a2048" />
                <stop offset="1" stop-color="#160f28" />
            </linearGradient>
            <linearGradient id="g-hair" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#f2fffb" />
                <stop offset="0.45" stop-color="#b8dcd0" />
                <stop offset="1" stop-color="#4a6a66" />
            </linearGradient>
            <radialGradient id="g-face" cx="0.5" cy="0.4" r="0.7">
                <stop offset="0" stop-color="#3a2c52" />
                <stop offset="1" stop-color="#160e26" />
            </radialGradient>
            <linearGradient id="g-hollows-title" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f4fffb" />
                <stop offset="0.45" stop-color="#8ff6e6" />
                <stop offset="1" stop-color="#3a8a7a" />
            </linearGradient>
            <linearGradient id="g-dusk-hollows" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#0c0820" stop-opacity="0.85" />
                <stop offset="1" stop-color="#0c0820" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="g-hall-light">
                <stop offset="0" stop-color="#fff6d8" stop-opacity="1" />
                <stop offset="0.3" stop-color="#ffd890" stop-opacity="0.7" />
                <stop offset="1" stop-color="#ff9a3a" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="g-window" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#e8fff4" />
                <stop offset="0.4" stop-color="#7ae8b8" />
                <stop offset="1" stop-color="#1a6a5a" />
            </linearGradient>
            <linearGradient id="g-hall-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#070512" />
                <stop offset="0.6" stop-color="#140c26" />
                <stop offset="1" stop-color="#0a1612" />
            </linearGradient>
            <linearGradient id="g-table" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#4a2e18" />
                <stop offset="0.5" stop-color="#2e1c0e" />
                <stop offset="1" stop-color="#140a04" />
            </linearGradient>
            <linearGradient id="g-shaft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2a3a2a" />
                <stop offset="1" stop-color="#0a100c" />
            </linearGradient>
        </defs>
    )
}
