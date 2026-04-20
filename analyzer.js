// ─── DEBUG LOGGING ───────────────────────────────────────────────────────────
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

// ─── ANALYSIS CHECKS ──────────────────────────────────────────────────────────
const CHECKS = [
  { id:'missing_deps', level:'error', run(ctx) {
    const m=[...ctx.solutionDoc.querySelectorAll('MissingDependency')]; if(!m.length) return null;
    const items=m.map(x=>{const r=x.querySelector('Required'); return `${r?.getAttribute('displayName')||r?.getAttribute('id')||'?'} (type:${r?.getAttribute('type')||'?'})`;});
    return { title:`${m.length} Ontbrekende afhankelijkheid${m.length>1?'heden':''}`, desc:'De solution heeft componenten afhankelijk van objecten die niet aanwezig zijn in de doelomgeving.', details:items.slice(0,5), solution:'Installeer eerst de vereiste managed solutions in de doelomgeving.', guide:GUIDES.missing_deps };
  }},
  { id:'conn_refs', level:'warning', run(ctx) {
    const r=[...ctx.solutionDoc.querySelectorAll('connectionreference,ConnectionReference')]; if(!r.length) return null;
    const names=r.map(x=>x.getAttribute('connectionreferencelogicalname')||x.getAttribute('name')||'?');
    return { title:`${r.length} Connectie Referentie${r.length>1?'s':''}`, desc:'Connectie referenties moeten in de doelomgeving opnieuw ingesteld worden.', details:[...new Set(names)].slice(0,5), solution:'Configureer na import de connectie referenties vanuit de solution.', guide:GUIDES.connection_refs };
  }},
  { id:'env_vars', level:'warning', run(ctx) {
    const vars=[...ctx.solutionDoc.querySelectorAll('environmentvariabledefinition,EnvironmentVariableDefinition')]; if(!vars.length) return null;
    const missing=vars.filter(v=>!v.querySelector('defaultvalue,DefaultValue'));
    if(!missing.length) return { level:'info', title:`${vars.length} Omgevingsvariabele${vars.length>1?'n':''} (met standaardwaarden)`, desc:'Alle omgevingsvariabelen hebben standaardwaarden.', details:[], solution:'Controleer na import of de standaardwaarden kloppen.', guide:GUIDES.env_ok };
    return { title:`${missing.length} Omgevingsvariabele${missing.length>1?'n':''} zonder standaardwaarde`, desc:'Deze variabelen hebben geen standaardwaarde en moeten bij import worden ingevuld.', details:missing.map(v=>v.getAttribute('displayname')||v.getAttribute('schemaname')||'?').slice(0,5), solution:'Stel de waarden in tijdens of na de import wizard.', guide:GUIDES.env_missing };
  }},
  { id:'hardcoded_urls', level:'warning', run(ctx) {
    if (!ctx.fileContents) return null;
    const foundUrls = [];
    for (const [name, content] of Object.entries(ctx.fileContents)) {
      if (name.startsWith('Workflows/') && name.endsWith('.json')) {
        const matches = content.match(/https?:\/\/[a-zA-Z0-9.-]+\.sharepoint\.com/g) || 
                        content.match(/https?:\/\/[a-zA-Z0-9.-]+\.dynamics\.com/g) ||
                        content.match(/https?:\/\/[a-zA-Z0-9.-]+\.crm\.dynamics\.com/g);
        if (matches) {
          foundUrls.push(...matches.map(u => `${name.split('/').pop()}: ${u}`));
        }
      }
    }
    if (!foundUrls.length) return null;
    return { title:`Hardcoded URL's gedetecteerd`, desc:`Er zijn hardcoded SharePoint of Dynamics URL's gevonden in de Flow definities. Dit kan problemen geven bij migratie naar andere omgevingen/tenants.`, details:[...new Set(foundUrls)].slice(0,5), solution:'Gebruik Omgevingsvariabelen voor URL\'s in plaats van hardcoded waarden.', guide:GUIDES.hardcoded_url };
  }},
  { id:'customizations_plugins', level:'info', run(ctx) {
    if (!ctx.customDoc) return null;
    const plugins = [...ctx.customDoc.querySelectorAll('PluginAssembly, pluginassembly')];
    if (!plugins.length) return null;
    return { title:`${plugins.length} Plugin Assemblies gevonden`, desc:'De solution bevat custom code (C# plugins). Zorg dat de doelomgeving plugins toestaat.', details:plugins.map(p => p.getAttribute('name') || p.getAttribute('Name') || '?').slice(0,5), solution:'Controleer of de Plugin Registration Tool of PAC CLI nodig is voor verdere configuratie.', level:'info' };
  }},
  { id:'managed', level:'info', run(ctx) {
    const m=ctx.solutionDoc.querySelector('SolutionManifest > Managed,managed');
    if(!m||!['1','true'].includes(m.textContent.trim().toLowerCase())) return null;
    return { title:'Managed Solution', desc:'Aanpassingen aan componenten in de doelomgeving zijn beperkt.', details:[], solution:'Exporteer de unmanaged versie vanuit de bronomgeving voor volledige bewerkbaarheid.', guide:GUIDES.managed };
  }},
  { id:'flows', level:'info', run(ctx) {
    const f=[...ctx.solutionDoc.querySelectorAll('workflow,Workflow')].filter(w=>w.getAttribute('category')==='5'||w.getAttribute('Category')==='5');
    if(!f.length) return null;
    return { title:`${f.length} Power Automate Flow${f.length>1?'s':''}`, desc:'Flows moeten na import worden ingeschakeld en geconfigureerd.', details:f.slice(0,5).map(w=>w.getAttribute('name')||'?'), solution:'Open elke flow, herstel connecties en schakel in via Turn on.', guide:GUIDES.flows };
  }},
  { id:'publisher', level:'warning', run(ctx) {
    const pub=ctx.solutionDoc.querySelector('Publisher,publisher'); if(!pub) return null;
    const prefix=pub.querySelector('CustomizationPrefix,customizationprefix')?.textContent?.trim();
    if(!prefix||prefix==='new') return { title:'Standaard Publisher Prefix "new"', desc:'De "new" prefix kan conflicten veroorzaken bij import.', details:[`Prefix: ${prefix||'new'}`], solution:'Maak een nieuwe publisher aan met een unieke prefix.', guide:GUIDES.publisher };
    return null;
  }},
];

