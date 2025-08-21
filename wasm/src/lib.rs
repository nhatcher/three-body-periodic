use wasm_bindgen::prelude::*;

use three_body::{evolve_rk4, evolve_verlet, evolve_dop853, Body};

#[wasm_bindgen]
pub fn evolve(data: &[f64], t: f64, method: &str) -> Result<Vec<f64>, String> {
    if data.len() != 21 {
        return Err("Data must contain exactly 21 elements".to_string());
    }
    let mut bodies = vec![
        Body {
            r: [data[0], data[1], data[2]],
            v: [data[3], data[4], data[5]],
            m: data[6],
        },
        Body {
            r: [data[7], data[8], data[9]],
            v: [data[10], data[11], data[12]],
            m: data[13],
        },
        Body {
            r: [data[14], data[15], data[16]],
            v: [data[17], data[18], data[19]],
            m: data[20],
        },
    ];

    let r = match method {
        "rk4" => evolve_rk4(&mut bodies, t),
        "verlet" => evolve_verlet(&mut bodies, t),
        "dop853" => evolve_dop853(&mut bodies, t),
        _ => return Err(format!("Unknown method: {}", method)),
    };
    Ok(r.0)
}

#[wasm_bindgen]
pub fn total_energy(data: &[f64]) -> Result<f64, String> {
    if data.len() != 21 {
        return Err("Data must contain exactly 21 elements".to_string());
    }
    let bodies = vec![
        Body {
            r: [data[0], data[1], data[2]],
            v: [data[3], data[4], data[5]],
            m: data[6],
        },
        Body {
            r: [data[7], data[8], data[9]],
            v: [data[10], data[11], data[12]],
            m: data[13],
        },
        Body {
            r: [data[14], data[15], data[16]],
            v: [data[17], data[18], data[19]],
            m: data[20],
        },
    ];
    Ok(three_body::total_energy(&bodies))
}

#[wasm_bindgen]
pub fn total_angular_momentum(data: &[f64]) -> Result<Vec<f64>, String> {
    if data.len() != 21 {
        return Err("Data must contain exactly 21 elements".to_string());
    }
    let bodies = vec![
        Body {
            r: [data[0], data[1], data[2]],
            v: [data[3], data[4], data[5]],
            m: data[6],
        },
        Body {
            r: [data[7], data[8], data[9]],
            v: [data[10], data[11], data[12]],
            m: data[13],
        },
        Body {
            r: [data[14], data[15], data[16]],
            v: [data[17], data[18], data[19]],
            m: data[20],
        },
    ];
    Ok(three_body::total_angular_momentum(&bodies).to_vec())
}
