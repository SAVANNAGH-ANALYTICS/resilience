import React, { useEffect, useMemo, useState } from "react";
import { CheckSquare, Square, Leaf, Bird, Download, Upload, RefreshCcw, Lock, Unlock, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "resilience_v1";

const DOMAIN_DATA = [
  { id: "finances", title: "Finances Plan", items: [
    "Current balances & liquidity map",
    "Emergency fund (cash vs. bank vs. mobile wallets)",
    "Currency diversification (USD, CAD, MXN, EUR)",
    "Payment tools set up: Revolut, Wise, PayPal; no-foreign-fee cards"
  ]},
  { id: "work", title: "Work & Income Plan", items: [
    "Remote work readiness (laptop, cloud files, Wi‑Fi backup)",
    "2‑month skill training plan (Google/IBM/Alison)",
    "Job platforms by country (LinkedIn, Job Bank CA, OCC Mundial MX, Europass EU)",
    "Side‑income tracks: tutoring, customer service, data entry, VA"
  ]},
  { id: "housing", title: "Housing & Packing Plan", items: [
    "Keep / sell / donate / store decisions",
    "Essentials‑only packing (≤ 2 suitcases per person)",
    "Furniture sell/donate plan",
    "Rental scouting checklist: safety, hospital proximity, walkability, cost < 30% income"
  ]},
  { id: "travel", title: "Travel & Transport Plan", items: [
    "Passports ready + copies (physical & digital)",
    "Driving plans (insurance, permits, maintenance)",
    "Flight options (Europe) + backup if canceled",
    "Border rules at a glance (Canada/Mexico)"
  ]},
  { id: "safehouse", title: "Safe House & Destination Plan", items: [
    "Shortlist cities by safety, jobs, hospitals, housing",
    "Primary & secondary fallback locations",
    "Short‑term rentals (Airbnb/Booking/local)",
    "Community contacts (libraries, nonprofits, faith groups)"
  ]},
  { id: "family", title: "Family Coordination Plan", items: [
    "Shared decisions (no preset roles)",
    "Weekly check‑ins (Signal/WhatsApp)",
    "Contingency if separated during travel",
    "Personal comfort/notes per person"
  ]},
  { id: "car", title: "Car & Transportation Plan", items: [
    "Title, insurance, maintenance, roadside kit",
    "Canada import rules (>30 days)",
    "Mexico TIP rules outside Baja/Sonora",
    "Resale vs. storage options"
  ]},
  { id: "pets", title: "Pet Preparation Plan", items: [
    "Vaccinations, health certificates, microchip",
    "Travel crate, food, vet contacts",
    "Entry requirements (CA/MX/EU)",
    "Foster/boarding backup"
  ]},
  { id: "docs", title: "Documents & Records Plan", items: [
    "Originals: passports, birth certs, car title, medical, academic",
    "Copies: physical + encrypted cloud & USB",
    "Emergency one‑pager (contacts, meds, accounts)",
    "POA / wills (optional)"
  ]},
  { id: "prehealth", title: "Pre‑Move Health Plan", items: [
    "Physical exam + bloodwork",
    "Dental (fillings/cleanings/crowns ahead of travel)",
    "Eye exam + updated Rx",
    "90‑day meds; vaccinations; travel vax if needed",
    "Women’s / Men’s screenings as age‑appropriate",
    "Medical records summary + basic health kit (ORS)"
  ]},
  { id: "health", title: "Health & Medical Plan (On Arrival)", items: [
    "First‑aid + Rx on hand",
    "Insurance: travel/expat/local",
    "Map nearest hospital/clinic",
    "Hydration & special‑needs support"
  ]},
  { id: "comms", title: "Communications Plan", items: [
    "Roaming plan or local SIM (Telcel/Rogers)",
    "Signal/WhatsApp/Telegram installed",
    "Google Voice for U.S. codes",
    "Offline maps + translation packs"
  ]},
  { id: "indicators", title: "Indications & Warning Signs", items: [
    "Unusual military/police presence",
    "Internet/phone blackouts",
    "Fuel/food shortages or rationing",
    "Banking limits / capital controls",
    "Curfews/checkpoints announced",
    "Anti‑foreigner targeting / protest escalation",
    "Violence spreading to once‑safe areas",
    "Embassy advisories urging departure"
  ]}
];

function useLocalState(initial) {
  const [state, setState] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : initial; }
    catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  return [state, setState];
}

