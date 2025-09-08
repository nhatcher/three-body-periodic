import unequal_mass from './examples/unequal_mass.js';
import equal_mass from './examples/equal_mass.js';
import choreographies from './examples/choreographies.js';
import free_fall from './examples/free_fall.js';
import examples3d from './examples/3d_examples.js';
import custom_examples from './examples/custom.js';
import free_fall_puzynin_sd from './examples/free_fall_puzynin_sd.js';
import free_fall_puzynin_600 from './examples/free_fall_puzynin_600.js';
import bhh_satellites from './examples/bhh_satellites.js';
import broucke_boggs from './examples/broucke_boggs.js';
import matt_sheen from './examples/matt_sheen.js';

const exampleClassDropdown = document.getElementById('example-class');
const exampleSelect = document.getElementById('example');


function getModuleByName(name) {
    switch (name) {
        case 'choreographies':
            return choreographies;
        case 'free_fall':
            return free_fall;
        case 'unequal_mass':
            return unequal_mass;
        case 'equal_mass':
            return equal_mass;
        case '3d_examples':
            return examples3d;
        case 'free_fall_puzynin_sd':
            return free_fall_puzynin_sd;
        case 'free_fall_puzynin_600':
            return free_fall_puzynin_600;
        case 'bhh_satellites':
            return bhh_satellites;
        case 'broucke_boggs':
            return broucke_boggs;
        case 'matt_sheen':
            return matt_sheen;
        case 'custom':
            return custom_examples;
        default:
            throw new Error(`Unknown example class: ${name}`);
    }
}

async function readIC2D() {
    const exampleClass = exampleClassDropdown.value;
    const example = exampleSelect.value;
    if (exampleClass === 'bookmarks') {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        const bm = bookmarks[example];
        const className = bm.class;
        const index = bm.index;
        return getModuleByName(className).getOrbit(index);
    }
    return getModuleByName(exampleClass).getOrbit(example);
}


async function fill_example_dropdown() {
    const exampleClass = exampleClassDropdown.value;

    // Clear existing options
    exampleSelect.innerHTML = '';
    if (exampleClass === 'bookmarks') {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        if (bookmarks.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No bookmarks';
            exampleSelect.appendChild(option);
            exampleSelect.disabled = true;
            return;
        }
        exampleSelect.disabled = false;
        bookmarks.map((bm, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = bm.name;
            exampleSelect.appendChild(option);
        });
        return;
    }
    let examples = await getModuleByName(exampleClass).getNames();
    if (exampleClass === 'custom') {
        examples.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            exampleSelect.appendChild(option);
        });
        return;
    } else {
        exampleSelect.disabled = false;
    }
    examples.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        exampleSelect.appendChild(option);
    });
}

export { fill_example_dropdown, readIC2D };