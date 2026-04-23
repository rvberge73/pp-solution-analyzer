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
  const topicMap = new Map();
  const parser = new DOMParser();

  Object.entries(ctx.fileContents).forEach(([path, content]) => {
    if (path.startsWith('botcomponents/') && path.endsWith('.xml')) {
      const doc = parser.parseFromString(content, 'text/xml');
      const name = doc.querySelector('name')?.textContent || path.split('/').pop();
      const desc = doc.querySelector('description')?.textContent || 'Geen beschrijving';
      const lastPub = doc.querySelector('publishtime')?.textContent || doc.querySelector('modifiedon')?.textContent || 'Onbekend';
      const stateCode = doc.querySelector('statecode')?.textContent || doc.querySelector('statuscode')?.textContent || '0';
      const statusText = stateCode === '0' ? '🟢 Aan' : '🔴 Uit';
      const isActive = stateCode === '0';
      
      const isTopic = path.includes('componenttype=9') || doc.querySelector('componenttype')?.textContent === '9';
      if (isTopic) {
        const existing = topicMap.get(name);
        if (!existing || (isActive && existing.status === '🔴 Uit') || (isActive === (existing.status === '🟢 Aan') && lastPub > existing.lastPub)) {
          topicMap.set(name, { name, desc, lastPub, status: statusText, path });
        }
      }
    }
  });
  return Array.from(topicMap.values());
}

function harvestWorkflows(ctx) {
  if (!ctx.customizationsDoc) return [];
  return [...ctx.customizationsDoc.querySelectorAll('Workflow')].map(w => ({
    name: w.getAttribute('Name'),
    jsonFile: w.querySelector('JsonFileName')?.textContent || 'N/A',
    type: w.querySelector('ModernFlowType')?.textContent || 'Standard'
  }));
}

function harvestAIModels(ctx) {
  if (!ctx.customizationsDoc) return [];
  const configs = [];
  ctx.customizationsDoc.querySelectorAll('AIConfiguration').forEach(config => {
    const rawJson = config.querySelector('msdyn_customconfiguration')?.textContent;
    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson);
        const promptText = parsed.prompt || parsed.text || parsed.current_prompt || (parsed.prompts && parsed.prompts[0]?.text);
        if (promptText) configs.push({ name: config.parentElement?.parentElement?.querySelector('name')?.textContent || 'AI Model', prompt: promptText });
      } catch (e) { log('AI JSON parse error', e); }
    }
  });
  return configs;
}

function harvestBotParts(ctx) {
  if (!ctx.contentTypesDoc) return [];
  return [...ctx.contentTypesDoc.querySelectorAll('Override')]
    .map(o => o.getAttribute('PartName'))
    .filter(p => p && p.includes('.topic'));
}

function harvestConnectionRefs(ctx) {
  if (!ctx.customizationsDoc) return [];
  return [...ctx.customizationsDoc.querySelectorAll('connectionreference')].map(c => ({
    display: c.querySelector('connectionreferencedisplayname')?.textContent || 'Onbekend',
    id: c.querySelector('connectorid')?.textContent || 'N/A'
  }));
}

