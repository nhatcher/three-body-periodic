
import { resizeCanvas } from "./common.js";
import { drawLegend } from "./common.js";
import { niceStep, formatTick } from "./util.js";
import { colors } from "./common.js";


// Globals
// const colors = ['#e74c3c', '#3498db', '#2ecc71'];
const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const timeSlider = document.getElementById('control-time');
const exampleClassDropdown = document.getElementById('example-class');


// Simple orbit camera
const camera = {
    yaw: 0.7,               // radians
    pitch: 0.35,            // radians (-π/2..π/2)
    zoom: 2.8,              // multiples of bounding radius (bigger -> farther)
    fov: 55 * Math.PI / 180 // perspective field of view
};

function drawCubeTicks3D(paths) {
    const { min, max, radius } = computeAABB3D(paths);
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const { toCanvas3D } = makeProjector3D(paths);

    const stepX = niceStep(maxX - minX, 8);
    const stepY = niceStep(maxY - minY, 8);
    const stepZ = niceStep(maxZ - minZ, 8);

    const tickLen = 0.04 * radius; // world-units for tick length

    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(203,213,225,0.85)'; // slate-300
    ctx.fillStyle = 'rgba(203,213,225,0.9)';
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
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('y', Ycap[0] - 2, Ycap[1]);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('z', Zcap[0] + 2, Zcap[1]);

    ctx.restore();
}



function computeAABB3D(paths) {
    let minX = +Infinity, minY = +Infinity, minZ = +Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const path of paths) {
        for (const p of path) {
            const [x, y, z] = p;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
    }
    if (!isFinite(minX)) {
        minX = -1;
        maxX = 1;
        minY = -1;
        maxY = 1;
        minZ = -1;
        maxZ = 1;
    }
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ;
    const radius = 0.5 * Math.hypot(dx, dy, dz) || 1;
    return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ], center: [cx, cy, cz], radius };
}

function drawGroundGrid3D(paths) {
    const { min, max } = computeAABB3D(paths);
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const { toCanvas3D } = makeProjector3D(paths);

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

function drawBoundingBox3D(paths) {
    const { min, max } = computeAABB3D(paths);
    const { toCanvas3D, worldToView } = makeProjector3D(paths);

    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const C = [
        [minX, minY, minZ], [maxX, minY, minZ], [maxX, maxY, minZ], [minX, maxY, minZ], // bottom
        [minX, minY, maxZ], [maxX, minY, maxZ], [maxX, maxY, maxZ], [minX, maxY, maxZ], // top
    ];
    const E = [
        [0, 1], [1, 2], [2, 3], [3, 0], // bottom
        [4, 5], [5, 6], [6, 7], [7, 4], // top
        [0, 4], [1, 5], [2, 6], [3, 7], // pillars
    ];

    // Depth-sort edges by average view-space z (farther first)
    const edges = E.map(([a, b]) => {
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
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(148,163,184,0.4)'; // slate-400 @ 40%
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }

    // Front edges (solid, brighter)
    ctx.setLineDash([]);
    for (const e of edges) {
        if ((e.za + e.zb) / 2 < 0) continue;
        const A = toCanvas3D(...C[e.a]);
        const B = toCanvas3D(...C[e.b]);
        ctx.strokeStyle = 'rgba(203,213,225,0.9)'; // slate-300 @ 90%
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    ctx.restore();
}



function computeBounds3D(paths) {
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
function makeProjector3D(paths) {
    const { center, radius } = computeBounds3D(paths);
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


function draw3D(paths, times, masses, energy, angularMomentum, period) {
    resizeCanvas();
    drawLegend(masses, energy, angularMomentum, period);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const { toCanvas3D, radius } = makeProjector3D(paths);

    // 1) Bounding cube first
    drawBoundingBox3D(paths);
    drawGroundGrid3D(paths);
    drawCubeTicks3D(paths);

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


// Mouse drag to orbit
let dragging = false, lastX = 0, lastY = 0;

canvas.addEventListener('mousedown', (e) => {
    if (exampleClassDropdown.value === '3d_examples') {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    }
});
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', (e) => {
    if (!dragging || exampleClassDropdown.value !== '3d_examples') {
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
    if (exampleClassDropdown.value !== '3d_examples') {
        return;
    }
    e.preventDefault();
    const factor = Math.pow(1.001, e.deltaY);
    camera.zoom = Math.min(10, Math.max(1.2, camera.zoom * factor));
    draw3D();
}, { passive: false });

// End mouse controls

export { draw3D };
