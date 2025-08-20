function getEight() {
    const [x1, y1] = [-0.97000436, 0.24308753];
    const [x2, y2] = [-x1, -y1];
    const [x3, y3] = [0, 0];
    const [vx3, vy3] = [0.93240737, 0.86473146];
    const [vx1, vy1] = [-vx3/2, -vy3/2];
    const [vx2, vy2] = [-vx3/2, -vy3/2];

    return [
        [x1, y1, 0.0, vx1, vy1, 0.0, 1.0],
        [x2, y2, 0.0, vx2, vy2, 0.0, 1.0],
        [0.0, 0.0, 0.0, vx3, vy3, 0.0, 1.0]
        , 10];
}

function getLagrange() {
    const m1 = 1;
    const m2 = 1;
    const m3 = 1;
    const [x1, y1] = [0.5773502691896258, 0];
    const [vx1, vy1] = [-0.0, 1.0];
    const [x2, y2] = [ -0.2886751345948129,  0.5];
    const [vx2, vy2] = [-0.8660254037844386, -0.5];
    const [x3, y3] = [ -0.2886751345948129, -0.5];
    const [vx3, vy3] = [0.8660254037844386, -0.5];

    return [
        [x1, y1, 0, vx1, vy1, 0, m1],
        [x2, y2, 0, vx2, vy2, 0, m2],
        [x3, y3, 0, vx3, vy3, 0, m3],
        3.6275987
    ];
}


function getEuler() {

}

export default {
    getEight,
    getLagrange,
    getEuler
};