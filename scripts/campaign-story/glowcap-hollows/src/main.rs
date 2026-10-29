use fframes::{EncoderOptions, MediaDirectory, RenderOptions, cli, cli::clap};
use fframes_skia_renderer::{SkiaFFramesRenderer, SkiaPipelineConfig, metal::SkiaMetalCtx};
use glowcap_hollows_story::{GlowcapHollowsStoryVideo, HEIGHT, WIDTH};
use std::{path::PathBuf, process::ExitCode};

#[derive(Debug, clap::Args)]
struct VideoArgs {
    /// Add the exact localized storyboard text to review output only.
    #[arg(long, value_parser=["en-us","id-id"], global=true)]
    locale: Option<String>,
    /// Add the separately delivered audio to the reference mix.
    #[arg(long, global = true)]
    review_audio: bool,
}

fn run() -> Result<ExitCode, Box<dyn std::error::Error>> {
    let args = cli::parse::<VideoArgs>();
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()?;
    let raw = root.join("apps/web/art/campaign/raw/glowcap-hollows/story");
    let folder = MediaDirectory::read_folder(raw.join("prepared"))?;
    let media = folder.process_media_source()?;
    let locale = args
        .app
        .locale
        .as_deref()
        .map(|l| usize::from(l == "id-id"));
    let video = GlowcapHollowsStoryVideo::new(locale, args.app.review_audio);
    let gpu = SkiaMetalCtx::new(WIDTH, HEIGHT)?;
    let temp = root.join("out/story-scenes/render-tmp");
    std::fs::create_dir_all(&temp)?;
    Ok(cli::new(
        &video,
        RenderOptions {
            media: Some(&media),
            default_font: "Lato",
            tmp_files_directory: Some(&temp),
            video_encoder_options: EncoderOptions {
                preferred_encoder: Some("libx264"),
                codec_params: Some(&[("crf", "24"), ("preset", "slow")]),
                ..Default::default()
            },
            ..Default::default()
        },
    )
    .args(args)
    .backend(SkiaFFramesRenderer::new_metal(
        &gpu,
        SkiaPipelineConfig::default(),
    )?)
    .preview(fframes_native_player::cli_preview)
    .run())
}

fn main() -> ExitCode {
    match run() {
        Ok(code) => code,
        Err(error) => {
            eprintln!("Glowcap Hollows: {error}");
            ExitCode::FAILURE
        }
    }
}