// ─── COMPONENT DETECTION ──────────────────────────────────────────────────────
function detectComponents(ctx) {
  const results = [];
  const doc = ctx.solutionDoc;
  const zipFiles = ctx.zipFiles;
  
  for (const def of COMP_DEFS) {
    let items = [];
    for (const sel of def.selectors) {
      try {
        let els = [...doc.querySelectorAll(sel)];
        if (def.filterFn) els = els.filter(def.filterFn);
        if (els.length) {
          items = els.map(e =>
            e.getAttribute(def.nameAttr||'displayname') ||
            e.getAttribute('name') || e.getAttribute('Name') ||
            e.getAttribute('displayname') || e.getAttribute('DisplayName') || '(naamloos)'
          );
          break;
        }
      } catch(e) {}
    }
    if (!items.length && def.types.length) {
      const count = def.types.reduce((sum, t) =>
        sum + doc.querySelectorAll(`RootComponent[type="${t}"],rootcomponent[type="${t}"]`).length, 0);
      if (count > 0) items = Array(count).fill('(details niet beschikbaar in solution.xml)');
    }
    if (!items.length && zipFiles) {
      const folderMap = { canvas:'CanvasApps', flows:'Workflows', webres:'WebResources', connectors:'Connectors' };
      const folder = folderMap[def.id];
      if (folder) {
        const found = Object.keys(zipFiles).filter(n => n.startsWith(folder+'/') && !n.endsWith('/'));
        if (found.length) items = found.map(n => n.split('/').pop());
      }
    }
    if (items.length) results.push({ ...def, items: [...new Set(items)] });
  }
  return results;
}

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderGuide(g) {
  if(!g) return '';
  return `<div class="guide-box"><div class="guide-header"><span class="guide-icon">🗺️</span><span class="guide-label">Stap-voor-stap: <a href="${g.url}" target="_blank" class="guide-link">${g.label}</a></span></div><ol class="guide-steps">${g.steps.map((s,i)=>`<li><span class="step-num">${i+1}</span><span class="step-text">${s}</span></li>`).join('')}</ol></div>`;
}

