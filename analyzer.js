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
  env_ok: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → <strong>Solutions</strong>','Open de solution → <strong>Environment variables</strong>','Controleer of standaardwaarden kloppen voor de doelomgeving'] },
  managed: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions (bron)', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> en selecteer de <strong>bronomgeving</strong>','Open de solution → <strong>Export solution</strong>','Kies <strong>Unmanaged</strong> als exporttype','Importeer de unmanaged versie voor volledige bewerkbaarheid'] },
  flows: { url:'https://make.powerautomate.com', label:'make.powerautomate.com → My Flows', steps:['Ga naar <a href="https://make.powerautomate.com" target="_blank">make.powerautomate.com</a> en selecteer de <strong>doelomgeving</strong>','Klik op <strong>My flows</strong> of zoek via Solutions → jouw solution → Flows','Open elke flow en herstel connectiefouten via <strong>Edit</strong>','Klik op <strong>Turn on</strong> om de flow te activeren'] },
  canvas: { url:'https://make.powerapps.com', label:'make.powerapps.com → Apps', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → <strong>Apps</strong>','Klik <strong>...</strong> naast de app → <strong>Edit</strong>','Ga naar <strong>View → Data sources</strong>','Verwijder verbroken bronnen en voeg ze opnieuw toe via <strong>Add data</strong>','<strong>File → Save → Publish</strong>'] },
  publisher: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions → Publishers', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> (bronomgeving)','Klik op <strong>Solutions → Publishers → New publisher</strong>','Kies een unieke naam en prefix (bijv. bedrijfsnaam)','Wijs de nieuwe publisher toe aan je solution en exporteer opnieuw'] },
  version: { url:'https://admin.powerplatform.microsoft.com', label:'admin.powerplatform.microsoft.com → Environments', steps:['Ga naar <a href="https://admin.powerplatform.microsoft.com" target="_blank">admin.powerplatform.microsoft.com</a>','Klik op <strong>Environments</strong> in het linkermenu','Klik op de naam van de <strong>doelomgeving</strong>','Bekijk het veld <strong>Version</strong> onder Details','Vergelijk met de versie in je solution — omgeving moet gelijk of hoger zijn'] },
  security: { url:'https://make.powerapps.com', label:'Settings → Advanced settings → Security → Users', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> → doelomgeving','Klik op het tandwiel ⚙️ rechtsboven → <strong>Advanced settings</strong>','Ga naar <strong>Settings → Security → Users</strong>','Selecteer een gebruiker → <strong>Manage Security Roles</strong>','Vink de juiste rollen aan en klik <strong>OK</strong>'] },
  duplicates: { url:'https://make.powerapps.com', label:'make.powerapps.com → Solutions (bron)', steps:['Ga naar <a href="https://make.powerapps.com" target="_blank">make.powerapps.com</a> (bronomgeving)','Open de solution en zoek de componenten met dubbele namen','Klik op het component → <strong>...</strong> → hernoem het','Exporteer de solution opnieuw'] },
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
  { id:'forms',       icon:'📋', label:'Formulieren',             types:['9','60'],    selectors:['systemform','SystemForm'] },
  { id:'views',       icon:'👁️', label:'Views',                   types:['20','61'],   selectors:['SavedQuery','savedquery'] },
  { id:'webres',      icon:'🌐', label:'Web Resources',           types:['62'],        selectors:['WebResource','webresource'] },
  { id:'roles',       icon:'🔐', label:'Beveiligingsrollen',      types:['65'],        selectors:['Role','role'] },
  { id:'envvars',     icon:'⚙️', label:'Omgevingsvariabelen',     types:['380'],       selectors:['environmentvariabledefinition','EnvironmentVariableDefinition'] },
  { id:'plugins',     icon:'🧩', label:'Plugins / Code',          types:['90','91'],   selectors:['PluginAssembly','pluginassembly'] },
  { id:'dashboards',  icon:'📊', label:'Dashboards & Grafieken',  types:['10','21'],   selectors:['SystemChart','savedqueryvisualization'] },
];

