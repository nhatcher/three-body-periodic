
import init, { evolve, total_energy, total_angular_momentum } from '../wasm/three_body_wasm.js';
import examples from './3d_examples.js';

await init();

// Globals
const colors = ['#e74c3c', '#3498db', '#2ecc71'];
const canvas = document.getElementById('plot');
const wrap = document.getElementById('canvasWrap');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const timeEl = document.getElementById('time');
const runButton = document.getElementById('run');
const timeSlider = document.getElementById('control-time');
const exampleClassDropdown = document.getElementById('example-class');
const exampleSelect = document.getElementById('example');

// paths: [ [ [x,y], ... ], [ ... ], [ ... ] ]
let paths = [[], [], []];
let masses = [1, 1, 1];
let times = [];

async function readIC2D() {
    const [data, t] = await examples.getOrbitData(exampleSelect.value);
    timeEl.value = t.toString();
    return data;
}

async function fill_example_dropdown() {
    const exampleClass = exampleClassDropdown.value;

    // Clear existing options
    exampleSelect.innerHTML = '';
    (await examples.getNames()).forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        exampleSelect.appendChild(option);
    });

}


// Simple orbit camera
const camera = {
    yaw: 0.7,               // radians
    pitch: 0.35,            // radians (-π/2..π/2)
    zoom: 2.8,              // multiples of bounding radius (bigger -> farther)
    fov: 55 * Math.PI / 180 // perspective field of view
};

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

function drawCubeTicks3D() {
    const { min, max, radius } = computeAABB3D();
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const { toCanvas3D } = makeProjector3D();

    const stepX = niceStep(maxX - minX, 8);
    const stepY = niceStep(maxY - minY, 8);
    const stepZ = niceStep(maxZ - minZ, 8);

    const tickLen = 0.04 * radius; // world-units for tick length

    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(203,213,225,0.85)'; // slate-300
    ctx.fillStyle   = 'rgba(203,213,225,0.9)';
    ctx.font = '12px sans-serif';

    // --- X axis ticks (edge: y=minY, z=minZ)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(minX / stepX) * stepX; x <= maxX + 1e-12; x += stepX) {
        const A = toCanvas3D(x, minY, minZ);
        const B = toCanvas3D(x, minY + tickLen, minZ); // tick outward in +Y
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();

        // label near B, with tiny screen-space nudge down
        ctx.fillText(formatTick(x, stepX), B[0], B[1] + 4);
    }

    // --- Y axis ticks (edge: x=minX, z=minZ)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(minY / stepY) * stepY; y <= maxY + 1e-12; y += stepY) {
        const A = toCanvas3D(minX, y, minZ);
        const B = toCanvas3D(minX + tickLen, y, minZ); // tick outward in +X
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();

        // label a bit left of A
        ctx.fillText(formatTick(y, stepY), A[0] - 6, A[1]);
    }

    // --- Z axis ticks (edge: x=minX, y=minY)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let z = Math.ceil(minZ / stepZ) * stepZ; z <= maxZ + 1e-12; z += stepZ) {
        const A = toCanvas3D(minX, minY, z);
        const B = toCanvas3D(minX + tickLen, minY, z); // tick outward in +X
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();

        // label to the right of B
        ctx.fillText(formatTick(z, stepZ), B[0] + 6, B[1]);
    }

    // axis captions
    const Xcap = toCanvas3D(maxX, minY + tickLen * 1.2, minZ);
    const Ycap = toCanvas3D(minX + tickLen * 1.2, maxY, minZ);
    const Zcap = toCanvas3D(minX + tickLen * 1.2, minY, maxZ);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('x', Xcap[0], Xcap[1] + 2);
    ctx.textAlign = 'right';  ctx.textBaseline = 'middle'; ctx.fillText('y', Ycap[0] - 2, Ycap[1]);
    ctx.textAlign = 'left';   ctx.textBaseline = 'middle'; ctx.fillText('z', Zcap[0] + 2, Zcap[1]);

    ctx.restore();
}



function computeAABB3D() {
    let minX=+Infinity, minY=+Infinity, minZ=+Infinity, maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity;
    for (const path of paths) for (const p of path) {
        const [x,y,z] = p;
        if (x<minX) minX=x; if (x>maxX) maxX=x;
        if (y<minY) minY=y; if (y>maxY) maxY=y;
        if (z<minZ) minZ=z; if (z>maxZ) maxZ=z;
    }
    if (!isFinite(minX)) { minX=-1;maxX=1;minY=-1;maxY=1;minZ=-1;maxZ=1; }
    const cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;
    const dx=maxX-minX, dy=maxY-minY, dz=maxZ-minZ;
    const radius = 0.5 * Math.hypot(dx,dy,dz) || 1;
    return { min:[minX,minY,minZ], max:[maxX,maxY,maxZ], center:[cx,cy,cz], radius };
}

