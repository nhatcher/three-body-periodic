
const infoDialog = document.getElementById('info-dialog');
const infoContent = document.getElementById('info-content');
const infoForm = document.getElementById('info-form');

const infoHeader = document.getElementById('info-header');
const infoHeaderTemplateMethod = document.getElementById('info-header-method');
const infoHeaderTemplateExampleClass = document.getElementById('info-header-example-class');

const exampleClassBtn = document.getElementById('example-class-btn');
const exampleClassDropdown = document.getElementById('example-class');
const methodSelect = document.getElementById('method');
const methodBtn = document.getElementById('method-btn');

exampleClassBtn.addEventListener('click', (e)  => {
    const descriptionTemplate = document.getElementById(`info-header-example-class`);
    infoHeader.replaceChildren(descriptionTemplate.content.cloneNode(true));


    const templateId = `help-example-class-${exampleClassDropdown.value}`;
    const template = document.getElementById(templateId);
    infoContent.replaceChildren(template.content.cloneNode(true));
    infoDialog.showModal();

});

methodBtn.addEventListener('click', () => {
    const descriptionTemplate = document.getElementById(`info-header-method`);
    infoHeader.replaceChildren(descriptionTemplate.content.cloneNode(true));
    
    const templateId = `help-method-${methodSelect.value}`;
    const template = document.getElementById(templateId);
    infoContent.replaceChildren(template.content.cloneNode(true));
    infoDialog.showModal();
});