function checkExportIntegrity(ctx) {
  const warnings = [];
  const rootComps = [...ctx.solutionDoc.querySelectorAll('RootComponent')];
  
  // Check for Managed status
  const isManaged = ctx.solutionDoc.querySelector('Managed')?.textContent === '1';
  
  rootComps.forEach(comp => {
    const type = comp.getAttribute('type');
    const id = comp.getAttribute('id');
    const schemaName = comp.getAttribute('schemaName') || id;
    
    // Integrity checks (existing)
    if (type === '29') {
      const found = Object.keys(ctx.zipFiles || {}).some(k => k.includes(id) || k.includes(schemaName));
      if (!found) warnings.push({ title: `Flow bestand mist: ${schemaName}`, desc: `Definitiebestand ontbreekt in de ZIP.`, level: 'warning' });
    }
    if (type === '300') {
      const found = Object.keys(ctx.zipFiles || {}).some(k => k.startsWith('CanvasApps/') && k.includes(schemaName));
      if (!found) warnings.push({ title: `Canvas App mist: ${schemaName}`, desc: `Het .msapp bestand ontbreekt.`, level: 'warning' });
    }

    // NEW: Connection Reference Personal Account Check
    if (type === '302') {
      const displayName = comp.getAttribute('displayname') || schemaName;
      
      // Heuristic: Names with spaces (First Last) or email-like patterns
      const isPersonal = /^[A-Z][a-z]+ [A-Z][a-z]+/.test(displayName) || displayName.includes('@');
      
      if (isPersonal) {
        if (isManaged) {
          warnings.push({
            title: `KRITIEK: Persoonlijk account in Managed Solution!`,
            desc: `Account '${displayName}' lijkt persoonlijk. Het is niet toegestaan om persoonlijke accounts te gebruiken in Test/Prod. Flows kunnen worden uitgeschakeld en zijn dan onmogelijk opnieuw te activeren.`,
            level: 'error'
          });
        } else {
          warnings.push({
            title: `Persoonlijk account gedetecteerd`,
            desc: `Connection Reference '${displayName}' lijkt een persoonlijk account te gebruiken. Overweeg een Service Account voor migratie naar Test/Prod.`,
            level: 'warning'
          });
        }
      }
    }
  });
  return warnings;
}

// ─── RENDERERS ────────────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderResults(ctx) {
  const meta = extractMeta(ctx.solutionDoc);
  const totalComps = ctx.solutionDoc.querySelectorAll('RootComponent').length;
  const integrity = checkExportIntegrity(ctx);
  const aiPrompts = harvestAIModels(ctx);
  
  const results = document.getElementById('results');
  let html = `
    <div class="insight-banner">
      <div class="insight-stat"><span class="insight-label">Solution</span><span class="insight-value">${esc(meta.name)}</span></div>
      <div class="insight-stat"><span class="insight-label">Items</span><span class="insight-value">${totalComps}</span></div>
    </div>

    <div class="research-summary" style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--border);">
      <p style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Onderzochte onderdelen:</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--green);">✅</span> <span>Workflows & AI Prompts</span></div>
        <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--green);">✅</span> <span>[Content_Types] Deep Scan</span></div>
        <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--green);">✅</span> <span>Connection Refs & Connector IDs</span></div>
        <div style="display: flex; align-items: center; gap: 0.75rem;"><span style="color: var(--green);">✅</span> <span>Componenten inventarisatie</span></div>
      </div>
    </div>
  `;

  if (aiPrompts.length) {
    html += `
      <div class="insight-card" style="border-left: 4px solid var(--purple);">
        <div class="insight-card-title">✨ AI Prompt Insights</div>
        ${aiPrompts.map(p => `<div style="margin-bottom: 1rem;"><div style="font-weight:600; font-size:0.8rem; color:var(--purple)">${esc(p.name)}</div><div class="finding-desc" style="background:rgba(0,0,0,0.2); padding:1rem; border-radius:8px; font-family:serif; font-style:italic;">"${esc(p.prompt)}"</div></div>`).join('')}
      </div>
    `;
  }

  if (integrity.length) {
    html += `<div class="section-title">⚠️ Integriteit & Waarschuwingen</div>`;
    integrity.forEach(f => {
      html += `<div class="finding-card ${f.level}"><div class="finding-header"><span class="finding-badge badge-${f.level}">${f.level.toUpperCase()}</span><span class="finding-title">${esc(f.title)}</span></div><div class="finding-desc">${esc(f.desc)}</div></div>`;
    });
  }
  results.innerHTML = html;
}

