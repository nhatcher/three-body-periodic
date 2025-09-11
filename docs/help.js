
const dialog = document.getElementById('help-dialog');
const body = document.getElementById('help-body');

const templates = Array.from(document.querySelectorAll('template[id^="help-"]'));
const tplById = Object.fromEntries(templates.map(t => [t.id, t]));
const exTemplates = templates.filter(t => /^help-example-/.test(t.id));

const text = (node) => node?.textContent?.trim().replace(/\s+/g, ' ') || '';
const heading = (tpl) => text(tpl.content.querySelector('h1,h2,h3,h4,h5,h6'));
const toTitle = (s) => s.replace(/\b\w/g, c => c.toUpperCase());
const idTitle = (id) => toTitle(id.replace(/^help-/, '').replace(/_/g, ' '));

// Topic list
const topicsBase = [
    // Main index
    { id: 'help-index', title: 'Help Index' },
    // Methods (alias the existing help-method template)
    { id: 'help-method', title: 'Methods (ODE Solvers)' },
    // Examples index
    { id: 'help-examples-index', title: 'Examples' },
    // Controls page 
    { id: 'help-controls', title: 'Controls' },
];


// Then include the leaf example pages (so they are reachable from sidebar/dropdown too)
exTemplates.forEach(t => {
    topicsBase.push({
        id: t.id,
        title: heading(t) || idTitle(t.id)
    });
});


function renderIndex() {
    body.innerHTML = `
      <h2>Help</h2>
      <p>Pick a section to learn more.</p>
      <div class="help-cards">
        <article class="help-card">
          <h3>Methods (ODE Solvers)</h3>
          <p>DOP853, Feagin 14(12), RK4, Velocity Verlet—what to use and when.</p>
          <button data-goto="help-method">Open</button>
        </article>
        <article class="help-card">
          <h3>Examples</h3>
          <p>Browse all example families with descriptions.</p>
          <button data-goto="help-examples-index">Open</button>
        </article>
        <article class="help-card">
          <h3>Controls</h3>
          <p>How to drive the app: play/pause, slider, favorites, settings…</p>
          <button data-goto="help-controls">Open</button>
        </article>
      </div>
    `;
}

function renderExamplesIndex() {
    body.innerHTML = `
      <h2>Examples</h2>
      <p>Periodic orbits grouped by family. Select one to read its description.</p>
      <div class="help-cards" id="examples-cards"></div>
    `;
    const wrap = body.querySelector('#examples-cards');
    exTemplates.forEach(t => {
        const title = heading(t) || idTitle(t.id);
        const card = document.createElement('article');
        card.className = 'help-card';
        card.innerHTML = `
        <h3>${title}</h3>
        <p>${text(t.content.querySelector('p')) || 'Read more…'}</p>
        <button data-goto="${t.id}">Open</button>
      `;
        wrap.appendChild(card);
    });
}


function renderTemplate(id) {
    const tpl = tplById[id];
    body.innerHTML = '';
    if (tpl) {
        body.appendChild(tpl.content.cloneNode(true));
        body.querySelectorAll('a[href^="http"]').forEach(a => {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        });
    } else {
        body.innerHTML = `<p>Missing help content: <code>${id}</code></p>`;
    }
}

function selectTopic(id, { persist = false, focusTab = false } = {}) {
    dialog.querySelector('.help-back').style.display = 'block';
    if (id === 'help-index') {
        renderIndex();
        dialog.querySelector('.help-back').style.display = 'none';
    } else if (id === 'help-examples-index') {
        renderExamplesIndex();
    } else {
        renderTemplate(id);
    }
    if (persist) {
        try {
            localStorage.setItem('help.lastTopic', id);
        } catch {
            // ignore
        }
    }
}

function init() {
    let initial = null;
    try {
        initial = localStorage.getItem('help.lastTopic');
    } catch {
        // no biggie
    }
    if (!initial || !topicsBase.some(t => t.id === initial)) {
        initial = 'help-index';
    }
    selectTopic(initial, { persist: false });
}

const helpBtn = document.getElementById('help');
helpBtn.addEventListener('click', () => {
    if (!dialog.open) {
        dialog.showModal();
    }
});


// Handle topic navigation (buttons and links with data-goto)
const helpForm = document.getElementById('help-form');
helpForm.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goto]');
    if (!el) {
        return;
    }
    e.preventDefault();
    selectTopic(el.dataset.goto, { persist: true });
});

init();
