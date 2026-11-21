/* BEK Agents Platform – static, no build step. Data lives in localStorage. */
(function(){
"use strict";
const KEY="bek_agents_platform_v1";
const CALC="https://bahakhmeissi.github.io/cod_calculator/";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);

/* ---------- agents ---------- */
const AGENTS=[
 {id:"builder",name:"Forge",title:"Store Builder",color:"#2563eb",
  role:"Builds a complete WordPress COD store: security, speed, cache, pixel + Conversions API, landing-page template, offers, order export.",
  acc:'<path d="M26 28 Q60 -4 94 28 L94 34 L26 34Z" fill="#f97316"/><rect x="22" y="32" width="76" height="6" rx="3" fill="#fb923c"/>'},
 {id:"scout",name:"Hawk",title:"Product Scout",color:"#0891b2",
  role:"Finds winning products in any market or niche you choose. Fills the scout sheet and stops for your decision.",
  acc:'<g transform="translate(78 84)"><circle cx="10" cy="10" r="12" fill="none" stroke="#fde047" stroke-width="5"/><line x1="19" y1="19" x2="32" y2="32" stroke="#fde047" stroke-width="6" stroke-linecap="round"/></g>'},
 {id:"swiper",name:"Remix",title:"Creative Swiper",color:"#9333ea",
  role:"Waits for your instructions, then downloads the chosen ad creatives and makes 4:5 and 9:16 versions with your edits (captions, text removal, dubbing).",
  acc:'<g transform="translate(76 80)"><rect x="0" y="10" width="34" height="24" rx="3" fill="#111827" stroke="#e5e7eb" stroke-width="2"/><path d="M0 10 L34 0 L34 10Z" fill="#e5e7eb"/><path d="M8 10 L12 3 M18 10 L22 1 M28 10 L31 3" stroke="#111827" stroke-width="3"/></g>'},
 {id:"pricer",name:"Calc",title:"Pricing Agent",color:"#16a34a",
  role:"Starts when you mark a product Test. Uses the COD calculator, the weight and the Alibaba price ceiling to propose profitable prices and offers.",
  acc:'<circle cx="60" cy="91" r="10" fill="#fde047" stroke="#ca8a04" stroke-width="2"/><text x="60" y="96" font-size="14" font-weight="800" text-anchor="middle" fill="#92400e" font-family="Arial">$</text>'},
 {id:"planner",name:"Blueprint",title:"Campaign Structure",color:"#ea580c",
  role:"Runs only after you confirm the final sheet. Prepares the campaign structure as a sheet. You launch it yourself in Meta.",
  acc:'<g transform="translate(76 82)"><rect width="30" height="36" rx="4" fill="#f8fafc"/><rect x="9" y="-4" width="12" height="8" rx="2" fill="#475569"/><path d="M6 14h18M6 21h18M6 28h12" stroke="#64748b" stroke-width="3" stroke-linecap="round"/></g>'},
 {id:"gemini",name:"Pixel",title:"Gemini Creator",color:"#db2777",
  role:"Generates product images, landing-page visuals and swiped page visuals with Gemini.",
  acc:'<g transform="translate(78 80)"><path d="M16 0 L20 12 L32 16 L20 20 L16 32 L12 20 0 16 L12 12Z" fill="#fde047"/></g>'},
 {id:"analyst",name:"Lens",title:"Campaign Analyst",color:"#4f46e5",
  role:"Reads your Meta results and tells you what to cut, scale or test next.",
  acc:'<g transform="translate(76 84)"><rect x="0" y="16" width="8" height="16" fill="#86efac"/><rect x="12" y="8" width="8" height="24" fill="#fde047"/><rect x="24" y="0" width="8" height="32" fill="#93c5fd"/></g>'}
];
const STATUS={idle:["Idle","pill"],waiting:["Waiting for you","pill wait"],working:["Working","pill work"],ready:["Ready","pill on"]};

/* ---------- defaults ---------- */
const DEFAULTS={
 settings:{market:"Mauritania",lang:"French",sourceMarkets:"Saudi Arabia, UAE, Kuwait, Lebanon, Algeria (open to any other country)",
  niches:"Health, gadgets (open to any niche)",minDays:21,minCreatives:6,minWeight:0,maxWeight:1000,maxAlibaba:"",
  sources:{adlib:true,sheets:true,alibaba:true,competitors:true},extra:""},
 notes:{},status:{scout:"idle",builder:"idle",swiper:"idle",pricer:"idle",planner:"idle",gemini:"idle",analyst:"idle"},
 rows:[]
};
let S=load();
function load(){try{const r=JSON.parse(localStorage.getItem(KEY)||"null");if(!r)return structuredClone(DEFAULTS);
  return {...structuredClone(DEFAULTS),...r,settings:{...DEFAULTS.settings,...(r.settings||{}),sources:{...DEFAULTS.settings.sources,...((r.settings||{}).sources||{})}},status:{...DEFAULTS.status,...(r.status||{})}};}catch(e){return structuredClone(DEFAULTS);}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast("Could not save in this browser");}}

