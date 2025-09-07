
const infoDialog = document.getElementById('info-dialog');
const infoContent = document.getElementById('info-content');
const infoForm = document.getElementById('info-form');

const infoHeaderTemplateMethod = document.getElementById('info-header-method');
const infoHeaderTemplateExampleClass = document.getElementById('info-header-example-class');

const exampleClassBtn = document.getElementById('example-class-btn');
const exampleBtn = document.getElementById('example-btn');
const exampleClassDropdown = document.getElementById('example-class');
const methodSelect = document.getElementById('method');
const methodBtn = document.getElementById('method-btn');

exampleBtn.addEventListener('click', (e)  => {
    const templateId = `help-example-${exampleClassDropdown.value}`;
    const template = document.getElementById(templateId);
    infoContent.replaceChildren(template.content.cloneNode(true));
    infoDialog.showModal();
});

exampleClassBtn.addEventListener('click', (e)  => {
    const descriptionTemplate = document.getElementById(`info-header-example-class`);
    infoContent.replaceChildren(descriptionTemplate.content.cloneNode(true));
    infoDialog.showModal();
});

methodBtn.addEventListener('click', () => {
    const templateId = `help-method`;
    const template = document.getElementById(templateId);
    infoContent.replaceChildren(template.content.cloneNode(true));
    infoDialog.showModal();
});



