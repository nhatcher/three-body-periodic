import unequal_mass from './examples/unequal_mass.js';
import equal_mass from './examples/equal_mass.js';
import choreographies from './examples/choreographies.js';
import free_fall from './examples/free_fall.js';
import examples3d from './examples/3d_examples.js';
import custom_examples from './examples/custom.js';
import free_fall_puzynin_sd from './examples/free_fall_puzynin_sd.js';
import free_fall_puzynin_600 from './examples/free_fall_puzynin_600.js';
import bhh_satellites from './examples/bhh_satellites.js';

const exampleClassDropdown = document.getElementById('example-class');
const exampleSelect = document.getElementById('example');

async function readIC2D() {
    const exampleClass = exampleClassDropdown.value;
    const example = exampleSelect.value;
    let values;
    switch (exampleClass) {
        case 'choreographies':
            values = choreographies.getOrbit(example);
            break;
        case 'free_fall':
            values = free_fall.getOrbit(example);
            break;
        case 'unequal_mass':
            values = unequal_mass.getOrbit(example);
            break;
        case 'equal_mass':
            values = equal_mass.getOrbit(example);
            break;
        case '3d_examples':
            values = await examples3d.getOrbit(example);
            break;
        case 'custom':
            values = await custom_examples.getOrbit(example);
            break;
        case 'free_fall_puzynin_sd':
            values = await free_fall_puzynin_sd.getOrbit(example);
            break;
        case 'free_fall_puzynin_600':
            values = await free_fall_puzynin_600.getOrbit(example);
            break;
        case 'bhh_satellites':
            values = bhh_satellites.getOrbit(example);
            break;
        default:
            throw new Error(`Unknown example class: ${exampleClass}`);
    }
    return values;
}


async function fill_example_dropdown() {
    const exampleClass = exampleClassDropdown.value;

    // Clear existing options
    exampleSelect.innerHTML = '';
    let examples;
    switch (exampleClass) {
        case 'choreographies':
            examples = choreographies.getNames();
            break;
        case 'free_fall':
            examples = free_fall.getNames();
            break;
        case 'unequal_mass':
            examples = unequal_mass.getNames();
            break;
        case 'equal_mass':
            examples = equal_mass.getNames();
            break;
        case 'choreographies':
            examples = choreographies.getNames();
            break;
        case '3d_examples':
            examples = await examples3d.getNames();
            break;
        case 'free_fall_puzynin_sd':
            examples = await free_fall_puzynin_sd.getNames();
            break;
        case 'free_fall_puzynin_600':
            examples = await free_fall_puzynin_600.getNames();
            break;
        case 'bhh_satellites':
            examples = bhh_satellites.getNames();
            break;
        case 'custom':
            examples = custom_examples.getNames();
            examples.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                exampleSelect.appendChild(option);
            });
            return;
    }
    examples.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        exampleSelect.appendChild(option);
    });
}

export { fill_example_dropdown, readIC2D };