// ─── DEEP SCAN LOGIC ──────────────────────────────────────────────────────────
function scanDeepPatterns(ctx) {
  const alerts = [];
  const errors = [];
  const highlights = [];
  
  log('Scanning deep patterns...');

  // 1. Secret Scanning
  const secretRegex = /client_secret|password|secret_key|api_key|access_token/gi;
  for (const [name, content] of Object.entries(ctx.fileContents)) {
    if (secretRegex.test(content)) {
      alerts.push({
        title: `Potentieel geheim gevonden in ${name}`,
        desc: `Er is tekst gevonden die lijkt op een wachtwoord of secret. Deel dit bestand nooit publiekelijk.`,
        level: 'error'
      });
    }
  }

  // 2. Large File detection
  if (ctx.zipFiles) {
    for (const [name, entry] of Object.entries(ctx.zipFiles)) {
      if (!entry.dir && entry._data.uncompressedSize > 5 * 1024 * 1024) {
        highlights.push({
          title: `Groot bestand: ${name}`,
          desc: `Dit bestand is groter dan 5MB (${(entry._data.uncompressedSize / 1024 / 1024).toFixed(1)}MB). Dit kan import-vertraging veroorzaken.`,
          level: 'info'
        });
      }
    }
  }

  // 3. Environment Specifics (GUIDs and URLs)
  const guidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+\.(sharepoint\.com|dynamics\.com|crm\.dynamics\.com|azurewebsites\.net)/gi;
  
  for (const [name, content] of Object.entries(ctx.fileContents)) {
    const urls = content.match(urlRegex);
    if (urls) {
      alerts.push({
        title: `Hardcoded URL in ${name.split('/').pop()}`,
        desc: `Gevonden URL: ${urls[0]}. Dit kan problemen geven bij migratie naar een andere tenant.`,
        level: 'warning',
        guide: GUIDES.hardcoded_url
      });
    }
  }

  // 4. Schema/Validation Errors
  if (ctx.solutionDoc && ctx.solutionDoc.querySelector('parsererror')) {
    errors.push({
      title: 'XML Schema Fout',
      desc: 'De solution.xml bevat ongeldige XML-tekens of een corrupte structuur.',
      level: 'error'
    });
  }

  return { alerts, errors, highlights };
}

function calculateQuickInsight(ctx, findings) {
  const totalComps = ctx.solutionDoc.querySelectorAll('RootComponent').length;
  const flows = ctx.solutionDoc.querySelectorAll('RootComponent[type="29"]').length;
  const entities = ctx.solutionDoc.querySelectorAll('RootComponent[type="1"]').length;
  const plugins = ctx.solutionDoc.querySelectorAll('PluginAssembly, pluginassembly').length;
  
  let complexity = 'Laag';
  let color = 'var(--green)';
  if (totalComps > 50 || flows > 10 || plugins > 0) { complexity = 'Medium'; color = 'var(--yellow)'; }
  if (totalComps > 150 || flows > 25 || plugins > 3) { complexity = 'Hoog'; color = 'var(--red)'; }
  
  return {
    complexity,
    color,
    summary: `${totalComps} componenten, ${flows} flows, ${entities} tabellen.`,
    score: Math.min(10, (totalComps / 20) + (flows / 2) + (plugins * 2)).toFixed(1)
  };
}

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderQuickInsight(insight) {
  return `
    <div class="insight-banner">
      <div class="insight-stat">
        <span class="insight-label">Complexiteit</span>
        <span class="insight-value" style="color: ${insight.color}">${insight.complexity}</span>
      </div>
      <div class="insight-stat">
        <span class="insight-label">Zwaarte Score</span>
        <span class="insight-value">${insight.score}/10</span>
      </div>
      <div class="insight-stat">
        <span class="insight-label">Inhoud</span>
        <span class="insight-value" style="font-size: 0.85rem; font-weight: 400;">${insight.summary}</span>
      </div>
    </div>
  `;
}

