let data = null;

async function loadTSV(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.trimEnd().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], data: [] };

  const headers = lines[0].split('\t').map(s => s.trim());
  const d = new Array(lines.length - 1);

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    // Adjust casting to your schema. Here:
    // 0: label (string), 1..5: numbers, 6: stability (string)
    d[i - 1] = [
      parts[0]?.trim() ?? "",
      +parts[1], +parts[2], +parts[3], +parts[4], +parts[5],
      (parts[6] ?? "").trim()
    ];
  }
  data = d;
}

async function getNames() {
    if (!data) {
        await loadTSV('./examples/data.csv');
    }
    return data.map(item => item[0]);
}

async function getOrbit(i) {
    if (!data) {
        await loadTSV('./examples/data.csv');
    }
    const row = data[i];
    const m = row[0].match(/^[^\()]+\(([^)]+)\)$/);
    const m1 = 1;
    const m2 = 1;
    const m3 = parseFloat(m[1]);

    const z0 = parseFloat(row[1]);
    const v_x = parseFloat(row[2]);
    const v_y = parseFloat(row[3]);
    const v_z = parseFloat(row[4]);
    const t = parseFloat(row[5]);


    return [[
        -1, 0, 0, v_x, v_y, v_z, m1,
        1, 0, 0, v_x, v_y, -v_z, m2,
        0, 0, z0, -2 * v_x / m3, -2 * v_y / m3, 0, m3
    ], t]
}

export default {
    getNames,
    getOrbit
};