/* ---------- helpers ---------- */
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2200);}
async function copy(text){try{await navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(_){}ta.remove();}toast("Copied. Paste it into Claude.");}
function download(name,text,type){const b=new Blob([text],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
const rule=r=>({days:(+r.days||0)>=(+S.settings.minDays||0),creatives:(+r.creatives||0)>=(+S.settings.minCreatives||0)});
function statusOf(r){
  if(r.decision==="Skip")return"Skipped";
  if(r.decision!=="Test")return"Scouted";
  if(r.structureReady)return"Structure ready";
  if(r.creativesReady&&r.pricing)return"Ready to confirm";
  if(r.creativesReady)return"Creatives ready";
  if(r.pricing)return"Priced";
  return"Chosen";
}
const COLS=[["name","Product name"],["niche","Niche"],["market","Source market"],["page","Advertiser page"],["pageUrl","Page link"],["days","Days running"],["creatives","Creatives on page"],["lp","Competitor landing page"],["alibaba","Alibaba link"],["price","Alibaba price"],["weight","Weight (g)"],["links","Best 6 creative links"],["angles","Marketing angles"],["notes","Notes / risks"],["decision","Decision"],["creativeInstr","Creative instructions"],["pricing","Pricing result"]];

/* ---------- briefs ---------- */
const guard="Rules: be honest in all copy (no cure claims, no fake reviews or before/afters, no invented discounts). Do not phrase anything around phone confirmation. Never launch or edit anything in Meta; prepare only. Stop and ask me before any decision that costs money.";
function notesOf(id){const n=(S.notes[id]||"").trim();return n?`\n\nMY COACH NOTES (follow these first):\n${n}`:"";}
function productBlock(r){return [`Product: ${r.name||"-"}`,`Niche: ${r.niche||"-"}`,`Found in: ${r.market||"-"}`,`Advertiser page: ${r.page||"-"} ${r.pageUrl||""}`,`Days running: ${r.days||"-"} | Creatives on page: ${r.creatives||"-"}`,`Competitor LP: ${r.lp||"-"}`,`Alibaba: ${r.alibaba||"-"} | Price: ${r.price||"-"} | Weight: ${r.weight||"-"} g`,`Best creative links:\n${r.links||"-"}`,`Angles: ${r.angles||"-"}`,`Notes: ${r.notes||"-"}`].join("\n");}
function brief(id,rows){
  const s=S.settings,src=Object.entries(s.sources).filter(([,v])=>v).map(([k])=>({adlib:"Meta Ad Library",sheets:"my Google Sheets",alibaba:"Alibaba/AliExpress",competitors:"competitor store pages"}[k])).join(", ");
  switch(id){
  case "scout":return `ROLE: Product Scout for my COD business. Target market for the store: ${s.market} (${s.lang}).\n\nSearch freely. Countries to look at (not a limit): ${s.sourceMarkets}. Niches (not a limit): ${s.niches}. Sources: ${src||"any"}.\nWinner rule: product running at least ${s.minDays} days AND at least ${s.minCreatives} different ad creatives on the same page. Approx. weight ${s.minWeight}-${s.maxWeight} g.${s.maxAlibaba?` Alibaba price ceiling: ${s.maxAlibaba}.`:""}\n${s.extra?`Extra guidance: ${s.extra}\n`:""}\nFor each product give: product name, niche, source market, advertiser Facebook page (+link), days running, number of creatives, competitor landing page, specific Alibaba link and price, approx. weight, the 6 best creative links, marketing angles, notes/risks.\nWrite them into my scout sheet, then STOP. I decide which products to test.\n\n${guard}${notesOf("scout")}`;
  case "pricer":{const list=rows.length?rows.map(productBlock).join("\n\n---\n\n"):"(no products marked Test yet)";return `ROLE: Pricing Agent. Use my COD calculator (${CALC}) logic. Target market: ${s.market}. For Mauritania the rates are: 7 $ fulfilment per delivered order, 15 $/kg shipping, 50 $/month storage spread over delivered orders.\nFor each product below: respect the weight and the maximum Alibaba price, then propose a selling price (and a 1 / 2 / 3 piece offer) that gives a profitable margin. Show profit per delivered order, break-even CPL, the assumptions (CPL, confirmation %, delivery %), and the risk. Write it into the "Pricing result" column.\n\nPRODUCTS:\n${list}\n\n${guard}${notesOf("pricer")}`;}
  case "swiper":{const list=rows.length?rows.map(r=>productBlock(r)+`\nMY INSTRUCTIONS FOR THE CREATIVES:\n${r.creativeInstr||"(none yet: wait for my instructions)"}`).join("\n\n---\n\n"):"(no products yet)";return `ROLE: Creative Swiper. Download the creative links for the products below, then follow MY INSTRUCTIONS exactly. Always output 4:5 and 9:16 versions for Facebook. Typical edits: add captions, remove existing text, dubbing. If a product has no instructions yet, wait and ask me.\n\n${list}\n\n${guard}${notesOf("swiper")}`;}
  case "planner":{const list=rows.length?rows.map(r=>productBlock(r)+`\nPRICING: ${r.pricing||"-"}\nCREATIVE INSTRUCTIONS: ${r.creativeInstr||"-"}`).join("\n\n---\n\n"):"(no confirmed products yet)";return `ROLE: Campaign Structure Agent. I confirmed the products below. Build the full campaign structure as a SHEET (campaigns, ad sets, ads, primary texts, headlines, creative file names with 4:5 / 9:16, budgets, naming, tracking notes). Do not touch Meta; I launch it myself. Market: ${s.market} (${s.lang}).\n\n${list}\n\n${guard}${notesOf("planner")}`;}
  case "builder":return `ROLE: Store Builder. Build a complete WordPress COD store using everything we built on gadgets.shopafricain.com (Hostinger, security, speed, cache, LiteSpeed purge, image compression, landing-page template, offers/downsell, DANGO COD form, Google Sheets export, pixel + Conversions API with dedup, legal pages, colour theme).\nStore details: market ${s.market}, language ${s.lang}, niche: [fill in], store name: [fill in], pixel id: [fill in], domain: [fill in].\nDo not change my other stores. Remove market-specific wording (names, phone prefixes) that does not match the new market.\n\n${guard}${notesOf("builder")}`;
  case "gemini":return `ROLE: Gemini Creator. Use Gemini to generate images for my product or landing page (realistic local people, 4:5 ads, product-in-use photos). I will tell you the product and what I need. Keep text on images short and perfectly spelled in ${s.lang}; no health claims.\n\nTask: [fill in]\n\n${guard}${notesOf("gemini")}`;
  case "analyst":return `ROLE: Campaign Analyst. I will give you Meta campaign data (export or screenshots). Tell me what to cut, scale or test next, with the numbers behind each call: spend, CPL/CPA, CTR, hook rate, frequency, per-creative and per-audience results. Compare to the break-even CPL from the COD calculator. Be specific and short.\n\nData: [paste or attach]\n\n${guard}${notesOf("analyst")}`;
  }
}
const testRows=()=>S.rows.filter(r=>r.decision==="Test");

/* ---------- 3D character ---------- */
function charSVG(a){
  const c=a.color;
  const shadow=`<svg viewBox="0 0 120 130"><ellipse cx="60" cy="122" rx="36" ry="7" fill="#0007"/></svg>`;
  const body=`<svg viewBox="0 0 120 130"><rect x="22" y="76" width="12" height="30" rx="6" fill="${c}"/><rect x="86" y="76" width="12" height="30" rx="6" fill="${c}"/><rect x="34" y="68" width="52" height="46" rx="14" fill="${c}"/><rect x="34" y="68" width="52" height="46" rx="14" fill="#fff" opacity=".12"/><rect x="46" y="80" width="28" height="18" rx="6" fill="#0b1220"/><circle cx="54" cy="89" r="3" fill="#22c55e"/><circle cx="64" cy="89" r="3" fill="#fde047"/></svg>`;
  const head=`<svg viewBox="0 0 120 130"><line x1="60" y1="22" x2="60" y2="10" stroke="${c}" stroke-width="4"/><circle cx="60" cy="8" r="5" fill="#f97316"/><rect x="26" y="22" width="68" height="52" rx="20" fill="${c}"/><rect x="26" y="22" width="68" height="52" rx="20" fill="#fff" opacity=".18"/><rect x="35" y="32" width="50" height="32" rx="13" fill="#0b1220"/><ellipse class="eye" cx="50" cy="48" rx="5" ry="6.5" fill="#7dd3fc"/><ellipse class="eye" cx="70" cy="48" rx="5" ry="6.5" fill="#7dd3fc"/><path d="M52 57 Q60 62 68 57" stroke="#7dd3fc" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
  const acc=`<svg viewBox="0 0 120 130">${a.acc}</svg>`;
  return `<div class="char"><div class="layer" style="transform:translateZ(-24px)">${shadow}</div><div class="layer" style="transform:translateZ(0)">${body}</div><div class="layer" style="transform:translateZ(22px)">${head}</div><div class="layer" style="transform:translateZ(44px)">${acc}</div></div>`;
}
function wireTilt(stage){
  const ch=$(".char",stage);
  stage.addEventListener("mousemove",e=>{const b=stage.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;ch.style.transform=`rotateY(${x*38}deg) rotateX(${-y*28}deg)`;});
  stage.addEventListener("mouseleave",()=>ch.style.transform="");
}

/* ---------- control room ---------- */
function renderPipeline(){
  const rows=S.rows,test=testRows();
  const steps=[
   ["Hawk scouts","Fills the sheet",rows.length,""],
   ["You decide","Test / Skip / Maybe",rows.filter(r=>!r.decision||r.decision==="Maybe").length,"gate"],
   ["Calc prices","Auto after Test",test.filter(r=>!r.pricing).length,""],
   ["Remix creatives","After your instructions",test.filter(r=>!r.creativesReady).length,""],
   ["You confirm","Final sheet",test.filter(r=>r.pricing&&r.creativesReady&&!r.structureReady).length,"gate"],
   ["Blueprint plans","Structure sheet",test.filter(r=>r.structureReady).length,""],
   ["You launch","In Meta, yourself","","you"]
  ];
  $("#pipeline").innerHTML=steps.map((s,i)=>`<div class="step ${s[3]}"><b><span class="n">${i+1}</span>${esc(s[0])}${s[2]!==""?`<span class="cnt">${s[2]}</span>`:""}</b><span>${esc(s[1])}</span></div>`).join("");
}
function renderAgents(){
  const root=$("#agents");root.innerHTML="";
  AGENTS.forEach(a=>{
    const st=STATUS[S.status[a.id]]||STATUS.idle;
    const el=document.createElement("div");el.className="agent";
    el.innerHTML=`<div class="stage">${charSVG(a)}</div>
      <h3><span>${esc(a.name)} <small class="muted">· ${esc(a.title)}</small></span><span class="${st[1]}">${st[0]}</span></h3>
      <p class="role">${esc(a.role)}</p>
      <div><label>Status</label><select data-st>${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${S.status[a.id]===k?"selected":""}>${v[0]}</option>`).join("")}</select></div>
      <div><label>Coach notes (how to sharpen ${esc(a.name)})</label><textarea data-notes placeholder="Add rules, examples, things to avoid, lessons from last run…">${esc(S.notes[a.id]||"")}</textarea></div>
      <div class="row"><button class="btn sm" data-copy>Copy brief</button>${a.id==="scout"?'<button class="btn ghost sm" data-go="settings">Scout settings</button>':""}${a.id==="pricer"?'<button class="btn ghost sm" data-go="calc">Calculator</button>':""}${["pricer","swiper","planner"].includes(a.id)?'<button class="btn ghost sm" data-go="board">Open board</button>':""}</div>`;
    wireTilt($(".stage",el));
    $("[data-st]",el).onchange=e=>{S.status[a.id]=e.target.value;save();renderAgents();};
    $("[data-notes]",el).oninput=e=>{S.notes[a.id]=e.target.value;save();};
    $("[data-copy]",el).onclick=()=>{
      let rows=[];if(a.id==="pricer")rows=testRows().filter(r=>!r.pricing);
      if(a.id==="swiper")rows=testRows().filter(r=>!r.creativesReady);
      if(a.id==="planner")rows=testRows().filter(r=>r.pricing&&r.creativesReady);
      copy(brief(a.id,rows));
    };
    $$("[data-go]",el).forEach(b=>b.onclick=()=>show(b.dataset.go));
    root.appendChild(el);
  });
}

/* ---------- board ---------- */
function renderBoard(){
  $("#ruleDays").textContent=S.settings.minDays;$("#ruleCreatives").textContent=S.settings.minCreatives;
  const t=$("#board");
  if(!S.rows.length){t.innerHTML=`<tr><td style="padding:22px" class="muted">No products yet. Click “+ Add product”, or import a CSV exported from your Google Sheet.</td></tr>`;return;}
  t.innerHTML=`<thead><tr><th>Product</th><th>Niche</th><th>Market</th><th>Days</th><th>Creatives</th><th>Rule</th><th>Alibaba</th><th>Weight</th><th>Decision</th><th>Status</th><th></th></tr></thead><tbody>`+
  S.rows.map(r=>{const k=rule(r);const ok=k.days&&k.creatives;return `<tr data-id="${r.id}"><td><b>${esc(r.name||"(unnamed)")}</b></td><td>${esc(r.niche)}</td><td>${esc(r.market)}</td><td>${esc(r.days)}</td><td>${esc(r.creatives)}</td><td>${ok?'<span class="ok">✓ passes</span>':`<span class="flag">${!k.days?"days ":""}${!k.creatives?"creatives":""} below</span>`}</td><td>${esc(r.price)}</td><td>${esc(r.weight)}</td><td><select data-dec><option value="">—</option>${["Test","Maybe","Skip"].map(v=>`<option ${r.decision===v?"selected":""}>${v}</option>`).join("")}</select></td><td><span class="tag ${esc(r.decision||"")}">${statusOf(r)}</span></td><td><button class="btn ghost sm" data-open>Open</button></td></tr>`;}).join("")+`</tbody>`;
  $$("tr[data-id]",t).forEach(tr=>{const r=S.rows.find(x=>x.id===tr.dataset.id);
    $("[data-dec]",tr).onchange=e=>{r.decision=e.target.value;save();renderBoard();renderPipeline();if(r.decision==="Test"){S.status.pricer="waiting";save();toast("Marked Test. Copy the Pricing brief from the control room.");}};
    $("[data-open]",tr).onclick=()=>openRow(r);});
}
function openRow(r){
  $("#mTitle").textContent=r.name||"New product";
  const f=(k,l,type="text")=>`<div><label>${l}</label><input type="${type}" data-k="${k}" value="${esc(r[k]||"")}"></div>`;
  const ta=(k,l,ph="")=>`<div style="grid-column:1/-1"><label>${l}</label><textarea data-k="${k}" placeholder="${esc(ph)}">${esc(r[k]||"")}</textarea></div>`;
  $("#mBody").innerHTML=`<div class="grid2">${f("name","Product name")}${f("niche","Niche")}${f("market","Source market")}${f("page","Advertiser page")}${f("pageUrl","Page link","url")}${f("days","Days running","number")}${f("creatives","Creatives on page","number")}${f("lp","Competitor landing page","url")}${f("alibaba","Alibaba link","url")}${f("price","Alibaba price")}${f("weight","Weight (g)","number")}${ta("links","Best 6 creative links (one per line)")}${ta("angles","Marketing angles")}${ta("notes","Notes / risks")}
  <div><label>Decision</label><select data-k="decision"><option value="">—</option>${["Test","Maybe","Skip"].map(v=>`<option ${r.decision===v?"selected":""}>${v}</option>`).join("")}</select></div><div></div>
  ${ta("creativeInstr","Creative instructions (what Remix should do)","e.g. 4:5 and 9:16, remove the original text, add French captions, dub in French")}${ta("pricing","Pricing result (from Calc)")}
  <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-c="creativesReady" ${r.creativesReady?"checked":""}> Creatives ready</label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-c="structureReady" ${r.structureReady?"checked":""}> Structure ready</label></div>
  <div class="actions"><button class="btn" id="mSave">Save</button><button class="btn ghost" id="mPrice">Copy pricing brief</button><button class="btn ghost" id="mCre">Copy creative brief</button><button class="btn danger" id="mDel">Delete</button></div>`;
  const collect=()=>{$$("[data-k]",$("#mBody")).forEach(el=>r[el.dataset.k]=el.value);$$("[data-c]",$("#mBody")).forEach(el=>r[el.dataset.c]=el.checked);};
  $("#mSave").onclick=()=>{collect();save();closeModal();renderBoard();renderPipeline();toast("Saved");};
  $("#mPrice").onclick=()=>{collect();save();copy(brief("pricer",[r]));};
  $("#mCre").onclick=()=>{collect();save();copy(brief("swiper",[r]));};
  $("#mDel").onclick=()=>{if(confirm("Delete this product?")){S.rows=S.rows.filter(x=>x.id!==r.id);save();closeModal();renderBoard();renderPipeline();}};
  $("#modal").hidden=false;
}
function closeModal(){$("#modal").hidden=true;}

/* ---------- csv ---------- */
function toCSV(){const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;return [COLS.map(c=>q(c[1])).join(",")].concat(S.rows.map(r=>COLS.map(c=>q(r[c[0]])).join(","))).join("\r\n");}
function parseCSV(t){const rows=[];let row=[],f="",q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}else if(c==='"')q=true;else if(c===","){row.push(f);f="";}else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(f);f="";rows.push(row);row=[];}else f+=c;}if(f!==""||row.length){row.push(f);rows.push(row);}return rows.filter(r=>r.some(x=>x.trim()!==""));}
function importCSV(text){
  const rows=parseCSV(text);if(rows.length<2){toast("CSV is empty");return;}
  const head=rows[0].map(h=>h.trim().toLowerCase());const idx={};
  COLS.forEach(([k,l])=>{const i=head.indexOf(l.toLowerCase());if(i>=0)idx[k]=i;});
  if(!Object.keys(idx).length){toast("Headers not recognised. Export a CSV from the board first to see the format.");return;}
  rows.slice(1).forEach(r=>{const o={id:uid()};COLS.forEach(([k])=>{if(idx[k]!=null)o[k]=r[idx[k]]||"";});S.rows.push(o);});
  save();renderBoard();renderPipeline();toast("Imported "+(rows.length-1)+" products");
}

