// ─── DEBUG & LOGGING ─────────────────────────────────────────────────────────
function log(msg, data) {
  console.log(`[Analyzer] ${msg}`, data || '');
  const debug = document.getElementById('debugContent');
  const area = document.getElementById('debugArea');
  if (debug && area) {
    area.classList.remove('hidden');
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    line.style.padding = '2px 0';
    line.innerHTML = `[${timestamp}] ${msg} ${data ? JSON.stringify(data).slice(0, 100) : ''}`;
    debug.prepend(line);
  }
}

// ─── GUIDES ──────────────────────────────────────────────────────────────────
const GUIDES = {
  missing_deps: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a>','Selecteer de <strong>doelomgeving</strong> rechtsboven','Klik op <strong>Solutions</strong> en bekijk welke managed solutions aanwezig zijn','Installeer de ontbrekende solutions via <strong>Import solution</strong>','Importeer daarna pas jouw solution opnieuw'] },
  connection_refs: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions', steps:['Importeer de solution via <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → <strong>Solutions → Import</strong>','Open de solution en klik op <strong>Connection References</strong>','Klik op elke referentie en kies of maak een connectie','Sla op en test de flows/apps'] },
  env_missing: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions → Import', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → <strong>Solutions → Import solution</strong>','In de import wizard verschijnt de stap <strong>Environment Variables</strong> — vul de waarden in','Al geïmporteerd? Open de solution → <strong>Environment variables</strong> → <strong>Edit</strong>'] },
  hardcoded_url: { url:'https://make.powerautomate.com', label:'Flow Editor', steps:['Open de flow in de <strong>Edit</strong> modus','Zoek naar acties (zoals HTTP of SharePoint) waar een volledige URL is ingevuld','Vervang de URL door een <strong>Environment Variable</strong> voor een betere migratie'] },
};

// ─── COMPONENT DEFINITIONS ────────────────────────────────────────────────────
const COMP_DEFS = [
  { id:'bots',        icon:'🤖', label:'Agents / Bots',          types:['9945'],      selectors:['bot','Bot'] },
  { id:'topics',      icon:'💬', label:'Copilot Topics',          types:['9947'],      selectors:['botcomponent[componenttype="9"]','botcomponent[ComponentType="9"]'], nameAttr:'name' },
  { id:'childagents', icon:'👶', label:'Child Agents',            types:[],            selectors:['botcomponent[componenttype="14"]','botcomponent[ComponentType="14"]'], nameAttr:'name' },
  { id:'agentflows',  icon:'🔄', label:'Agent Flows / Cloud Flows', types:['29'],     selectors:['Workflow','workflow'], filterFn: el => ['5','6'].includes(el.getAttribute('category')||el.getAttribute('Category')||'5') },
  { id:'canvas',      icon:'📱', label:'Canvas Apps',             types:['300'],       selectors:['CanvasApp','canvasapp'] },
  { id:'mdapps',      icon:'🗃️', label:'Model-driven Apps',       types:['80'],        selectors:['AppModule','appmodule'] },
  { id:'connectors',  icon:'🔌', label:'Custom Connectors',       types:['301'],       selectors:['connector','Connector'] },
  { id:'connrefs',    icon:'🔗', label:'Connection References',   types:['302'],       selectors:['connectionreference','ConnectionReference'], nameAttr:'connectionreferencelogicalname' },
  { id:'tables',      icon:'🗄️', label:'Dataverse Tabellen',      types:['1'],         selectors:['Entity','entity'] },
  { id:'envvars',     icon:'⚙️', label:'Omgevingsvariabelen',     types:['380'],       selectors:['environmentvariabledefinition','EnvironmentVariableDefinition'] },
];

// ─── COPILOT & INTEGRITY HARVESTER ───────────────────────────────────────────
function harvestCopilotDeep(ctx) {
  const topics = [];
  const parser = new DOMParser();

  Object.entries(ctx.fileContents).forEach(([path, content]) => {
    if (path.startsWith('botcomponents/') && path.endsWith('.xml')) {
      const doc = parser.parseFromString(content, 'text/xml');
      const name = doc.querySelector('name')?.textContent || path.split('/').pop();
      const desc = doc.querySelector('description')?.textContent || 'Geen beschrijving';
      const lastPub = doc.querySelector('publishtime')?.textContent || doc.querySelector('modifiedon')?.textContent || 'Onbekend';
      
      // Status detection: statecode 0 is usually Active/On, 1 is Inactive/Off
      const stateCode = doc.querySelector('statecode')?.textContent || doc.querySelector('statuscode')?.textContent || '0';
      const status = stateCode === '0' ? '🟢 Aan' : '🔴 Uit';
      
      const isTopic = path.includes('componenttype=9') || doc.querySelector('componenttype')?.textContent === '9';
      if (isTopic) {
        topics.push({ name, desc, lastPub, status, path });
      }
    }
  });
  return topics;
}

