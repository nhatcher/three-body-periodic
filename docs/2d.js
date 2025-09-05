import { resizeCanvas } from "./common.js";
import { drawLegend } from "./common.js";
import { niceStep, formatTick } from "./util.js";
import { colors } from "./common.js";

const canvas = document.getElementById('plot');
const ctx = canvas.getContext('2d');
const timeSlider = document.getElementById('control-time');
let toCanvas, fromCanvas;
const exampleClassDropdown = document.getElementById('example-class');

function computeBounds(paths) {
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

function makeProjector(paths) {
    const bounds = computeBounds(paths);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dx = Math.max(1e-12, bounds.maxX - bounds.minX);
    const dy = Math.max(1e-12, bounds.maxY - bounds.minY);
    const scale = 0.9 * Math.min(w / dx, h / dy); // 10% margin
    const xMargin = (w - scale * dx) / 2;
    const yMargin = (h - scale * dy) / 2;
    toCanvas = (x, y) => {
        const cx = xMargin + scale * (x - bounds.minX);
        const cy = h - (yMargin + scale * (y - bounds.minY)); // y-up
        return [cx, cy];
    };
    fromCanvas = (cx, cy) => {
        const x = (cx - xMargin) / scale + bounds.minX;
        const y = bounds.maxY - (cy - yMargin) / scale;
        return [x, y];
    }

    return { toCanvas, fromCanvas };
}

// draws a subtle grid in the background
function drawGrid() {
    const [minX, maxY] = fromCanvas(0, 0);
    const [maxX, minY] = fromCanvas(canvas.clientWidth, canvas.clientHeight);

    // Tick step
    const xStep = niceStep(maxX - minX, 8);
    const yStep = niceStep(maxY - minY, 8);
    ctx.save();
    ctx.globalAlpha = 0.8;

    for (let xVal = Math.ceil(minX / xStep) * xStep; xVal < maxX; xVal += xStep) {
        const [tx, _] = toCanvas(xVal, minY); // map to canvas X pos
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx, canvas.clientHeight);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1b2647';
        ctx.stroke();
    }
    for (let yVal = Math.ceil(minY / yStep) * yStep; yVal < maxY; yVal += yStep) {
        const [_, ty] = toCanvas(minX, yVal); // map to canvas Y pos
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(canvas.clientWidth, ty);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1b2647';
        ctx.stroke();
    }
    ctx.restore();
}


function drawAxis() {
    ctx.save();

    // Styles
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.font = '12px sans-serif';

    const [minX, maxY] = fromCanvas(0, 0);
    const [maxX, minY] = fromCanvas(canvas.clientWidth, canvas.clientHeight);

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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let xVal = Math.ceil(minX / xStep) * xStep; xVal < maxX; xVal += xStep) {
        const [tx, _] = toCanvas(xVal, minY);
        ctx.beginPath();
        ctx.moveTo(tx, xAxisY);
        ctx.lineTo(tx, xAxisY - tick);
        ctx.stroke();
        ctx.fillText(formatTick(xVal, xStep), tx, xAxisY - tick - labelPad);
    }


    // Y ticks & labels
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let yVal = Math.ceil(minY / yStep) * yStep; yVal < maxY; yVal += yStep) {
        const [_, ty] = toCanvas(minX, yVal);
        ctx.beginPath();
        ctx.moveTo(yAxisX, ty);
        ctx.lineTo(yAxisX + tick, ty);
        ctx.stroke();
        ctx.fillText(formatTick(yVal, yStep), yAxisX + tick + labelPad, ty);
    }


    ctx.restore();
}


function rotate(p, q, w, time) {
    if (w === 0) {
        return [p, q];
    }
    const 𝜃 = -w*time;
    const p1 = p*Math.cos(𝜃) - q*Math.sin(𝜃);
    const q1 = p*Math.sin(𝜃) + q*Math.cos(𝜃);
    return [p1, q1];
}

function draw2D(paths, times, masses, energy, angularMomentum, period, 𝜃_max) {
    resizeCanvas();
    drawLegend(masses, energy, angularMomentum, period);

    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    makeProjector(paths);
    attachCoordEventsOnce();

    drawGrid();
    drawAxis();

    // percentage of computed time we are drawing
    const factor = parseFloat(timeSlider.value) / parseFloat(timeSlider.max);
    const w = 𝜃_max / period;

    paths.forEach((pts, i) => {
        const l = pts.length;
        if (l === 0) {
            return;
        }
        ctx.beginPath();
        const [x0, y0] = toCanvas(pts[0][0], pts[0][1]);
        ctx.moveTo(x0, y0);
        let k = 1;
        for (k = 1; k < l && times[k] <= factor * period; k++) {
            const [p1, q1] = rotate(pts[k][0], pts[k][1], w, times[k]);
            const [x, y] = toCanvas(p1, q1);
            ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2.0; ctx.strokeStyle = colors[i]; ctx.stroke();

        // Start marker
        const [sx, sy] = toCanvas(pts[0][0], pts[0][1]);
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.strokeStyle = colors[i]; ctx.stroke();

        // End marker
        const [p, q] = rotate(pts[k - 1][0], pts[k - 1][1], w, times[k-1]);
        const [ex, ey] = toCanvas(p, q);
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fillStyle = colors[i]; ctx.fill();
    });
}

function clear2D() {
    resizeCanvas();
    ctx.save();
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const humanTime = new Date().toLocaleTimeString();
    const textContent = `Computing. Started at ${humanTime} (this may take a while)...`;
    ctx.font = '32px sans-serif';
    ctx.fillStyle = '#df4e35ff';
    const textWidth = ctx.measureText(textContent).width;
    ctx.fillText(textContent, (canvas.clientWidth - textWidth) / 2, canvas.clientHeight / 2);
    ctx.restore();
}




const coordsEl = document.getElementById('coords');

function onMouseMove(e) {
  if (!fromCanvas || exampleClassDropdown.value === '3d_examples') {
    coordsEl.textContent = '';
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const [x, y] = fromCanvas(cx, cy);
  coordsEl.textContent = `x: ${x}   y: ${y}`;
}

function onMouseLeave() {
  coordsEl.textContent = '';
}

// Attach once
let coordsEventsAttached = false;
function attachCoordEventsOnce() {
  if (coordsEventsAttached) return;
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  coordsEventsAttached = true;
}


export { draw2D, clear2D };