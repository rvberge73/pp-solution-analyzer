// ─── Analyzer Engine ───────────────────────────────────────────────────────

const CHECKS = [
  {
    id: 'missing_deps',
    name: 'Ontbrekende Afhankelijkheden',
    level: 'error',
    run(doc) {
      const missing = [...doc.querySelectorAll('MissingDependency')];
      if (!missing.length) return null;
      const items = missing.map(m => {
        const req = m.querySelector('Required');
        const dep = m.querySelector('Dependent');
        return `${req?.getAttribute('displayName') || req?.getAttribute('id') || 'Onbekend'} (type: ${req?.getAttribute('type') || '?'})`;
      });
      return {
        title: `${missing.length} Ontbrekende afhankelijkheid${missing.length > 1 ? 'heden' : ''}`,
        desc: `De solution heeft componenten die afhankelijk zijn van objecten die niet aanwezig zijn in de doelomgeving.`,
        details: items.slice(0, 5),
        solution: `Installeer eerst de vereiste managed solutions of zorg dat de afhankelijke componenten aanwezig zijn in de doelomgeving. Controleer de sectie MissingDependencies in solution.xml.`,
      };
    }
  },
  {
    id: 'connection_refs',
    name: 'Connectie Referenties',
    level: 'warning',
    run(doc) {
      const refs = [...doc.querySelectorAll('connectionreference, ConnectionReference')];
      if (!refs.length) return null;
      const names = refs.map(r => r.getAttribute('connectionreferencelogicalname') || r.getAttribute('displayname') || r.getAttribute('name') || 'Onbekend');
      return {
        title: `${refs.length} Connectie Referentie${refs.length > 1 ? 's' : ''} gevonden`,
        desc: `De solution bevat connectie referenties die in de doelomgeving opnieuw ingesteld moeten worden.`,
        details: [...new Set(names)].slice(0, 5),
        solution: `Na het importeren: ga naar de Flows of Apps die gebruikmaken van deze connecties en configureer de connectie referenties opnieuw via 'Edit > Connections'.`,
      };
    }
  },
  {
    id: 'env_variables',
    name: 'Omgevingsvariabelen',
    level: 'warning',
    run(doc) {
      const vars = [...doc.querySelectorAll('environmentvariabledefinition, EnvironmentVariableDefinition')];
      if (!vars.length) return null;
      const withoutDefault = vars.filter(v => !v.querySelector('defaultvalue, DefaultValue'));
      const names = withoutDefault.map(v => v.getAttribute('displayname') || v.getAttribute('schemaname') || 'Onbekend');
      if (!withoutDefault.length) return {
        title: `${vars.length} Omgevingsvariabele${vars.length > 1 ? 'n' : ''} (met standaardwaarden)`,
        desc: `Er zijn omgevingsvariabelen gevonden, maar alle hebben standaardwaarden.`,
        details: [],
        solution: `Controleer na import of de standaardwaarden correct zijn voor de doelomgeving.`,
        level: 'info',
      };
      return {
        title: `${withoutDefault.length} Omgevingsvariabele${withoutDefault.length > 1 ? 'n' : ''} zonder standaardwaarde`,
        desc: `De volgende omgevingsvariabelen hebben geen standaardwaarde en moeten handmatig worden ingevuld bij import.`,
        details: names.slice(0, 5),
        solution: `Stel bij het importeren de waarden in voor alle omgevingsvariabelen. Zonder correcte waarden werken flows en apps mogelijk niet.`,
      };
    }
  },
  {
    id: 'managed_props',
    name: 'Managed Eigenschappen',
    level: 'info',
    run(doc) {
      const managed = doc.querySelector('SolutionManifest > Managed, managed');
      const isManaged = managed?.textContent?.trim() === '1' || managed?.textContent?.trim()?.toLowerCase() === 'true';
      if (!isManaged) return null;
      return {
        title: 'Managed Solution',
        desc: `Dit is een managed solution. Aanpassingen aan componenten in de doelomgeving zijn beperkt.`,
        details: [],
        solution: `Als je aanpassingen wilt maken, exporteer dan de unmanaged solution vanuit de bronomgeving, of maak een aparte unmanaged layer bovenop.`,
      };
    }
  },
  {
    id: 'flows',
    name: 'Power Automate Flows',
    level: 'info',
    run(doc) {
      const flows = [...doc.querySelectorAll('workflow[category="5"], Workflow[Category="5"]')];
      const allWorkflows = [...doc.querySelectorAll('workflow, Workflow')].filter(w => {
        const cat = w.getAttribute('category') || w.getAttribute('Category');
        return cat === '5';
      });
      const found = flows.length || allWorkflows.length;
      if (!found) return null;
      const names = allWorkflows.slice(0, 5).map(w => w.getAttribute('name') || 'Onbekend');
      return {
        title: `${found} Power Automate Flow${found > 1 ? 's' : ''} gedetecteerd`,
        desc: `Flows moeten na import worden ingeschakeld en hun connecties moeten worden geconfigureerd.`,
        details: names,
        solution: `Na import: open elke flow, controleer de connecties, en schakel de flow in via het 'Turn on' commando.`,
      };
    }
  },
  {
    id: 'canvas_apps',
    name: 'Canvas Apps',
    level: 'info',
    run(doc) {
      const apps = [...doc.querySelectorAll('CanvasApp, canvasapp')];
      if (!apps.length) return null;
      const names = apps.map(a => a.getAttribute('displayname') || a.getAttribute('name') || 'Onbekend');
      return {
        title: `${apps.length} Canvas App${apps.length > 1 ? 's' : ''} gevonden`,
        desc: `Canvas apps vereisen na import mogelijk herverbinding van data bronnen.`,
        details: names.slice(0, 5),
        solution: `Open na import elke canvas app in de editor, controleer de data bronnen onder 'View > Data sources' en herstel eventuele verbroken verbindingen.`,
      };
    }
  },
  {
    id: 'publisher',
    name: 'Publisher Prefix Conflict',
    level: 'warning',
    run(doc) {
      const pub = doc.querySelector('Publisher, publisher');
      if (!pub) return null;
      const prefix = pub.querySelector('CustomizationPrefix, customizationprefix')?.textContent?.trim();
      const name = pub.querySelector('UniqueName, uniquename')?.textContent?.trim() || pub.getAttribute('uniquename');
      if (!prefix || prefix === 'new') return {
        title: 'Standaard Publisher Prefix "new"',
        desc: `De solution gebruikt de standaard "new" publisher prefix. Dit kan conflicten veroorzaken.`,
        details: [`Publisher: ${name || 'Onbekend'}`, `Prefix: ${prefix || 'new'}`],
        solution: `Gebruik altijd een unieke publisher prefix (bijv. je bedrijfsnaam). Pas de publisher aan in de bronomgeving voordat je de solution exporteert.`,
      };
      return null;
    }
  },
  {
    id: 'version',
    name: 'Solution Versie',
    level: 'info',
    run(doc) {
      const ver = doc.querySelector('Version, version')?.textContent?.trim()
        || doc.querySelector('SolutionManifest')?.getAttribute('Version');
      if (!ver) return null;
      return {
        title: `Versie: ${ver}`,
        desc: `Gevonden solution versie. Zorg dat de doelomgeving een gelijke of hogere platform versie heeft.`,
        details: [],
        solution: `Controleer de versie van de Power Platform omgeving via admin.powerplatform.microsoft.com.`,
        level: 'info',
      };
    }
  },
  {
    id: 'security_roles',
    name: 'Beveiligingsrollen',
    level: 'info',
    run(doc) {
      const roles = [...doc.querySelectorAll('Role, role')];
      if (!roles.length) return null;
      const names = roles.map(r => r.getAttribute('name') || r.getAttribute('Name') || 'Onbekend');
      return {
        title: `${roles.length} Beveiligingsrol${roles.length > 1 ? 'len' : ''} gevonden`,
        desc: `Beveiligingsrollen in de solution moeten na import worden toegewezen aan gebruikers.`,
        details: names.slice(0, 5),
        solution: `Wijs na import de beveiligingsrollen toe aan de juiste gebruikers of teams via Settings > Security > Users.`,
      };
    }
  },
  {
    id: 'duplicate_names',
    name: 'Dubbele Component Namen',
    level: 'warning',
    run(doc) {
      const components = [...doc.querySelectorAll('[name], [Name]')];
      const names = components.map(c => c.getAttribute('name') || c.getAttribute('Name')).filter(Boolean);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      const unique = [...new Set(dupes)];
      if (!unique.length) return null;
      return {
        title: `${unique.length} Dubbele component naam/namen`,
        desc: `Er zijn componenten met dezelfde naam gevonden. Dit kan importproblemen veroorzaken.`,
        details: unique.slice(0, 5),
        solution: `Hernoem de conflicterende componenten in de bronomgeving voordat je de solution opnieuw exporteert.`,
      };
    }
  },
];

