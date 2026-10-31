//! Thornwood props, on top of the shared fx toolkit and the props of the earlier
//! Regions. Ambient motion repeats every LOOP seconds, like the rest of the toolkit.
use crate::fx::*;
use crate::hollows::{bloom, leaf, letters, spline, taper, thorn};
use fframes::{FFramesContext, Frame, Shader, ShaderUniforms, Svgr};
use std::f32::consts::{PI, TAU};

/// The Old Bramble on the Region Map, in map units: its face, eyes and mouth.
pub const FACE: (f32, f32) = (1205., 222.);
pub const EYE_L: (f32, f32) = (1162., 188.);
pub const EYE_R: (f32, f32) = (1252., 207.);
pub const MOUTH: (f32, f32) = (1210., 262.);
/// Other painted landmarks of the Region Map.
pub const WEB_CAVE: (f32, f32) = (917., 490.);
pub const LANTERN_TREE: (f32, f32) = (531., 562.);
pub const VILLAGE: (f32, f32) = (1062., 677.);
pub const BEAR: (f32, f32) = (1050., 330.);

/// The autumn and summer colors of falling leaves.
pub const LEAF_FILLS: [&str; 4] = ["url(#g-leaf)", "#d8461e", "#f08a2a", "#b8d04a"];

/// The bark shader, compiled once.
pub fn bark_shader() -> Shader {
    let noise = include_str!("../../hearthvale/src/shaders/noise.sksl");
    Shader::sksl(format!("{noise}\n{}", include_str!("shaders/bark.sksl")))
}

/// The bark over the full frame. `cam` is the view in face space (center x,
/// center y, zoom), so the bark moves and scales with the drawn features.
pub fn bark<'a>(sh: &Shader, frame: &Frame, cam: (f32, f32, f32), light: (f32, f32, f32), shade: (f32, f32, f32), moss: f32) -> Svgr<'a> {
    let base = 1.3;
    let layer = sh.draw(
        frame,
        ShaderUniforms::new()
            .float2("uOffset", cam.0 / base, cam.1 / base)
            .float("uScale", cam.2 * base)
            .float3("uLight", light.0, light.1, light.2)
            .float3("uShade", shade.0, shade.1, shade.2)
            .float("uMoss", moss),
    );
    fframes::svgr!(<image href={layer.href()} x="0" y="0" width="1280" height="720" />)
}

/// The transform from face space to the frame for a view `cam`.
pub fn view(cam: (f32, f32, f32)) -> String {
    format!("translate(640 360) scale({:.4}) translate({:.2} {:.2})", cam.2, -cam.0, -cam.1)
}

/// The pose of the drawn face.
#[derive(Clone, Copy)]
pub struct Pose {
    /// 0 closed, 1 wide open.
    pub open: f32,
    /// 0 calm, 1 angry: the brows come down at the middle.
    pub anger: f32,
    /// 0 closed, 1 open.
    pub mouth: f32,
    /// The amber light in the eyes.
    pub glow: f32,
    /// Where the pupils look, -1..1 in x.
    pub look: f32,
}

/// The face space is 1280 x 720 at zoom 1. The eyes and the features.
pub const F_EYE_L: (f32, f32) = (432., 330.);
pub const F_EYE_R: (f32, f32) = (848., 330.);

/// One eye of the giant in face space: an amber orb inside lids of bark.
pub fn giant_eye<'a>(c: (f32, f32), side: f32, p: Pose, t: f32) -> Svgr<'a> {
    let (cx, cy) = c;
    let open = p.open.clamp(0., 1.2);
    let w = 112.;
    // The inner corner is toward the nose. Anger lowers the upper lid there.
    let inner = cx - side * w;
    let outer = cx + side * w;
    let up_in = cy - 70. * open + 46. * p.anger * open.min(1.);
    let up_out = cy - 78. * open + 6. * p.anger;
    let low = cy + 44. * open.min(1.) + 4.;
    let almond = format!(
        "M{inner:.1} {:.1} C{:.1} {up_in:.1} {:.1} {up_out:.1} {outer:.1} {:.1} C{:.1} {low:.1} {:.1} {low:.1} {inner:.1} {:.1}Z",
        cy + 6., lerp(inner, outer, 0.3), lerp(inner, outer, 0.72), cy - 2., lerp(outer, inner, 0.3), lerp(outer, inner, 0.7), cy + 6.
    );
    let id = if side < 0. { "tw-eye-l" } else { "tw-eye-r" };
    let breathe = 0.9 + 0.1 * wave(t, 1., if side < 0. { 0.1 } else { 0.35 });
    let glow = p.glow * breathe;
    let (px, py) = (cx + p.look * 26., cy - 4.);
    let orb = if open > 0.03 {
        fframes::svgr!(
            <g>
                <defs><clipPath id={id}><path d={almond.clone()} /></clipPath></defs>
                <g clip-path={format!("url(#{id})")}>
                    <rect x={cx - 130.} y={cy - 110.} width="260" height="200" fill="#3a1402" />
                    <circle cx={px} cy={py} r="78" fill="url(#g-eye)" opacity={0.35 + 0.65 * glow.min(1.)} />
                    <circle cx={px} cy={py} r="44" fill="none" stroke="#7a2e04" stroke-width="7" opacity="0.7" />
                    <circle cx={px} cy={py} r="44" fill="none" stroke="#ffe7a0" stroke-width="1.5" opacity={0.5 * glow.min(1.)} />
                    <ellipse cx={px} cy={py} rx="9" ry={30. * (1. - 0.35 * p.anger)} fill="#1e0802" />
                    <circle cx={px - 18.} cy={py - 20.} r="7" fill="#fffbe8" opacity={0.75 * glow.min(1.)} />
                    <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", inner, cy - 4., cx, up_in.min(up_out) + 30., cx, up_in.min(up_out) + 30., outer, cy - 4.)} fill="none" stroke="#1a0802" stroke-width="26" opacity="0.55" filter="url(#blur8)" />
                </g>
            </g>
        )
    } else {
        Svgr::empty()
    };
    // The lids: a heavy roll of bark above, a lighter one below.
    let lid = format!(
        "M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}",
        inner - side * 10., cy + 10., lerp(inner, outer, 0.3), up_in - 16., lerp(inner, outer, 0.72), up_out - 18., outer + side * 14., cy - 2.,
        lerp(outer, inner, 0.3), low + 14., lerp(outer, inner, 0.7), low + 14., inner - side * 10., cy + 10.
    );
    fframes::svgr!(
        <g>
            <ellipse cx={cx} cy={cy} rx={150. + 60. * glow} ry={100. + 40. * glow} fill="url(#g-eye-halo)" opacity={0.55 * glow.min(1.2)} />
            {orb}
            <path d={lid} fill="none" stroke="#1e1006" stroke-width="16" stroke-linejoin="round" />
            <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", inner - side * 4., cy + 2., lerp(inner, outer, 0.3), up_in - 10., lerp(inner, outer, 0.72), up_out - 12., outer + side * 8., cy - 4.)} fill="none" stroke="#c89a62" stroke-width="5" stroke-linecap="round" opacity="0.6" />
            <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", outer, cy + 8., lerp(outer, inner, 0.3), low + 22., lerp(outer, inner, 0.7), low + 22., inner, cy + 14.)} fill="none" stroke="#a0784a" stroke-width="3" opacity="0.45" />
        </g>
    )
}

