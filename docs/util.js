const MAX_POINTS_PER_BODY = 10_000;
function reshapeResultToPaths(result) {
    // result is Float64Array of length 10 * steps: [x1,y1,z1, x2,y2,z2, x3,y3,z3, t] per step
    const resultCount = result.length;
    if (resultCount % 10 !== 0) {
        throw new Error('Result length is not a multiple of 10.');
    }
    const stepCount = resultCount / 10;
    const paths = [[], [], []];
    const times = [];
    const bigStep = Math.floor(resultCount / Math.min(10 * MAX_POINTS_PER_BODY, resultCount));
    for (let s = 0; s < stepCount; s += bigStep) {
        const base = s * 10;
        for (let b = 0; b < 3; b++) {
            const x = result[base + b * 3 + 0];
            const y = result[base + b * 3 + 1];
            const z = result[base + b * 3 + 2];
            paths[b].push([x, y, z]);
        }
        times.push(result[base + 9]);
    }
    return { paths, times };
}

function niceStep(range, target = 8) {
    if (!isFinite(range) || range <= 0) return 1;
    const rough = range / target;
    const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow10;
    let nice;
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
    return nice * pow10;
}

function formatTick(v, step) {
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    const s = (Math.abs(v) < 1e-12 ? 0 : v).toFixed(decimals);
    return s.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '');
}

export { reshapeResultToPaths, niceStep, formatTick };