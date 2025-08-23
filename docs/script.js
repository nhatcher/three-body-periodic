
import init, { evolve, total_energy, total_angular_momentum } from './wasm/three_body_wasm.js';
import { recordWebM } from './video.js';
import { draw2D } from './2d.js';
import { draw3D } from './3d.js';
import { fill_example_dropdown, readIC2D } from './ic.js';
import { reshapeResultToPaths } from './util.js';

await init();

// Globals
const canvas = document.getElementById('plot');
const statusEl = document.getElementById('status');
const runButton = document.getElementById('run');
const timeSlider = document.getElementById('control-time');
const exampleClassDropdown = document.getElementById('example-class');
const exampleSelect = document.getElementById('example');

// Runtime
let paths = [[], [], []];
let masses = [1, 1, 1];
let times = [];
let energy = 0;
let angularMomentum = [0, 0, 0];
let period = 0;


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



async function run() {
    runButton.disabled = true;
    statusEl.classList.remove('error');
    try {
        // Read the initial conditions and compute the orbit parameters
        const [ic, t] = await readIC2D();
        masses = [ic[6], ic[13], ic[20]];
        energy = total_energy(ic);
        angularMomentum = total_angular_momentum(ic);

        const t0 = performance.now();
        // method: 'dop853', 'rk4' or 'verlet'
        // dop853 outperforms rk4 and verlet in all circumstances
        // throws on Err(String)
        const result = evolve(ic, t, "dop853");
        const t1 = performance.now();

        const x = reshapeResultToPaths(result);
        paths = x.paths;
        times = x.times;
        period = t;

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
        play_loop();
    }
});

function draw() {
    if (exampleClassDropdown.value === '3d_examples') {
        draw3D(paths, times, masses, energy, angularMomentum, period);
    } else {
        draw2D(paths, times, masses, energy, angularMomentum, period);
    }
}

window.addEventListener('resize', draw);
timeSlider.addEventListener('input', draw);
exampleClassDropdown.addEventListener('change', async () => {
    await fill_example_dropdown();
    await run();
    play_loop();
});
exampleSelect.addEventListener('change', async () => {
    await run();
    play_loop();
});


const recordBtn = document.getElementById('record');

recordBtn.addEventListener('click', async () => {
    recordBtn.disabled = true;
    try {
        await recordWebM(timeSlider, canvas, draw);
    } finally {
        recordBtn.disabled = false;
    }
});

// First render with defaults
await fill_example_dropdown();
await run();
play_loop();