/// Hanging strands of moss, from `top` points, `len` long, swaying.
pub fn moss<'a>(t: f32, roots: &[(f32, f32, f32)], seed: u32, breath: f32) -> Svgr<'a> {
    let strands = roots
        .iter()
        .enumerate()
        .map(|(i, &(x, y, len))| {
            let k = i as u32;
            let sway = (9. + 6. * rnd(k, seed)) * wave(t, 1., rnd(k, seed + 1)) + breath * 22. * rnd(k, seed + 2);
            let pts = (0..=5)
                .map(|j| {
                    let u = j as f32 / 5.;
                    (x + sway * u * u + 6. * (u * 5. + rnd(k, seed + 3) * 6.).sin(), y + len * u)
                })
                .collect::<Vec<_>>();
            let d = taper(&spline(&pts, 3), lerp(5., 10., rnd(k, seed + 4)), 1.2, 1.);
            let fill = if rnd(k, seed + 5) > 0.5 { "url(#g-moss)" } else { "url(#g-moss-dark)" };
            fframes::svgr!(<path d={d} fill={fill} stroke="#14200a" stroke-width="0.8" stroke-opacity="0.5" />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{strands}</g>)
}

/// A cluster of leaves at (x, y), `size` across, in autumn colors.
pub fn leaf_cluster<'a>(x: f32, y: f32, size: f32, t: f32, seed: u32, red: f32) -> Svgr<'a> {
    let n = 9;
    let sway = 4. * wave(t, 1., rnd(seed, 1));
    let leaves = (0..n)
        .map(|k| {
            let a = -PI / 2. + lerp(-1.6, 1.6, k as f32 / (n - 1) as f32) + 0.3 * rnd(k, seed);
            let r = size * lerp(0.15, 0.55, rnd(k, seed + 2));
            let (lx, ly) = (x + a.cos() * r, y + a.sin() * r * 0.8);
            let fill = if rnd(k, seed + 3) < red { if rnd(k, seed + 4) > 0.5 { "url(#g-leaf-red)" } else { "url(#g-leaf-orange)" } } else if rnd(k, seed + 4) > 0.5 { "url(#g-leaf-green)" } else { "url(#g-leaf-deep)" };
            let s = size * lerp(0.32, 0.5, rnd(k, seed + 5));
            fframes::svgr!(
                <g transform={format!("translate({lx:.1} {ly:.1}) rotate({:.0})", a.to_degrees() + 90. + sway * 3.)}>
                    <path d={leaf(s)} fill={fill} stroke="#1a1006" stroke-width="1.2" stroke-opacity="0.55" />
                    <path d={format!("M0 0 L0 {:.1}", -s * 0.9)} stroke="#1a0c04" stroke-width="1.2" opacity="0.35" />
                </g>
            )
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{leaves}</g>)
}

/// The outline of a brow over one eye in face space, angled down at the nose when angry.
pub fn brow_shape(side: f32, anger: f32) -> String {
    let (ex, ey) = if side < 0. { F_EYE_L } else { F_EYE_R };
    let pts = [
        (640. + side * 34., ey - 66. + 56. * anger),
        (ex + side * -70., ey - 112. + 34. * anger),
        (ex + side * 60., ey - 128. + 8. * anger),
        (ex + side * 170., ey - 104.),
        (ex + side * 236., ey - 60.),
    ];
    taper(&spline(&pts, 6), 104., 34., 1.)
}

/// A heavy brow of bark over one eye, for scenes that draw only one eye.
pub fn giant_brow<'a>(side: f32, anger: f32) -> Svgr<'a> {
    let shape = brow_shape(side, anger);
    fframes::svgr!(
        <g>
            <path d={shape.clone()} fill="#000" opacity="0.65" transform="translate(6 26)" filter="url(#blur18)" />
            <path d={shape.clone()} fill="url(#g-brow)" />
            <path d={shape} fill="none" stroke="#120804" stroke-width="3" opacity="0.7" />
        </g>
    )
}

const NOSE: &str = "M606 236 C594 300 588 356 574 404 C534 434 528 500 572 524 C606 544 674 544 708 524 C752 500 746 434 706 404 C692 356 686 300 674 236 C664 226 616 226 606 236Z";
const CHEEK_L: &str = "M240 454 C270 404 420 406 520 438 C580 458 590 520 540 550 C470 582 330 574 268 540 C226 518 222 482 240 454Z";
const CHEEK_R: &str = "M1040 454 C1010 404 860 406 760 438 C700 458 690 520 740 550 C810 582 950 574 1012 540 C1054 518 1058 482 1040 454Z";

/// The bark layer of a frame for a view `cam`, to fill several features.
pub fn bark_layer(sh: &Shader, frame: &Frame, cam: (f32, f32, f32), light: (f32, f32, f32), shade: (f32, f32, f32), moss: f32) -> fframes::media::ImageData<'static> {
    let base = 1.3;
    sh.draw(
        frame,
        ShaderUniforms::new()
            .float2("uOffset", cam.0 / base, cam.1 / base)
            .float("uScale", cam.2 * base)
            .float3("uLight", light.0, light.1, light.2)
            .float3("uShade", shade.0, shade.1, shade.2)
            .float("uMoss", moss),
    )
}

/// A feature of the face in face space: the bark, shifted so its grain breaks at
/// the edge, then shading from the upper left and a cast shadow.
pub fn carved<'a>(layer: &fframes::media::ImageData<'static>, cam: (f32, f32, f32), shape: &str, id: &'static str, shift: (f32, f32), shading: &'static str, shadow: (f32, f32)) -> Svgr<'a> {
    let tf = view(cam);
    fframes::svgr!(
        <g>
            <defs><clipPath id={id}><path d={shape.to_string()} transform={tf.clone()} /></clipPath></defs>
            <g transform={tf.clone()}><path d={shape.to_string()} fill="#000" opacity="0.6" transform={format!("translate({} {})", shadow.0, shadow.1)} filter="url(#blur18)" /></g>
            <g clip-path={format!("url(#{id})")}>
                <image href={layer.href()} x={shift.0} y={shift.1} width="1280" height="720" />
                <image href={layer.href()} x={shift.0 - 1280.} y={shift.1} width="1280" height="720" />
            </g>
            <g transform={tf}>
                <path d={shape.to_string()} fill={shading} />
                <path d={shape.to_string()} fill="none" stroke="#1a0a04" stroke-width="2" opacity="0.35" />
            </g>
        </g>
    )
}

