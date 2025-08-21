
import init, { evolve, total_energy, total_angular_momentum } from './wasm/three_body_wasm.js';
import unequal_mass from './examples/unequal_mass.js';
import equal_mass from './examples/equal_mass.js';
import choreographies from './examples/choreographies.js';
import free_fall from './examples/free_fall.js';

await init();

// Globals
const colors = ['#e74c3c', '#3498db', '#2ecc71'];
const canvas = document.getElementById('plot');
const wrap = document.getElementById('canvasWrap');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const methodEl = document.getElementById('method');
const timeEl = document.getElementById('time');
const runButton = document.getElementById('run');
const timeSlider = document.getElementById('control-time');
const exampleClassDropdown = document.getElementById('example-class');
const exampleSelect = document.getElementById('example');

// paths: [ [ [x,y], ... ], [ ... ], [ ... ] ]
let paths = [[], [], []];
let masses = [1, 1, 1];
let times = [];
let energy = 0;
let angularMomentum = [0, 0, 0];


function getExampleValues() {
    const exampleClass = exampleClassDropdown.value;
    const example = exampleSelect.value;
    let values;
    switch (exampleClass) {
        case 'choreographies':
            values = choreographies.getOrbit(example);
            break;
        case 'free_fall':
            values = free_fall.getOrbit(example);
            break;
        case 'unequal_mass':
            values = unequal_mass.getOrbit(example);
            break;
        case 'equal_mass':
            values = equal_mass.getOrbit(example);
            break;
    }
    return values;
}

function setDefaults() {
    const values = getExampleValues();

    document.getElementById('b1x').value = values[0][0];
    document.getElementById('b1y').value = values[0][1];
    document.getElementById('b1vx').value = values[0][3];
    document.getElementById('b1vy').value = values[0][4];
    document.getElementById('b1m').value = values[0][6];

    document.getElementById('b2x').value = values[1][0];
    document.getElementById('b2y').value = values[1][1];
    document.getElementById('b2vx').value = values[1][3];
    document.getElementById('b2vy').value = values[1][4];
    document.getElementById('b2m').value = values[1][6];

    document.getElementById('b3x').value = values[2][0];
    document.getElementById('b3y').value = values[2][1];
    document.getElementById('b3vx').value = values[2][3];
    document.getElementById('b3vy').value = values[2][4];
    document.getElementById('b3m').value = values[2][6];

    timeEl.value = values[3];
}

function fill_example_dropdown() {
    const exampleClass = exampleClassDropdown.value;

    // Clear existing options
    exampleSelect.innerHTML = '';
    let examples;

    if (exampleClass === 'free_fall') {
        examples = free_fall.getNames();
    } else if (exampleClass === 'unequal_mass') {
        examples = unequal_mass.getNames();
    } else if (exampleClass === 'equal_mass') {
        examples = equal_mass.getNames();
    } else if (exampleClass === 'choreographies') {
        examples = choreographies.getNames();
    }
    examples.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        exampleSelect.appendChild(option);
    });

}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(320, wrap.clientWidth);
    const h = Math.max(240, wrap.clientHeight);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/// Read the initial conditions form the DOM
function readIC2D() {
    const vals = (id) => {
        const el = document.getElementById(id);
        const v = Number(el.value);
        if (!Number.isFinite(v)) {
            throw new Error(`Invalid number in ${id}`);
        }
        return v;
    };
    const b1 = [vals('b1x'), vals('b1y'), 0.0, vals('b1vx'), vals('b1vy'), 0.0, vals('b1m')];
    const b2 = [vals('b2x'), vals('b2y'), 0.0, vals('b2vx'), vals('b2vy'), 0.0, vals('b2m')];
    const b3 = [vals('b3x'), vals('b3y'), 0.0, vals('b3vx'), vals('b3vy'), 0.0, vals('b3m')];
    return [...b1, ...b2, ...b3];
}

function computeBounds() {
    let minX = +Infinity, minY = +Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const path of paths) {
        for (const [x, y] of path) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    if (!isFinite(minX)) { minX = -1; maxX = 1; minY = -1; maxY = 1; }
    return { minX, minY, maxX, maxY };
}

