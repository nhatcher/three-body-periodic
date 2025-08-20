// src/dop853.rs
// DOP853 (Dormand–Prince 8(5,3)) for N-body gravity (G=1).
//
// Coefficients are the classic DOP853 ones (Hairer–Nørsett–Wanner).
// Numbers below match SciPy/ode_solvers tables (citations in comments).

use crate::{types::Body, utils::accelerations};

#[inline]
fn clamp(x: f64, lo: f64, hi: f64) -> f64 {
    x.max(lo).min(hi)
}

// ---------- DOP853 Butcher data ----------
// Sources for these constants (same values):
// - SciPy devdocs arrays DOP853.A / .B / .C (method definition)
// - ode_solvers crate (butcher_tableau.rs) coefficients for DOPRI853
//   B is order-8 weights; E is (b - b_hat) used for the 5th-order error estimate.
//   (Hairer, Nørsett, Wanner, "Solving ODE I", DOP853)

const C: [f64; 12] = [
    0.0,
    0.0526001519587677318785587544488,
    0.0789002279381515978178381316732,
    0.118350341907227396726757197510,
    0.281649658092772603273242802490,
    1.0 / 3.0,
    0.25,
    0.307692307692307692307692307692,
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

// ---------- helpers on the 6N state vector ----------
fn pack_state(bodies: &[Body]) -> Vec<f64> {
    // y = [r0x, r0y, r0z, v0x, v0y, v0z, r1x, ...]
    let n = bodies.len();
    let mut y = vec![0.0; 6 * n];
    for (i, b) in bodies.iter().enumerate() {
        let o = 6 * i;
        y[o] = b.r[0];
        y[o + 1] = b.r[1];
        y[o + 2] = b.r[2];
        y[o + 3] = b.v[0];
        y[o + 4] = b.v[1];
        y[o + 5] = b.v[2];
    }
    y
}

fn unpack_state(y: &[f64], bodies: &mut [Body]) {
    for (i, b) in bodies.iter_mut().enumerate() {
        let o = 6 * i;
        b.r = [y[o], y[o + 1], y[o + 2]];
        b.v = [y[o + 3], y[o + 4], y[o + 5]];
    }
}

fn deriv(y: &[f64], masses: &[f64], eps2: f64) -> Vec<f64> {
    let n = masses.len();
    // extract positions and velocities
    let mut r = vec![[0.0f64; 3]; n];
    let mut v = vec![[0.0f64; 3]; n];
    for i in 0..n {
        let o = 6 * i;
        r[i] = [y[o], y[o + 1], y[o + 2]];
        v[i] = [y[o + 3], y[o + 4], y[o + 5]];
    }
    let a = accelerations(&r, masses, eps2);
    // dy/dt = [v, a]
    let mut dy = vec![0.0; 6 * n];
    for i in 0..n {
        let o = 6 * i;
        dy[o] = v[i][0];
        dy[o + 1] = v[i][1];
        dy[o + 2] = v[i][2];
        dy[o + 3] = a[i][0];
        dy[o + 4] = a[i][1];
        dy[o + 5] = a[i][2];
    }
    dy
}

fn saxpy_into(out: &mut [f64], a: f64, x: &[f64]) {
    for (o, xi) in out.iter_mut().zip(x.iter()) {
        *o += a * xi;
    }
}

// Weighted RMS error norm (Hairer style)
fn error_norm(err: &[f64], y: &[f64], y_new: &[f64], rtol: f64, atol: f64) -> f64 {
    let mut accum = 0.0;
    let n = err.len();
    for i in 0..n {
        let sc = atol + rtol * y[i].abs().max(y_new[i].abs());
        let e = err[i] / sc;
        accum += e * e;
    }
    (accum / (n as f64)).sqrt()
}

// One DOP853 trial step: returns (y8, err_norm, k1) ; k1 is returned for optional FSAL (not used here).
fn dop853_trial(
    y: &[f64],
    h: f64,
    masses: &[f64],
    eps2: f64,
    rtol: f64,
    atol: f64,
) -> (Vec<f64>, f64, Vec<f64>) {
    let n = y.len();
    let mut k: [Vec<f64>; 12] = std::array::from_fn(|_| vec![0.0; n]);

    // k1
    k[0] = deriv(y, masses, eps2);

    // stages 2..12
    for s in 2..=12 {
        let ai = A[s - 2];
        let mut ytmp = y.to_vec();
        for (j, &aij) in ai.iter().enumerate() {
            if aij != 0.0 {
                saxpy_into(&mut ytmp, h * aij, &k[j]);
            }
        }
        k[s - 1] = deriv(&ytmp, masses, eps2);
    }

    // 8th-order solution
    let mut y8 = y.to_vec();
    for i in 0..12 {
        if B8[i] != 0.0 {
            saxpy_into(&mut y8, h * B8[i], &k[i]);
        }
    }

    // embedded 5th-order error estimate (vector), then norm
    let mut errv = vec![0.0; n];
    for i in 0..12 {
        if E5[i] != 0.0 {
            saxpy_into(&mut errv, h * E5[i], &k[i]);
        }
    }
    let errn = error_norm(&errv, y, &y8, rtol, atol);

    (y8, errn, k[0].clone())
}

/// Evolve from t=0 to t=t_end with adaptive DOP853.
/// Returns (flat positions history, final time reached).
///
/// Notes:
/// - Appends the 3D positions of each body *before* every accepted step (t=0 included via the first loop push).
/// - Uses a simple step controller; tweak `RTOL/ATOL/SAFETY/MIN/MAX` as you like.
/// - For close encounters you may want softening (eps2 > 0) to tame singularities.
pub fn evolve(bodies: &mut [Body], t_end: f64) -> (Vec<f64>, f64) {
    let n = bodies.len();
    let masses: Vec<f64> = bodies.iter().map(|b| b.m).collect();

    // tolerances & controller params (conservative defaults for chaotic 3-body)
    const RTOL: f64 = 1e-9;
    const ATOL: f64 = 1e-12;
    const SAFETY: f64 = 0.9;
    const FAC_MIN: f64 = 0.2;
    const FAC_MAX: f64 = 5.0;
    const P: f64 = 8.0; // order
    const INV_EXP: f64 = 1.0 / (P + 1.0); // 1/9

    let eps2 = 0.0; //1e-8; // Plummer softening^2 (set 0.0 to disable)

    let mut y = pack_state(bodies);
    let mut t = 0.0;

    // naive initial step guess: fraction of interval, bounded away from zero
    let mut h = (t_end - t).abs().max(1e-12) * 1e-3;
    h = h.min((t_end - t).abs()); // can't jump past end
    // direction
    let dir = if t_end >= 0.0 { 1.0 } else { -1.0 };
    h *= dir;

    let mut result = Vec::<f64>::new();
    let mut last_fs = None::<Vec<f64>>; // could be used for FSAL reuse (not needed here)

    let max_steps = 5_000_000usize;
    let mut steps = 0usize;

    while (t - t_end).abs() > 0.0 && steps < max_steps {
        // push current positions (like your RK4/Verlet do)
        for i in 0..n {
            let o = 6 * i;
            result.push(y[o]);
            result.push(y[o + 1]);
            result.push(y[o + 2]);
        }
        result.push(t);

        // clamp final step to hit t_end
        if (t - t_end).abs() < (h.abs() * 0.5) || (t - t_end).signum() == dir {
            h = t_end - t;
        }

        let (y_trial, errn, _k1) = dop853_trial(&y, h, &masses, eps2, RTOL, ATOL);

        if errn <= 1.0 || ((t - t_end) * dir) >= 0.0 {
            // accept
            y = y_trial;
            t += h;
            // next h
            let fac = if errn == 0.0 {
                FAC_MAX
            } else {
                SAFETY * errn.powf(-INV_EXP)
            };
            h *= clamp(fac, FAC_MIN, FAC_MAX);
        } else {
            // reject and shrink
            let fac = SAFETY * errn.powf(-INV_EXP);
            h *= clamp(fac, 0.1, 0.5); // shrink a bit more aggressively on reject
            continue; // retry from same t,y
        }

        steps += 1;
        if h.abs() < 1e-16 {
            // give up to avoid infinite loop in extreme cases
            break;
            // h = t_end - t;
        }
        if (t_end - t).abs() <= 0.0 {
            break;
        }
        // ensure we don't overshoot (only clamp if stepping past t_end)
        if ((t - t_end) * dir) > 0.0 {
            h = t_end - t;
        }
    }

    // write back to bodies the final state
    unpack_state(&y, bodies);
    (result, t)
}