/// The drawn face of the Old Bramble for close-ups. `cam` is the view in face
/// space, `light` is 0 for dusk and 1 for full afternoon light.
pub fn giant_face<'a>(sh: &Shader, frame: &Frame, t: f32, p: Pose, cam: (f32, f32, f32), light: f32) -> Svgr<'a> {
    let lit = (lerp(0.42, 0.8, light), lerp(0.3, 0.6, light), lerp(0.2, 0.36, light));
    let shade = (0.07, 0.04, 0.02);
    let layer = bark_layer(sh, frame, cam, lit, shade, 0.7);
    let breath = 0.5 + 0.5 * wave(t, 1., 0.);
    let anger = p.anger;
    let z = cam.2;
    let shift = |dx: f32, dy: f32| (dx * z, dy * z);
    let mouth_h = 14. + 80. * p.mouth;
    let my = 580.;
    let lips = format!(
        "M478 {my:.1} C548 {:.1} 732 {:.1} 802 {my:.1} C732 {:.1} 548 {:.1} 478 {my:.1}Z",
        my - mouth_h * 0.5, my - mouth_h * 0.5, my + mouth_h * 0.55, my + mouth_h * 0.55
    );
    let teeth = (0..9)
        .map(|k| {
            let x = lerp(520., 760., k as f32 / 8.);
            let top = k % 2 == 0;
            let h = mouth_h * lerp(0.3, 0.5, rnd(k, 71));
            let y0 = if top { my - mouth_h * 0.4 } else { my + mouth_h * 0.42 };
            let tip = if top { y0 + h } else { y0 - h };
            fframes::svgr!(<path d={format!("M{:.1} {y0:.1} L{x:.1} {tip:.1} L{:.1} {y0:.1}Z", x - 12., x + 12.)} fill="#9a7044" stroke="#2a1406" stroke-width="2" />)
        })
        .collect::<Vec<_>>();
    let teeth = if p.mouth > 0.05 { fframes::svgr!(<g>{teeth}</g>) } else { Svgr::empty() };
    let wrinkles = [
        "M400 160 C480 130 560 140 616 160", "M664 160 C730 138 810 132 890 162", "M450 112 C530 92 600 100 640 116", "M680 114 C740 94 820 96 880 112",
        "M560 520 C506 548 488 590 480 640", "M720 520 C774 548 792 590 800 640",
    ];
    let lines = wrinkles
        .iter()
        .map(|d| fframes::svgr!(<g><path d={*d} fill="none" stroke="#120804" stroke-width="8" stroke-linecap="round" opacity="0.6" /><path d={*d} fill="none" stroke="#e0b47c" stroke-width="2.5" stroke-linecap="round" opacity="0.35" transform="translate(-3 -5)" /></g>))
        .collect::<Vec<_>>();
    // The moss: a mustache that droops from under the nose, and a long beard.
    let mustache = (0..40)
        .map(|k| {
            let side = if k % 2 == 0 { -1. } else { 1. };
            let u = rnd(k, 80);
            let x = 640. + side * lerp(20., 190., u);
            let y = 528. + 30. * u * u + 8. * rnd(k, 81);
            (x, y, lerp(40., 70., rnd(k, 82)) * (0.6 + 0.8 * u))
        })
        .collect::<Vec<_>>();
    let beard_back = (0..70)
        .map(|k| {
            let u = rnd(k, 90);
            let row = rnd(k, 96);
            (lerp(370., 910., u), 604. + 130. * row - 16. * (1. - (2. * u - 1.).powi(2)), lerp(40., 90., rnd(k, 92)))
        })
        .collect::<Vec<_>>();
    let beard = (0..60)
        .map(|k| {
            let u = k as f32 / 45.;
            (lerp(380., 900., u) + 8. * rnd(k, 95), 640. - 24. * (1. - (2. * u - 1.).powi(2)) + 14. * rnd(k, 93), lerp(110., 220., rnd(k, 94)))
        })
        .collect::<Vec<_>>();
    let sway = 6. * wave(t, 1., 0.3);
    let beard_mass = format!(
        "M360 640 C420 600 520 610 640 616 C760 610 860 600 920 640 C {:.1} 700 {:.1} 760 {:.1} 800 L{:.1} 800 C{:.1} 760 {:.1} 700 360 640Z",
        950. + sway, 930. + sway, 900. + sway, 380. + sway, 350. + sway, 330. + sway
    );
    // Moss hangs from the crown at the temples.
    let temples = (0..40)
        .map(|k| {
            let side = if k % 2 == 0 { -1. } else { 1. };
            let x = 640. + side * lerp(470., 640., rnd(k, 97));
            (x, lerp(40., 120., rnd(k, 98)), lerp(160., 380., rnd(k, 99)))
        })
        .collect::<Vec<_>>();
    let tufts = |side: f32| {
        let (ex, ey) = if side < 0. { F_EYE_L } else { F_EYE_R };
        (0..10)
            .map(|k| {
                let u = k as f32 / 9.;
                (ex + side * lerp(-40., 210., u), ey - lerp(120., 96., u) + 40. * anger * (1. - u), lerp(22., 46., rnd(k, 61 + side as u32)))
            })
            .collect::<Vec<_>>()
    };
    let crown_back = (0..18)
        .map(|k| {
            let u = k as f32 / 17.;
            let x = lerp(-60., 1340., u) + 30. * rnd(k, 101);
            let y = lerp(-30., 20., rnd(k, 102)) + 70. * (2. * u - 1.).powi(4);
            leaf_cluster(x, y, lerp(170., 230., rnd(k, 103)), t, 200 + k, lerp(0.2, 0.5, rnd(k, 104)))
        })
        .collect::<Vec<_>>();
    let crown = (0..22)
        .map(|k| {
            let u = k as f32 / 21.;
            let x = lerp(-40., 1320., u) + 26. * rnd(k, 111);
            let y = lerp(20., 70., rnd(k, 112)) + 90. * (2. * u - 1.).powi(4);
            leaf_cluster(x, y, lerp(120., 170., rnd(k, 113)), t, 300 + k, lerp(0.45, 0.95, rnd(k, 114)))
        })
        .collect::<Vec<_>>();
    let tf = view(cam);
    fframes::svgr!(
        <g>
            <image href={layer.href()} x="0" y="0" width="1280" height="720" />
            <g transform={tf.clone()}>
                <rect x="-300" y="-300" width="1880" height="1320" fill="url(#g-face-light)" opacity={0.5 + 0.25 * light} />
                <ellipse cx={F_EYE_L.0} cy={F_EYE_L.1 + 6.} rx="200" ry="130" fill="#080302" opacity="0.8" filter="url(#blur18)" />
                <ellipse cx={F_EYE_R.0} cy={F_EYE_R.1 + 6.} rx="200" ry="130" fill="#080302" opacity="0.8" filter="url(#blur18)" />
                {lines}
            </g>
            {carved(&layer, cam, CHEEK_L, "tw-cheek-l", shift(23., -31.), "url(#g-bulge)", (10., 24.))}
            {carved(&layer, cam, CHEEK_R, "tw-cheek-r", shift(-29., 17.), "url(#g-bulge)", (10., 24.))}
            <g transform={tf.clone()}>
                {giant_eye(F_EYE_L, -1., p, t)}
                {giant_eye(F_EYE_R, 1., p, t)}
            </g>
            {carved(&layer, cam, &brow_shape(-1., anger), "tw-brow-l", shift(37., 53.), "url(#g-brow-shade)", (8., 30.))}
            {carved(&layer, cam, &brow_shape(1., anger), "tw-brow-r", shift(-41., 47.), "url(#g-brow-shade)", (8., 30.))}
            <g transform={tf.clone()}>
                {moss(t, &tufts(-1.), 500, 0.)}
                {moss(t, &tufts(1.), 520, 0.)}
            </g>
            {carved(&layer, cam, NOSE, "tw-nose", shift(53., -29.), "url(#g-nose-shade)", (30., 26.))}
            <g transform={tf}>
                <ellipse cx="606" cy="516" rx="18" ry="9" fill="#120602" opacity="0.85" />
                <ellipse cx="674" cy="516" rx="18" ry="9" fill="#120602" opacity="0.85" />
                <path d="M612 270 C602 330 596 380 584 424" fill="none" stroke="#f0c890" stroke-width="6" stroke-linecap="round" opacity="0.35" />
                {moss(t, &temples, 700, 0.)}
                <path d={lips.clone()} fill="#0e0402" />
                <ellipse cx="640" cy={my} rx="150" ry={mouth_h * 0.45} fill="url(#g-eye-halo)" opacity={0.7 * p.mouth * p.glow.min(1.)} />
                {teeth}
                <path d={lips} fill="none" stroke="#2a1608" stroke-width="7" />
                <path d={beard_mass.clone()} fill="#000" opacity="0.5" transform="translate(0 -14)" filter="url(#blur18)" />
                <path d={beard_mass} fill="url(#g-moss-mass)" filter="url(#blur3u)" />
                {moss(t, &beard_back, 400, breath * 0.4)}
                {moss(t, &beard, 410, breath * 0.5)}
                {moss(t, &mustache, 300, breath * p.mouth)}
                {crown_back}
                {crown}
            </g>
        </g>
    )
}

