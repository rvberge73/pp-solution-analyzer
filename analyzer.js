// ─── Step-by-step navigation guides ─────────────────────────────────────────

const GUIDES = {
  missing_deps: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a>',
      'Selecteer de <strong>doelomgeving</strong> rechtsboven in de omgevingskiezer',
      'Klik in het linkermenu op <strong>Solutions</strong>',
      'Bekijk welke managed solutions aanwezig zijn — vergelijk dit met de ontbrekende afhankelijkheden hierboven',
      'Installeer de ontbrekende solutions via <strong>Import solution</strong> voordat je deze solution importeert',
    ]
  },
  connection_refs: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Solutions',
    steps: [
      'Importeer de solution eerst via <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → <strong>Solutions → Import solution</strong>',
      'Open na import de solution en klik op <strong>Connection References</strong> in het linkermenu',
      'Klik op elke connectie referentie en kies een bestaande connectie of maak een nieuwe aan',
      'Sla op en test de flows/apps om te verifiëren dat de connecties werken',
    ]
  },
  env_variables_missing: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Solutions',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>doelomgeving</strong>',
      'Klik op <strong>Solutions → Import solution</strong> en upload de ZIP',
      'Tijdens de import wizard verschijnt een stap <strong>"Environment Variables"</strong> — vul hier de waarden in',
      'Kun je de wizard niet meer zien? Open de geïmporteerde solution → <strong>Environment variables</strong> → klik op elke variabele → <strong>Edit</strong> → voer de waarde in',
    ]
  },
  env_variables_ok: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Solutions',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → <strong>Solutions</strong>',
      'Open de geïmporteerde solution en klik op <strong>Environment variables</strong>',
      'Controleer of de standaardwaarden kloppen voor de doelomgeving (bijv. andere API-url of configuratie)',
      'Klik op een variabele → <strong>Edit</strong> om de waarde aan te passen indien nodig',
    ]
  },
  managed_props: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Solutions (bronomgeving)',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>bronomgeving</strong>',
      'Klik op <strong>Solutions</strong> en open de betreffende solution',
      'Klik op <strong>Export solution</strong> → kies <strong>Unmanaged</strong> als exporttype',
      'Importeer daarna de unmanaged versie in de doelomgeving voor volledige bewerkbaarheid',
    ]
  },
  flows: {
    url: 'https://make.powerautomate.com',
    label: 'make.powerautomate.com → My Flows',
    steps: [
      'Ga naar <a href="https://make.powerautomate.com" target="_blank">make.powerautomate.com</a> en selecteer de <strong>doelomgeving</strong>',
      'Klik op <strong>My flows</strong> (of zoek de flows op via Solutions → je solution → Flows)',
      'Open elke flow en kijk of er een foutmelding staat over connecties',
      'Klik op <strong>Edit</strong> → klik op de stap met de connectiefout → selecteer de correcte connectie',
      'Sla op en klik daarna op <strong>Turn on</strong> om de flow te activeren',
    ]
  },
  canvas_apps: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Apps',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>doelomgeving</strong>',
      'Klik op <strong>Apps</strong> in het linkermenu',
      'Klik de drie puntjes (...) naast de app → <strong>Edit</strong> om de app in de editor te openen',
      'Ga in de editor naar <strong>View → Data sources</strong> (of het data-icoon links)',
      'Verwijder verbroken databronnen en voeg de correcte opnieuw toe via <strong>Add data</strong>',
      'Sla op via <strong>File → Save</strong> en publiceer via <strong>File → Publish</strong>',
    ]
  },
  publisher: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Solutions → Publishers',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>bronomgeving</strong>',
      'Klik op <strong>Solutions</strong> in het linkermenu',
      'Klik bovenin op <strong>Publishers</strong>',
      'Klik op <strong>New publisher</strong> → kies een unieke naam en prefix (bijv. je bedrijfsnaam)',
      'Ga terug naar je solution → klik op <strong>...</strong> → <strong>Edit</strong> → wijzig de publisher naar de nieuwe',
      'Exporteer de solution opnieuw — de componenten krijgen nu de juiste prefix',
    ]
  },
  version: {
    url: 'https://admin.powerplatform.microsoft.com',
    label: 'admin.powerplatform.microsoft.com → Environments',
    steps: [
      'Ga naar <a href="https://admin.powerplatform.microsoft.com" target="_blank">admin.powerplatform.microsoft.com</a>',
      'Klik in het linkermenu op <strong>Environments</strong>',
      'Klik op de naam van de <strong>doelomgeving</strong>',
      'Bekijk onder <strong>Details</strong> het veld <strong>Version</strong>',
      'Vergelijk deze versie met de versie in je solution.xml — de omgevingsversie moet gelijk of hoger zijn',
    ]
  },
  security_roles: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Settings → Users',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>doelomgeving</strong>',
      'Klik rechts bovenin op het tandwiel ⚙️ → <strong>Advanced settings</strong>',
      'Ga in het klassieke menu naar <strong>Settings → Security → Users</strong>',
      'Selecteer de gebruiker(s) die toegang nodig hebben',
      'Klik op <strong>Manage Security Roles</strong> en vink de juiste rol(len) aan',
      'Klik op <strong>OK</strong> om de rollen toe te wijzen',
    ]
  },
  duplicate_names: {
    url: 'https://make.powerapps.com',
    label: 'make.powerapps.com → Solutions (bronomgeving)',
    steps: [
      'Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>bronomgeving</strong>',
      'Open de solution en zoek de componenten met dubbele namen (zie lijst hierboven)',
      'Klik op het component → <strong>...</strong> → <strong>Rename</strong> of open het component en wijzig de naam',
      'Exporteer de solution opnieuw na het hernoemen',
    ]
  },
};