function drawGroundGrid3D() {
    const { min, max, radius } = computeAABB3D();
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const { toCanvas3D } = makeProjector3D();

    const stepX = niceStep(maxX - minX, 8);
    const stepY = niceStep(maxY - minY, 8);
    const stepZ = niceStep(maxZ - minZ, 8);

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148,163,184,0.22)'; // slate-400 @ 22%

    // X-Y plane
    // X-directed lines (vary Y)
    for (let y = Math.ceil(minY / stepY) * stepY; y <= maxY + 1e-12; y += stepY) {
        const A = toCanvas3D(minX, y, minZ);
        const B = toCanvas3D(maxX, y, minZ);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    // Y-directed lines (vary X)
    for (let x = Math.ceil(minX / stepX) * stepX; x <= maxX + 1e-12; x += stepX) {
        const A = toCanvas3D(x, minY, minZ);
        const B = toCanvas3D(x, maxY, minZ);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }

    // Y-Z plane
    // Y-directed lines (vary Z)
    for (let z = Math.ceil(minZ / stepZ) * stepZ; z <= maxZ + 1e-12; z += stepZ) {
        const A = toCanvas3D(minX, minY, z);
        const B = toCanvas3D(minX, maxY, z);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    // Z-directed lines (vary Y)
    for (let y = Math.ceil(minY / stepY) * stepY; y <= maxY + 1e-12; y += stepY) {
        const A = toCanvas3D(minX, y, minZ);
        const B = toCanvas3D(minX, y, maxZ);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }

    // X-Z plane
    // X-directed lines (vary Z)
    for (let z = Math.ceil(minZ / stepZ) * stepZ; z <= maxZ + 1e-12; z += stepZ) {
        const A = toCanvas3D(minX, minY, z);
        const B = toCanvas3D(maxX, minY, z);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    // Z-directed lines (vary X)
    for (let x = Math.ceil(minX / stepX) * stepX; x <= maxX + 1e-12; x += stepX) {
        const A = toCanvas3D(x, minY, minZ);
        const B = toCanvas3D(x, minY, maxZ);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }

    ctx.restore();
}

function drawBoundingBox3D() {
    const { min, max } = computeAABB3D();
    const { toCanvas3D, worldToView } = makeProjector3D();

    const [minX,minY,minZ] = min, [maxX,maxY,maxZ] = max;
    const C = [
        [minX,minY,minZ], [maxX,minY,minZ], [maxX,maxY,minZ], [minX,maxY,minZ], // bottom
        [minX,minY,maxZ], [maxX,minY,maxZ], [maxX,maxY,maxZ], [minX,maxY,maxZ], // top
    ];
    const E = [
        [0,1],[1,2],[2,3],[3,0], // bottom
        [4,5],[5,6],[6,7],[7,4], // top
        [0,4],[1,5],[2,6],[3,7], // pillars
    ];

    // Depth-sort edges by average view-space z (farther first)
    const edges = E.map(([a,b]) => {
        const za = worldToView(...C[a])[2];
        const zb = worldToView(...C[b])[2];
        return { a, b, depth: (za + zb) / 2, za, zb };
    }).sort((e1, e2) => e1.depth - e2.depth);

    // Back edges (dashed, lighter)
    ctx.save();
    ctx.lineWidth = 1;
    for (const e of edges) {
        if ((e.za + e.zb) / 2 >= 0) continue; // draw only "back" first
        const A = toCanvas3D(...C[e.a]);
        const B = toCanvas3D(...C[e.b]);
        ctx.setLineDash([5,5]);
        ctx.strokeStyle = 'rgba(148,163,184,0.4)'; // slate-400 @ 40%
        ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke();
    }

    // Front edges (solid, brighter)
    ctx.setLineDash([]);
    for (const e of edges) {
        if ((e.za + e.zb) / 2 < 0) continue;
        const A = toCanvas3D(...C[e.a]);
        const B = toCanvas3D(...C[e.b]);
        ctx.strokeStyle = 'rgba(203,213,225,0.9)'; // slate-300 @ 90%
        ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke();
    }
    ctx.restore();
}



function computeBounds3D() {
    let minX = +Infinity, minY = +Infinity, minZ = +Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const path of paths) for (const p of path) {
        const [x, y, z] = p;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    if (!isFinite(minX)) { minX = -1; maxX = 1; minY = -1; maxY = 1; minZ = -1; maxZ = 1; }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ;
    const radius = 0.5 * Math.hypot(dx, dy, dz) || 1; // bounding sphere radius
    return { center: [cx, cy, cz], radius };
}

// 3D -> screen projector
function makeProjector3D() {
    const { center, radius } = computeBounds3D();
    const w = canvas.clientWidth, h = canvas.clientHeight;

    // Scale to fit 90% of the smaller screen dimension
    const s = 0.9 * 0.5 * Math.min(w, h) / radius;

    // Camera distance (relative to radius). Larger = farther (less perspective)
    const d = Math.max(1.5, camera.zoom) * radius;

    const cyaw = Math.cos(camera.yaw), syaw = Math.sin(camera.yaw);
    const cp = Math.cos(camera.pitch), sp = Math.sin(camera.pitch);

    function worldToView(x, y, z) {
        // center the object
        const tx = x - center[0];
        const ty = y - center[1];
        const tz = z - center[2];

        // yaw (Y), then pitch (X)
        const xr = cyaw * tx + syaw * tz;
        const zr = -syaw * tx + cyaw * tz;
        const yr = cp * ty - sp * zr;
        const zr2 = sp * ty + cp * zr;
        return [xr, yr, zr2];
    }

    function toCanvas3D(x, y, z) {
        const [xr, yr, zr] = worldToView(x, y, z);
        const persp = d / (d - zr);     // simple perspective scale
        const cx = w * 0.5 + (xr * s) * persp;
        const cy = h * 0.5 - (yr * s) * persp;
        return [cx, cy, zr];
    }

    return { toCanvas3D, worldToView, radius, d, s };
}


function draw3D() {
    resizeCanvas();
    // drawLegend();
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const { toCanvas3D, radius } = makeProjector3D();

    // 1) Bounding cube first
    drawBoundingBox3D();
    drawGroundGrid3D();
    drawCubeTicks3D();

    // 2) Orientation triad
    // drawAxisTriad3D();

    // percentage of computed time we are drawing
    const factor = parseFloat(timeSlider.value) / parseFloat(timeSlider.max);
    const tLimit = factor * times[times.length - 1];

    // Draw each body's 3D polyline
    paths.forEach((pts, i) => {
        const l = pts.length;
        if (!l) return;

        ctx.beginPath();
        let k = 0;

        let p = toCanvas3D(pts[0][0], pts[0][1], pts[0][2]);
        ctx.moveTo(p[0], p[1]);

        for (k = 1; k < l && times[k] <= tLimit; k++) {
            p = toCanvas3D(pts[k][0], pts[k][1], pts[k][2]);
            ctx.lineTo(p[0], p[1]);
        }
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = colors[i];
        ctx.stroke();

        // Start marker
        const [sx, sy] = toCanvas3D(pts[0][0], pts[0][1], pts[0][2]);
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.strokeStyle = colors[i]; ctx.stroke();

        // End marker
        const [ex, ey] = toCanvas3D(pts[Math.max(0, k - 1)][0], pts[Math.max(0, k - 1)][1], pts[Math.max(0, k - 1)][2]);
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.fillStyle = colors[i]; ctx.fill();
    });
}

// Corner axis triad for orientation
function drawAxisTriad3D() {
    const { toCanvas3D, radius } = makeProjector3D();
    const len = radius; // triad length in world units

    const O = toCanvas3D(0, 0, 0);
    const X = toCanvas3D(len, 0, 0);
    const Y = toCanvas3D(0, len, 0);
    const Z = toCanvas3D(0, 0, len);

    function line(a, b, color) {
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    }
    line(O, X, '#ef4444'); // x (red)
    line(O, Y, '#22c55e'); // y (green)
    line(O, Z, '#3b82f6'); // z (blue)

    ctx.font = '12px sans-serif'; ctx.fillStyle = '#cbd5e1';
    ctx.fillText('x', X[0] + 4, X[1] + 4);
    ctx.fillText('y', Y[0] + 4, Y[1] + 4);
    ctx.fillText('z', Z[0] + 4, Z[1] + 4);
}

function play_loop() {
    const sliderValue = parseFloat(timeSlider.value);
    const maxTime = parseFloat(timeSlider.max);
    if (sliderValue >= maxTime) {
        timeSlider.value = '0';
    } else {
        timeSlider.value = (sliderValue + 1).toString();
    }
    draw3D();
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
            const z = result[base + b * 3 + 2];
            paths[b].push([x, y, z]);
        }
        times.push(result[base + 9]);
    }
    return { paths, times };
}