/// Pairs of beast eyes in the dark; `open` 0..1, `color` "amber" or "red".
pub fn beast_eyes<'a>(x: f32, y: f32, size: f32, open: f32, red: bool) -> Svgr<'a> {
    if open <= 0.02 {
        return Svgr::empty();
    }
    let (halo, core) = if red { ("url(#g-red)", "#ffd0b0") } else { ("url(#g-eye-halo)", "#fff0b8") };
    let eye = |cx: f32, dir: f32| {
        let w = size * 0.5;
        let h = size * 0.3 * open;
        let d = format!("M{:.1} {y:.1} Q{cx:.1} {:.1} {:.1} {:.1} Q{cx:.1} {:.1} {:.1} {y:.1}Z", cx - w, y - h * 1.4 - dir * h * 0.4, cx + w, y + dir * h * 0.3, y + h, cx - w);
        fframes::svgr!(<path d={d} fill={core} />)
    };
    fframes::svgr!(
        <g>
            <ellipse cx={x} cy={y} rx={size * 2.6} ry={size * 1.2} fill={halo} opacity={0.6 * open} />
            {eye(x - size * 0.9, 1.)}
            {eye(x + size * 0.9, -1.)}
        </g>
    )
}

/// A lantern of cold green fire, hanging from the origin; `size` 1 is 30 units wide.
pub fn lantern<'a>(t: f32, seed: f32, glow: f32, size: f32) -> Svgr<'a> {
    let f = flicker(t, seed);
    let h = 22. + 6. * f;
    let sway = 2. * wave(t, 6., seed);
    let flame = format!("M0 36 C-9 30 -8 {:.1} {sway:.1} {:.1} C8 {:.1} 9 30 0 36Z", 36. - h * 0.5, 36. - h, 36. - h * 0.5);
    fframes::svgr!(
        <g transform={format!("scale({size:.3})")}>
            <circle cx="0" cy="26" r={70. + 30. * f} fill="url(#g-witch)" opacity={glow * (0.55 + 0.25 * f)} />
            <path d="M0 0 L0 8" stroke="#2a2a22" stroke-width="2" />
            <path d="M-6 8 L6 8 L13 16 L13 44 L6 50 L-6 50 L-13 44 L-13 16Z" fill="#0e1a12" opacity="0.6" stroke="#2a3a2a" stroke-width="2.5" />
            <path d={flame} fill="#5aff8a" opacity={glow} />
            <path d="M0 36 C-4 32 -3 24 0 18 C3 24 4 32 0 36Z" fill="#e8fff0" opacity={glow} />
            <path d="M-13 16 L-13 44 M13 16 L13 44 M0 8 L0 50" stroke="#1a2418" stroke-width="2" />
            <path d="M-8 4 L8 4 L13 12 L-13 12Z M-7 50 L7 50 L5 56 L-5 56Z" fill="#2a3428" />
        </g>
    )
}

