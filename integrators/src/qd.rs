// src/qd.rs
#![allow(clippy::needless_range_loop)]
#![allow(clippy::excessive_precision)]

use core::cmp::Ordering;

#[inline]
fn two_sum(a: f64, b: f64) -> (f64, f64) {
    let s = a + b;
    let bb = s - a;
    let e = (a - (s - bb)) + (b - bb);
    (s, e)
}
#[inline]
fn fast_two_sum(a: f64, b: f64) -> (f64, f64) {
    let s = a + b;
    let e = b - (s - a);
    (s, e)
}
#[inline]
fn split(a: f64) -> (f64, f64) {
    const C: f64 = 134_217_729.0; // 2^27 + 1
    let t = C * a;
    let hi = t - (t - a);
    let lo = a - hi;
    (hi, lo)
}
#[inline]
fn two_prod(a: f64, b: f64) -> (f64, f64) {
    let p = a * b;
    let (a_hi, a_lo) = split(a);
    let (b_hi, b_lo) = split(b);
    let e = ((a_hi * b_hi - p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
    (p, e)
}

/// Grow an expansion `e` by a scalar `b`.
fn grow_expansion(e: &[f64], b: f64) -> Vec<f64> {
    let mut q = b;
    let mut h: Vec<f64> = Vec::with_capacity(e.len() + 1);
    for &ei in e {
        let (s, r) = two_sum(q, ei);
        if r != 0.0 {
            h.push(r);
        }
        q = s;
    }
    h.push(q);
    h
}

/// Compress an arbitrary list of partials into at most N non-overlapping components (largest first).
fn compress_to_n(mut v: Vec<f64>, n: usize) -> [f64; 4] {
    v.retain(|x| *x != 0.0);
    if v.is_empty() {
        return [0.0; 4];
    }
    // Smallest first so fast_two_sum precondition (|a| >= |b|) holds when we sweep back.
    v.sort_by(|a, b| a.abs().partial_cmp(&b.abs()).unwrap_or(Ordering::Equal));

    // Collapse to a non-overlapping expansion.
    let mut q = 0.0f64;
    let mut h: Vec<f64> = Vec::with_capacity(v.len());
    for &ei in &v {
        let (s, r) = two_sum(q, ei);
        if r != 0.0 {
            h.push(r);
        }
        q = s;
    }
    h.push(q);

    // Take the largest N terms.
    let mut out = [0.0; 4];
    for (k, i) in (0..h.len()).rev().take(n).enumerate() {
        out[k] = h[i];
    }
    out
}

#[derive(Copy, Clone, Debug, Default)]
pub struct QD {
    pub c: [f64; 4],
} // c[0] is the leading component

impl QD {
    #[inline]
    pub fn zero() -> Self {
        Self { c: [0.0; 4] }
    }
    #[inline]
    pub fn one() -> Self {
        Self::from_f64(1.0)
    }
    #[inline]
    pub fn from_f64(x: f64) -> Self {
        Self {
            c: [x, 0.0, 0.0, 0.0],
        }
    }
    #[inline]
    pub fn to_f64(self) -> f64 {
        self.c[0]
    }
    #[inline]
    pub fn neg(self) -> Self {
        Self {
            c: [-self.c[0], -self.c[1], -self.c[2], -self.c[3]],
        }
    }

    #[inline]
    pub fn abs(self) -> Self {
        if self.c[0] < 0.0 { self.neg() } else { self }
    }

    pub fn add(self, rhs: Self) -> Self {
        let mut e: Vec<f64> = Vec::with_capacity(8);
        for &a in &self.c {
            if a != 0.0 {
                e = grow_expansion(&e, a);
            }
        }
        for &b in &rhs.c {
            if b != 0.0 {
                e = grow_expansion(&e, b);
            }
        }
        Self {
            c: compress_to_n(e, 4),
        }
    }
    pub fn sub(self, rhs: Self) -> Self {
        self.add(rhs.neg())
    }

    pub fn mul(self, rhs: Self) -> Self {
        let mut e: Vec<f64> = Vec::with_capacity(16);
        for &ai in &self.c {
            if ai == 0.0 {
                continue;
            }
            for &bj in &rhs.c {
                if bj == 0.0 {
                    continue;
                }
                let (p, pe) = two_prod(ai, bj);
                e = grow_expansion(&e, p);
                if pe != 0.0 {
                    e = grow_expansion(&e, pe);
                }
            }
        }
        Self {
            c: compress_to_n(e, 4),
        }
    }

    pub fn recip(self) -> Self {
        // Newton: y <- y + y*(1 - x*y)
        let mut y = QD::from_f64(1.0 / self.to_f64());
        for _ in 0..3 {
            let one = QD::one();
            y = y.add(y.mul(one.sub(self.mul(y))));
        }
        y
    }
    pub fn div(self, rhs: Self) -> Self {
        self.mul(rhs.recip())
    }

    pub fn sqrt(self) -> Self {
        // Newton: y <- 0.5 * (y + x / y)
        let mut y = QD::from_f64(self.to_f64().sqrt());
        let half = QD::from_f64(0.5);
        for _ in 0..3 {
            y = half.mul(y.add(self.div(y)));
        }
        y
    }

    // Handy scalars
    #[inline]
    pub fn mul_f64(self, k: f64) -> Self {
        self.mul(QD::from_f64(k))
    }
    #[inline]
    pub fn add_f64(self, k: f64) -> Self {
        self.add(QD::from_f64(k))
    }

    #[inline]
    pub fn is_zero(self) -> bool {
        self.c[0] == 0.0 && self.c[1] == 0.0 && self.c[2] == 0.0 && self.c[3] == 0.0
    }

    #[inline]
    pub fn lt(self, rhs: Self) -> bool {
        self.to_f64() < rhs.to_f64()
    }
    #[inline]
    pub fn le(self, rhs: Self) -> bool {
        self.to_f64() <= rhs.to_f64()
    }
    #[inline]
    pub fn gt(self, rhs: Self) -> bool {
        self.to_f64() > rhs.to_f64()
    }
    #[inline]
    pub fn ge(self, rhs: Self) -> bool {
        self.to_f64() >= rhs.to_f64()
    }

    #[inline]
    pub fn min(self, rhs: Self) -> Self {
        if self.le(rhs) { self } else { rhs }
    }
    #[inline]
    pub fn max(self, rhs: Self) -> Self {
        if self.ge(rhs) { self } else { rhs }
    }
}

// Minimal comparisons for our uses (sign/abs/ordering in controller).
impl PartialEq for QD {
    fn eq(&self, other: &Self) -> bool {
        self.c[0] == other.c[0]
            && self.c[1] == other.c[1]
            && self.c[2] == other.c[2]
            && self.c[3] == other.c[3]
    }
}
impl PartialOrd for QD {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.to_f64().partial_cmp(&other.to_f64())
    }
}