export default function ResilienceApp() {
  const [data, setData] = useLocalState(() => {
    const payload = {}; DOMAIN_DATA.forEach(d => payload[d.id] = d.items.map(() => false)); return payload;
  });
  const [active, setActive] = useState(DOMAIN_DATA[0].id);
  const [filter, setFilter] = useState("all");
  const [locked, setLocked] = useState(false);

  const current = useMemo(() => DOMAIN_DATA.find(d => d.id === active), [active]);

  const progress = useMemo(() => {
    const totals = DOMAIN_DATA.map(d => { const vals = data[d.id]||[]; const done = vals.filter(Boolean).length; return { id:d.id, title:d.title, done, total: vals.length }; });
    const allDone = totals.reduce((a,t)=>a+t.done,0);
    const allTotal = totals.reduce((a,t)=>a+t.total,0);
    return { totals, allDone, allTotal, pct: allTotal ? Math.round((allDone/allTotal)*100) : 0 };
  }, [data]);

  const filteredItems = useMemo(() => {
    const vals = data[current.id] || [];
    return current.items.map((label, idx) => ({ label, idx, checked: vals[idx] }))
      .filter(item => filter === "all" ? true : filter === "open" ? !item.checked : item.checked);
  }, [current, data, filter]);

  const toggle = (idx) => setData(prev => ({ ...prev, [current.id]: prev[current.id].map((v,i)=> i===idx ? !v : v) }));
  const resetDomain = () => { if (confirm(`Reset \"${current.title}\" checklist?`)) setData(prev => ({ ...prev, [current.id]: prev[current.id].map(()=>false) })); };
  const resetAll = () => { if (confirm("Reset ALL domains?")) { const fresh = {}; DOMAIN_DATA.forEach(d=> fresh[d.id]=d.items.map(()=>false)); setData(fresh);} };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ version:1, data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `resilience-checklists-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJSON = (file) => { const r = new FileReader(); r.onload = () => { try { const { data: imp } = JSON.parse(r.result); setData(imp); } catch(e){ alert(\"Import failed: \"+e.message);} }; r.readAsText(file); };

  return (
    <div className=\"min-h-screen bg-emerald-50 text-emerald-900 flex flex-col\">
      <header className=\"sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow\">
        <div className=\"max-w-5xl mx-auto px-4 py-3 flex items-center justify-between\">
          <div className=\"flex items-center gap-2\">
            <Leaf className=\"w-6 h-6\" /><h1 className=\"font-semibold tracking-wide\">Resilience</h1>
          </div>
          <div className=\"flex items-center gap-2 text-emerald-50\">
            <button onClick={exportJSON} className=\"px-2 py-1 rounded hover:bg-emerald-600 flex items-center gap-1\"><Download className=\"w-4 h-4\"/>Export</button>
            <label className=\"px-2 py-1 rounded hover:bg-emerald-600 flex items-center gap-1 cursor-pointer\">
              <Upload className=\"w-4 h-4\"/> Import
              <input type=\"file\" accept=\"application/json\" className=\"hidden\" onChange={e => e.target.files && importJSON(e.target.files[0])} />
            </label>
            <button onClick={()=>setLocked(s=>!s)} className=\"px-2 py-1 rounded hover:bg-emerald-600\">{locked ? 'Unlock' : 'Lock'}</button>
          </div>
        </div>
      </header>

      <main className=\"flex-1 max-w-5xl mx-auto w-full px-4 py-4 grid md:grid-cols-[260px_1fr] gap-4\">
        <aside className=\"bg-white rounded-2xl shadow p-3 border border-emerald-100\">
          <div className=\"flex items-center justify-between mb-2\">
            <h2 className=\"font-semibold text-emerald-700\">Domains</h2>
            <span className=\"text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full\">{progress.pct}%</span>
          </div>
          <nav className=\"space-y-1 max-h-[70vh] overflow-auto pr-1\">
            {DOMAIN_DATA.map(d => {
              const vals = data[d.id] || []; const done = vals.filter(Boolean).length; const total = vals.length;
              const pct = total ? Math.round((done/total)*100) : 0; const sel = active === d.id;
              return (
                <button key={d.id} onClick={()=>setActive(d.id)} className={`w-full text-left px-3 py-2 rounded-xl transition ${sel ? \"bg-emerald-600 text-white\" : \"hover:bg-emerald-50\"}`}>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"text-sm\">{d.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sel ? \"bg-emerald-500/30\" : \"bg-emerald-100 text-emerald-700\"}`}>{pct}%</span>
                  </div>
                </button>
              )
            })}
          </nav>
          <div className=\"mt-3 flex gap-2\">
            <button onClick={resetDomain} className=\"flex-1 text-xs bg-white border border-emerald-200 text-emerald-700 rounded-lg py-1 hover:bg-emerald-50 flex items-center justify-center gap-1\">Reset domain</button>
            <button onClick={resetAll} className=\"flex-1 text-xs bg-white border border-emerald-200 text-emerald-700 rounded-lg py-1 hover:bg-emerald-50\">Reset all</button>
          </div>
        </aside>

        <section className=\"bg-white rounded-2xl shadow p-4 border border-emerald-100\">
          <div className=\"flex items-center justify-between mb-3\">
            <div className=\"flex items-center gap-2\">
              <Bird className=\"w-5 h-5 text-emerald-600\"/><h3 className=\"font-semibold text-emerald-800\">{current.title}</h3>
            </div>
            <div className=\"flex items-center gap-2\">
              <button onClick={()=>setFilter(\"all\")} className={`text-xs px-2 py-1 rounded ${filter === \"all\" ? \"bg-emerald-600 text-white\" : \"bg-emerald-100 text-emerald-700\"}`}>All</button>
              <button onClick={()=>setFilter(\"open\")} className={`text-xs px-2 py-1 rounded ${filter === \"open\" ? \"bg-emerald-600 text-white\" : \"bg-emerald-100 text-emerald-700\"}`}>Open</button>
              <button onClick={()=>setFilter(\"done\")} className={`text-xs px-2 py-1 rounded ${filter === \"done\" ? \"bg-emerald-600 text-white\" : \"bg-emerald-100 text-emerald-700\"}`}>Done</button>\n            </div>\n          </div>\n\n          <ul className=\"space-y-2\">\n            {filteredItems.map((it) => (\n              <li key={it.idx} className=\"flex items-center gap-3 p-3 rounded-xl border border-emerald-100 hover:bg-emerald-50\">\n                <button disabled={locked} onClick={()=>toggle(it.idx)} className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center ${it.checked ? \"bg-emerald-600 text-white\" : \"bg-emerald-100 text-emerald-700\"}`}>{it.checked ? <CheckSquare className=\"w-5 h-5\"/> : <Square className=\"w-5 h-5\"/>}</button>\n                <span className={`text-sm ${it.checked ? \"line-through text-emerald-500\" : \"text-emerald-900\"}`}>{it.label}</span>\n              </li>\n            ))}\n          </ul>\n\n          <div className=\"mt-4 text-right text-xs text-emerald-600 flex items-center justify-between\">\n            <div className=\"flex items-center gap-1\"><CheckCircle2 className=\"w-4 h-4\"/> {progress.totals.find(t => t.id === current.id)?.done} / {progress.totals.find(t => t.id === current.id)?.total} done</div>\n            <div>Total progress: {progress.pct}%</div>\n          </div>\n        </section>\n      </main>\n\n      <footer className=\"bg-emerald-100 text-emerald-700\">\n        <div className=\"max-w-5xl mx-auto px-4 py-3 text-xs flex items-center justify-between\">\n          <div className=\"flex items-center gap-2\"><Leaf className=\"w-4 h-4\"/> Resilience — peace & freedom</div>\n          <div className=\"flex items-center gap-3\">\n            <a className=\"underline\" href=\"#about\">About</a>\n            <a className=\"underline\" href=\"#privacy\">Privacy</a>\n          </div>\n        </div>\n      </footer>\n    </div>\n  );\n}\n