function checkExportIntegrity(ctx) {
  const warnings = [];
  const rootComps = [...ctx.solutionDoc.querySelectorAll('RootComponent')];
  
  rootComps.forEach(comp => {
    const type = comp.getAttribute('type');
    const id = comp.getAttribute('id');
    const schemaName = comp.getAttribute('schemaName') || id;
    
    // Check for common missing files
    if (type === '29') { // Workflow
      const found = Object.keys(ctx.zipFiles || {}).some(k => k.includes(id) || k.includes(schemaName));
      if (!found) warnings.push({ title: `Flow bestand mist: ${schemaName}`, desc: `De flow staat in solution.xml maar het definitiebestand ontbreekt in de ZIP.`, level: 'warning' });
    }
    if (type === '300') { // Canvas App
      const found = Object.keys(ctx.zipFiles || {}).some(k => k.startsWith('CanvasApps/') && k.includes(schemaName));
      if (!found) warnings.push({ title: `Canvas App mist: ${schemaName}`, desc: `Het .msapp bestand of metadata voor deze app ontbreekt.`, level: 'warning' });
    }
  });

  return warnings;
}

function harvestMasterInventory(ctx) {
  const inventory = [];
  const rootComps = [...ctx.solutionDoc.querySelectorAll('RootComponent')];
  rootComps.forEach(comp => {
    inventory.push({
      logicalName: comp.getAttribute('schemaName') || comp.getAttribute('id') || '?',
      typeCode: comp.getAttribute('type'),
      displayName: comp.getAttribute('displayName') || '–'
    });
  });
  return inventory;
}

// ─── RENDERERS ────────────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderInsights(ctx) {
  const topics = harvestCopilotDeep(ctx);
  const integrity = checkExportIntegrity(ctx);
  const master = harvestMasterInventory(ctx);

  let html = `<div class="section-title">📊 Diepe Copilot & Inventaris Analyse</div>`;

  // Copilot Topics
  if (topics.length) {
    html += `
      <div class="insight-card">
        <div class="insight-card-title">💬 Copilot Topics (${topics.length})</div>
        <table class="insight-table">
          <tr><th>Topic</th><th>Status</th><th>Beschrijving</th><th>Datum</th></tr>
          ${topics.map(t => `<tr><td><strong>${esc(t.name)}</strong></td><td>${t.status}</td><td><small>${esc(t.desc)}</small></td><td><span class="badge-date">${esc(t.lastPub)}</span></td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  // Master Inventory
  html += `
    <div class="insight-card">
      <div class="insight-card-title">📂 Master Logical Inventory (${master.length} items)</div>
      <div class="logical-inventory-grid">
        <table class="insight-table">
          <tr><th>Logische Naam</th><th>Type Code</th><th>Display Naam</th></tr>
          ${master.slice(0, 20).map(m => `<tr><td><code>${esc(m.logicalName)}</code></td><td>${esc(m.typeCode)}</td><td><small>${esc(m.displayName)}</small></td></tr>`).join('')}
        </table>
        ${master.length > 20 ? `<div class="url-more">...en nog ${master.length - 20} andere componenten</div>` : ''}
      </div>
    </div>
  `;

  return { html, integrity };
}

function renderResults(ctx) {
  const meta = extractMeta(ctx.solutionDoc);
  const totalComps = ctx.solutionDoc.querySelectorAll('RootComponent').length;
  const results = document.getElementById('results');
  
  const { html: insightsHtml, integrity } = renderInsights(ctx);

  // Combine with basic findings
  const findings = [...integrity];
  const counts = { error: findings.filter(f=>f.level==='error').length, warning: findings.filter(f=>f.level==='warning').length, info: 0 };

  let html = `
    <div class="insight-banner">
      <div class="insight-stat"><span class="insight-label">Solution</span><span class="insight-value">${esc(meta.name)}</span></div>
      <div class="insight-stat"><span class="insight-label">Items</span><span class="insight-value">${totalComps}</span></div>
      <div class="insight-stat"><span class="insight-label">Deep Scan</span><span class="insight-value" style="color:var(--purple)">Actief</span></div>
    </div>
  `;

  html += insightsHtml;

  if (findings.length) {
    html += `<div class="section-title">⚠️ Integriteit & Waarschuwingen</div>`;
    findings.forEach(f => {
      html += `
        <div class="finding-card ${f.level}">
          <div class="finding-header"><span class="finding-badge badge-${f.level}">${f.level.toUpperCase()}</span><span class="finding-title">${esc(f.title)}</span></div>
          <div class="finding-desc">${esc(f.desc)}</div>
        </div>
      `;
    });
  }

  results.innerHTML = html;
}

