use crate::types::Body;

/// Total energy = kinetic + potential (G=1).
pub fn total_energy(bodies: &[Body]) -> f64 {
    let n = bodies.len();
    // Kinetic
    let mut ke = 0.0;
    for b in bodies {
        let v2 = b.v[0] * b.v[0] + b.v[1] * b.v[1] + b.v[2] * b.v[2];
        ke += 0.5 * b.m * v2;
    }
    // Potential
    let mut pe = 0.0;
    for i in 0..n {
        for j in (i + 1)..n {
            let rij = sub(bodies[j].r, bodies[i].r);
            let r = (rij[0] * rij[0] + rij[1] * rij[1] + rij[2] * rij[2]).sqrt();
            pe += -bodies[i].m * bodies[j].m / r;
        }
    }
    ke + pe
}

#[inline]
pub fn add(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

#[inline]
pub fn sub(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

#[inline]
pub fn smul(s: f64, a: [f64; 3]) -> [f64; 3] {
    [s * a[0], s * a[1], s * a[2]]
}


/// Compute accelerations a_i = Σ_{j≠i} m_j r_ij / |r_ij|^3  (G = 1)
/// Optional Plummer softening via eps2 to avoid singularities in close encounters.
pub fn accelerations(positions: &[[f64; 3]], masses: &[f64], eps2: f64) -> Vec<[f64; 3]> {
    let n = positions.len();
    let mut a = vec![[0.0; 3]; n];

    for i in 0..n {
        let pi = positions[i];
        let mut ai = [0.0; 3];
        for j in 0..n {
            if i == j {
                continue;
            }
            let rij = sub(positions[j], pi);
            let r2 = rij[0] * rij[0] + rij[1] * rij[1] + rij[2] * rij[2] + eps2;
            let r = r2.sqrt();
            let r3 = r2 * r;
            // G = 1, so a_i += m_j * r_ij / |r_ij|^3
            ai = add(ai, smul(masses[j] / r3, rij));
        }
        a[i] = ai;
    }
    a
}
