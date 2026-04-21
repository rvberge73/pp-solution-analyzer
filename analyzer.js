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
  { id:'bots',        icon:'🤖', label:'Copilot / Bots',         types:['9945'],      selectors:['bot','Bot'] },
  { id:'topics',      icon:'💬', label:'Topics',                  types:['9947'],      selectors:['botcomponent[componenttype="9"]','botcomponent[ComponentType="9"]'], nameAttr:'name' },
  { id:'childagents', icon:'👶', label:'Child Agents',            types:[],            selectors:['botcomponent[componenttype="14"]','botcomponent[ComponentType="14"]'], nameAttr:'name' },
  { id:'agentflows',  icon:'🔄', label:'Agent Flows / Cloud Flows', types:['29'],     selectors:['Workflow','workflow'], filterFn: el => ['5','6'].includes(el.getAttribute('category')||el.getAttribute('Category')||'5') },
  { id:'canvas',      icon:'📱', label:'Canvas Apps',             types:['300'],       selectors:['CanvasApp','canvasapp'] },
  { id:'mdapps',      icon:'🗃️', label:'Model-driven Apps',       types:['80'],        selectors:['AppModule','appmodule'] },
  { id:'connectors',  icon:'🔌', label:'Custom Connectors',       types:['301'],       selectors:['connector','Connector'] },
  { id:'connrefs',    icon:'🔗', label:'Connection References',   types:['302'],       selectors:['connectionreference','ConnectionReference'], nameAttr:'connectionreferencelogicalname' },
  { id:'tables',      icon:'🗄️', label:'Dataverse Tabellen',      types:['1'],         selectors:['Entity','entity'] },
  { id:'plugins',     icon:'🧩', label:'Plugins / Code',          types:['90','91'],   selectors:['PluginAssembly','pluginassembly'] },
  { id:'envvars',     icon:'⚙️', label:'Omgevingsvariabelen',     types:['380'],       selectors:['environmentvariabledefinition','EnvironmentVariableDefinition'] },
];

// ─── HARVESTER LOGIC ──────────────────────────────────────────────────────────
function harvestMetadata(ctx) {
  const metadata = { creators: new Set(), modifiers: new Set(), descriptions: [] };
  
  const scanDocs = [ctx.solutionDoc, ctx.customDoc].filter(Boolean);
  scanDocs.forEach(doc => {
    // CreatedBy / ModifiedBy
    doc.querySelectorAll('CreatedBy, CreatedByName, ModifiedBy, ModifiedByName').forEach(el => {
      const val = el.textContent.trim();
      if (val && val !== '00000000-0000-0000-0000-000000000000') {
        if (el.tagName.toLowerCase().includes('created')) metadata.creators.add(val);
        else metadata.modifiers.add(val);
      }
    });
    // Descriptions
    doc.querySelectorAll('Description, LocalizedName').forEach(el => {
      const desc = el.getAttribute('description') || el.textContent.trim();
      if (desc && desc.length > 5 && !metadata.descriptions.includes(desc)) metadata.descriptions.push(desc);
    });
  });

  return metadata;
}

function harvestAIModels(ctx) {
  const models = [];
  if (!ctx.customDoc) return models;
  
  // AI Models are often entities named msdyn_aimodel
  const entityNodes = ctx.customDoc.querySelectorAll('Entity, entity');
  entityNodes.forEach(node => {
    const name = node.querySelector('Name, name')?.textContent;
    if (name === 'msdyn_aimodel') {
      // In a real solution, the actual models are records, but we can detect the presence
      models.push({ name: 'AI Builder Model (Dataverse)', type: 'Onbekend (Record-level)', status: 'Aanwezig' });
    }
  });

  // Check solution.xml for AI component types (type 402 is often AI model)
  ctx.solutionDoc.querySelectorAll('RootComponent[type="402"]').forEach(comp => {
    models.push({ name: comp.getAttribute('id') || 'AI Model', type: 'AI Builder', status: 'Managed' });
  });

  return models;
}

