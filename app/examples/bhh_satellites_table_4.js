// https://numericaltank.sjtu.edu.cn/three-body/three-body.html

// (a) 1.0283 0.9879 −1.62064 −0.65955 −0.14784 6.9193
// (b) 1.5142 0.4968 −1.90809 −0.50283 −0.08614 8.2924
// (c) 2.9216 31.9067 −1.22892 −2.37239 0.09481 1.6822
// (d) 4.4143 18.6575 −1.32880 −1.86103 0.25507 2.3306
// (e) 10.3501 10.4522 −1.69797 −1.22777 0.86183 3.5607
// (f) 18.7011 4.2388 −2.51585 −0.53262 1.49754 5.9612


function getExampleA() {
    const m1 = 1.0283;
    const m3 = 0.9879;
    const m2 = 1;
    const x1 = -1.62064;
    const v1 = -0.65955;
    const v3 = -0.14784;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 6.9193;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleB() {
    const m1 = 1.5142;
    const m3 = 0.4968;
    const m2 = 1;
    const x1 = -1.90809;
    const v1 = 0.50283;
    const v3 = 0.08614;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 8.2924;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleC() {
    const m1 = 2.9216;
    const m3 = 31.9067;
    const m2 = 1;
    const x1 = -1.22892;
    const v1 = -2.37239;
    const v3 = 0.09481;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 1.6822;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleD() {
    const m1 = 4.4143;
    const m3 = 18.6575;
    const m2 = 1;
    const x1 = -1.32880;
    const v1 = -1.86103;
    const v3 = 0.25507;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 2.3306;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleE() {
    const m1 = 10.3501;
    const m3 = 10.4522;
    const m2 = 1;
    const x1 = -1.69797;
    const v1 = -1.22777;
    const v3 = 0.86183;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 3.5607;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleF() {
    const m1 = 18.7011;
    const m3 = 4.2388;
    const m2 = 1;
    const x1 = -2.51585;
    const v1 = -0.53262;
    const v3 = 1.49754;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 5.9612;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

const bhh_table_4 = {
    getExampleA,
    getExampleB,
    getExampleC,
    getExampleD,
    getExampleE,
    getExampleF
}

export default bhh_table_4;