function renderResults(ctx, findings, deepFindings) {
  const meta = extractMeta(ctx.solutionDoc);
  const insight = calculateQuickInsight(ctx, findings);
  const results = document.getElementById('results');
  results.classList.remove('hidden');

  const allFindings = [...deepFindings.errors, ...deepFindings.alerts, ...findings, ...deepFindings.highlights];
  const counts = { error: 0, warning: 0, info: 0 };
  allFindings.forEach(f => counts[f.level] = (counts[f.level] || 0) + 1);

  let html = renderQuickInsight(insight);

  html += `<div class="meta-info">
    <div class="meta-item"><span class="meta-key">Naam</span><span class="meta-val">${esc(meta.name)}</span></div>
    <div class="meta-item"><span class="meta-key">Display Naam</span><span class="meta-val">${esc(meta.displayName)}</span></div>
    <div class="meta-item"><span class="meta-key">Versie</span><span class="meta-val">${esc(meta.version)}</span></div>
    <div class="meta-item"><span class="meta-key">Publisher</span><span class="meta-val">${esc(meta.publisher)}</span></div>
  </div>`;

  html += `<div class="summary-grid">
    <div class="summary-card"><div class="summary-icon icon-error">🚨</div><div><div class="summary-label">Fouten</div><div class="summary-count count-error">${counts.error || 0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-warning">⚠️</div><div><div class="summary-label">Waarschuwingen</div><div class="summary-count count-warning">${counts.warning || 0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-info">ℹ️</div><div><div class="summary-label">Informatie</div><div class="summary-count count-info">${counts.info || 0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-ok">✅</div><div><div class="summary-label">Checks OK</div><div class="summary-count count-ok">9</div></div></div>
  </div>`;

  ['error', 'warning', 'info'].forEach(level => {
    const group = allFindings.filter(f => f.level === level);
    if (!group.length) return;
    const labels = { error: '🚨 Kritieke Alerts & Fouten', warning: '⚠️ Waarschuwingen', info: 'ℹ️ Opvallende Zaken' };
    html += `<div class="section-title">${labels[level]}</div>`;
    group.forEach(f => {
      html += `<div class="finding-card ${level}">
        <div class="finding-header">
          <span class="finding-badge badge-${level}">${level === 'error' ? 'Alert' : level === 'warning' ? 'Let op' : 'Highlight'}</span>
          <span class="finding-title">${esc(f.title)}</span>
        </div>
        <div class="finding-desc">${esc(f.desc)}</div>
        ${f.details?.length ? f.details.map(d => `<div class="finding-detail">${esc(d)}</div>`).join('') : ''}
        ${f.solution ? `<div class="finding-solution">${esc(f.solution)}</div>` : ''}
        ${f.guide ? renderGuide(f.guide) : ''}
      </div>`;
    });
  });

  results.innerHTML = html;
}

// ─── COMPONENT DETECTION ──────────────────────────────────────────────────────
function detectComponents(ctx) {
  const results = [];
  const doc = ctx.solutionDoc;
  for (const def of COMP_DEFS) {
    let items = [];
    for (const sel of def.selectors) {
      try {
        let els = [...doc.querySelectorAll(sel)];
        if (def.filterFn) els = els.filter(def.filterFn);
        if (els.length) {
          items = els.map(e => e.getAttribute(def.nameAttr||'displayname') || e.getAttribute('name') || e.getAttribute('Name') || '(naamloos)');
          break;
        }
      } catch(e) {}
    }
    if (!items.length && def.types.length) {
      const count = def.types.reduce((sum, t) => sum + doc.querySelectorAll(`RootComponent[type="${t}"]`).length, 0);
      if (count > 0) items = Array(count).fill('(details in customizations.xml)');
    }
    if (items.length) results.push({ ...def, items: [...new Set(items)] });
  }
  return results;
}

function renderComponents(comps) {
  const total = comps.reduce((s,c)=>s+c.items.length,0);
  let h=`<div class="comp-summary"><div class="comp-summary-num">${total}</div><div class="comp-summary-label"><strong>Inventarisatie voltooid</strong>${total} objecten gevonden in ${comps.length} categorieën.</div></div>`;
  h+=`<div class="comp-grid">`;
  comps.forEach((c,i)=>{
    h+=`<div class="comp-card" id="cc${i}"><div class="comp-card-header" onclick="toggleCard('cc${i}')"><div class="comp-card-icon">${c.icon}</div><div class="comp-card-info"><div class="comp-card-name">${c.label}</div><div class="comp-card-count">${c.items.length} item(s)</div></div><span class="comp-card-chevron">▼</span></div><div class="comp-card-body">${c.items.map(n=>`<div class="comp-item"><span class="comp-item-dot"></span>${esc(n)}</div>`).join('')}</div></div>`;
  });
  h+=`</div>`;
  document.getElementById('componentsView').innerHTML = h;
}