function harvestConnections(ctx) {
  const connections = [];
  ctx.solutionDoc.querySelectorAll('connectionreference, ConnectionReference').forEach(el => {
    connections.push({
      logicalName: el.getAttribute('connectionreferencelogicalname') || '–',
      displayName: el.getAttribute('displayname') || '–',
      provider: el.querySelector('connectionreferencedisplayname')?.textContent || el.getAttribute('connectionreferencelogicalname')?.split('_')[1] || 'Unknown',
      connectionId: el.querySelector('connectionid')?.textContent || 'Niet toegewezen'
    });
  });
  return connections;
}

function harvestFullUrls(ctx) {
  const urls = new Set();
  const greedyUrlRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"<>']*/gi;
  
  Object.entries(ctx.fileContents).forEach(([name, content]) => {
    const matches = content.match(greedyUrlRegex);
    if (matches) {
      matches.forEach(url => {
        // Filter out common noise
        if (!url.includes('schema.microsoft.com') && !url.includes('w3.org')) {
          urls.add(url);
        }
      });
    }
  });
  return Array.from(urls);
}

// ─── RENDERERS ────────────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderInsights(ctx) {
  const metadata = harvestMetadata(ctx);
  const aiModels = harvestAIModels(ctx);
  const connections = harvestConnections(ctx);
  const urls = harvestFullUrls(ctx);

  let html = `<div class="section-title">📊 Geavanceerde Inzichten</div>`;

  // Metadata Table
  html += `
    <div class="insight-card">
      <div class="insight-card-title">👥 Betrokken Personen & Metadata</div>
      <table class="insight-table">
        <tr><th>Type</th><th>Waarden</th></tr>
        <tr><td>Makers</td><td>${Array.from(metadata.creators).join(', ') || 'Onbekend'}</td></tr>
        <tr><td>Aanpassers</td><td>${Array.from(metadata.modifiers).join(', ') || 'Onbekend'}</td></tr>
        <tr><td>Omschrijvingen</td><td><ul class="insight-list">${metadata.descriptions.slice(0,3).map(d => `<li>${esc(d)}</li>`).join('')}</ul></td></tr>
      </table>
    </div>
  `;

  // AI Models
  if (aiModels.length) {
    html += `
      <div class="insight-card">
        <div class="insight-card-title">🤖 AI Builder Modellen</div>
        <table class="insight-table">
          <tr><th>Model Naam</th><th>Type</th><th>Status</th></tr>
          ${aiModels.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.type)}</td><td>${esc(m.status)}</td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  // Connections
  if (connections.length) {
    html += `
      <div class="insight-card">
        <div class="insight-card-title">🔗 Deep Connection Insights</div>
        <table class="insight-table">
          <tr><th>Display Naam</th><th>Provider</th><th>ID</th></tr>
          ${connections.map(c => `<tr><td>${esc(c.displayName)}</td><td><strong>${esc(c.provider)}</strong></td><td><small>${esc(c.connectionId)}</small></td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  // Greedy URLs
  if (urls.length) {
    html += `
      <div class="insight-card">
        <div class="insight-card-title">📡 Gevonden Eindpunten (Full URLs)</div>
        <div class="url-list">
          ${urls.slice(0, 15).map(url => `<div class="url-item">${esc(url)}</div>`).join('')}
          ${urls.length > 15 ? `<div class="url-more">...en nog ${urls.length - 15} andere URL's</div>` : ''}
        </div>
      </div>
    `;
  }

  return html;
}

function renderResults(ctx, findings, deepScan) {
  const meta = extractMeta(ctx.solutionDoc);
  const totalComps = ctx.solutionDoc.querySelectorAll('RootComponent').length;
  
  const results = document.getElementById('results');
  const allFindings = [...deepScan.errors, ...deepScan.alerts, ...findings, ...deepScan.highlights];
  const counts = { error: 0, warning: 0, info: 0 };
  allFindings.forEach(f => counts[f.level] = (counts[f.level] || 0) + 1);

  let html = `
    <div class="insight-banner">
      <div class="insight-stat"><span class="insight-label">Solution</span><span class="insight-value">${esc(meta.name)}</span></div>
      <div class="insight-stat"><span class="insight-label">Grootte</span><span class="insight-value">${totalComps} obj</span></div>
      <div class="insight-stat"><span class="insight-label">Status</span><span class="insight-value" style="color:var(--green)">Scan Voltooid</span></div>
    </div>
  `;

  html += renderInsights(ctx);

  html += `<div class="section-title">⚠️ Analyse & Bevindingen</div>`;
  ['error', 'warning', 'info'].forEach(level => {
    const grp = allFindings.filter(f => f.level === level);
    if (!grp.length) return;
    html += grp.map(f => `
      <div class="finding-card ${level}">
        <div class="finding-header"><span class="finding-badge badge-${level}">${level.toUpperCase()}</span><span class="finding-title">${esc(f.title)}</span></div>
        <div class="finding-desc">${esc(f.desc)}</div>
        ${f.guide ? renderGuide(f.guide) : ''}
      </div>
    `).join('');
  });

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
        if (els.length) { items = els.map(e => e.getAttribute(def.nameAttr||'displayname') || e.getAttribute('name') || '(naamloos)'); break; }
      } catch(e) {}
    }
    if (items.length) comps.push({ ...def, items: [...new Set(items)] });
  }
  
  const total = comps.reduce((s,c)=>s+c.items.length,0);
  let h = `<div class="comp-summary"><div class="comp-summary-num">${total}</div><div class="comp-summary-label"><strong>Inventarisatie</strong>${total} objecten gevonden.</div></div><div class="comp-grid">`;
  comps.forEach((c,i) => {
    h += `<div class="comp-card" id="cc${i}"><div class="comp-card-header" onclick="toggleCard('cc${i}')"><div class="comp-card-icon">${c.icon}</div><div class="comp-card-info"><div class="comp-card-name">${c.label}</div><div class="comp-card-count">${c.items.length} item(s)</div></div><span class="comp-card-chevron">▼</span></div><div class="comp-card-body">${c.items.map(n=>`<div class="comp-item"><span class="comp-item-dot"></span>${esc(n)}</div>`).join('')}</div></div>`;
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
  document.getElementById('results').innerHTML = `<div class="loader"><div class="spinner"></div><br/>Harvester bezig...</div>`;
  
  try {
    const ctx = { zipFiles: null, fileContents: {}, solutionDoc: null, customDoc: null };
    const parser = new DOMParser();

    if (file.name.endsWith('.zip')) {
      const zip = await window.JSZip.loadAsync(file);
      ctx.zipFiles = zip.files;
      const solEntry = zip.file('solution.xml') || zip.file('Other/solution.xml');
      if (solEntry) ctx.solutionDoc = parser.parseFromString(await solEntry.async('text'), 'text/xml');
      const custEntry = zip.file('customizations.xml');
      if (custEntry) ctx.customDoc = parser.parseFromString(await custEntry.async('text'), 'text/xml');
      
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
      ctx.fileContents['raw.xml'] = text;
    }

    if (!ctx.solutionDoc) throw new Error('Geen Solution XML gevonden.');

    const findings = []; // Placeholder for basic checks
    const deepScan = { alerts: [], errors: [], highlights: [] }; // Placeholder for deep scan
    
    renderResults(ctx, findings, deepScan);
    renderComponents(ctx);
    
  } catch (err) {
    log('Fatal Error', err);
    document.getElementById('results').innerHTML = `<div class="finding-card error">Fout: ${err.message}</div>`;
  }
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', e => { if(e.target.files[0]) handleFile(e.target.files[0]); });
document.getElementById('dropzone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
document.getElementById('dropzone').addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
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

function renderGuide(g) {
  return `<div class="guide-box"><div class="guide-header">🗺️ <span>${g.label}</span></div><ol class="guide-steps">${g.steps.map((s,i)=>`<li><span class="step-num">${i+1}</span><span>${s}</span></li>`).join('')}</ol></div>`;
}
log('Harvester Engine initialized.');
