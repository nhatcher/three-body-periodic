const colors = ['#e74c3c', '#3498db', '#2ecc71'];

function resizeCanvas() {
    const canvas = document.getElementById('plot');
    const wrap = document.getElementById('canvasWrap');

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(320, wrap.clientWidth);
    const h = Math.max(240, wrap.clientHeight);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawLegend(masses, energy, angularMomentum, period) {
    const legendContent = document.getElementById('legend-content');
    const legend = document.getElementById('legend');
    if (legend.dataset.display === 'false') {
        legendContent.innerHTML = '';
        return;
    }
    legendContent.innerHTML = '';
    ['Body 1', 'Body 2', 'Body 3'].forEach((label, i) => {
        const row = document.createElement('div');
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = colors[i];
        const txt = document.createElement('span');
        txt.textContent = `${label}  (m = ${masses[i]})`;
        row.appendChild(sw);
        row.appendChild(txt);
        legendContent.appendChild(row);
    });

    // Energy
    const row = document.createElement('div');
    const txt = document.createElement('span');
    txt.textContent = `Energy: ${energy}`;
    row.appendChild(txt);
    legendContent.appendChild(row);

    // Angular Momentum
    const row2 = document.createElement('div');
    const txt2 = document.createElement('span');
    txt2.textContent = `Angular Momentum: ${angularMomentum[2]}`;
    row2.appendChild(txt2);
    legendContent.appendChild(row2);

    // Period
    const row3 = document.createElement('div');
    const txt3 = document.createElement('span');
    txt3.textContent = `Period: ${period} seconds`;
    row3.appendChild(txt3);
    legendContent.appendChild(row3);
}

export { drawLegend, resizeCanvas, colors };