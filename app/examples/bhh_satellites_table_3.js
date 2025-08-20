// (a) 1.0124 0.9968 −1.32962 −0.88963 −0.28501 9.2111
// (b) 0.5312 2.2837 −0.97138 −1.37584 −0.34528 7.0421
// (c) 0.8056 2.0394 −1.05795 −1.24044 −0.26723 7.4389
// (d) 0.3916 0.8341 −1.21503 −1.00328 −0.53749 9.2807
// (e) 0.1472 3.4219 −0.80027 −1.74811 −0.42176 5.8793
// (f) 0.8413 1.4155 −1.17777 −1.05903 −0.29934 8.3444

// function getExampleA() {
//     const m1 = 1.0124;
//     const m3 = 0.9968;
//     const m2 = 1;
//     const x1 = -1.32962;
//     const v1 = -0.88963;
//     const v3 = -0.28501;
//     const v2 = -(m1 * v1 + m3 * v3) / m2;

//     const t = 9.2111;

//     return [
//         [x1, 0, 0, 0, v1, 0, m1],
//         [0, 0, 0, 0, v2, 0, m2],
//         [1, 0, 0, 0, v3, 0, m3]
//         , t];
// }

function getExampleA() {
    const m1 = 1.0124;
    const m3 = 0.9968;
    const m2 = 1;
    const x1 = -1.32962;
    const v1 = -0.88963;
    const v3 = -0.28501;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 9.2111;

    const 𝜃 = 0.38316088765562;

    return [
        [x1*Math.cos(𝜃), x1*Math.sin(𝜃), 0, -v1*Math.sin(𝜃), v1*Math.cos(𝜃), 0, m1],
        [0, 0, 0, -v2*Math.sin(𝜃), v2*Math.cos(𝜃), 0, m2],
        [Math.cos(𝜃), Math.sin(𝜃), 0, -v3*Math.sin(𝜃), v3*Math.cos(𝜃), 0, m3]
        , t];
}

function getExampleB() {
    const m1 = 0.5312;
    const m3 = 2.2837;
    const m2 = 1;
    const x1 = -0.97138;
    const v1 = -1.37584;
    const v3 = -0.34528;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 7.0421;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleC() {
    const m1 = 0.8056;
    const m3 = 2.0394;
    const m2 = 1;
    const x1 = -1.05795;
    const v1 = -1.24044;
    const v3 = -0.26723;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 7.4389;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleD() {
    const m1 = 0.3916;
    const m3 = 0.8341;
    const m2 = 1;
    const x1 = -1.21503;
    const v1 = -1.00328;
    const v3 = -0.53749;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 9.2807;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleE() {
    const m1 = 0.1472;
    const m3 = 3.4219;
    const m2 = 1;
    const x1 = -0.80027;
    const v1 = -1.74811;
    const v3 = -0.42176;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 5.8793;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}

function getExampleF() {
    const m1 = 0.8413;
    const m3 = 1.4155;
    const m2 = 1;
    const x1 = -1.17777;
    const v1 = -1.05903;
    const v3 = -0.29934;
    const v2 = -(m1 * v1 + m3 * v3) / m2;

    const t = 8.3444;

    return [
        [x1, 0, 0, 0, v1, 0, m1],
        [0, 0, 0, 0, v2, 0, m2],
        [1, 0, 0, 0, v3, 0, m3]
        , t];
}


const bhh_table_3 = {
    getExampleA,
    getExampleB,
    getExampleC,
    getExampleD,
    getExampleE,
    getExampleF
}

export default bhh_table_3;