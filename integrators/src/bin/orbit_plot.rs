use std::{fs, path::PathBuf};

use clap::Parser;
use serde::Deserialize;
use three_body::{self, Body};

#[derive(Parser, Debug)]
#[command(name = "orbit-plot", about = "Evolve and plot a 3-body orbit to PNG.")]
struct Args {
    /// Path to the TOML config
    #[arg(short, long, value_name = "FILE")]
    config: PathBuf,
}

#[derive(Deserialize, Debug)]
struct BodyCfg {
    r: [f64; 3],
    v: [f64; 3],
    mass: f64,
}

#[derive(Deserialize, Debug)]
struct Cfg {
    method: String,
    period: f64,
    #[serde(default = "default_output")]
    output: String,
    #[serde(default = "default_width")]
    width: u32,
    #[serde(default = "default_height")]
    height: u32,
    #[serde(default)]
    body: Vec<BodyCfg>,
}

fn default_output() -> String {
    "orbit.png".to_string()
}

fn default_width() -> u32 {
    1200
}

fn default_height() -> u32 {
    900
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let toml_str = fs::read_to_string(&args.config)?;
    let cfg: Cfg = toml::from_str(&toml_str)?;

    let mut bodies = build_ic(&cfg);

    let (series, t_end) = match cfg.method.as_str() {
        "dop853" => three_body::evolve_dop853(&mut bodies, cfg.period),
        "rk4" => three_body::evolve_rk4(&mut bodies, cfg.period),
        "verlet" => three_body::evolve_verlet(&mut bodies, cfg.period),
        "feagin14" => three_body::evolve_feagin14(&mut bodies, cfg.period),
        _ => {
            eprintln!("Unknown method: {}", cfg.method);
            std::process::exit(1);
        }
    };

    let paths = reshape_paths(&series);

    let (min_x, max_x, min_y, max_y) = bounds_with_aspect(&paths, cfg.width, cfg.height);
    render_png(
        &paths,
        (min_x, max_x, min_y, max_y),
        &cfg.output,
        cfg.width,
        cfg.height,
    )?;

    println!("Done: {}", cfg.output);
    Ok(())
}

fn build_ic(cfg: &Cfg) -> Vec<Body> {
    let mut v = Vec::with_capacity(3);
    for b in &cfg.body {
        let body = Body {
            m: b.mass,
            r: b.r,
            v: b.v,
        };
        v.push(body);
    }
    v
}

/// Reshape the flat evolution buffer into per-body polylines.
/// Input length must be steps * 10 (3 bodies × (x,y,z)  and time).
fn reshape_paths(series: &[f64]) -> [Vec<(f64, f64)>; 3] {
    let frame_len = 10; // 3 bodies × (x,y,z)  and time = 10
    assert!(series.len() % frame_len == 0);
    let steps = series.len() / frame_len;
    let mut p1 = Vec::with_capacity(steps);
    let mut p2 = Vec::with_capacity(steps);
    let mut p3 = Vec::with_capacity(steps);

    for k in 0..steps {
        let base = k * frame_len;
        p1.push((series[base], series[base + 1]));
        p2.push((series[base + 3], series[base + 4]));
        p3.push((series[base + 6], series[base + 7]));
    }
    [p1, p2, p3]
}

fn bounds_with_aspect(
    paths: &[Vec<(f64, f64)>; 3],
    width: u32,
    height: u32,
) -> (f64, f64, f64, f64) {
    let mut min_x = f64::INFINITY;
    let mut max_x = f64::NEG_INFINITY;
    let mut min_y = f64::INFINITY;
    let mut max_y = f64::NEG_INFINITY;

    for p in paths {
        for &(x, y) in p {
            if x < min_x {
                min_x = x;
            }
            if x > max_x {
                max_x = x;
            }
            if y < min_y {
                min_y = y;
            }
            if y > max_y {
                max_y = y;
            }
        }
    }

    // small padding
    let pad = 0.05;
    let mut dx = (max_x - min_x).max(1e-12);
    let mut dy = (max_y - min_y).max(1e-12);

    // enforce data aspect = pixel aspect
    let pixel_aspect = (width as f64) / (height as f64);
    let data_aspect = dx / dy;

    let (cx, cy) = ((min_x + max_x) * 0.5, (min_y + max_y) * 0.5);

    if data_aspect < pixel_aspect {
        // data too “tall”: widen x to match
        dx = dy * pixel_aspect;
    } else {
        // data too “wide”: enlarge y to match
        dy = dx / pixel_aspect;
    }

    let hx = 0.5 * dx * (1.0 + 2.0 * pad);
    let hy = 0.5 * dy * (1.0 + 2.0 * pad);
    (cx - hx, cx + hx, cy - hy, cy + hy)
}

fn render_png(
    paths: &[Vec<(f64, f64)>; 3],
    bbox: (f64, f64, f64, f64),
    out: &str,
    width: u32,
    height: u32,
) -> anyhow::Result<()> {
    use plotters::prelude::*;
    let root = BitMapBackend::new(out, (width, height)).into_drawing_area();
    root.fill(&WHITE)?;

    let (min_x, max_x, min_y, max_y) = bbox;
    let mut chart = ChartBuilder::on(&root)
        .margin(20)
        .caption("Three-Body Orbit", ("sans-serif", 24))
        .set_label_area_size(LabelAreaPosition::Left, 40)
        .set_label_area_size(LabelAreaPosition::Bottom, 40)
        .build_cartesian_2d(min_x..max_x, min_y..max_y)?;

    chart
        .configure_mesh()
        .x_labels(10)
        .y_labels(10)
        .x_label_formatter(&|v| format!("{:.2}", v))
        .y_label_formatter(&|v| format!("{:.2}", v))
        .draw()?;

    let colors = [RED.mix(0.9), BLUE.mix(0.9), BLACK.mix(0.9)];
    for (i, poly) in paths.iter().enumerate() {
        chart
            .draw_series(LineSeries::new(poly.clone(), &colors[i]))?
            .label(format!("Body {}", i + 1))
            .legend(move |(x, y)| PathElement::new(vec![(x, y), (x + 20, y)], &colors[i]));
    }
    // after draw_series for the lines
    for (i, poly) in paths.iter().enumerate() {
        if let Some(&(x0, y0)) = poly.first() {
            chart.draw_series(std::iter::once(Circle::new(
                (x0, y0),
                /*radius px*/ 4,
                colors[i].filled(),
            )))?;
        }
    }
    chart
        .configure_series_labels()
        .border_style(&BLACK.mix(0.3))
        .background_style(&WHITE.mix(0.8))
        .draw()?;

    root.present()?;
    Ok(())
}