/// A small hooded cutter seen from the side, feet at the origin, about 150 units
/// tall, walking to the right. `step` is the walk phase; `knife` raises the knife.
pub fn cutter<'a>(t: f32, step: f32, knife: f32, glow: f32, seed: f32) -> Svgr<'a> {
    let bob = 3. * (TAU * step * 2.).sin().abs();
    let legs = 9. * (TAU * step).sin();
    let cloak = format!(
        "M-6 {:.1} C-30 {:.1} -40 -40 -46 -6 L{:.1} 0 L{:.1} 0 L26 -4 C24 -40 20 {:.1} 10 {:.1} C14 {:.1} 16 {:.1} 6 {:.1} C-2 {:.1} -10 {:.1} -6 {:.1}Z",
        -126. - bob, -110. - bob, -10. - legs, 12. + legs, -100. - bob, -118. - bob, -134. - bob, -150. - bob, -156. - bob, -156. - bob, -140. - bob, -126. - bob
    );
    let arm_a = lerp(30., -120., knife);
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx="40" ry="6" fill="#000" opacity="0.5" />
            <path d={cloak.clone()} fill="#04060a" />
            <path d={cloak} fill="none" stroke="#5aff8a" stroke-width="1.6" opacity={0.55 * glow} />
            <g transform={format!("translate(8 {:.1}) rotate({arm_a:.0})", -104. - bob)}>
                <path d="M0 0 L34 0" stroke="#04060a" stroke-width="9" stroke-linecap="round" />
                <path d="M32 0 L58 -3 L60 0 L58 3Z" fill="#c8d8c8" opacity={0.3 + 0.7 * knife} />
            </g>
            <g transform={format!("translate(12 {:.1})", -96. - bob)}>
                <path d="M0 0 L46 -20" stroke="#1a140c" stroke-width="3.5" stroke-linecap="round" />
                <g transform={format!("translate(46 -20) rotate({:.1})", 10. * wave(t, 2., seed))}>{lantern(t, seed, glow, 0.62)}</g>
            </g>
        </g>
    )
}

/// A coin of bone seen from above, with a hole in its middle; `ratio` 1 is
/// face-on, smaller is tilted away. `frost` covers it with ice.
pub fn bone_coin<'a>(r: f32, ratio: f32, rot: f32, frost: f32) -> Svgr<'a> {
    let hole = r * 0.26;
    let ring = format!(
        "M{:.1} 0 A{r:.1} {r:.1} 0 1 0 {:.1} 0 A{r:.1} {r:.1} 0 1 0 {:.1} 0Z M{:.1} 0 A{hole:.1} {hole:.1} 0 1 1 {:.1} 0 A{hole:.1} {hole:.1} 0 1 1 {:.1} 0Z",
        -r, r, -r, -hole, hole, -hole
    );
    let beads = (0..20)
        .map(|k| {
            let a = TAU * k as f32 / 20.;
            fframes::svgr!(<circle cx={a.cos() * r * 0.8} cy={a.sin() * r * 0.8} r={r * 0.035} fill="#7a6a4c" />)
        })
        .collect::<Vec<_>>();
    // The Bone Ferry: a boat on waves, under the hole.
    let s = r / 60.;
    let boat = format!(
        "M{:.1} {:.1} Q0 {:.1} {:.1} {:.1} L{:.1} {:.1} Q0 {:.1} {:.1} {:.1}Z M{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1}Z",
        -30. * s, 24. * s, 44. * s, 30. * s, 24. * s, 22. * s, 26. * s, 34. * s, -22. * s, 26. * s,
        -4. * s, 24. * s, 2. * s, 6. * s, 12. * s, 24. * s
    );
    let waves = format!(
        "M{:.1} {:.1} q{:.1} {:.1} {:.1} 0 t{:.1} 0 t{:.1} 0 M{:.1} {:.1} q{:.1} {:.1} {:.1} 0 t{:.1} 0",
        -30. * s, 42. * s, 7.5 * s, -5. * s, 15. * s, 15. * s, 15. * s, -18. * s, 50. * s, 7.5 * s, -5. * s, 15. * s, 15. * s
    );
    let crystals = if frost > 0.01 {
        let d = (0..9)
            .map(|k| {
                let a = TAU * rnd(k, 51);
                let rr = r * lerp(0.35, 0.95, rnd(k, 52));
                let (x, y) = (a.cos() * rr, a.sin() * rr);
                let l = r * lerp(0.06, 0.14, rnd(k, 53));
                format!("M{:.1} {y:.1} L{:.1} {y:.1} M{x:.1} {:.1} L{x:.1} {:.1} M{:.1} {:.1} L{:.1} {:.1} ", x - l, x + l, y - l, y + l, x - l * 0.6, y - l * 0.6, x + l * 0.6, y + l * 0.6)
            })
            .collect::<String>();
        fframes::svgr!(
            <g opacity={frost.min(1.)}>
                <path d={ring.clone()} fill="#cfe8ff" fill-rule="evenodd" opacity="0.35" />
                <path d={d} stroke="#f4fbff" stroke-width={(r * 0.025).max(0.8)} stroke-linecap="round" />
            </g>
        )
    } else {
        Svgr::empty()
    };
    let thick = r * 0.14 * (1. - ratio).max(0.12);
    fframes::svgr!(
        <g transform={format!("rotate({rot:.1}) scale(1 {ratio:.3})")}>
            <path d={ring.clone()} fill="url(#g-bone-edge)" fill-rule="evenodd" transform={format!("translate(0 {:.1})", thick / ratio.max(0.05))} />
            <path d={ring.clone()} fill="url(#g-bone)" fill-rule="evenodd" stroke="#6a5a40" stroke-width={(r * 0.04).max(1.)} />
            <circle r={r * 0.92} fill="none" stroke="#8a785a" stroke-width={(r * 0.03).max(0.8)} />
            <circle r={r * 0.68} fill="none" stroke="#8a785a" stroke-width={(r * 0.025).max(0.8)} opacity="0.8" />
            {beads}
            <circle r={hole} fill="none" stroke="#5a4a32" stroke-width={(r * 0.06).max(1.)} />
            <circle r={hole * 1.25} fill="none" stroke="#fff8e8" stroke-width={(r * 0.02).max(0.6)} opacity="0.6" />
            <path d={boat} fill="#5a4a32" opacity="0.95" />
            <path d={waves} fill="none" stroke="#5a4a32" stroke-width={(2.2 * s).max(0.8)} stroke-linecap="round" />
            {crystals}
        </g>
    )
}

/// A leather purse, its bottom center at the origin, about 120 units tall, with
/// the cut seal in violet wax on its cord.
pub fn purse<'a>(t: f32, seal: f32) -> Svgr<'a> {
    let glow = seal * (0.85 + 0.15 * wave(t, 2., 0.3));
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx="70" ry="12" fill="#000" opacity="0.5" filter="url(#blur8)" />
            <path d="M-56 0 C-74 -40 -60 -86 -26 -100 L-20 -112 L20 -112 L26 -100 C60 -86 74 -40 56 0Z" fill="url(#g-leather)" stroke="#1e1006" stroke-width="3" />
            <path d="M-26 -100 C-10 -94 10 -94 26 -100" fill="none" stroke="#1e1006" stroke-width="3" />
            <path d="M-20 -112 L-28 -128 M-8 -112 L-10 -132 M8 -112 L10 -132 M20 -112 L28 -128" stroke="#5a3a1c" stroke-width="4" stroke-linecap="round" />
            <path d="M-30 -102 C-10 -92 14 -92 32 -104" fill="none" stroke="#c8a060" stroke-width="3" />
            <path d="M32 -104 C44 -96 46 -80 40 -66" fill="none" stroke="#c8a060" stroke-width="3" />
            <path d="M-40 -60 C-30 -50 -20 -46 -6 -44 M10 -30 C26 -30 40 -36 48 -46" fill="none" stroke="#2a1608" stroke-width="2" opacity="0.6" />
            <circle cx="40" cy="-56" r="15" fill="url(#g-wax-seal)" stroke="#2a0412" stroke-width="2" />
            {crate::mesa::cut_seal(40., -56., 11., glow)}
        </g>
    )
}