// ─── COMPONENT DETECTION ──────────────────────────────────────────────────────
function renderComponents(ctx) {
  const comps = [];
  for (const def of COMP_DEFS) {
    let items = [];
    for (const sel of def.selectors) {
      try {
        let els = [...ctx.solutionDoc.querySelectorAll(sel)];
        if (def.filterFn) els = els.filter(def.filterFn);
        if (els.length) { items = els.map(e => ({ name: e.getAttribute(def.nameAttr||'displayname') || e.getAttribute('name') || '(naamloos)', logical: e.getAttribute('schemaName') || e.getAttribute('uniquename') })); break; }
      } catch(e) {}
    }
    if (items.length) comps.push({ ...def, items: [...new Set(items)] });
  }
  
  const total = comps.reduce((s,c)=>s+c.items.length,0);
  let h = `<div class="comp-summary"><div class="comp-summary-num">${total}</div><div class="comp-summary-label"><strong>Componenten Overzicht</strong>${total} objecten gevonden.</div></div><div class="comp-grid">`;
  comps.forEach((c,i) => {
    h += `
      <div class="comp-card" id="cc${i}">
        <div class="comp-card-header" onclick="toggleCard('cc${i}')">
          <div class="comp-card-icon">${c.icon}</div>
          <div class="comp-card-info"><div class="comp-card-name">${c.label}</div><div class="comp-card-count">${c.items.length} item(s)</div></div>
          <span class="comp-card-chevron">▼</span>
        </div>
        <div class="comp-card-body">
          ${c.items.map(item => `<div class="comp-item"><span class="comp-item-dot"></span><div>${esc(item.name)}<br/><small style="opacity:0.6"><code>${esc(item.logical || '')}</code></small></div></div>`).join('')}
        </div>
      </div>`;
  });
  h += `</div>`;
  document.getElementById('componentsView').innerHTML = h;
}

// ─── CORE ─────────────────────────────────────────────────────────────────────
function extractMeta(doc) {
  return { name: doc.querySelector('UniqueName')?.textContent||'–', version: doc.querySelector('Version')?.textContent||'–' };
}

function toggleCard(id) { document.getElementById(id).classList.toggle('open'); }
window.toggleCard = toggleCard;

async function handleFile(file) {
  document.getElementById('outputArea').classList.remove('hidden');
  document.getElementById('results').innerHTML = `<div class="loader"><div class="spinner"></div><br/>Diepe analyse bezig...</div>`;
  
  try {
    const ctx = { zipFiles: null, fileContents: {}, solutionDoc: null };
    const parser = new DOMParser();

    if (file.name.endsWith('.zip')) {
      const zip = await window.JSZip.loadAsync(file);
      ctx.zipFiles = zip.files;
      const solEntry = zip.file('solution.xml') || zip.file('Other/solution.xml');
      if (solEntry) ctx.solutionDoc = parser.parseFromString(await solEntry.async('text'), 'text/xml');
      
      const loadTasks = [];
      for (const [name, entry] of Object.entries(zip.files)) {
        if (!entry.dir && (name.endsWith('.xml') || name.endsWith('.json'))) {
          loadTasks.push(entry.async('text').then(txt => ctx.fileContents[name] = txt));
        }
      }
      await Promise.all(loadTasks);
    } else {
      const text = await file.text();
      ctx.solutionDoc = parser.parseFromString(text, 'text/xml');
    }

    if (!ctx.solutionDoc) throw new Error('Geen Solution XML gevonden.');

    renderResults(ctx);
    renderComponents(ctx);
    
  } catch (err) {
    log('Fatal Error', err);
    document.getElementById('results').innerHTML = `<div class="finding-card error">Fout: ${err.message}</div>`;
  }
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', e => { if(e.target.files[0]) handleFile(e.target.files[0]); });
document.getElementById('dropzone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
document.getElementById('dragleave', e => e.currentTarget.classList.remove('drag-over'));
document.getElementById('dropzone').addEventListener('drop', e => { e.preventDefault(); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
document.getElementById('analyzeBtn').addEventListener('click', () => { 
  const val = document.getElementById('xmlInput').value.trim();
  if(val) handleFile(new File([val], "pasted.xml", {type:"text/xml"}));
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('tab'+tab.dataset.tab.charAt(0).toUpperCase()+tab.dataset.tab.slice(1)).classList.remove('hidden');
  });
});

log('Copilot Deep-Dive Engine ready.');
