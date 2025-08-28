// src/dop853_hp.rs
use crate::types::Body;
// use crate::dop853::{C, A, B8, E5}; // make those pub(crate) in your dop853.rs
use crate::qd::QD;

/*
c7=1/4
c6=4*c7/3
c5=(6+Math.sqrt(6))*c6/10
c4=(6-Math.sqrt(6))*c6/10
c3=2*c4/3
c2=2*c3/2
*/

const C: [f64; 12] = [
    0.0,
    0.0526001519587677318785587544488, // c2 1/18
    0.0789002279381515978178381316732, // c2*18/12
    0.118350341907227396726757197510,  // c2*18/8
    0.281649658092772603273242802490,  // 1/(c2*67.5)
    1.0 / 3.0,
    0.25,
    0.307692307692307692307692307692, // 4/13
    0.651282051282051282051282051282,
    0.6,
    0.857142857142857142857142857142,
    1.0,
];

const A: [&[f64]; 12] = [
    // i = 2..12 rows; each row has a_ij, j=1..i-1
    &[5.26001519587677318785587544488E-2], // c2
    &[
        1.97250569845378994544595329183E-2,
        5.91751709536136983633785987549E-2,
    ],
    &[
        2.95875854768068491816892993775E-2,
        0.0,
        8.87627564304205475450678981324E-2,
    ],
    &[
        2.41365134159266685502369798665E-1,
        0.0,
        -8.84549479328286085344864962717E-1,
        9.24834003261792003115737966543E-1,
    ],
    &[
        3.70370370370370370370370370370E-2,
        0.0,
        0.0,
        1.70828608729473871279604482173E-1,
        1.25467687566822425016691814123E-1,
    ],
    &[
        3.7109375E-2,
        0.0,
        0.0,
        1.70252211019544039314978060272E-1,
        6.02165389804559606850219397283E-2,
        -1.7578125E-2,
    ],
    &[
        3.70920001185047927108779319836E-2,
        0.0,
        0.0,
        1.70383925712239993810214054705E-1,
        1.07262030446373284651809199168E-1,
        -1.53194377486244017527936158236E-2,
        8.27378916381402288758473766002E-3,
    ],
    &[
        6.24110958716075717114429577812E-1,
        0.0,
        0.0,
        -3.36089262944694129406857109825E0,
        -8.68219346841726006818189891453E-1,
        2.75920996994467083049415600797E1,
        2.01540675504778934086186788979E1,
        -4.34898841810699588477366255144E1,
    ],
    &[
        4.77662536438264365890433908527E-1,
        0.0,
        0.0,
        -2.48811461997166764192642586468E0,
        -5.90290826836842996371446475743E-1,
        2.12300514481811942347288949897E1,
        1.52792336328824235832596922938E1,
        -3.32882109689848629194453265587E1,
        -2.03312017085086261358222928593E-2,
    ],
    &[
        -9.3714243008598732571704021658E-1,
        0.0,
        0.0,
        5.18637242884406370830023853209E0,
        1.09143734899672957818500254654E0,
        -8.14978701074692612513997267357E0,
        -1.85200656599969598641566180701E1,
        2.27394870993505042818970056734E1,
        2.49360555267965238987089396762E0,
        -3.0467644718982195003823669022E0,
    ],
    &[
        2.27331014751653820792359768449E0,
        0.0,
        0.0,
        -1.05344954667372501984066689879E1,
        -2.00087205822486249909675718444E0,
        -1.79589318631187989172765950534E1,
        2.79488845294199600508499808837E1,
        -2.85899827713502369474065508674E0,
        -8.87285693353062954433549289258E0,
        1.23605671757943030647266201528E1,
        6.43392746015763530355970484046E-1,
    ],
    &C,
];

const B8: [f64; 12] = [
    5.42937341165687622380535766363E-2,
    0.0,
    0.0,
    0.0,
    0.0,
    4.45031289275240888144113950566E0,
    1.89151789931450038304281599044E0,
    -5.8012039600105847814672114227E0,
    3.1116436695781989440891606237E-1,
    -1.52160949662516078556178806805E-1,
    2.01365400804030348374776537501E-1,
    4.47106157277725905176885569043E-2,
];

// E = b(8) - b_hat(5); multiply h * sum(E_i * k_i) to get error estimate (embedded order-5).
const E5: [f64; 12] = [
    0.1312004499419488073250102996E-01,
    0.0,
    0.0,
    0.0,
    0.0,
    -0.1225156446376204440720569753E+01,
    -0.4957589496572501915214079952E+00,
    0.1664377182454986536961530415E+01,
    -0.3503288487499736816886487290E+00,
    0.3341791187130174790297318841E+00,
    0.8192320648511571246570742613E-01,
    -0.2235530786388629525884427845E-01,
];