/// A clay jar, its bottom center at the origin, filled with glowing amber.
pub fn jar<'a>(h: f32, fill: f32, t: f32, seed: u32) -> Svgr<'a> {
    let w = h * 0.62;
    let body = format!(
        "M{:.1} 0 C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} L{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} 0Z",
        -w * 0.36, -w * 0.62, -h * 0.2, -w * 0.6, -h * 0.66, -w * 0.24, -h * 0.84, -w * 0.24, -h, w * 0.24, -h, w * 0.24, -h * 0.84, w * 0.6, -h * 0.66, w * 0.62, -h * 0.2, w * 0.36
    );
    let pulse = 0.85 + 0.15 * wave(t, 1., rnd(seed, 3));
    fframes::svgr!(
        <g>
            <ellipse cx="0" cy="2" rx={w * 0.6} ry={h * 0.06} fill="#000" opacity="0.5" />
            <circle cx="0" cy={-h * 0.9} r={h * 0.5} fill="url(#g-amber-halo)" opacity={0.6 * fill * pulse} />
            <path d={body.clone()} fill="url(#g-clay)" stroke="#1e0e06" stroke-width="2.5" />
            <ellipse cx="0" cy={-h} rx={w * 0.24} ry={h * 0.05} fill="#1e0e06" />
            <ellipse cx="0" cy={-h} rx={w * 0.2} ry={h * 0.035} fill="url(#g-amber)" opacity={fill} />
            <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", -w * 0.2, -h * 0.98, -w * 0.3, -h * 0.9, -w * 0.25, -h * 0.82, -w * 0.32, -h * 0.74)} fill="none" stroke="#ffb43a" stroke-width={h * 0.05} stroke-linecap="round" opacity={fill * 0.9} />
            <path d={format!("M{:.1} {:.1} C{:.1} {:.1} {:.1} {:.1} {:.1} {:.1}", -w * 0.42, -h * 0.6, -w * 0.48, -h * 0.4, -w * 0.4, -h * 0.2, -w * 0.3, -h * 0.08)} fill="none" stroke="#e0a870" stroke-width="2" opacity="0.4" />
        </g>
    )
}

/// A cutter's curved knife, the tip pointing along +x, `len` long.
pub fn knife<'a>(len: f32, shine: f32) -> Svgr<'a> {
    let l = len;
    fframes::svgr!(
        <g>
            <path d={format!("M{:.1} -6 L{:.1} -6 L{:.1} 6 L{:.1} 6Z", -l * 0.4, -l * 0.02, -l * 0.02, -l * 0.4)} fill="#3a2010" stroke="#120804" stroke-width="2" />
            <path d={format!("M0 -7 C{:.1} -14 {:.1} -12 {l:.1} 2 C{:.1} 4 {:.1} 6 0 6Z", l * 0.4, l * 0.8, l * 0.7, l * 0.3)} fill="#a8b4ac" stroke="#2a302c" stroke-width="2" />
            <path d={format!("M4 -4 C{:.1} -10 {:.1} -8 {:.1} 0", l * 0.4, l * 0.75, l * 0.95)} fill="none" stroke="#f4fff8" stroke-width="2" opacity={0.4 + 0.6 * shine} />
        </g>
    )
}

/// A small bird seen from below, wings `flap` -1..1, body at the origin.
pub fn bird(size: f32, flap: f32) -> String {
    let s = size;
    let f = flap * s * 0.7;
    format!(
        "M{:.1} {:.1} Q{:.1} {:.1} 0 0 Q{:.1} {:.1} {:.1} {:.1} Q{:.1} {:.1} 0 {:.1} Q{:.1} {:.1} {:.1} {:.1}Z",
        -s, f, -s * 0.5, f * 0.2 - s * 0.25, s * 0.5, f * 0.2 - s * 0.25, s, f, s * 0.45, s * 0.1, s * 0.2, -s * 0.45, s * 0.1, -s, f
    )
}