function makeProjector() {
    const bounds = computeBounds();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dx = Math.max(1e-12, bounds.maxX - bounds.minX);
    const dy = Math.max(1e-12, bounds.maxY - bounds.minY);
    const scale = 0.9 * Math.min(w / dx, h / dy); // 10% margin
    const xMargin = (w - scale * dx) / 2;
    const yMargin = (h - scale * dy) / 2;
    function toCanvas(x, y) {
        const cx = xMargin + scale * (x - bounds.minX);
        const cy = h - (yMargin + scale * (y - bounds.minY)); // y-up
        return [cx, cy];
    }
    function fromCanvas(cx, cy) {
        const x = (cx - xMargin) / scale + bounds.minX;
        const y = bounds.maxY - (cy - yMargin) / scale;
        return [x, y];
    }

    return { toCanvas, fromCanvas };
}

function drawLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = '';
    ['Body 1', 'Body 2', 'Body 3'].forEach((label, i) => {
        const row = document.createElement('div');
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = colors[i];
        const txt = document.createElement('span');
        txt.textContent = `${label}  (m = ${masses[i]})`;
        row.appendChild(sw);
        row.appendChild(txt);
        legend.appendChild(row);
    });
    const row = document.createElement('div');
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = 'transparent';
    const txt = document.createElement('span');
    txt.textContent = `Energy: ${energy}`;
    row.appendChild(sw);
    row.appendChild(txt);
    legend.appendChild(row);

    const row2 = document.createElement('div');
    const sw2 = document.createElement('span');
    sw2.className = 'swatch';
    sw2.style.background = 'transparent';
    const txt2 = document.createElement('span');
    txt2.textContent = `Angular Momentum: ${angularMomentum[2]}`;
    row2.appendChild(sw2);
    row2.appendChild(txt2);
    legend.appendChild(row2);
}

function drawAxis() {
    ctx.save();

    // Styles
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';

    const { toCanvas, fromCanvas } = makeProjector();
    const [minX, maxY] = fromCanvas(0, 0);
    const [maxX, minY] = fromCanvas(canvas.clientWidth, canvas.clientHeight);

    // Helpers: nice tick step and formatting
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

    // Tick step
    const xStep = niceStep(maxX - minX, 8);
    const yStep = niceStep(maxY - minY, 8);

    // Margins for axes (5% inset from edges)
    const margin = 6;
    const xAxisY = canvas.clientHeight - margin; // bottom
    const yAxisX = margin;                       // left

    // Draw bottom X axis
    ctx.beginPath();
    ctx.moveTo(margin, xAxisY);
    ctx.lineTo(canvas.clientWidth - margin, xAxisY);
    ctx.stroke();

    // Draw left Y axis
    ctx.beginPath();
    ctx.moveTo(yAxisX, margin);
    ctx.lineTo(yAxisX, canvas.clientHeight - margin);
    ctx.stroke();

    const tick = 6;
    const labelPad = 2;

    // X ticks & labels
    {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const start = Math.ceil(minX / xStep) * xStep;
        for (let i = 0; i < 1000; i++) {
            const xVal = start + i * xStep;
            if (xVal > maxX + 1e-12) {
                break;
            }
            const [tx, _] = toCanvas(xVal, minY); // map to canvas X pos
            ctx.beginPath();
            ctx.moveTo(tx, xAxisY);
            ctx.lineTo(tx, xAxisY - tick);
            ctx.stroke();
            ctx.fillText(formatTick(xVal, xStep), tx, xAxisY - tick - labelPad);
        }
    }

    // Y ticks & labels
    {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const start = Math.ceil(minY / yStep) * yStep;
        for (let i = 0; i < 1000; i++) {
            const yVal = start + i * yStep;
            if (yVal > maxY + 1e-12) {
                break;
            }
            const [_, ty] = toCanvas(minX, yVal); // map to canvas Y pos
            ctx.beginPath();
            ctx.moveTo(yAxisX, ty);
            ctx.lineTo(yAxisX + tick, ty);
            ctx.stroke();
            ctx.fillText(formatTick(yVal, yStep), yAxisX + tick + labelPad, ty);
        }
    }

    ctx.restore();
}