// --- helpers on the 6N state vector in QD ---
fn pack_state_qd(bodies: &[Body]) -> Vec<QD> {
    let n = bodies.len();
    let mut y = vec![QD::zero(); 6 * n];
    for (i, b) in bodies.iter().enumerate() {
        let o = 6 * i;
        y[o] = QD::from_f64(b.r[0]);
        y[o + 1] = QD::from_f64(b.r[1]);
        y[o + 2] = QD::from_f64(b.r[2]);
        y[o + 3] = QD::from_f64(b.v[0]);
        y[o + 4] = QD::from_f64(b.v[1]);
        y[o + 5] = QD::from_f64(b.v[2]);
    }
    y
}

fn unpack_state_qd_to_f64(y: &[QD], bodies: &mut [Body]) {
    for (i, b) in bodies.iter_mut().enumerate() {
        let o = 6 * i;
        b.r = [y[o].to_f64(), y[o + 1].to_f64(), y[o + 2].to_f64()];
        b.v = [y[o + 3].to_f64(), y[o + 4].to_f64(), y[o + 5].to_f64()];
    }
}

#[inline]
fn saxpy_into_qd(out: &mut [QD], a: QD, x: &[QD]) {
    for (o, xi) in out.iter_mut().zip(x.iter()) {
        *o = o.add(a.mul(*xi));
    }
}

// Acceleration with G=1 and optional Plummer softening eps2
fn accelerations_qd(r: &[[QD; 3]], m: &[QD], eps2: QD) -> Vec<[QD; 3]> {
    let n = r.len();
    let mut a = vec![[QD::zero(); 3]; n];
    for i in 0..n {
        for j in (i + 1)..n {
            let dx = r[j][0].sub(r[i][0]);
            let dy = r[j][1].sub(r[i][1]);
            let dz = r[j][2].sub(r[i][2]);
            let mut d2 = dx.mul(dx).add(dy.mul(dy)).add(dz.mul(dz));
            if eps2.to_f64() != 0.0 {
                d2 = d2.add(eps2);
            }
            let rinv = d2.sqrt().recip();
            let rinv3 = rinv.mul(rinv).mul(rinv);
            let s_i = m[j].mul(rinv3); // contribution to a_i
            let s_j = m[i].mul(rinv3); // contribution to a_j (opposite sign)
            a[i][0] = a[i][0].add(s_i.mul(dx));
            a[i][1] = a[i][1].add(s_i.mul(dy));
            a[i][2] = a[i][2].add(s_i.mul(dz));
            a[j][0] = a[j][0].sub(s_j.mul(dx));
            a[j][1] = a[j][1].sub(s_j.mul(dy));
            a[j][2] = a[j][2].sub(s_j.mul(dz));
        }
    }
    a
}

fn deriv_qd(y: &[QD], masses: &[QD], eps2: QD) -> Vec<QD> {
    let n = masses.len();
    let mut r = vec![[QD::zero(); 3]; n];
    let mut v = vec![[QD::zero(); 3]; n];
    for i in 0..n {
        let o = 6 * i;
        r[i][0] = y[o];
        r[i][1] = y[o + 1];
        r[i][2] = y[o + 2];
        v[i][0] = y[o + 3];
        v[i][1] = y[o + 4];
        v[i][2] = y[o + 5];
    }
    let acc = accelerations_qd(&r, masses, eps2);

    let mut dy = vec![QD::zero(); 6 * n];
    for i in 0..n {
        let o = 6 * i;
        dy[o] = v[i][0];
        dy[o + 1] = v[i][1];
        dy[o + 2] = v[i][2];
        dy[o + 3] = acc[i][0];
        dy[o + 4] = acc[i][1];
        dy[o + 5] = acc[i][2];
    }
    dy
}

// Weighted RMS error norm computed in f64 for the step controller
// fn error_norm_qd(err: &[QD], y: &[QD], y_new: &[QD], rtol: f64, atol: f64) -> f64 {
//     let mut accum = 0.0;
//     let n = err.len();
//     for i in 0..n {
//         let sc = atol + rtol * y[i].to_f64().abs().max(y_new[i].to_f64().abs());
//         let e = err[i].to_f64() / sc;
//         accum += e * e;
//     }
//     (accum / (n as f64)).sqrt()
// }

fn error_norm_qd(err: &[QD], y: &[QD], y_new: &[QD], rtol: QD, atol: QD) -> QD {
    let mut accum = QD::from_f64(0.0);
    let n = err.len();

    for i in 0..n {
        // sc = atol + rtol * max(|y_i|, |y_new_i|)
        let yi = y[i].abs();
        let yni = y_new[i].abs();
        let sc = atol.add(rtol.mul(yi.max(yni)));

        // e/sc
        let e_scaled = err[i].div(sc);
        let e2 = e_scaled.mul(e_scaled);
        accum = accum.add(e2);
    }
    // sqrt(mean)
    let mean = accum.div(QD::from_f64(n as f64));
    mean.sqrt()
}