// ─── Metadata Extractor ──────────────────────────────────────────────────────

function extractMeta(doc) {
  const meta = {};
  meta.name = doc.querySelector('UniqueName, uniquename')?.textContent?.trim()
    || doc.querySelector('SolutionManifest')?.getAttribute('Name')
    || '–';
  meta.displayName = doc.querySelector('LocalizedName, localizedname')?.getAttribute('description')
    || doc.querySelector('DisplayName, displayname')?.textContent?.trim()
    || '–';
  meta.version = doc.querySelector('Version, version')?.textContent?.trim() || '–';
  meta.publisher = doc.querySelector('Publisher UniqueName, publisher uniquename')?.textContent?.trim()
    || doc.querySelector('Publisher')?.getAttribute('uniquename') || '–';
  return meta;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function renderResults(findings, meta) {
  const results = document.getElementById('results');
  results.classList.remove('hidden');

  const counts = { error: 0, warning: 0, info: 0 };
  findings.forEach(f => counts[f.level] = (counts[f.level] || 0) + 1);

  let html = '';

  // Meta info
  html += `<div class="meta-info">
    <div class="meta-item"><span class="meta-key">Naam</span><span class="meta-val">${esc(meta.name)}</span></div>
    <div class="meta-item"><span class="meta-key">Display Naam</span><span class="meta-val">${esc(meta.displayName)}</span></div>
    <div class="meta-item"><span class="meta-key">Versie</span><span class="meta-val">${esc(meta.version)}</span></div>
    <div class="meta-item"><span class="meta-key">Publisher</span><span class="meta-val">${esc(meta.publisher)}</span></div>
  </div>`;

  // Summary
  html += `<div class="summary-grid">
    <div class="summary-card">
      <div class="summary-icon icon-error">🚨</div>
      <div><div class="summary-label">Fouten</div><div class="summary-count count-error">${counts.error || 0}</div></div>
    </div>
    <div class="summary-card">
      <div class="summary-icon icon-warning">⚠️</div>
      <div><div class="summary-label">Waarschuwingen</div><div class="summary-count count-warning">${counts.warning || 0}</div></div>
    </div>
    <div class="summary-card">
      <div class="summary-icon icon-info">ℹ️</div>
      <div><div class="summary-label">Informatie</div><div class="summary-count count-info">${counts.info || 0}</div></div>
    </div>
    <div class="summary-card">
      <div class="summary-icon icon-ok">✅</div>
      <div><div class="summary-label">Checks OK</div><div class="summary-count count-ok">${CHECKS.length - findings.length}</div></div>
    </div>
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
        html += `<div class="finding-card ${level}">
          <div class="finding-header">
            <span class="finding-badge badge-${level}">${level === 'error' ? 'Fout' : level === 'warning' ? 'Waarschuwing' : 'Info'}</span>
            <span class="finding-title">${esc(f.title)}</span>
          </div>
          <div class="finding-desc">${esc(f.desc)}</div>
          ${f.details?.length ? f.details.map(d => `<div class="finding-detail">${esc(d)}</div>`).join('') : ''}
          ${f.solution ? `<div class="finding-solution">${esc(f.solution)}</div>` : ''}
        </div>`;
      });
    });
  }

  results.innerHTML = html;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

// ─── Core Analysis ───────────────────────────────────────────────────────────

function analyzeXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    showError('Ongeldige XML. Controleer of je de volledige en correcte XML hebt geplakt. ' + parseError.textContent?.slice(0, 200));
    return;
  }

  const meta = extractMeta(doc);
  const findings = [];

  for (const check of CHECKS) {
    try {
      const result = check.run(doc);
      if (result) {
        findings.push({ level: result.level || check.level, ...result });
      }
    } catch (e) {
      console.warn('Check failed:', check.id, e);
    }
  }

  findings.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return (order[a.level] ?? 9) - (order[b.level] ?? 9);
  });

  renderResults(findings, meta);
}

async function analyzeZip(file) {
  const JSZip = window.JSZip;
  const zip = await JSZip.loadAsync(file);

  const candidates = ['solution.xml', 'customizations.xml', 'Other/solution.xml'];
  let xmlContent = null;

  for (const candidate of candidates) {
    const entry = zip.file(candidate);
    if (entry) { xmlContent = await entry.async('text'); break; }
  }

  // Fallback: first .xml file
  if (!xmlContent) {
    for (const [name, entry] of Object.entries(zip.files)) {
      if (name.endsWith('.xml') && !entry.dir) {
        xmlContent = await entry.async('text');
        break;
      }
    }
  }

  if (!xmlContent) {
    showError('Geen XML bestand gevonden in de ZIP. Zorg dat de ZIP een geldig Power Platform solution export is.');
    return;
  }

  analyzeXML(xmlContent);
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const xmlInput = document.getElementById('xmlInput');

async function handleFile(file) {
  showLoader();
  await new Promise(r => setTimeout(r, 200));
  if (file.name.endsWith('.zip')) {
    await analyzeZip(file);
  } else {
    const text = await file.text();
    analyzeXML(text);
  }
}

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', async e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) await handleFile(file);
});

fileInput.addEventListener('change', async () => {
  if (fileInput.files[0]) await handleFile(fileInput.files[0]);
});

analyzeBtn.addEventListener('click', async () => {
  const xml = xmlInput.value.trim();
  if (!xml) {
    if (fileInput.files[0]) { await handleFile(fileInput.files[0]); return; }
    showError('Plak eerst XML inhoud of selecteer een bestand.');
    return;
  }
  showLoader();
  await new Promise(r => setTimeout(r, 150));
  analyzeXML(xml);
});
