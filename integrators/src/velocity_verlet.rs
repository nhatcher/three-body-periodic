// Velocity–Verlet (kick–drift–kick) for N-body gravity with G = 1.

use crate::{
    types::Body,
    utils::{accelerations, add, smul},
};

/// One velocity–Verlet step (KDK):
/// v(t+dt/2) = v(t) + (dt/2) a(r(t))
/// r(t+dt)   = r(t) + dt * v(t+dt/2)
/// v(t+dt)   = v(t+dt/2) + (dt/2) a(r(t+dt))
fn step_velocity_verlet(bodies: &mut [Body], dt: f64, eps2: f64) {
    let m: Vec<f64> = bodies.iter().map(|b| b.m).collect();

    // a(t)
    let r0: Vec<[f64; 3]> = bodies.iter().map(|b| b.r).collect();
    let a0 = accelerations(&r0, &m, eps2);

    // Kick (half)
    for (body, a) in bodies.iter_mut().zip(a0.iter()) {
        body.v = add(body.v, smul(0.5 * dt, *a));
    }

    // Drift
    for body in bodies.iter_mut() {
        body.r = add(body.r, smul(dt, body.v));
    }

    // a(t+dt)
    let r1: Vec<[f64; 3]> = bodies.iter().map(|b| b.r).collect();
    let a1 = accelerations(&r1, &m, eps2);

    // Kick (half)
    for (body, a) in bodies.iter_mut().zip(a1.iter()) {
        body.v = add(body.v, smul(0.5 * dt, *a));
    }
}


// put near your verlet code
fn step_sym4(bodies: &mut [Body], h: f64, eps2: f64) {
    // Yoshida 4th-order coefficients
    const CBR2: f64 = 1.259_921_049_894_873_2;           // 2^(1/3)
    const DEN:  f64 = 2.0 - CBR2;
    const W1:   f64 = 1.0 / DEN;                         // ≈ 1.3512071919596578
    const W2:   f64 = -CBR2 / DEN;                       // ≈ -1.7024143839193153
    step_velocity_verlet(bodies, W1 * h, eps2);
    step_velocity_verlet(bodies, W2 * h, eps2);
    step_velocity_verlet(bodies, W1 * h, eps2);
}

/// Integrate from t=0 to t=t_end with fixed step dt.
/// (If t_end is not a multiple of dt, the final short step breaks strict symplecticness;
/// either choose t_end = k*dt, or accept that tiny final deviation.)
pub fn evolve(bodies: &mut [Body], t_end: f64) -> (Vec<f64>, f64) {
    let dt = 1e-5;
    let eps2 = 0.0; // 1e-8;
    let mut t = 0.0;
    let mut result = Vec::new();
    // Do whole steps
    let steps = (t_end / dt).floor() as usize;
    for _ in 0..steps {
        result.append(&mut bodies[0].r.to_vec());
        result.append(&mut bodies[1].r.to_vec());
        result.append(&mut bodies[2].r.to_vec());
        step_sym4(bodies, dt, eps2);
        t += dt;
    }
    // Optional final partial step
    let rem = t_end - t;
    if rem > 0.0 {
        step_sym4(bodies, rem, eps2);
        t = t_end;
    }
    (result, t)
}