function renderAnalysis(findings, meta) {
  const counts={error:0,warning:0,info:0};
  findings.forEach(f=>counts[f.level]=(counts[f.level]||0)+1);
  let h=`<div class="meta-info">
    <div class="meta-item"><span class="meta-key">Naam</span><span class="meta-val">${esc(meta.name)}</span></div>
    <div class="meta-item"><span class="meta-key">Display Naam</span><span class="meta-val">${esc(meta.displayName)}</span></div>
    <div class="meta-item"><span class="meta-key">Versie</span><span class="meta-val">${esc(meta.version)}</span></div>
    <div class="meta-item"><span class="meta-key">Publisher</span><span class="meta-val">${esc(meta.publisher)}</span></div>
  </div>
  <div class="summary-grid">
    <div class="summary-card"><div class="summary-icon icon-error">🚨</div><div><div class="summary-label">Fouten</div><div class="summary-count count-error">${counts.error||0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-warning">⚠️</div><div><div class="summary-label">Waarschuwingen</div><div class="summary-count count-warning">${counts.warning||0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-info">ℹ️</div><div><div class="summary-label">Informatie</div><div class="summary-count count-info">${counts.info||0}</div></div></div>
    <div class="summary-card"><div class="summary-icon icon-ok">✅</div><div><div class="summary-label">Checks OK</div><div class="summary-count count-ok">${CHECKS.length-findings.length}</div></div></div>
  </div>`;
  if(!findings.length) { h+=`<div class="success-banner">🎉 Geen problemen gevonden!</div>`; }
  else {
    ['error','warning','info'].forEach(level=>{
      const grp=findings.filter(f=>f.level===level); if(!grp.length) return;
      h+=`<div class="section-title">${{error:'🚨 Fouten',warning:'⚠️ Waarschuwingen',info:'ℹ️ Informatie'}[level]}</div>`;
      grp.forEach(f=>{
        h+=`<div class="finding-card ${level}"><div class="finding-header"><span class="finding-badge badge-${level}">${level==='error'?'Fout':level==='warning'?'Waarschuwing':'Info'}</span><span class="finding-title">${esc(f.title)}</span></div><div class="finding-desc">${esc(f.desc)}</div>${(f.details||[]).map(d=>`<div class="finding-detail">${esc(d)}</div>`).join('')}${f.solution?`<div class="finding-solution">${esc(f.solution)}</div>`:''}${renderGuide(f.guide)}</div>`;
      });
    });
  }
  document.getElementById('results').innerHTML = h;
}

function renderComponents(comps) {
  const total = comps.reduce((s,c)=>s+c.items.length,0);
  let h=`<div class="comp-summary"><div class="comp-summary-num">${total}</div><div class="comp-summary-label"><strong>${total} componenten gevonden</strong>in ${comps.length} categorie${comps.length!==1?'ën':''}</div></div>`;
  if(!comps.length){ h+=`<div class="comp-empty">Geen componenten herkend.<br/>Upload de volledige solution.zip voor beste resultaten.</div>`; }
  else {
    h+=`<div class="comp-grid">`;
    comps.forEach((c,i)=>{
      h+=`<div class="comp-card" id="cc${i}"><div class="comp-card-header" onclick="toggleCard('cc${i}')"><div class="comp-card-icon">${c.icon}</div><div class="comp-card-info"><div class="comp-card-name">${c.label}</div><div class="comp-card-count">${c.items.length} item${c.items.length!==1?'s':''}</div></div><span class="comp-card-chevron">▼</span></div><div class="comp-card-body">${c.items.map(n=>`<div class="comp-item"><span class="comp-item-dot"></span>${esc(n)}</div>`).join('')}</div></div>`;
    });
    h+=`</div>`;
  }
  document.getElementById('componentsView').innerHTML = h;
}

window.toggleCard = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
};

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
  document.getElementById('results').innerHTML=`<div class="loader"><div class="spinner"></div><br/>Diepe scan bezig...</div>`;
  document.getElementById('componentsView').innerHTML='';
}