/// A flock that bursts out of a point at `at` and then circles; `count` birds.
/// The birds settle into their circles `dur` seconds after `at`, so the hold loops.
pub fn flock<'a>(t: f32, at: f32, from: (f32, f32), toward: (f32, f32), count: u32, seed: u32, size: f32, fill: &'static str, dur: f32) -> Svgr<'a> {
    let dt = t - at;
    if dt <= 0. {
        return Svgr::empty();
    }
    let birds = (0..count)
        .map(|k| {
            let spread = (lerp(-90., 90., rnd(k, seed)), lerp(-60., 60., rnd(k, seed + 1)));
            let speed = lerp(0.75, 1., rnd(k, seed + 2));
            let fly = 1. - (1. - (dt / (dur * speed)).min(1.)).powi(3);
            let x = lerp(from.0, toward.0 + spread.0 * 2., fly) + 30. * wave(t, 1., rnd(k, seed + 3)) * fly;
            let y = lerp(from.1, toward.1 + spread.1 * 2., fly) + 20. * wave(t, 1., rnd(k, seed + 4) + 0.25) * fly;
            let flap = wave(t, 8. + 4. * (rnd(k, seed + 5) * 2.).floor(), rnd(k, seed + 6));
            let s = size * lerp(0.6, 1.1, rnd(k, seed + 7)) * lerp(0.6, 1., fly);
            fframes::svgr!(<path d={bird(s, flap)} transform={format!("translate({x:.1} {y:.1})")} fill={fill} opacity={(dt * 4.).min(1.)} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{birds}</g>)
}

/// Leaves that fall through the frame, once per LOOP, in Thornwood colors.
pub fn falling<'a>(t: f32, alpha: f32, count: u32, seed: u32, size: f32, area: (f32, f32, f32, f32)) -> Svgr<'a> {
    if alpha <= 0. {
        return Svgr::empty();
    }
    let (ax, ay, aw, ah) = area;
    let leaves = (0..count)
        .map(|k| {
            let u = (t / LOOP + rnd(k, seed)).rem_euclid(1.);
            let x = ax + aw * rnd(k, seed + 1) + 50. * (TAU * (u * 2. + rnd(k, seed + 2))).sin();
            let y = lerp(ay - 40., ay + ah + 40., u);
            let spin = 360. * u * if rnd(k, seed + 3) > 0.5 { 1. } else { -1. } + 180. * rnd(k, seed + 4);
            let flip = (TAU * (u * 2. + rnd(k, seed + 5))).cos();
            let s = size * lerp(0.6, 1.2, rnd(k, seed + 6));
            let o = alpha * (PI * u).sin().powf(0.4);
            let fill = LEAF_FILLS[(rnd(k, seed + 7) * 4.) as usize % 4];
            fframes::svgr!(<path d={leaf(s)} transform={format!("translate({x:.1} {y:.1}) rotate({spin:.0}) scale({flip:.2} 1)")} fill={fill} opacity={o} />)
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{leaves}</g>)
}

/// A thorny bramble along a center line: a dark stem with thorns and red
/// leaves that open as it grows; `grow` 0..1.
pub fn bramble<'a>(center: &[(f32, f32)], w0: f32, w1: f32, grow: f32, t: f32, seed: u32) -> Svgr<'a> {
    bramble_in(center, w0, w1, grow, t, seed, false)
}

/// A bramble; `golden` makes it a vine of light.
pub fn bramble_in<'a>(center: &[(f32, f32)], w0: f32, w1: f32, grow: f32, t: f32, seed: u32, golden: bool) -> Svgr<'a> {
    if grow <= 0.001 {
        return Svgr::empty();
    }
    let d = taper(center, w0, w1, grow);
    let n = center.len();
    let thorns = (1..n.saturating_sub(1))
        .step_by(2)
        .filter(|&i| (i as f32) / ((n - 1) as f32) < grow)
        .map(|i| {
            let (x, y) = center[i];
            let b = center[(i + 1).min(n - 1)];
            let a = (b.1 - y).atan2(b.0 - x).to_degrees();
            let side = if (i / 2) % 2 == 0 { -90. } else { 90. };
            let w = lerp(w0, w1, i as f32 / (n - 1) as f32);
            let grow_in = (((grow * (n - 1) as f32) - i as f32) / 2.).clamp(0., 1.);
            fframes::svgr!(<path d={thorn(w * 1.3 * grow_in + 0.1)} transform={format!("translate({x:.1} {y:.1}) rotate({:.0}) translate(0 {:.1})", a + side + 90., -w * 0.3)} fill={if golden { "#e8a83a" } else { "#1a0c06" }} />)
        })
        .collect::<Vec<_>>();
    let leaves = (2..n.saturating_sub(1))
        .step_by(5)
        .filter(|&i| (i as f32) / ((n - 1) as f32) < grow)
        .map(|i| {
            let (x, y) = center[i];
            let open = (((grow * (n - 1) as f32) - i as f32) / 4.).clamp(0., 1.);
            let sway = 8. * wave(t, 1., rnd(i as u32, seed));
            let fill = if rnd(i as u32, seed + 1) > 0.4 { "#d8401c" } else { "#f08a2a" };
            let a = if (i / 5) % 2 == 0 { -40. } else { 140. };
            let s = lerp(w0, w1, i as f32 / (n - 1) as f32) * 2.2 * open;
            fframes::svgr!(<path d={leaf(s.max(0.1))} transform={format!("translate({x:.1} {y:.1}) rotate({:.0})", a + sway)} fill={fill} stroke="#3a0a04" stroke-width="1" opacity={open} />)
        })
        .collect::<Vec<_>>();
    if golden {
        return fframes::svgr!(
            <g>
                <path d={d.clone()} fill="#ffc040" opacity="0.6" filter="url(#blur8u)" />
                {thorns}
                <path d={d.clone()} fill="url(#g-gold-stem)" stroke="#6a4008" stroke-width="1.8" />
                {leaves}
            </g>
        );
    }
    fframes::svgr!(
        <g>
            <path d={d.clone()} fill="#1a0c06" opacity="0.4" transform="translate(4 6)" filter="url(#blur3)" />
            {thorns}
            <path d={d.clone()} fill="url(#g-stem)" stroke="#120804" stroke-width="1.5" />
            {leaves}
        </g>
    )
}

/// Rings of sound from a horn or a voice, starting at `at`, one every `gap` s.
pub fn sound_rings<'a>(x: f32, y: f32, t: f32, at: f32, gap: f32, count: u32, reach: f32, color: &'static str) -> Svgr<'a> {
    let rings = (0..count)
        .filter_map(|k| {
            let dt = t - at - gap * k as f32;
            if !(0.0..1.2).contains(&dt) {
                return None;
            }
            let u = dt / 1.2;
            let r = 20. + reach * (1. - (1. - u).powi(2));
            Some(fframes::svgr!(<circle cx={x} cy={y} r={r} fill="none" stroke={color} stroke-width={2. + 10. * (1. - u)} opacity={0.8 * (1. - u)} />))
        })
        .collect::<Vec<_>>();
    fframes::svgr!(<g>{rings}</g>)
}

/// A name plate whose letters grow along a thorny bramble; `grow` 0..1 runs the
/// bramble and the letters.
pub fn thorn_plate<'a>(frame: &mut Frame, ctx: &FFramesContext<'a, '_>, x: f32, y: f32, name: &'static str, grow: f32, t: f32) -> Svgr<'a> {
    let (glyphs, total) = letters(frame, ctx, name, 62, 4., x);
    let x0 = x - total / 2.;
    let n = glyphs.len() as f32;
    let face = glyphs
        .iter()
        .enumerate()
        .map(|(i, (c, gx, w))| {
            let k = ((grow * (n + 3.) - i as f32) / 3.).clamp(0., 1.);
            let s = bloom(k * 0.6).min(1.2);
            if s < 0.02 || c == " " {
                return Svgr::empty();
            }
            let cx = gx + w / 2.;
            fframes::svgr!(
                <g transform={format!("translate({cx:.1} {y:.1}) scale({s:.3}) translate({:.1} {:.1})", -cx, -y)} opacity={k.min(1.)}>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size="62" fill="#ffb43a" opacity="0.4" filter="url(#blur8)">{c.clone()}</text>
                    <text x={*gx + 3.} y={y + 4.} font-family="Cinzel" font-weight="900" font-size="62" fill="#0a0602" opacity="0.75">{c.clone()}</text>
                    <text x={*gx} y={y} font-family="Cinzel" font-weight="900" font-size="62" fill="url(#g-thorn-title)" stroke="#1a0c04" stroke-width="1.6">{c.clone()}</text>
                </g>
            )
        })
        .collect::<Vec<_>>();
    let pts = (0..=30)
        .map(|k| {
            let u = k as f32 / 30.;
            (x0 - 30. + (total + 60.) * u, y + 24. + 7. * (u * TAU * 2.5).sin() + 2. * wave(t, 1., u))
        })
        .collect::<Vec<_>>();
    fframes::svgr!(
        <g>
            <ellipse cx={x} cy={y - 18.} rx={total * 0.62} ry="70" fill="#0a0602" opacity={0.55 * grow.min(1.)} filter="url(#blur18)" />
            {bramble(&pts, 9., 4., grow, t, 913)}
            {face}
        </g>
    )
}