async function run() {
    runButton.disabled = true;
    statusEl.classList.remove('error');
    try {
        const t = parseFloat(timeEl.value);
        if (!isFinite(t) || t <= 0) {
            throw new Error('Time t must be a positive number.');
        }

        // Read the initial conditions and compute the orbit parameters
        const ic = await readIC2D();
        masses = [ic[6], ic[13], ic[20]];
        // energy = total_energy(ic);
        // angularMomentum = total_angular_momentum(ic);

        const t0 = performance.now();
        // method: 'dop853', 'rk4' or 'verlet'
        // dop853 outperforms rk4 and verlet in all circumstances
        // throws on Err(String)
        const result = evolve(ic, t, "dop853");
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
window.addEventListener('resize', draw3D);
timeSlider.addEventListener('input', draw3D);

// Mouse drag to orbit
let dragging = false, lastX = 0, lastY = 0;

canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', (e) => {
    if (!dragging) {
        return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    camera.yaw += dx * 0.01;
    camera.pitch += dy * 0.01;
    camera.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, camera.pitch));
    draw3D();
});

// Wheel to zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = Math.pow(1.001, e.deltaY);
    camera.zoom = Math.min(10, Math.max(1.2, camera.zoom * factor));
    draw3D();
}, { passive: false });

// End mouse controls

exampleSelect.addEventListener('change', () => {
    readIC2D();
    run();
});

await fill_example_dropdown();
await run();