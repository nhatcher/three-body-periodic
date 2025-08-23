// Name ˙x1(0) ˙y1(0) λ T Θ(rad) 〈P 〉
// Moore’s figure eight 0.216 343 0.332 029 2.574 29 26.128 0.245 57 1.35 × 100
// Simo’s figure eight 0.211 139 0.333 568 2.583 87 26.127 0.277 32 1.36 × 100
// (M8)7 0.147 262 0.297 709 3.008 60 182.873 0.269 21 2.46 × 100
// I.A.1 butterfly I 0.147 307 0.060 243 4.340 39 56.378 0.034 78 1.35 × 105
// I.A.2 butterfly II 0.196 076 0.048 69 4.016 39 56.375 0.066 21 5.52 × 106
// I.A.3 bumblebee 0.111 581 0.355 545 2.727 51 286.192 -1.090 4 1.01 × 105
// I.B.1 moth I 0.279 332 0.238 203 2.764 56 68.464 0.899 49 5.25 × 102
// I.B.2 moth II 0.271 747 0.280 288 2.611 72 121.006 1.138 78 1.87 × 103
// I.B.3 butterfly III 0.211 210 0.119 761 3.693 54 98.435 0.170 35 3.53 × 105
// I.B.4 moth III 0.212 259 0.208 893 3.263 41 152.330 0.503 01 7.48 × 105
// I.B.5 goggles 0.037 785 0.058 010 4.860 23 112.129 -0.406 17 1.33 × 104
// I.B.6 butterfly IV 0.170 296 0.038 591 4.226 76 690.632 0.038 484 1.23 × 1013
// I.B.7 dragonfly 0.047 479 0.346 935 2.880 67 104.005 -0.406 199 1.25 × 106
// II.B.1 yarn 0.361 396 0.225 728 2.393 07 205.469 -1.015 61 2.33 × 106
// II.C.2a yin-yang I 0.304 003 0.180 257 2.858 02 83.727 0.659 242 1.31 × 105
// II.C.2b yin-yang I 0.143 554 0.166 156 3.878 10 83.727 -0.020 338 1.31 × 105
// II.C.3a yin-yang II 0.229 355 0.181 764 3.302 84 334.877 0.472 891 7.19 × 1010
// II.C.3b yin-yang II 0.227 451 0.170 639 3.366 76 334.872 0.254 995 7.19 × 1010

function getEight() {
    const [x1, y1] = [-0.97000436, 0.24308753];
    const [x2, y2] = [-x1, -y1];
    const [x3, y3] = [0, 0];
    const [vx3, vy3] = [0.93240737, 0.86473146];
    const [vx1, vy1] = [-vx3 / 2, -vy3 / 2];
    const [vx2, vy2] = [-vx3 / 2, -vy3 / 2];

    return [
        [x1, y1, 0.0, vx1, vy1, 0.0, 1.0,
         x2, y2, 0.0, vx2, vy2, 0.0, 1.0,
        0.0, 0.0, 0.0, vx3, vy3, 0.0, 1.0],
        10];
}

function getLagrange() {
    const m1 = 1;
    const m2 = 1;
    const m3 = 1;
    const [x1, y1] = [0.5773502691896258, 0];
    const [vx1, vy1] = [-0.0, 1.0];
    const [x2, y2] = [-0.2886751345948129, 0.5];
    const [vx2, vy2] = [-0.8660254037844386, -0.5];
    const [x3, y3] = [-0.2886751345948129, -0.5];
    const [vx3, vy3] = [0.8660254037844386, -0.5];

    return [
        [x1, y1, 0, vx1, vy1, 0, m1,
         x2, y2, 0, vx2, vy2, 0, m2,
         x3, y3, 0, vx3, vy3, 0, m3],
        3.6275987
    ];
}

function getEuler() {
    // todo!()
}


function getButterflyI() {
    const l = 4.34039;
    const vx1 = 0.147307;
    const vy1 = 0.060243;
    const t = 56.378;
    const [m1, m2, m3] = [1, 1, 1];

    return [
        [-l, 0, 0, vx1, vy1, 0, m1],
        [l, 0, 0, vx1, vy1, 0, m2],
        [0, 0, 0, -2 * vx1, -2 * vy1, 0, m3],
        t
    ];
}


const ic = [
    ["Eight", getEight()],
    ["Lagrange", getLagrange()],
    // ["Euler", getEuler()],
    // ["Butterfly I", getButterflyI()]
];

function getNames() {
    return ic.map((item) => item[0]);
}

function getOrbit(index) {
    return ic[index][1];
}

export default {
    getNames,
    getOrbit
};