/// Shared static definitions of the Thornwood scenes.
pub fn defs<'a>() -> Svgr<'a> {
    fframes::svgr!(
        <defs>
            <radialGradient id="g-eye" cx="0.45" cy="0.42" r="0.6">
                <stop offset="0" stop-color="#fffbe0" />
                <stop offset="0.3" stop-color="#ffd860" />
                <stop offset="0.7" stop-color="#f08a14" />
                <stop offset="1" stop-color="#8a3204" />
            </radialGradient>
            <radialGradient id="g-eye-halo">
                <stop offset="0" stop-color="#ffe7a0" stop-opacity="0.9" />
                <stop offset="0.35" stop-color="#ffaa2a" stop-opacity="0.5" />
                <stop offset="1" stop-color="#ff7a10" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="g-brow-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffe2b0" stop-opacity="0.35" />
                <stop offset="0.45" stop-color="#ffd8a0" stop-opacity="0.05" />
                <stop offset="1" stop-color="#1a0a02" stop-opacity="0.7" />
            </linearGradient>
            <linearGradient id="g-nose-shade" x1="0" y1="0" x2="1" y2="0.3">
                <stop offset="0" stop-color="#ffe2b0" stop-opacity="0.35" />
                <stop offset="0.45" stop-color="#ffd8a0" stop-opacity="0" />
                <stop offset="1" stop-color="#1a0a02" stop-opacity="0.75" />
            </linearGradient>
            <radialGradient id="g-moss-mass" cx="0.45" cy="0.2" r="0.9">
                <stop offset="0" stop-color="#4e6a26" />
                <stop offset="0.5" stop-color="#2e4616" />
                <stop offset="1" stop-color="#121e08" />
            </radialGradient>
            <radialGradient id="g-bulge" cx="0.35" cy="0.3" r="0.8">
                <stop offset="0" stop-color="#ffe2b0" stop-opacity="0.35" />
                <stop offset="0.5" stop-color="#ffd8a0" stop-opacity="0" />
                <stop offset="0.85" stop-color="#1a0a02" stop-opacity="0.55" />
                <stop offset="1" stop-color="#1a0a02" stop-opacity="0.85" />
            </radialGradient>
            <linearGradient id="g-brow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#b48a58" />
                <stop offset="0.45" stop-color="#7a5430" />
                <stop offset="1" stop-color="#2e1a0a" />
            </linearGradient>
            <linearGradient id="g-nose" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#c49a64" />
                <stop offset="0.5" stop-color="#8a6036" />
                <stop offset="1" stop-color="#3a2210" />
            </linearGradient>
            <linearGradient id="g-moss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3e5a1e" />
                <stop offset="0.6" stop-color="#6e8a34" />
                <stop offset="1" stop-color="#a8b860" />
            </linearGradient>
            <linearGradient id="g-moss-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1e2e0e" />
                <stop offset="0.7" stop-color="#3e5a22" />
                <stop offset="1" stop-color="#6a7a3a" />
            </linearGradient>
            <linearGradient id="g-leaf-red" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#8a1e08" />
                <stop offset="1" stop-color="#f0622a" />
            </linearGradient>
            <linearGradient id="g-leaf-orange" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#a8460e" />
                <stop offset="1" stop-color="#ffb04a" />
            </linearGradient>
            <linearGradient id="g-leaf-green" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#1e4a14" />
                <stop offset="1" stop-color="#8ac04a" />
            </linearGradient>
            <linearGradient id="g-leaf-deep" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#0e2a0c" />
                <stop offset="1" stop-color="#4a7a2a" />
            </linearGradient>
            <radialGradient id="g-face-light" cx="0.28" cy="0.18" r="0.9">
                <stop offset="0" stop-color="#ffd890" stop-opacity="0.45" />
                <stop offset="0.5" stop-color="#ff9a3a" stop-opacity="0.08" />
                <stop offset="1" stop-color="#000" stop-opacity="0.55" />
            </radialGradient>
            <radialGradient id="g-witch">
                <stop offset="0" stop-color="#e8fff0" stop-opacity="0.9" />
                <stop offset="0.3" stop-color="#5aff8a" stop-opacity="0.45" />
                <stop offset="1" stop-color="#0a8a3a" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="g-bone" cx="0.38" cy="0.32" r="0.8">
                <stop offset="0" stop-color="#fffaee" />
                <stop offset="0.45" stop-color="#e8dcc0" />
                <stop offset="1" stop-color="#a8987a" />
            </radialGradient>
            <linearGradient id="g-bone-edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#6a5a40" />
                <stop offset="0.5" stop-color="#b8a888" />
                <stop offset="1" stop-color="#5a4a32" />
            </linearGradient>
            <linearGradient id="g-leather" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#9a6a3a" />
                <stop offset="0.5" stop-color="#6a4220" />
                <stop offset="1" stop-color="#2e1a0a" />
            </linearGradient>
            <linearGradient id="g-clay" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#4a2a16" />
                <stop offset="0.4" stop-color="#9a6a42" />
                <stop offset="1" stop-color="#3a2010" />
            </linearGradient>
            <linearGradient id="g-stem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#6a3a1a" />
                <stop offset="0.5" stop-color="#3a1e0c" />
                <stop offset="1" stop-color="#1a0c04" />
            </linearGradient>
            <linearGradient id="g-gold-stem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fffbe0" />
                <stop offset="0.5" stop-color="#f6c850" />
                <stop offset="1" stop-color="#b8781a" />
            </linearGradient>
            <linearGradient id="g-thorn-title" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fffbe2" />
                <stop offset="0.45" stop-color="#f2c45a" />
                <stop offset="1" stop-color="#8a5a14" />
            </linearGradient>
            <linearGradient id="g-moon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#1a2a4a" />
                <stop offset="1" stop-color="#060a14" />
            </linearGradient>
            <linearGradient id="g-sun-left" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#ffe2a0" stop-opacity="0.55" />
                <stop offset="0.5" stop-color="#ffb860" stop-opacity="0.08" />
                <stop offset="1" stop-color="#ffb860" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="g-frost">
                <stop offset="0" stop-color="#f4fbff" stop-opacity="0.85" />
                <stop offset="0.4" stop-color="#a8d8ff" stop-opacity="0.35" />
                <stop offset="1" stop-color="#4a8ad8" stop-opacity="0" />
            </radialGradient>
        </defs>
    )
}
