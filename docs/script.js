import { recordWebM } from './video.js';
import { clear2D, draw2D } from './2d.js';
import { draw3D } from './3d.js';
import { fill_example_dropdown, readIC2D } from './ic.js';
import { reshapeResultToPaths } from './util.js';


const simWorker = new Worker(new URL('./sim-worker.js', import.meta.url), { type: 'module' });

let workerReady = new Promise((resolve) => {
    const onMsg = (evt) => {
        if (evt.data?.type === 'ready') {
            simWorker.removeEventListener('message', onMsg);
            resolve();
        }
    };
    simWorker.addEventListener('message', onMsg);
});

await workerReady;

// Globals
const canvas = document.getElementById('plot');
const statusEl = document.getElementById('status');
const runButton = document.getElementById('run');
const timeSlider = document.getElementById('control-time');
const exampleClassDropdown = document.getElementById('example-class');
const exampleSelect = document.getElementById('example');
const methodSelect = document.getElementById('method');

// Runtime
let paths = [[], [], []];
let masses = [1, 1, 1];
let times = [];
let energy = 0;
let angularMomentum = [0, 0, 0];
let period = 0;
let 𝜃_max = 0;  // max angle (for BHH examples)


// For racing requests (dropdown changes quickly, etc.)
let nextRequestId = 1;
let latestRequestId = 0;


function play_loop() {
    if (runButton.innerText === 'Pause') {
        const sliderValue = parseFloat(timeSlider.value);
        const maxTime = parseFloat(timeSlider.max);
        if (sliderValue >= maxTime) {
            timeSlider.value = '0';
        } else {
            timeSlider.value = (sliderValue + 1).toString();
        }
        draw();
        requestAnimationFrame(play_loop);
    } else {
        draw();
    }
}



async function run() {
    runButton.innerText = 'Play';
    runButton.disabled = true;
    statusEl.classList.remove('error');
    try {
        // Read the initial conditions and compute the orbit parameters
        const [icRaw, t, theta_max] = await readIC2D();
        masses = [icRaw[6], icRaw[13], icRaw[20]];
        period = t;
        𝜃_max = theta_max || 0;

        const ic = new Float64Array(icRaw);

        // Kick off worker job
        const requestId = nextRequestId++;
        latestRequestId = requestId;

        const resultPromise = new Promise((resolve, reject) => {
            const onMessage = (evt) => {
                const msg = evt.data;
                if (!msg || msg.requestId !== requestId) {
                    return;
                }

                simWorker.removeEventListener('message', onMessage);

                if (msg.type === 'error') {
                    reject(new Error(msg.message));
                } else {
                    resolve(msg);
                }
            };
            simWorker.addEventListener('message', onMessage);
        });
        const method = methodSelect.value;
        if (method === 'feagin14') {
            clear2D();
        }

        // Post to worker; transfer the IC buffer (we won't need it again on main)
        simWorker.postMessage({ requestId, ic, t, method }, [ic.buffer]);

        const { result, energy: E, angularMomentum: L, computeMs } = await resultPromise;

        // Ignore stale responses (if the user changed selection mid-flight)
        if (requestId !== latestRequestId) {
            return;
        }

        energy = E;
        angularMomentum = Array.from(L);


        const x = reshapeResultToPaths(result);
        paths = x.paths;
        times = x.times;

        const steps = result.length / 10;
        statusEl.textContent = `OK — steps: ${steps.toLocaleString()} | points/body: ${paths[0].length.toLocaleString()} | compute: ${computeMs.toFixed(1)} ms`;
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
        play_loop();
    }
});

function draw() {
    if (exampleClassDropdown.value === '3d_examples') {
        draw3D(paths, times, masses, energy, angularMomentum, period);
    } else {
        draw2D(paths, times, masses, energy, angularMomentum, period, 𝜃_max);
    }
}

window.addEventListener('resize', draw);
timeSlider.addEventListener('input', draw);
exampleClassDropdown.addEventListener('change', async () => {
    await fill_example_dropdown();
    updateUrl();
    await run();
    play_loop();
});
exampleSelect.addEventListener('change', async () => {
    updateUrl();
    await run();
    play_loop();
});
methodSelect.addEventListener('change', async () => {
    await run();
    play_loop();
});

function updateUrl() {
    const params = new URLSearchParams(window.location.search);

    params.set("class", exampleClassDropdown.value);
    params.set("index", exampleSelect.value);

    const newUrl = window.location.pathname + "?" + params.toString();

    // We don’t want to clutter history (otherwise we could use pushState)
    window.history.replaceState({}, "", newUrl);
}

document.getElementById('canvasWrap').addEventListener('keydown', (evt) => {
    switch (evt.key) {
        case 'ArrowLeft':
            // choose the previous example in dropdown
            exampleSelect.selectedIndex = (exampleSelect.selectedIndex - 1 + exampleSelect.options.length) % exampleSelect.options.length;
            exampleSelect.dispatchEvent(new Event('change'));
            evt.preventDefault();
            break;
        case 'ArrowRight':
            // choose the next example in dropdown
            exampleSelect.selectedIndex = (exampleSelect.selectedIndex + 1) % exampleSelect.options.length;
            exampleSelect.dispatchEvent(new Event('change'));
            evt.preventDefault();
            break;
        case ' ':
            runButton.click();
            evt.preventDefault();
            break;
            default:
            break;
    }
});


// const recordBtn = document.getElementById('record');

// recordBtn.addEventListener('click', async () => {
//     recordBtn.disabled = true;
//     try {
//         await recordWebM(timeSlider, canvas, draw);
//     } finally {
//         recordBtn.disabled = false;
//     }
// });

async function fillFromURL() {
    const params = new URLSearchParams(window.location.search);

    // Example: ?class=equal_mass&index=3
    const classParam = params.get("class");   // e.g. "equal_mass"
    const indexParam = params.get("index");   // e.g. "3"


    // Apply to dropdowns if values exist
    if (classParam) {
        exampleClassDropdown.value = classParam;
    }
    await fill_example_dropdown();

    if (indexParam) {
        exampleSelect.value = indexParam;
    }
}


await fillFromURL();

await run();
play_loop();
