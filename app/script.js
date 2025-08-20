
import init, { evolve } from './pkg/three_body_wasm.js';
import bhh_table_4 from './examples/bhh_satellites_table_4.js';
import bhh_table_3 from './examples/bhh_satellites_table_3.js';
import unequal_mass from './examples/unequal_mass.js';
import choreographies from './examples/choreographies.js';
import free_fall from './examples/free_fall.js';
import free_fall_8_6 from './examples/free_fall_8_6.js';
import free_fall_8_2 from './examples/free_fall_8_2.js';

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

let paths = [[], [], []];
let masses = [1, 1, 1];


function getExampleValues() {
    const exampleClass = exampleClassDropdown.value;
    const example = exampleSelect.value;
    let values;
    switch (exampleClass) {
        case 'bhh_satellites_table_4':
            switch (example) {
                case 'getExampleA':
                    values = bhh_table_4.getExampleA();
                    break;
                case 'getExampleB':
                    values = bhh_table_4.getExampleB();
                    break;
                case 'getExampleC':
                    values = bhh_table_4.getExampleC();
                    break;
                case 'getExampleD':
                    values = bhh_table_4.getExampleD();
                    break;
                case 'getExampleE':
                    values = bhh_table_4.getExampleE();
                    break;
                case 'getExampleF':
                    values = bhh_table_4.getExampleF();
                    break;
                default:
                    throw new Error(`Unknown example: ${example}`);
            }
            break;
        case 'bhh_satellites_table_3':
            switch (example) {
                case 'getExampleA':
                    values = bhh_table_3.getExampleA();
                    break;
                case 'getExampleB':
                    values = bhh_table_3.getExampleB();
                    break;
                case 'getExampleC':
                    values = bhh_table_3.getExampleC();
                    break;
                case 'getExampleD':
                    values = bhh_table_3.getExampleD();
                    break;
                case 'getExampleE':
                    values = bhh_table_3.getExampleE();
                    break;
                case 'getExampleF':
                    values = bhh_table_3.getExampleF();
                    break;
                default:
                    throw new Error(`Unknown example: ${example}`);
            }
            break;
        case 'choreographies':
            switch (example) {
                case 'getEight':
                    values = choreographies.getEight();
                    break;
                case 'getLagrange':
                    values = choreographies.getLagrange();
                    break;
                case 'getEuler':
                    values = choreographies.getEuler();
                    break;
                default:
                    throw new Error(`Unknown example: ${example}`);
            }
            break;
        case 'free_fall':
            switch (example) {
                case 'getExample1':
                    values = free_fall.getExample1();
                    break;
                case 'getExample2':
                    values = free_fall.getExample2();
                    break;
                case 'getExample3':
                    values = free_fall.getExample3();
                    break;
                default:
                    throw new Error(`Unknown example: ${example}`);
            }
            break;
        case 'free_fall_8_6':
            values = free_fall_8_6[example]();
            break;
        case 'free_fall_8_2':
            values = free_fall_8_2[example]();
            break;
        case 'unequal_mass':
            switch (example) {
                case 'getExample1':
                    values = unequal_mass.getExample1();
                    break;
                case 'getExample2':
                    values = unequal_mass.getExample2();
                    break;
                case 'getExample3':
                    values = unequal_mass.getExample3();
                    break;
                default:
                    throw new Error(`Unknown example: ${example}`);
            }
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
    switch (exampleClass) {
        case 'bhh_satellites_table_4':
            examples = bhh_table_4;
            break;
        case 'bhh_satellites_table_3':
            examples = bhh_table_3;
            break;
        case 'unequal_mass':
            examples = unequal_mass;
            break;
        case 'choreographies':
            examples = choreographies;
            break;
        case 'free_fall':
            examples = free_fall;
            break;
        case 'free_fall_8_6':
            examples = free_fall_8_6;
            break;
        case 'free_fall_8_6':
            examples = free_fall_8_6;
            break;
        case 'free_fall_8_2':
            examples = free_fall_8_2;
            break;
        default:
            throw new Error(`Unknown example class: ${exampleClass}`);
    }

    // Populate the example dropdown
    for (const [key, value] of Object.entries(examples)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        exampleSelect.appendChild(option);
    }
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

function computeBounds(paths) {
    // paths: [ [ [x,y], ... ], [ ... ], [ ... ] ]
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
    const bounds = computeBounds(paths);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dx = Math.max(1e-12, bounds.maxX - bounds.minX);
    const dy = Math.max(1e-12, bounds.maxY - bounds.minY);
    const scale = 0.9 * Math.min(w / dx, h / dy); // 10% margin
    const xMargin = (w - scale * dx) / 2;
    const yMargin = (h - scale * dy) / 2;
    return function toCanvas(x, y) {
        const cx = xMargin + scale * (x - bounds.minX);
        const cy = h - (yMargin + scale * (y - bounds.minY)); // y-up
        return [cx, cy];
    }
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

    const toCanvas = makeProjector();

    // percentage of computed time we are drawing
    const factor = parseFloat(timeSlider.value) / parseFloat(timeSlider.max);

    paths.forEach((pts, i) => {
        const l = Math.floor(pts.length * factor);
        if (l === 0) {
            return;
        }
        ctx.beginPath();
        const [x0, y0] = toCanvas(pts[0][0], pts[0][1]);
        ctx.moveTo(x0, y0);
        for (let k = 1; k < l; k++) {
            const [x, y] = toCanvas(pts[k][0], pts[k][1]);
            ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2.0; ctx.strokeStyle = colors[i]; ctx.stroke();

        // Start marker
        const [sx, sy] = toCanvas(pts[0][0], pts[0][1]);
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.strokeStyle = colors[i]; ctx.stroke();

        // End marker
        const [ex, ey] = toCanvas(pts[l - 1][0], pts[l - 1][1]);
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fillStyle = colors[i]; ctx.fill();
    });
}

const MAX_POINTS_PER_BODY = 10_000;
function reshapeResultToPaths(result) {
    // result is Float64Array of length 9 * steps: [x1,y1,z1, x2,y2,z2, x3,y3,z3] per step
    const resultCount = result.length;
    if (resultCount % 9 !== 0) {
        throw new Error('Result length is not a multiple of 9.');
    }
    const stepCount = resultCount / 9;
    const paths = [[], [], []];
    const bigStep = Math.floor(resultCount / Math.min(9 * MAX_POINTS_PER_BODY, resultCount));
    for (let s = 0; s < stepCount; s += bigStep) {
        const base = s * 9;
        for (let b = 0; b < 3; b++) {
            const x = result[base + b * 3 + 0];
            const y = result[base + b * 3 + 1];
            // ignored for 2D plot
            // const z = result[base + b*3 + 2];
            paths[b].push([x, y]);
        }
    }
    return paths;
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

        const t0 = performance.now();
        const result = evolve(ic, t, method); // throws on Err(String)
        console.log(result);
        const t1 = performance.now();

        paths = reshapeResultToPaths(result);
        draw();

        const steps = result.length / 9;
        statusEl.textContent = `OK — steps: ${steps.toLocaleString()} | points/body: ${paths[0].length.toLocaleString()} | compute: ${(t1 - t0).toFixed(1)} ms`;
    } catch (err) {
        console.error(err);
        statusEl.textContent = 'Error: ' + (err?.message || String(err));
        statusEl.classList.add('error');
    } finally {
        runButton.disabled = false;
    }
}

runButton.addEventListener('click', run);
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