// ─── Analyzer Engine ──────────────────────────────────────────────────────────

const CHECKS = [
  {
    id: 'missing_deps',
    level: 'error',
    run(doc) {
      const missing = [...doc.querySelectorAll('MissingDependency')];
      if (!missing.length) return null;
      const items = missing.map(m => {
        const req = m.querySelector('Required');
        return `${req?.getAttribute('displayName') || req?.getAttribute('id') || 'Onbekend'} (type: ${req?.getAttribute('type') || '?'})`;
      });
      return {
        title: `${missing.length} Ontbrekende afhankelijkheid${missing.length > 1 ? 'heden' : ''}`,
        desc: 'De solution heeft componenten die afhankelijk zijn van objecten die niet aanwezig zijn in de doelomgeving.',
        details: items.slice(0, 5),
        solution: 'Installeer eerst de vereiste managed solutions in de doelomgeving voordat je deze solution importeert.',
        guide: GUIDES.missing_deps,
      };
    }
  },
  {
    id: 'connection_refs',
    level: 'warning',
    run(doc) {
      const refs = [...doc.querySelectorAll('connectionreference, ConnectionReference')];
      if (!refs.length) return null;
      const names = refs.map(r => r.getAttribute('connectionreferencelogicalname') || r.getAttribute('name') || 'Onbekend');
      return {
        title: `${refs.length} Connectie Referentie${refs.length > 1 ? 's' : ''} gevonden`,
        desc: 'De solution bevat connectie referenties die in de doelomgeving opnieuw ingesteld moeten worden.',
        details: [...new Set(names)].slice(0, 5),
        solution: 'Configureer na import de connectie referenties opnieuw vanuit de solution.',
        guide: GUIDES.connection_refs,
      };
    }
  },
  {
    id: 'env_variables',
    level: 'warning',
    run(doc) {
      const vars = [...doc.querySelectorAll('environmentvariabledefinition, EnvironmentVariableDefinition')];
      if (!vars.length) return null;
      const withoutDefault = vars.filter(v => !v.querySelector('defaultvalue, DefaultValue'));
      const names = withoutDefault.map(v => v.getAttribute('displayname') || v.getAttribute('schemaname') || 'Onbekend');
      if (!withoutDefault.length) return {
        title: `${vars.length} Omgevingsvariabele${vars.length > 1 ? 'n' : ''} (met standaardwaarden)`,
        desc: 'Er zijn omgevingsvariabelen gevonden, maar alle hebben standaardwaarden.',
        details: [],
        solution: 'Controleer na import of de standaardwaarden correct zijn voor de doelomgeving.',
        guide: GUIDES.env_variables_ok,
        level: 'info',
      };
      return {
        title: `${withoutDefault.length} Omgevingsvariabele${withoutDefault.length > 1 ? 'n' : ''} zonder standaardwaarde`,
        desc: 'De volgende omgevingsvariabelen hebben geen standaardwaarde en moeten handmatig worden ingevuld bij import.',
        details: names.slice(0, 5),
        solution: 'Stel tijdens of na import de waarden in voor alle omgevingsvariabelen.',
        guide: GUIDES.env_variables_missing,
      };
    }
  },
  {
    id: 'managed_props',
    level: 'info',
    run(doc) {
      const managed = doc.querySelector('SolutionManifest > Managed, managed');
      const isManaged = managed?.textContent?.trim() === '1' || managed?.textContent?.trim()?.toLowerCase() === 'true';
      if (!isManaged) return null;
      return {
        title: 'Managed Solution',
        desc: 'Dit is een managed solution. Aanpassingen aan componenten in de doelomgeving zijn beperkt.',
        details: [],
        solution: 'Exporteer de unmanaged versie vanuit de bronomgeving als je aanpassingen wilt maken.',
        guide: GUIDES.managed_props,
      };
    }
  },
  {
    id: 'flows',
    level: 'info',
    run(doc) {
      const allWorkflows = [...doc.querySelectorAll('workflow, Workflow')].filter(w => {
        const cat = w.getAttribute('category') || w.getAttribute('Category');
        return cat === '5';
      });
      if (!allWorkflows.length) return null;
      const names = allWorkflows.slice(0, 5).map(w => w.getAttribute('name') || 'Onbekend');
      return {
        title: `${allWorkflows.length} Power Automate Flow${allWorkflows.length > 1 ? 's' : ''} gedetecteerd`,
        desc: 'Flows moeten na import worden ingeschakeld en hun connecties moeten worden geconfigureerd.',
        details: names,
        solution: 'Open elke flow na import, herstel connecties en schakel de flow in.',
        guide: GUIDES.flows,
      };
    }
  },
  {
    id: 'canvas_apps',
    level: 'info',
    run(doc) {
      const apps = [...doc.querySelectorAll('CanvasApp, canvasapp')];
      if (!apps.length) return null;
      const names = apps.map(a => a.getAttribute('displayname') || a.getAttribute('name') || 'Onbekend');
      return {
        title: `${apps.length} Canvas App${apps.length > 1 ? 's' : ''} gevonden`,
        desc: 'Canvas apps vereisen na import mogelijk herverbinding van databronnen.',
        details: names.slice(0, 5),
        solution: 'Open elke app in de editor en herstel verbroken databronnen.',
        guide: GUIDES.canvas_apps,
      };
    }
  },
  {
    id: 'publisher',
    level: 'warning',
    run(doc) {
      const pub = doc.querySelector('Publisher, publisher');
      if (!pub) return null;
      const prefix = pub.querySelector('CustomizationPrefix, customizationprefix')?.textContent?.trim();
      const name = pub.querySelector('UniqueName, uniquename')?.textContent?.trim() || pub.getAttribute('uniquename');
      if (!prefix || prefix === 'new') return {
        title: 'Standaard Publisher Prefix "new"',
        desc: 'De solution gebruikt de standaard "new" prefix. Dit kan conflicten veroorzaken bij import.',
        details: [`Publisher: ${name || 'Onbekend'}`, `Prefix: ${prefix || 'new'}`],
        solution: 'Maak een nieuwe publisher aan met een unieke prefix en exporteer de solution opnieuw.',
        guide: GUIDES.publisher,
      };
      return null;
    }
  },
  {
    id: 'version',
    level: 'info',
    run(doc) {
      const ver = doc.querySelector('Version, version')?.textContent?.trim()
        || doc.querySelector('SolutionManifest')?.getAttribute('Version');
      if (!ver) return null;
      return {
        title: `Solution versie: ${ver}`,
        desc: 'Controleer of de doelomgeving een gelijke of hogere platform versie heeft.',
        details: [],
        solution: 'Controleer de versie van de doelomgeving via het Power Platform admin center.',
        guide: GUIDES.version,
      };
    }
  },
  {
    id: 'security_roles',
    level: 'info',
    run(doc) {
      const roles = [...doc.querySelectorAll('Role, role')];
      if (!roles.length) return null;
      const names = roles.map(r => r.getAttribute('name') || r.getAttribute('Name') || 'Onbekend');
      return {
        title: `${roles.length} Beveiligingsrol${roles.length > 1 ? 'len' : ''} gevonden`,
        desc: 'Beveiligingsrollen in de solution moeten na import worden toegewezen aan gebruikers.',
        details: names.slice(0, 5),
        solution: 'Wijs na import de beveiligingsrollen toe aan de juiste gebruikers of teams.',
        guide: GUIDES.security_roles,
      };
    }
  },
  {
    id: 'duplicate_names',
    level: 'warning',
    run(doc) {
      const components = [...doc.querySelectorAll('[name], [Name]')];
      const names = components.map(c => c.getAttribute('name') || c.getAttribute('Name')).filter(Boolean);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      const unique = [...new Set(dupes)];
      if (!unique.length) return null;
      return {
        title: `${unique.length} Dubbele component naam/namen`,
        desc: 'Er zijn componenten met dezelfde naam gevonden. Dit kan importproblemen veroorzaken.',
        details: unique.slice(0, 5),
        solution: 'Hernoem de conflicterende componenten in de bronomgeving en exporteer opnieuw.',
        guide: GUIDES.duplicate_names,
      };
    }
  },
];

