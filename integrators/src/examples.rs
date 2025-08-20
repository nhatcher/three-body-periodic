use crate::Body;

pub fn example1() -> (Vec<Body>, f64) {
    // https://numericaltank.sjtu.edu.cn/three-body/three-body-unequal-mass-movies.htm
    let v1 = 0.2869236336;
    let v2 = 0.0791847624;
    let t_end = 4.1761292190;
    let m1 = 1.0;
    let m2 = 0.5;
    let m3 = 1.0;
    let bodies = vec![
        Body {
            m: m1,
            r: [-1.0, 0.0, 0.0],
            v: [v1, v2, 0.0],
        },
        Body {
            m: m2,
            r: [0.0, 0.0, 0.0],
            v: [-2.0 * v1 / m2, -2.0 * v2 / m2, 0.0],
        },
        Body {
            m: m3,
            r: [1.0, 0.0, 0.0],
            v: [v1, v2, 0.0],
        },
    ];
    (bodies, t_end)
}
