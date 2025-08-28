use bigdecimal::BigDecimal as BD;
use bigdecimal::num_traits::{FromPrimitive, One, Signed, ToPrimitive, Zero};
use once_cell::sync::Lazy;
use std::str::FromStr;

use crate::{
    feagin14::coef::{B_STR, C_STR},
    types::Body,
};

// ---------- helpers to build BD constants ----------
fn bd(s: &str) -> BD {
    BD::from_str(s).expect("bad decimal")
}

static C_BD: Lazy<Vec<BD>> = Lazy::new(|| C_STR.iter().map(|s| bd(s)).collect());

static B_BD: Lazy<Vec<Vec<BD>>> = Lazy::new(|| {
    B_STR
        .iter()
        .map(|row| row.iter().map(|s| bd(s)).collect())
        .collect()
});

// Error estimator indices (1/1000) * h * (k[1] - k[33])  [1-based in file]
const ERR_I1: usize = 1;
const ERR_I2: usize = 33;
const ERR_SCALE_F64: f64 = 1.0 / 1000.0;
static ERR_SCALE: Lazy<BD> = Lazy::new(|| bd("0.001"));

// Working scale for BigDecimal (digits after decimal). Tune as you like.
const BD_SCALE: i64 = 60;

// ---------- pack/unpack as BigDecimal ----------
fn pack_state_bd(bodies: &[Body]) -> Vec<BD> {
    let n = bodies.len();
    let mut y = Vec::with_capacity(6 * n);
    for b in bodies {
        y.push(BD::from_f64(b.r[0]).unwrap());
        y.push(BD::from_f64(b.r[1]).unwrap());
        y.push(BD::from_f64(b.r[2]).unwrap());
        y.push(BD::from_f64(b.v[0]).unwrap());
        y.push(BD::from_f64(b.v[1]).unwrap());
        y.push(BD::from_f64(b.v[2]).unwrap());
    }
    y
}

fn unpack_state_bd(y: &[BD], bodies: &mut [Body]) {
    for (i, b) in bodies.iter_mut().enumerate() {
        let o = 6 * i;
        b.r = [
            y[o].to_f64().unwrap(),
            y[o + 1].to_f64().unwrap(),
            y[o + 2].to_f64().unwrap(),
        ];
        b.v = [
            y[o + 3].to_f64().unwrap(),
            y[o + 4].to_f64().unwrap(),
            y[o + 5].to_f64().unwrap(),
        ];
    }
}

// ---------- BigDecimal math helpers ----------
#[inline]
fn with_scale(x: BD) -> BD {
    x.with_scale(BD_SCALE)
}

#[inline]
fn saxpy_into_bd(out: &mut [BD], a: &BD, x: &[BD]) {
    for (o, xi) in out.iter_mut().zip(x.iter()) {
        *o = with_scale(o.clone() + with_scale(a.clone() * xi.clone()));
    }
}

// Newton sqrt with fixed scale
fn sqrt_bd(x: &BD) -> BD {
    // assert!(x.sign() != bigdecimal::num_traits::sign::Sign::Minus, "sqrt of negative");
    if x.is_zero() {
        return BD::zero();
    }
    // Start from f64 sqrt for speed
    let mut y = BD::from_f64(x.to_f64().unwrap().sqrt())
        .unwrap()
        .with_scale(BD_SCALE);
    let two = BD::from(2u32);
    // iterate
    for _ in 0..(BD_SCALE as usize + 10) {
        let y_next = with_scale((y.clone() + with_scale(x.clone() / y.clone())) / two.clone());
        if with_scale((y_next.clone() - y.clone()).abs()) <= bd(&format!("1e-{}", BD_SCALE)) {
            return y_next;
        }
        y = y_next;
    }
    y
}

// Weighted RMS error norm (returns f64 for the step controller)
fn error_norm_bd(err: &[BD], y: &[BD], y_new: &[BD], rtol: f64, atol: f64) -> f64 {
    let mut accum = BD::zero();
    let n = err.len();
    for i in 0..n {
        let yi = y[i].to_f64().unwrap().abs();
        let yni = y_new[i].to_f64().unwrap().abs();
        let sc = atol + rtol * yi.max(yni);
        if sc == 0.0 {
            continue;
        }
        let e = err[i].to_f64().unwrap() / sc;
        accum = with_scale(accum + BD::from_f64(e * e).unwrap());
    }
    let mean = accum.to_f64().unwrap() / (n as f64);
    mean.sqrt()
}

