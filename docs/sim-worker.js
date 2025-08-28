import init, { evolve, total_energy, total_angular_momentum } from './wasm/three_body_wasm.js';

await init();

self.postMessage({ type: 'ready' });

self.onmessage = async (evt) => {
    const { requestId, ic, t, method } = evt.data;

    try {
        const t0 = performance.now();

        // If ic came as a plain Array, wrap it (faster to receive Float64Array directly).
        const icArr = Array.isArray(ic) ? new Float64Array(ic) : ic;

        // Do all heavy work here
        const energy = total_energy(icArr);
        const angularMomentum = total_angular_momentum(icArr); // returns Float64Array(3) or Array(3)
        const result = evolve(icArr, t, method);               // flat array/typed-array from WASM
        const t1 = performance.now();

        // Prefer transferring buffers to avoid copies
        const transfers = [];
        let resultPayload = result;
        if (result?.buffer instanceof ArrayBuffer) {
            transfers.push(result.buffer);
        }
        let angMomPayload = angularMomentum;
        if (angularMomentum?.buffer instanceof ArrayBuffer) {
            transfers.push(angularMomentum.buffer);
        }

        self.postMessage(
            {
                type: 'ok',
                requestId,
                result: resultPayload,
                energy,
                angularMomentum: angMomPayload,
                computeMs: t1 - t0,
            },
            transfers
        );
    } catch (err) {
        self.postMessage({
            type: 'error',
            requestId,
            message: err?.message || String(err),
        });
    }
};
