import unequal_mass from './examples/unequal_mass.js';
import equal_mass from './examples/equal_mass.js';
import choreographies from './examples/choreographies.js';
import free_fall from './examples/free_fall.js';
import examples3d from './examples/3d_examples.js';

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
    }
    examples.forEach((name, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = name;
        exampleSelect.appendChild(option);
    });
}

export { fill_example_dropdown, readIC2D };