// ---------- BigDecimal N-body derivative ----------
fn deriv_bd(y: &[BD], masses: &[BD], eps2: &BD) -> Vec<BD> {
    let n = masses.len();
    let mut r = vec![[BD::zero(), BD::zero(), BD::zero()]; n];
    let mut v = vec![[BD::zero(), BD::zero(), BD::zero()]; n];
    for i in 0..n {
        let o = 6 * i;
        r[i][0] = y[o].clone();
        r[i][1] = y[o + 1].clone();
        r[i][2] = y[o + 2].clone();
        v[i][0] = y[o + 3].clone();
        v[i][1] = y[o + 4].clone();
        v[i][2] = y[o + 5].clone();
    }

    // accelerations
    let mut a = vec![[BD::zero(), BD::zero(), BD::zero()]; n];
    for i in 0..n {
        for j in 0..n {
            if i == j {
                continue;
            }
            let dx = with_scale(r[j][0].clone() - r[i][0].clone());
            let dy = with_scale(r[j][1].clone() - r[i][1].clone());
            let dz = with_scale(r[j][2].clone() - r[i][2].clone());
            let r2 = with_scale(
                with_scale(dx.clone() * dx.clone())
                    + with_scale(dy.clone() * dy.clone())
                    + with_scale(dz.clone() * dz.clone())
                    + eps2.clone(),
            );
            if r2.is_zero() {
                continue;
            }
            let r = sqrt_bd(&r2);
            let r3 = with_scale(r.clone() * r2.clone());
            if r3.is_zero() {
                continue;
            }
            let inv_r3 = with_scale(BD::one() / r3);
            let s = with_scale(masses[j].clone() * inv_r3);
            a[i][0] = with_scale(a[i][0].clone() + with_scale(s.clone() * dx));
            a[i][1] = with_scale(a[i][1].clone() + with_scale(s.clone() * dy));
            a[i][2] = with_scale(a[i][2].clone() + with_scale(s.clone() * dz));
        }
    }

    // dy/dt = [v, a]
    let mut dy = vec![BD::zero(); 6 * n];
    for i in 0..n {
        let o = 6 * i;
        dy[o] = v[i][0].clone();
        dy[o + 1] = v[i][1].clone();
        dy[o + 2] = v[i][2].clone();
        dy[o + 3] = a[i][0].clone();
        dy[o + 4] = a[i][1].clone();
        dy[o + 5] = a[i][2].clone();
    }
    dy
}

// ---------- One trial step (BigDecimal everything) ----------
fn erk_trial_bd(
    y: &[BD],
    h: f64,
    masses: &[BD],
    eps2: &BD,
    rtol: f64,
    atol: f64,
) -> (Vec<BD>, f64) {
    let n = y.len();
    let s = B_BD.len(); // 35
    let mut k: Vec<Vec<BD>> = (0..s).map(|_| vec![BD::zero(); n]).collect();

    // k0
    k[0] = deriv_bd(y, masses, eps2);

    let h_bd = BD::from_f64(h).unwrap();

    // stages i = 1..s-1
    for i in 1..s {
        let mut ytmp = y.to_vec();
        for (j, aij) in B_BD[i].iter().enumerate() {
            if !aij.is_zero() {
                let coeff = with_scale(h_bd.clone() * aij.clone());
                saxpy_into_bd(&mut ytmp, &coeff, &k[j]);
            }
        }
        k[i] = deriv_bd(&ytmp, masses, eps2);
    }

    // high-order solution
    let mut y_hi = y.to_vec();
    for i in 0..s {
        let bi = &C_BD[i];
        if !bi.is_zero() {
            let coeff = with_scale(h_bd.clone() * bi.clone());
            saxpy_into_bd(&mut y_hi, &coeff, &k[i]);
        }
    }

    // error vector via stage-difference
    let mut errv = vec![BD::zero(); n];
    for m in 0..n {
        errv[m] = with_scale(
            ERR_SCALE.clone()
                * with_scale(
                    h_bd.clone() * with_scale(k[ERR_I1][m].clone() - k[ERR_I2][m].clone()),
                ),
        );
    }

    let errn = error_norm_bd(&errv, y, &y_hi, rtol, atol);
    (y_hi, errn)
}

// ---------- Public evolve (same API) ----------
pub fn evolve(bodies: &mut [Body], t_end: f64) -> (Vec<f64>, f64) {
    let n_b = bodies.len();
    let masses_bd: Vec<BD> = bodies.iter().map(|b| BD::from_f64(b.m).unwrap()).collect();

    // tolerances & controller
    const RTOL: f64 = 1e-15;
    const ATOL: f64 = 1e-15;
    const SAFETY: f64 = 0.9;
    const FAC_MIN: f64 = 0.2;
    const FAC_MAX: f64 = 5.0;
    const P: f64 = 14.0;
    const INV_EXP: f64 = 1.0 / (P + 1.0); // 1/15

    let eps2_bd = BD::zero(); // or bd("1e-16") etc for softening

    let mut y = pack_state_bd(bodies);
    let mut t = 0.0;

    // initial h
    let dir = if t_end >= 0.0 { 1.0 } else { -1.0 };
    let mut h = (t_end - t).abs().max(1e-16) * 1e-3 * dir;

    let mut result = Vec::<f64>::new();
    let max_steps = 10_000_000usize;
    let mut steps = 0usize;

    while (t - t_end).abs() > 0.0 && steps < max_steps {
        // record
        for i in 0..n_b {
            let o = 6 * i;
            result.push(y[o].to_f64().unwrap());
            result.push(y[o + 1].to_f64().unwrap());
            result.push(y[o + 2].to_f64().unwrap());
        }
        result.push(t);

        // clamp final step if needed
        if (t_end - t).abs() <= 0.5 * h.abs() || ((t + h - t_end) * dir) > 0.0 {
            h = t_end - t;
        }

        let (y_trial, errn) = erk_trial_bd(&y, h, &masses_bd, &eps2_bd, RTOL, ATOL);

        if errn <= 1.0 || ((t - t_end) * dir) >= 0.0 {
            // accept
            y = y_trial;
            t += h;
            let fac = if errn == 0.0 {
                FAC_MAX
            } else {
                SAFETY * errn.powf(-INV_EXP)
            };
            h *= fac.clamp(FAC_MIN, FAC_MAX);
        } else {
            // reject
            let fac = SAFETY * errn.powf(-INV_EXP);
            h *= fac.clamp(0.1, 0.5);
            continue;
        }

        steps += 1;
        if h.abs() < 1e-18 {
            break;
        }
        if ((t - t_end) * dir) > 0.0 {
            h = t_end - t;
        }
    }

    unpack_state_bd(&y, bodies);
    (result, t)
}