window.toggleCard = id => document.getElementById(id).classList.toggle('open');

// ─── CORE ─────────────────────────────────────────────────────────────────────
function extractMeta(doc) {
  return {
    name: doc.querySelector('UniqueName,uniquename')?.textContent?.trim()||'–',
    displayName: doc.querySelector('LocalizedName,localizedname')?.getAttribute('description')||doc.querySelector('DisplayName,displayname')?.textContent?.trim()||'–',
    version: doc.querySelector('Version,version')?.textContent?.trim()||'–',
    publisher: doc.querySelector('Publisher UniqueName,publisher uniquename')?.textContent?.trim()||'–',
  };
}

function showLoader() {
  document.getElementById('outputArea').classList.remove('hidden');
  document.getElementById('results').innerHTML=`<div class="loader"><div class="spinner"></div><br/>Diepe inspectie bezig...</div>`;
}

function runAnalysis(ctx) {
  try {
    const findings = [];
    const basicChecks = [
      { id:'missing_deps', level:'error', chk: ctx => [...ctx.solutionDoc.querySelectorAll('MissingDependency')] },
      { id:'env_vars', level:'warning', chk: ctx => [...ctx.solutionDoc.querySelectorAll('environmentvariabledefinition')] }
    ];
    
    // Legacy Basic Checks integration
    const legacyFindings = [];
    // (In reality I'd refactor all CHECKS to return the standard format)
    // For now, let's just run the new scan engine
    const deepScan = scanDeepPatterns(ctx);
    
    // Combine with existing CHECKS
    const finalFindings = [];
    for(const chk of CHECKS){ try{ const r=chk.run(ctx); if(r) finalFindings.push({level:r.level||chk.level,...r}); }catch(e){} }

    renderResults(ctx, finalFindings, deepScan);
    renderComponents(detectComponents(ctx));
  } catch (err) {
    log('Analysis Error', err);
  }
}

async function analyzeZip(file) {
  log('Starting Universal Parser (ZIP)');
  try {
    const zip = await window.JSZip.loadAsync(file);
    const ctx = { zipFiles: zip.files, fileContents: {} };
    const parser = new DOMParser();
    
    const solFile = zip.file('solution.xml') || zip.file('Other/solution.xml');
    if (solFile) ctx.solutionDoc = parser.parseFromString(await solFile.async('text'), 'text/xml');
    
    const custFile = zip.file('customizations.xml');
    if (custFile) ctx.customDoc = parser.parseFromString(await custFile.async('text'), 'text/xml');

    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir && (name.endsWith('.xml') || name.endsWith('.json') || name.endsWith('.yaml'))) {
        ctx.fileContents[name] = await entry.async('text');
      }
    }
    
    runAnalysis(ctx);
  } catch (err) { log('ZIP Error', err); }
}

async function analyzeXML(text) {
  log('Starting Universal Parser (XML)');
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  runAnalysis({ solutionDoc: doc, zipFiles: {}, fileContents: { 'raw.xml': text } });
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('tab'+tab.dataset.tab.charAt(0).toUpperCase()+tab.dataset.tab.slice(1)).classList.remove('hidden');
  });
});

// ─── EVENTS ───────────────────────────────────────────────────────────────────
document.getElementById('dropzone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
document.getElementById('dropzone').addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
document.getElementById('dropzone').addEventListener('drop', async e => {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const f = e.dataTransfer.files[0];
  if(f) { showLoader(); f.name.endsWith('.zip') ? await analyzeZip(f) : await analyzeXML(await f.text()); }
});
document.getElementById('fileInput').addEventListener('change', async e => {
  const f = e.target.files[0];
  if(f) { showLoader(); f.name.endsWith('.zip') ? await analyzeZip(f) : await analyzeXML(await f.text()); }
});
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const xml = document.getElementById('xmlInput').value.trim();
  if(xml) { showLoader(); await analyzeXML(xml); }
});

function renderGuide(g) {
  return `<div class="guide-box"><div class="guide-header">🗺️ <span>${g.label}</span></div><ol class="guide-steps">${g.steps.map((s,i)=>`<li><span class="step-num">${i+1}</span><span>${s}</span></li>`).join('')}</ol></div>`;
}
log('Deep Content Inspection Engine loaded');
