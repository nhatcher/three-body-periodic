// The initial conditions, the periods $T$ and the stability of the "panio-trio" periodic orbits in the case of the initial position $\bm{r}_1 = (-1, 0, 0)$, 
// $\bm{r}_2=(1, 0, 0)$ and $\bm{r}_3 = (0, 0, z_0)$ with the initial velocities $\bm{v}_1 = (v_x, v_y, v_z)$, $\bm{v}_2 = (v_x, v_y, -v_z)$ 
// and $\bm{v}_3 = (-2 v_x/m_3, -2 v_y/m_3, 0)$. Stability of periodic orbit: S (linearly stable), U (linearly unstable).
// ------------------------------------------------------------------------------------------------------------------------------------------------------
// Orbit O_{n}(m_3)            z_0                      v_x                    v_y                         v_z                     T           stability
// ------------------------------------------------------------------------------------------------------------------------------------------------------
// O_{50}(0.4)         2.12752903483315e-01     2.49867956101367e-01     3.49853042343309e-02     3.43576317431247e-04     1.05330623626924e+02    S
// O_{62}(0.4)         2.41129936269425e-01     2.42906714685526e-01     3.03882898984410e-02     2.93992501002631e-04     1.10387609178131e+02    U
// O_{67}(0.4)         2.09158578553905e-01     2.46341790207023e-01     3.03790500940823e-02    -6.13665171691193e-03     1.11253945784275e+02    U
// O_{68}(0.4)         2.15935255496587e-01     2.46806860905345e-01     3.02229645851569e-02    -4.46170640968614e-03     1.11690205157424e+02    S
// O_{69}(0.4)         1.53709558208379e-01     2.55080648978036e-01     4.68139224180319e-02     2.76175039818286e-03     1.11912003556651e+02    U
// O_{70}(0.4)         2.20711118652267e-01     2.47551786973339e-01     3.00182691711651e-02    -3.16279387741220e-03     1.12226312472729e+02    U
// O_{84}(0.4)         2.21057394252072e-01     2.43862497123233e-01     2.50202047390211e-02    -8.19296109598901e-03     1.18002396709829e+02    S
// O_{91}(0.4)         1.73415473184618e-01     2.54509828521192e-01     4.27049691312407e-02     3.32628506993265e-03     1.20122719289350e+02    S
// O_{105}(0.4)        2.24096774243019e-01     2.41606606940666e-01     1.87361694449261e-02    -1.18890126073708e-02     1.24485267419072e+02    S
// O_{120}(0.4)        1.77427922301168e-01     2.48820046261975e-01     3.73652002264609e-02    -3.13754291995453e-03     1.32759087925152e+02    S

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
        await loadTSV('./3d/data.csv');
    }
    return data.map(item => item[0]);
}

async function getOrbitData(i) {
    if (!data) {
        await loadTSV('./3d/data.csv');
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

function getExample1() {
    const z0 = 2.12752903483315e-01;
    const v_x = 2.49867956101367e-01;
    const v_y = 3.49853042343309e-02;
    const v_z = 3.43576317431247e-04;
    const m1 = 1;
    const m2 = 1;
    const m3 = 0.4;
    return [[
        -1, 0, 0, v_x, v_y, v_z, m1,
        1, 0, 0, v_x, v_y, -v_z, m2,
        0, 0, z0, -2 * v_x / m3, -2 * v_y / m3, 0, m3
    ], 1.05330623626924e+02]
}

export default {
    getNames,
    getOrbitData
};