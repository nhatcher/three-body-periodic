import { readIC2D, fill_example_dropdown } from "./ic.js";

const newExBtn = document.getElementById('new-example');
const dlg = document.getElementById('new-example-dialog');
const cancelBtn = document.getElementById('cancel-new-ex');
const createBtn = document.getElementById('create-new-ex');
const deleteBtn = document.getElementById('delete-new-ex');

const exampleSelect = document.getElementById('example');
const exampleClassDropdown = document.getElementById('example-class');


function fillInputsFromIC(data) {
  const [ic, t] = data;
  if (ic.length !== 21) {
    throw new Error("Expected 21 values (3 bodies × 7 values each)");
  }

  for (let i = 0; i < 3; i++) {
    const base = i * 7;
    const [x, y, z, vx, vy, vz, m] = ic.slice(base, base + 7);

    const idx = i + 1; // body1, body2, body3

    document.getElementById(`modal-x${idx}`).value = x;
    document.getElementById(`modal-y${idx}`).value = y;
    document.getElementById(`modal-z${idx}`).value = z;
    document.getElementById(`modal-vx${idx}`).value = vx;
    document.getElementById(`modal-vy${idx}`).value = vy;
    document.getElementById(`modal-vz${idx}`).value = vz;
    document.getElementById(`modal-m${idx}`).value = m;
  }
  document.getElementById('modal-period').value = t;
}

deleteBtn.addEventListener('click', async () => {
  const examples = localStorage.getItem("examples");
  if (!examples) return;
  const examplesObj = JSON.parse(examples);
  const name = exampleSelect.value;
  if (!(name in examplesObj)) return;
  if (!confirm(`Are you sure you want to delete the example "${name}"? This action cannot be undone.`)) {
    return;
  }
  delete examplesObj[name];
  localStorage.setItem("examples", JSON.stringify(examplesObj));
  await fill_example_dropdown();
  exampleSelect.value = Object.keys(examplesObj)[0] || '';
  exampleSelect.dispatchEvent(new Event('change', { bubbles: true }));
  dlg.close();
});

// Open the modal
newExBtn.addEventListener('click', async () => {
  let name = exampleSelect.selectedOptions[0].textContent;
  if (exampleClassDropdown.value === 'custom') {
    // custom values
  }
  const ic = await readIC2D();
  fillInputsFromIC(ic);
  dlg.showModal();
  const nameEl = document.getElementById('ex-name');
  nameEl.value = name
  nameEl.focus();
});

// Close modal on cancel
cancelBtn.addEventListener('click', () => dlg.close());

// Parse helper
function num(id) {
  const v = document.getElementById(`modal-${id}`).value.trim();
  const x = Number(v);
  if (!Number.isFinite(x)) throw new Error(`Invalid number in ${id}`);
  return x;
}

// Collect ICs from the form
function collectICs() {
  const name = document.getElementById('ex-name').value.trim() || 'Custom example';

  const bodies = [[
      num('x1'), num('y1'), num('z1'), num('vx1'), num('vy1'), num('vz1'), num('m1'),
      num('x2'), num('y2'), num('z2'), num('vx2'), num('vy2'), num('vz2'), num('m2'),
      num('x3'), num('y3'), num('z3'), num('vx3'), num('vy3'), num('vz3'), num('m3'),
  ], num('period')];

  return { name, bodies };
}

// Create & insert a new option into the example select
async function addCustomExample({ name, bodies }) {
  const storage = localStorage.getItem("examples");
  const examples = storage ? JSON.parse(storage) : {};
  examples[name] = bodies;
  localStorage.setItem("examples", JSON.stringify(examples));
  exampleClassDropdown.value = 'custom';
  await fill_example_dropdown();
  exampleSelect.value = Object.keys(examples)[0];
  exampleSelect.dispatchEvent(new Event('change', { bubbles: true }));
}

createBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const ics = collectICs();
  await addCustomExample(ics);
  dlg.close();
});