/* ---------- settings ---------- */
function renderSettings(){
  const s=S.settings;
  $("#settingsForm").innerHTML=`
  <div class="card"><label>Store market (where you will sell)</label><input type="text" data-s="market" value="${esc(s.market)}"><label style="margin-top:10px">Store language</label><input type="text" data-s="lang" value="${esc(s.lang)}"></div>
  <div class="card"><label>Countries to scout (a starting point, not a limit)</label><textarea data-s="sourceMarkets">${esc(s.sourceMarkets)}</textarea><label style="margin-top:10px">Niches</label><textarea data-s="niches">${esc(s.niches)}</textarea></div>
  <div class="card"><div class="grid2" style="margin:0"><div><label>Min days running</label><input type="number" data-s="minDays" value="${esc(s.minDays)}"></div><div><label>Min creatives on page</label><input type="number" data-s="minCreatives" value="${esc(s.minCreatives)}"></div><div><label>Weight min (g)</label><input type="number" data-s="minWeight" value="${esc(s.minWeight)}"></div><div><label>Weight max (g)</label><input type="number" data-s="maxWeight" value="${esc(s.maxWeight)}"></div></div><label style="margin-top:10px">Alibaba price ceiling (optional)</label><input type="text" data-s="maxAlibaba" value="${esc(s.maxAlibaba)}" placeholder="e.g. 6 $ per unit"></div>
  <div class="card"><label>Sources</label>${[["adlib","Meta Ad Library"],["sheets","My Google Sheets"],["alibaba","Alibaba / AliExpress"],["competitors","Competitor store pages"]].map(([k,l])=>`<label style="display:flex;gap:8px;align-items:center;color:var(--txt);font-size:14px"><input type="checkbox" data-src="${k}" ${s.sources[k]?"checked":""}> ${l}</label>`).join("")}<label style="margin-top:10px">Extra guidance for the Scout</label><textarea data-s="extra" placeholder="Anything you learned: what to avoid, what worked…">${esc(s.extra)}</textarea></div>`;
  $$("[data-s]").forEach(el=>el.oninput=()=>{S.settings[el.dataset.s]=el.type==="number"?+el.value:el.value;save();$("#scoutBrief").textContent=brief("scout");renderBoard();});
  $$("[data-src]").forEach(el=>el.onchange=()=>{S.settings.sources[el.dataset.src]=el.checked;save();$("#scoutBrief").textContent=brief("scout");});
  $("#scoutBrief").textContent=brief("scout");
}