function renderComponents(ctx) {
  const topics = harvestCopilotDeep(ctx);
  const workflows = harvestWorkflows(ctx);
  const botParts = harvestBotParts(ctx);
  const connRefs = harvestConnectionRefs(ctx);
  let h = '';

  if (topics.length) {
    h += `
      <div class="insight-card" style="margin-bottom: 3rem;">
        <div class="insight-card-title">💬 Gedetecteerde Copilot Topics (${topics.length})</div>
        <table class="insight-table">
          <tr><th>Topic</th><th>Status</th><th>Beschrijving</th><th>Laatst Gewijzigd</th></tr>
          ${topics.map(t => `<tr><td><strong>${esc(t.name)}</strong></td><td>${t.status}</td><td><small>${esc(t.desc)}</small></td><td><span class="badge-date">${esc(t.lastPub)}</span></td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  if (workflows.length) {
    h += `
      <div class="insight-card" style="margin-bottom: 3rem;">
        <div class="insight-card-title">🔄 Cloud Workflows (${workflows.length})</div>
        <table class="insight-table">
          <tr><th>Workflow Name</th><th>Bestandsnaam</th><th>Type</th></tr>
          ${workflows.map(w => `<tr><td><strong>${esc(w.name)}</strong></td><td><code>${esc(w.jsonFile)}</code></td><td><span class="badge-date">${esc(w.type)}</span></td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  if (connRefs.length) {
    h += `
      <div class="insight-card" style="margin-bottom: 3rem;">
        <div class="insight-card-title">🔗 Connection References (${connRefs.length})</div>
        <table class="insight-table">
          <tr><th>Display Name</th><th>Connector ID</th></tr>
          ${connRefs.map(c => `<tr><td><strong>${esc(c.display)}</strong></td><td><code>${esc(c.id)}</code></td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  if (botParts.length) {
    h += `
      <div class="insight-card" style="margin-bottom: 3rem;">
        <div class="insight-card-title">🤖 [Content_Types] Bot Parts (${botParts.length})</div>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; padding:1rem;">
          ${botParts.map(p => `<span class="badge-date" style="background:rgba(255,255,255,0.05)">${esc(p)}</span>`).join('')}
        </div>
      </div>
    `;
  }

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
  h += `<div class="comp-summary"><div class="comp-summary-num">${total}</div><div class="comp-summary-label"><strong>Componenten Overzicht</strong>${total} objecten gevonden in de solution.</div></div><div class="comp-grid">`;
  comps.forEach((c,i) => {
    h += `<div class="comp-card" id="cc${i}"><div class="comp-card-header" onclick="toggleCard('cc${i}')"><div class="comp-card-icon">${c.icon}</div><div class="comp-card-info"><div class="comp-card-name">${c.label}</div><div class="comp-card-count">${c.items.length} item(s)</div></div><span class="comp-card-chevron">▼</span></div><div class="comp-card-body">${c.items.map(item => `<div class="comp-item"><span class="comp-item-dot"></span><div>${esc(item.name)}<br/><small style="opacity:0.6"><code>${esc(item.logical || '')}</code></small></div></div>`).join('')}</div></div>`;
  });
  h += `</div>`;
  document.getElementById('componentsView').innerHTML = h;
}

function extractMeta(doc) {
  return { name: doc.querySelector('UniqueName')?.textContent||'–', version: doc.querySelector('Version')?.textContent||'–' };
}

window.toggleCard = id => document.getElementById(id).classList.toggle('open');

// ─── CORE ─────────────────────────────────────────────────────────────────────
async function handleFile(file) {
  document.getElementById('outputArea').classList.remove('hidden');
  document.getElementById('results').innerHTML = `<div class="loader"><div class="spinner"></div><br/>Analyse bezig...</div>`;
  try {
    const ctx = { zipFiles: null, fileContents: {}, solutionDoc: null };
    const parser = new DOMParser();
    if (file.name.endsWith('.zip')) {
      const zip = await window.JSZip.loadAsync(file);
      ctx.zipFiles = zip.files;
      const solEntry = zip.file('solution.xml') || zip.file('Other/solution.xml');
      if (solEntry) ctx.solutionDoc = parser.parseFromString(await solEntry.async('text'), 'text/xml');
      
      const custEntry = zip.file('customizations.xml') || zip.file('Other/customizations.xml');
      if (custEntry) ctx.customizationsDoc = parser.parseFromString(await custEntry.async('text'), 'text/xml');

      const ctEntry = zip.file('[Content_Types].xml');
      if (ctEntry) ctx.contentTypesDoc = parser.parseFromString(await ctEntry.async('text'), 'text/xml');
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
    if (!ctx.solutionDoc) throw new Error('Geen Solution XML.');
    renderResults(ctx);
    renderComponents(ctx);
  } catch (err) {
    document.getElementById('results').innerHTML = `<div class="finding-card error">Fout: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
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
});

log('Engine fully loaded.');