// ─── Metadata Extractor ───────────────────────────────────────────────────────

function extractMeta(doc) {
  const meta = {};
  meta.name = doc.querySelector('UniqueName, uniquename')?.textContent?.trim() || '–';
  meta.displayName = doc.querySelector('LocalizedName, localizedname')?.getAttribute('description')
    || doc.querySelector('DisplayName, displayname')?.textContent?.trim() || '–';
  meta.version = doc.querySelector('Version, version')?.textContent?.trim() || '–';
  meta.publisher = doc.querySelector('Publisher UniqueName, publisher uniquename')?.textContent?.trim()
    || doc.querySelector('Publisher')?.getAttribute('uniquename') || '–';
  return meta;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderGuide(guide) {
  if (!guide) return '';
  const steps = guide.steps.map((s, i) =>
    `<li><span class="step-num">${i + 1}</span><span class="step-text">${s}</span></li>`
  ).join('');
  return `
    <div class="guide-box">
      <div class="guide-header">
        <span class="guide-icon">🗺️</span>
        <span class="guide-label">Stap-voor-stap: <a href="${guide.url}" target="_blank" class="guide-link">${guide.label}</a></span>
      </div>
      <ol class="guide-steps">${steps}</ol>
    </div>`;
}

function renderResults(findings, meta) {
  const results = document.getElementById('results');
  results.classList.remove('hidden');
  const counts = { error: 0, warning: 0, info: 0 };
  findings.forEach(f => counts[f.level] = (counts[f.level] || 0) + 1);

  let html = `<div class="meta-info">
    <div class="meta-item"><span class="meta-key">Naam</span><span class="meta-val">${esc(meta.name)}</span></div>
    <div class="meta-item"><span class="meta-key">Display Naam</span><span class="meta-val">${esc(meta.displayName)}</span></div>
    <div class="meta-item"><span class="meta-key">Versie</span><span class="meta-val">${esc(meta.version)}</span></div>
    <div class="meta-item"><span class="meta-key">Publisher</span><span class="meta-val">${esc(meta.publisher)}</span></div>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="summary-icon icon-error">🚨</div><div><div class="summary-label">Fouten</div><div class="summary-count count-error">${counts.error || 0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-warning">⚠️</div><div><div class="summary-label">Waarschuwingen</div><div class="summary-count count-warning">${counts.warning || 0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-info">ℹ️</div><div><div class="summary-label">Informatie</div><div class="summary-count count-info">${counts.info || 0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-ok">✅</div><div><div class="summary-label">Checks OK</div><div class="summary-count count-ok">${CHECKS.length - findings.length}</div></div></div>
  </div>`;

  if (!findings.length) {
    html += `<div class="success-banner">🎉 Geen problemen gevonden! De solution ziet er goed uit.</div>`;
  } else {
    ['error', 'warning', 'info'].forEach(level => {
      const group = findings.filter(f => f.level === level);
      if (!group.length) return;
      const labels = { error: '🚨 Fouten', warning: '⚠️ Waarschuwingen', info: 'ℹ️ Informatie' };
      html += `<div class="section-title">${labels[level]}</div>`;
      group.forEach(f => {
        const badgeLabel = level === 'error' ? 'Fout' : level === 'warning' ? 'Waarschuwing' : 'Info';
        html += `<div class="finding-card ${level}">
          <div class="finding-header">
            <span class="finding-badge badge-${level}">${badgeLabel}</span>
            <span class="finding-title">${esc(f.title)}</span>
          </div>
          <div class="finding-desc">${esc(f.desc)}</div>
          ${f.details?.length ? f.details.map(d => `<div class="finding-detail">${esc(d)}</div>`).join('') : ''}
          ${f.solution ? `<div class="finding-solution">${esc(f.solution)}</div>` : ''}
          ${renderGuide(f.guide)}
        </div>`;
      });
    });
  }

  results.innerHTML = html;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showLoader() {
  const results = document.getElementById('results');
  results.classList.remove('hidden');
  results.innerHTML = `<div class="loader"><div class="spinner"></div><br/>Analyseren...</div>`;
}

function showError(msg) {
  const results = document.getElementById('results');
  results.classList.remove('hidden');
  results.innerHTML = `<div class="finding-card error"><div class="finding-header"><span class="finding-badge badge-error">Fout</span><span class="finding-title">Analyse mislukt</span></div><div class="finding-desc">${esc(msg)}</div></div>`;
}

// ─── Core Analysis ────────────────────────────────────────────────────────────

function analyzeXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  if (doc.querySelector('parsererror')) {
    showError('Ongeldige XML. Controleer of je de volledige en correcte XML hebt geplakt.');
    return;
  }
  const meta = extractMeta(doc);
  const findings = [];
  for (const check of CHECKS) {
    try {
      const result = check.run(doc);
      if (result) findings.push({ level: result.level || check.level, ...result });
    } catch (e) { console.warn('Check failed:', check.id, e); }
  }
  findings.sort((a, b) => ({ error: 0, warning: 1, info: 2 }[a.level] ?? 9) - ({ error: 0, warning: 1, info: 2 }[b.level] ?? 9));
  renderResults(findings, meta);
}

async function analyzeZip(file) {
  const zip = await window.JSZip.loadAsync(file);
  let xmlContent = null;
  for (const name of ['solution.xml', 'customizations.xml', 'Other/solution.xml']) {
    const entry = zip.file(name);
    if (entry) { xmlContent = await entry.async('text'); break; }
  }
  if (!xmlContent) {
    for (const [name, entry] of Object.entries(zip.files)) {
      if (name.endsWith('.xml') && !entry.dir) { xmlContent = await entry.async('text'); break; }
    }
  }
  if (!xmlContent) { showError('Geen XML bestand gevonden in de ZIP.'); return; }
  analyzeXML(xmlContent);
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const xmlInput = document.getElementById('xmlInput');

async function handleFile(file) {
  showLoader();
  await new Promise(r => setTimeout(r, 200));
  file.name.endsWith('.zip') ? await analyzeZip(file) : analyzeXML(await file.text());
}

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', async e => { e.preventDefault(); dropzone.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f) await handleFile(f); });
fileInput.addEventListener('change', async () => { if (fileInput.files[0]) await handleFile(fileInput.files[0]); });
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const xml = xmlInput.value.trim();
  if (!xml) { if (fileInput.files[0]) { await handleFile(fileInput.files[0]); return; } showError('Plak eerst XML of selecteer een bestand.'); return; }
  showLoader();
  await new Promise(r => setTimeout(r, 150));
  analyzeXML(xml);
});