/* ---------- views ---------- */
function show(v){$$(".view").forEach(x=>x.classList.toggle("on",x.id==="v-"+v));$$("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
  if(v==="settings")renderSettings();if(v==="board")renderBoard();if(v==="room"){renderPipeline();renderAgents();}history.replaceState(null,"","#"+v);window.scrollTo(0,0);}

function init(){
  $$("#nav button").forEach(b=>b.onclick=()=>show(b.dataset.v));
  $("#mClose").onclick=closeModal;$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  $("#addRow").onclick=()=>{const r={id:uid(),name:"",decision:""};S.rows.unshift(r);save();renderBoard();renderPipeline();openRow(r);};
  $("#exportCsv").onclick=()=>download("scout-board.csv",toCSV(),"text/csv");
  $("#importCsv").onclick=()=>$("#csvFile").click();
  $("#csvFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>importCSV(String(rd.result));rd.readAsText(f);e.target.value="";};
  $("#copyScout").onclick=()=>copy(brief("scout"));
  $("#exportAll").onclick=()=>download("bek-agents-backup.json",JSON.stringify(S,null,2),"application/json");
  $("#importAll").onclick=()=>$("#jsonFile").click();
  $("#jsonFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(String(rd.result));if(!o||typeof o!=="object"||!Array.isArray(o.rows||[]))throw 0;S={...structuredClone(DEFAULTS),...o};S.settings={...DEFAULTS.settings,...(o.settings||{}),sources:{...DEFAULTS.settings.sources,...((o.settings||{}).sources||{})}};save();show("room");toast("Backup restored");}catch(_){toast("That file is not a valid backup");}};rd.readAsText(f);e.target.value="";};
  $("#resetAll").onclick=()=>{if(confirm("Erase all notes, settings and products in this browser?")){S=structuredClone(DEFAULTS);save();show("room");}};
  const h=(location.hash||"#room").slice(1);show(["room","board","settings","calc","data"].includes(h)?h:"room");
}
init();
})();