fn dop853_trial_qd(y: &[QD], h: QD, masses: &[QD], eps2: QD, rtol: QD, atol: QD) -> (Vec<QD>, f64) {
    let n = y.len();
    let mut k: [Vec<QD>; 12] = core::array::from_fn(|_| vec![QD::zero(); n]);

    // k1
    k[0] = deriv_qd(y, masses, eps2);

    // stages 2..12
    for s in 2..=12 {
        let ai = A[s - 2];
        let mut ytmp = y.to_vec();
        for (j, &aij) in ai.iter().enumerate() {
            if aij != 0.0 {
                saxpy_into_qd(&mut ytmp, h.mul_f64(aij), &k[j]);
            }
        }
        k[s - 1] = deriv_qd(&ytmp, masses, eps2);
    }

    // 8th-order solution
    let mut y8 = y.to_vec();
    for i in 0..12 {
        if B8[i] != 0.0 {
            saxpy_into_qd(&mut y8, h.mul_f64(B8[i]), &k[i]);
        }
    }

    // embedded 5th-order error (vector)
    let mut errv = vec![QD::zero(); n];
    for i in 0..12 {
        if E5[i] != 0.0 {
            saxpy_into_qd(&mut errv, h.mul_f64(E5[i]), &k[i]);
        }
    }

    let errn = error_norm_qd(&errv, y, &y8, rtol, atol);
    (y8, errn.to_f64())
}

/// High-precision evolve: same signature/return as your original, but state is carried in QD.
pub fn evolve_hp(bodies: &mut [Body], t_end: f64) -> (Vec<f64>, f64) {
    let n = bodies.len();
    let masses_qd: Vec<QD> = bodies.iter().map(|b| QD::from_f64(b.m)).collect();
    let t_end = QD::from_f64(t_end);

    // tolerances & controller
    let RTOL: QD = QD::from_f64(1e-20);
    let ATOL: QD = QD::from_f64(1e-20);
    let SAFETY: f64 = 0.9;
    let FAC_MIN: f64 = 0.2;
    let FAC_MAX: f64 = 5.0;
    const P: f64 = 8.0;
    const INV_EXP: f64 = 1.0 / (P + 1.0); // 1/9
    let eps2 = QD::from_f64(0.0);

    let mut y = pack_state_qd(bodies);
    let mut t = QD::from_f64(0.0);

    // initial step guess
    let mut h = t_end.sub(t).abs().max(QD::from_f64(1e-12)).mul_f64(1e-3);
    h = h.min(t_end.sub(t).abs());

    let dir = if t_end >= QD::zero() { 1.0 } else { -1.0 };
    h = h.mul_f64(dir);

    let mut result = Vec::<f64>::new();
    let max_steps = 5_000_000usize;
    let mut steps = 0usize;

    while t.sub(t_end).abs() > QD::zero() && steps < max_steps {
        // push current positions & time (as in your solver)
        for i in 0..n {
            let o = 6 * i;
            result.push(y[o].to_f64());
            result.push(y[o + 1].to_f64());
            result.push(y[o + 2].to_f64());
        }
        result.push(t.to_f64());

        // clamp final step to hit t_end
        if t.sub(t_end).abs() < h.abs().mul_f64(0.5) || t.sub(t_end).mul_f64(dir) > QD::zero() {
            h = t_end.sub(t);
        }

        let (y_trial, errn) = dop853_trial_qd(&y, h, &masses_qd, eps2, RTOL, ATOL);

        if errn <= 1.0 || t.sub(t_end).mul_f64(dir) >= QD::zero() {
            // accept
            y = y_trial;
            t = t.add(h);
            // next h
            let fac = if errn == 0.0 {
                FAC_MAX
            } else {
                SAFETY * errn.powf(-INV_EXP)
            };
            h = h.mul_f64(fac.clamp(FAC_MIN, FAC_MAX));
        } else {
            // reject and shrink
            let fac = SAFETY * errn.powf(-INV_EXP);
            h = h.mul_f64(fac.clamp(0.1, 0.5));
            continue;
        }

        steps += 1;
        if h.abs() < QD::from_f64(1e-16) {
            break;
        }
        if t_end.sub(t).abs() <= QD::zero() {
            break;
        }
        if t.sub(t_end).mul_f64(dir) > QD::zero() {
            h = t_end.sub(t);
        }
    }

    unpack_state_qd_to_f64(&y, bodies);
    (result, t.to_f64())
}