// draws a subtle grid in the background
function drawGrid() {
    ctx.save();
    ctx.globalAlpha = 0.2;
    const step = 80;
    for (let x = 0; x < canvas.clientWidth; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.clientHeight); ctx.lineWidth = 1; ctx.strokeStyle = '#1b2647'; ctx.stroke();
    }
    for (let y = 0; y < canvas.clientHeight; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.clientWidth, y); ctx.lineWidth = 1; ctx.strokeStyle = '#1b2647'; ctx.stroke();
    }
    ctx.restore();
}

function draw() {
    resizeCanvas();
    drawLegend();

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    drawGrid();
    drawAxis();

    const { toCanvas } = makeProjector();

    // percentage of computed time we are drawing
    const factor = parseFloat(timeSlider.value) / parseFloat(timeSlider.max);

    paths.forEach((pts, i) => {
        const l = pts.length;
        if (l === 0) {
            return;
        }
        ctx.beginPath();
        const [x0, y0] = toCanvas(pts[0][0], pts[0][1]);
        ctx.moveTo(x0, y0);
        let k = 1;
        for (k = 1; k < l && times[k] < factor * times[times.length - 1]; k++) {
            const [x, y] = toCanvas(pts[k][0], pts[k][1]);
            ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2.0; ctx.strokeStyle = colors[i]; ctx.stroke();

        // Start marker
        const [sx, sy] = toCanvas(pts[0][0], pts[0][1]);
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.strokeStyle = colors[i]; ctx.stroke();

        // End marker
        const [ex, ey] = toCanvas(pts[k - 1][0], pts[k - 1][1]);
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fillStyle = colors[i]; ctx.fill();
    });
}

function play_loop() {
    const sliderValue = parseFloat(timeSlider.value);
    const maxTime = parseFloat(timeSlider.max);
    if (sliderValue >= maxTime) {
        timeSlider.value = '0';
    } else {
        timeSlider.value = (sliderValue + 1).toString();
    }
    draw();
    if (runButton.innerText === 'Pause') {
        requestAnimationFrame(play_loop);
    }
}

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
            // ignored for 2D plot
            // const z = result[base + b*3 + 2];
            paths[b].push([x, y]);
        }
        times.push(result[base + 9]);
    }
    return { paths, times };
}

function run() {
    runButton.disabled = true;
    statusEl.classList.remove('error');
    try {
        const method = methodEl.value; // 'rk4' or 'verlet'
        const t = Number(timeEl.value);
        if (!isFinite(t) || t <= 0) {
            throw new Error('Time t must be a positive number.');
        }

        const ic = readIC2D();
        masses = [ic[6], ic[13], ic[20]];
        energy = total_energy(ic);
        angularMomentum = total_angular_momentum(ic);

        const t0 = performance.now();
        const result = evolve(ic, t, method); // throws on Err(String)
        const t1 = performance.now();

        const x = reshapeResultToPaths(result);
        paths = x.paths;
        times = x.times;
        play_loop();

        const steps = result.length / 10;
        statusEl.textContent = `OK — steps: ${steps.toLocaleString()} | points/body: ${paths[0].length.toLocaleString()} | compute: ${(t1 - t0).toFixed(1)} ms`;
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Error: ' + (err?.message || String(err));
        statusEl.classList.add('error');
    } finally {
        runButton.disabled = false;
    }
}

runButton.addEventListener('click', () => {
    if (runButton.innerText === 'Play') {
        runButton.innerText = 'Pause';
        play_loop();
    } else {
        runButton.innerText = 'Play';
        run();
    }
});
window.addEventListener('resize', draw);
timeSlider.addEventListener('input', draw);
exampleClassDropdown.addEventListener('change', () => {
    fill_example_dropdown();
    setDefaults();
    run();
});
exampleSelect.addEventListener('change', () => {
    setDefaults();
    run();
});



// First render with defaults
fill_example_dropdown();
setDefaults();
run();