function showError(msg) {
  document.getElementById('outputArea').classList.remove('hidden');
  document.getElementById('results').innerHTML=`<div class="finding-card error"><div class="finding-header"><span class="finding-badge badge-error">Fout</span><span class="finding-title">Analyse mislukt</span></div><div class="finding-desc">${esc(msg)}</div></div>`;
}

function runAnalysis(ctx) {
  log('Starting Deep Analysis', { files: Object.keys(ctx.zipFiles || {}).length });
  try {
    const meta=extractMeta(ctx.solutionDoc);
    const findings=[];
    for(const chk of CHECKS){ try{ const r=chk.run(ctx); if(r) findings.push({level:r.level||chk.level,...r}); }catch(e){ log(`Check ${chk.id} failed`, e); } }
    findings.sort((a,b)=>({error:0,warning:1,info:2}[a.level]??9)-({error:0,warning:1,info:2}[b.level]??9));
    const comps=detectComponents(ctx);
    document.getElementById('outputArea').classList.remove('hidden');
    renderAnalysis(findings, meta);
    renderComponents(comps);
    document.getElementById('outputArea').scrollIntoView({behavior:'smooth',block:'start'});
  } catch (err) {
    log('Fatal error in runAnalysis', err);
    showError('Er is een onverwachte fout opgetreden: ' + err.message);
  }
}

async function analyzeZip(file) {
  log('Analyzing ZIP Deep Scan', file.name);
  try {
    const zip=await window.JSZip.loadAsync(file);
    const ctx = { zipFiles: zip.files, fileContents: {} };
    
    // Pre-load essential XMLs
    const parser = new DOMParser();
    const solFile = zip.file('solution.xml') || zip.file('Other/solution.xml');
    if (solFile) ctx.solutionDoc = parser.parseFromString(await solFile.async('text'), 'text/xml');
    
    const custFile = zip.file('customizations.xml');
    if (custFile) ctx.customDoc = parser.parseFromString(await custFile.async('text'), 'text/xml');
    
    // Pre-load all JSONs for content scanning
    for (const [name, entry] of Object.entries(zip.files)) {
      if (name.endsWith('.json') && !entry.dir) {
        ctx.fileContents[name] = await entry.async('text');
      }
    }
    
    if (!ctx.solutionDoc) { showError('Geen solution.xml gevonden.'); return; }
    runAnalysis(ctx);
  } catch (err) {
    log('Error reading ZIP', err);
    showError('Kon de ZIP niet openen: ' + err.message);
  }
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.add('hidden'));
    tab.classList.add('active');
    const panelId = 'tab' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
    document.getElementById(panelId).classList.remove('hidden');
  });
});

// ─── EVENTS ───────────────────────────────────────────────────────────────────
const fileInput=document.getElementById('fileInput');
async function handleFile(file){
  showLoader();
  await new Promise(r=>setTimeout(r,200));
  if(file.name.endsWith('.zip')) await analyzeZip(file);
  else {
    const text = await file.text();
    const parser = new DOMParser();
    runAnalysis({ solutionDoc: parser.parseFromString(text, 'text/xml'), zipFiles: {}, fileContents: {} });
  }
}

document.getElementById('dropzone').addEventListener('dragover',e=>{e.preventDefault();e.currentTarget.classList.add('drag-over');});
document.getElementById('dropzone').addEventListener('dragleave',e=>e.currentTarget.classList.remove('drag-over'));
document.getElementById('dropzone').addEventListener('drop',async e=>{
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  if(e.dataTransfer.files[0]) await handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change',async()=>{ if(fileInput.files[0]) await handleFile(fileInput.files[0]); });
document.getElementById('analyzeBtn').addEventListener('click',async()=>{
  const xml=document.getElementById('xmlInput').value.trim();
  if(!xml){ if(fileInput.files[0]){ await handleFile(fileInput.files[0]); return; } showError('Plak eerst XML of selecteer een bestand.'); return; }
  showLoader(); await new Promise(r=>setTimeout(r,150));
  const parser = new DOMParser();
  runAnalysis({ solutionDoc: parser.parseFromString(xml, 'text/xml'), zipFiles: {}, fileContents: {} });
});
log('Deep Scan Analyzer initialized');
