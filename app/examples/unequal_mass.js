// https://numericaltank.sjtu.edu.cn/three-body/three-body-unequal-mass-movies.htm


function getExample1() {
    const v1 = 0.2869236336;
    const v2 = 0.0791847624;
    const m2 = 0.5;

    return [
        [-1.0, 0.0, 0.0, v1, v2, 0.0, 1.0],
        [0.0, 0.0, 0.0, -2 * v1 / m2, -2 * v2 / m2, 0.0, m2],
        [1.0, 0.0, 0.0, v1, v2, 0.0, 1.0]
        , 4.1761292190];
}

function getExample2() {
    const v1 = 0.4227625247;
    const v2 = 0.2533646387;
    const m2 = 0.75;

    return [
        [-1.0, 0.0, 0.0, v1, v2, 0.0, 1.0],
        [0.0, 0.0, 0.0, -2 * v1 / m2, -2 * v2 / m2, 0.0, m2],
        [1.0, 0.0, 0.0, v1, v2, 0.0, 1.0]
        , 5.9858187252];
}

function getExample3() {
    // I.Bi.c.60  (2)	0.4448123384	0.1589471380	152.8745723698
    const v1 = 0.4448123384;
    const v2 = 0.1589471380;
    const m2 = 2;

    return [
        [-1.0, 0.0, 0.0, v1, v2, 0.0, 1.0],
        [0.0, 0.0, 0.0, -2 * v1 / m2, -2 * v2 / m2, 0.0, m2],
        [1.0, 0.0, 0.0, v1, v2, 0.0, 1.0]
        , 152.8745723698];
}



const examples = {
    getExample1,
    getExample2,
    getExample3
};

export default examples;