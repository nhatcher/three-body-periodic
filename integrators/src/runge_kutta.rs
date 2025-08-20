// Runge–Kutta 4 for 3-body gravity with G = 1 (can handle N bodies too).

use crate::{
    types::Body,
    utils::{accelerations, add, smul},
};

/// Advance the system by one RK4 step of size `dt`.
fn step_rk4(bodies: &mut [Body], dt: f64, eps2: f64) {
    let n = bodies.len();

    // Stage 1 (k1)
    let r0: Vec<[f64; 3]> = bodies.iter().map(|b| b.r).collect();
    let v0: Vec<[f64; 3]> = bodies.iter().map(|b| b.v).collect();
    let m: Vec<f64> = bodies.iter().map(|b| b.m).collect();
    let a0 = accelerations(&r0, &m, eps2);

    // Stage 2 (k2) @ t + dt/2
    let r_half: Vec<[f64; 3]> = (0..n).map(|i| add(r0[i], smul(0.5 * dt, v0[i]))).collect();
    let v_half1: Vec<[f64; 3]> = (0..n).map(|i| add(v0[i], smul(0.5 * dt, a0[i]))).collect();
    let a_half1 = accelerations(&r_half, &m, eps2);

    // Stage 3 (k3) @ t + dt/2
    let r_half2: Vec<[f64; 3]> = (0..n)
        .map(|i| add(r0[i], smul(0.5 * dt, v_half1[i])))
        .collect();
    let v_half2: Vec<[f64; 3]> = (0..n)
        .map(|i| add(v0[i], smul(0.5 * dt, a_half1[i])))
        .collect();
    let a_half2 = accelerations(&r_half2, &m, eps2);

    // Stage 4 (k4) @ t + dt
    let r_end: Vec<[f64; 3]> = (0..n).map(|i| add(r0[i], smul(dt, v_half2[i]))).collect();
    let v_end: Vec<[f64; 3]> = (0..n).map(|i| add(v0[i], smul(dt, a_half2[i]))).collect();
    let a_end = accelerations(&r_end, &m, eps2);

    // Combine increments
    for i in 0..n {
        // r_{n+1} = r_n + dt/6 * (v0 + 2*v_half1 + 2*v_half2 + v_end)
        let dr = smul(
            dt / 6.0,
            add(
                add(v0[i], smul(2.0, v_half1[i])),
                add(smul(2.0, v_half2[i]), v_end[i]),
            ),
        );
        // v_{n+1} = v_n + dt/6 * (a0 + 2*a_half1 + 2*a_half2 + a_end)
        let dv = smul(
            dt / 6.0,
            add(
                add(a0[i], smul(2.0, a_half1[i])),
                add(smul(2.0, a_half2[i]), a_end[i]),
            ),
        );

        bodies[i].r = add(bodies[i].r, dr);
        bodies[i].v = add(bodies[i].v, dv);
    }
}

/// Evolve from t=0 to t=t_end with fixed time step dt.
/// Returns the final time actually reached.
pub fn evolve(bodies: &mut [Body], t_end: f64) -> (Vec<f64>, f64) {
    let dt = 1e-5;
    // softening^2; set 0.0 to disable
    let eps2 = 1e-8;
    let mut t = 0.0;
    let mut result = Vec::new();
    while t < t_end {
        let h = if t + dt > t_end { t_end - t } else { dt };
        result.append(&mut bodies[0].r.to_vec());
        result.append(&mut bodies[1].r.to_vec());
        result.append(&mut bodies[2].r.to_vec());
        step_rk4(bodies, h, eps2);
        t += h;
    }
    (result, t)
}
