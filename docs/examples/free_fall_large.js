let data = null;

async function loadTSV(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.trimEnd().split(/\r?\n/);
  const d = new Array(lines.length - 1);

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(parseFloat);
    d[i - 1] = parts;
  }
  data = d;
}

async function getNames() {
    if (!data) {
        await loadTSV('./examples/sol_81.csv');
    }
    return data.map((_, index) => index.toString());
}

async function getOrbit(i) {
    if (!data) {
        await loadTSV('./examples/sol_81.csv');
    }
    const row = data[i];
    const m1 = 1;
    const m2 = 1;
    const m3 = 1;

    const x = parseFloat(row[0]);
    const y = parseFloat(row[1]);
    const t = parseFloat(row[2]);


    return [[
        -0.5, 0, 0, 0.0, 0.0, 0.0, m1,
        x, y, 0, 0.0, 0.0, 0.0, m2,
        0.5, 0, 0.0, 0.0, 0.0, 0, m3
    ], t]
}

export default {
    getNames,
    getOrbit
};