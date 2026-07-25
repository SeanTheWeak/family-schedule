import { useState, useEffect } from "react";

const SUPABASE_URL = "https://kubuypsabeimcgqzwsgu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1YnV5cHNhYmVpbWNncXp3c2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNTY3NDMsImV4cCI6MjA5OTkzMjc0M30.q2kcloyNhV5Qw3cToBidaLYhTp126QwyRIIrThjXets";
const ADMIN_PIN = "8008";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// ── Design tokens: "kitchen chalkboard" ─────────────────────
const C = {
  slate:     "#2E3B36",
  slateDeep: "#25302B",
  chalk:     "#F3F1E9",
  chalkDim:  "rgba(243,241,233,0.58)",
  chalkLine: "rgba(243,241,233,0.14)",
  paper:     "#FBF7EE",
  paperDim:  "#F1EBDC",
  ink:       "#26302B",
  inkDim:    "#7A8880",
  accent:    "#D64545",
  accentDim: "#5A2E2E",
  shadow:    "0 3px 10px rgba(0,0,0,0.28)",
};
const F_DISPLAY = "'Permanent Marker', cursive";
const F_BODY    = "'Nunito', system-ui, sans-serif";
const F_MONO    = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

const DEFAULT_MEMBERS = [
  { id: "dad",   label: "Dad",   emoji: "👨", color: "#5C8DBF", bg: "#E4EDF6" },
  { id: "mom",   label: "Mom",   emoji: "👩", color: "#C9749B", bg: "#F7E7EE" },
  { id: "sean",  label: "Sean",  emoji: "🧒", color: "#5FAE86", bg: "#E6F3EC" },
  { id: "zac",   label: "Zac",   emoji: "🧒", color: "#D9A23C", bg: "#FAF0DE" },
  { id: "ace",   label: "Ace",   emoji: "🧒", color: "#9B79C4", bg: "#F0E9F7" },
  { id: "chase", label: "Chase", emoji: "🧒", color: "#4FADB5", bg: "#E2F3F4" },
];

const COLORS = [
  { color: "#5C8DBF", bg: "#E4EDF6" },
  { color: "#C9749B", bg: "#F7E7EE" },
  { color: "#5FAE86", bg: "#E6F3EC" },
  { color: "#D9A23C", bg: "#FAF0DE" },
  { color: "#9B79C4", bg: "#F0E9F7" },
  { color: "#4FADB5", bg: "#E2F3F4" },
  { color: "#E8875A", bg: "#FBEAE0" },
  { color: "#7B8F6B", bg: "#EBF0E6" },
];

const EMOJIS = ["👨","👩","🧒","👧","👦","🧑","👴","👵","🐶","🌟"];
const MONTHS_FULL  = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const DAYS_SHORT   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

const inp = { width:"100%", padding:"10px 12px", borderRadius:8, border:`1.5px solid ${C.paperDim}`, borderBottomWidth:2, borderBottomColor:"rgba(38,48,43,0.22)", fontSize:14, fontFamily:F_BODY, boxSizing:"border-box", background:C.paper, color:C.ink, marginBottom:10 };
const pill = (a,c) => ({ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontWeight:700, fontSize:13, fontFamily:F_BODY, background:a?c:"transparent", color:a?C.paper:C.chalkDim, flexShrink:0 });

// deterministic per-id tilt so cards look hand-placed but don't jitter on re-render
function tilt(id) {
  let h = 0;
  const s = String(id);
  for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return ((h % 240) / 100) - 1.2; // ~ -1.2deg .. 1.2deg
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbPost(path, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "POST", headers: HEADERS, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbPatch(path, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "PATCH", headers: HEADERS, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbDelete(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "DELETE", headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
}

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}
function formatDate(ds) {
  const d = new Date(ds + "T00:00:00");
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function daysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
function firstDayOf(y, m)  { return new Date(y, m, 1).getDay(); }
function groupByDate(list) {
  const map = {};
  list.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
}
function slugify(str) {
  return str.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"") + "_" + Date.now();
}

// ── Moved OUTSIDE App to fix input focus bug ──────────────
function Modal({ children, onClose }) {
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} className="fs-fade"
      style={{position:"fixed",inset:0,background:"rgba(20,24,20,0.55)",zIndex:30,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div className="fs-sheet" style={{background:C.paper,borderRadius:"18px 18px 0 0",padding:"22px 20px 36px",width:"100%",maxWidth:480,boxSizing:"border-box",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
        <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",width:40,height:5,borderRadius:3,background:C.paperDim}}/>
        {children}
      </div>
    </div>
  );
}

function FormFields({ form, setForm, members, modal, onSubmit }) {
  return (
    <>
      <div style={{fontSize:11,fontWeight:700,color:C.inkDim,marginBottom:7,fontFamily:F_MONO,letterSpacing:1,textTransform:"uppercase"}}>For who</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>
        {members.map(m => (
          <button key={m.id} className="fs-btn" onClick={()=>setForm(f=>({...f,member:m.id}))}
            style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:F_BODY,background:form.member===m.id?m.color:m.bg,color:form.member===m.id?"#fff":m.color}}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:C.inkDim,marginBottom:5,fontFamily:F_MONO,letterSpacing:1,textTransform:"uppercase"}}>Date</div>
      <input className="fs-field" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...inp,fontFamily:F_MONO}}/>
      <div style={{fontSize:11,fontWeight:700,color:C.inkDim,marginBottom:5,fontFamily:F_MONO,letterSpacing:1,textTransform:"uppercase"}}>Time (optional)</div>
      <input className="fs-field" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={{...inp,fontFamily:F_MONO}}/>
      <div style={{fontSize:11,fontWeight:700,color:C.inkDim,marginBottom:5,fontFamily:F_MONO,letterSpacing:1,textTransform:"uppercase"}}>Description</div>
      <input
        className="fs-field"
        type="text"
        placeholder="e.g. Swimming lesson, Vaccine..."
        value={form.note}
        onChange={e=>setForm(f=>({...f,note:e.target.value}))}
        onKeyDown={e=>e.key==="Enter"&&onSubmit()}
        style={inp}
        autoFocus
      />
    </>
  );
}

function EventCard({ ev, members, onEdit, onDelete }) {
  const m = members.find(x => x.id === ev.member) || { label: ev.member, emoji: "👤", color: "#8A9088", bg: "#eee" };
  const deg = tilt(ev.id);
  return (
    <div className="fs-card fs-enter" style={{
      "--tilt": `${deg}deg`,
      position:"relative", display:"flex", gap:12, alignItems:"flex-start",
      background:C.paper, borderRadius:6, padding:"14px 14px 12px",
      margin:"14px 4px 18px", boxShadow:C.shadow,
      transform:`rotate(${deg}deg)`, transition:"transform 0.15s ease",
    }}>
      <div style={{position:"absolute", top:-9, left:20, width:46, height:17, background:m.color, opacity:0.88, transform:"rotate(-5deg)", borderRadius:2, boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
      <div style={{width:38,height:38,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:17,flexShrink:0,boxShadow:"inset 0 0 0 2px rgba(255,255,255,0.35)"}}>
        <span>{m.emoji}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:800,fontSize:15,color:C.ink,fontFamily:F_BODY,lineHeight:1.3}}>{ev.note}</div>
        <div style={{marginTop:5,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          <span style={{fontSize:11,fontWeight:700,color:m.color,fontFamily:F_MONO,letterSpacing:0.4,textTransform:"uppercase"}}>{m.label}</span>
          {ev.time && <span style={{fontSize:12,color:C.inkDim,fontFamily:F_MONO}}>{ev.time}</span>}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
        <button className="fs-btn" onClick={()=>onEdit(ev)} aria-label="Edit" style={{background:C.paperDim,border:"none",borderRadius:6,padding:"5px 9px",cursor:"pointer",fontSize:13}}>✎</button>
        <button className="fs-btn" onClick={()=>onDelete(ev)} aria-label="Delete" style={{background:"#F6E2DE",border:"none",borderRadius:6,padding:"5px 9px",cursor:"pointer",fontSize:13,color:C.accent}}>🗑</button>
      </div>
    </div>
  );
}

export default function App() {
  const now = new Date();
  const TODAY = todayStr();

  const [events, setEvents]       = useState([]);
  const [members, setMembers]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("fs_members")) || DEFAULT_MEMBERS; } catch { return DEFAULT_MEMBERS; }
  });
  const [loading, setLoading]     = useState(true);
  const [errMsg, setErrMsg]       = useState(null);
  const [filter, setFilter]       = useState("semua");
  const [tab, setTab]             = useState("list");
  const [calYear, setCalYear]     = useState(now.getFullYear());
  const [calMonth, setCalMonth]   = useState(now.getMonth());
  const [calSel, setCalSel]       = useState(null);
  const [modal, setModal]         = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pinInput, setPinInput]   = useState("");
  const [pinError, setPinError]   = useState(false);
  const [pinNext, setPinNext]     = useState(null);
  const [editMembers, setEditMembers] = useState([]);
  const [saving, setSaving]       = useState(false);

  const emptyForm = { date: TODAY, time: "", member: members[0]?.id || "dad", note: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    localStorage.setItem("fs_members", JSON.stringify(members));
  }, [members]);

  async function loadEvents() {
    setLoading(true); setErrMsg(null);
    try { setEvents(await sbGet("events?order=date.asc,time.asc")); }
    catch { setErrMsg("Failed to load. Check your internet connection."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadEvents(); }, []);

  async function addEvent() {
    if (!form.note.trim() || !form.date) return;
    setSaving(true);
    try {
      const saved = await sbPost("events", { member: form.member, date: form.date, time: form.time||null, note: form.note });
      setEvents(prev => [...prev, ...(Array.isArray(saved)?saved:[saved])].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||"").localeCompare(b.time||"")));
      setForm(emptyForm);
      setModal(null);
    } catch(e) { alert("Failed to save: " + e.message); }
    finally { setSaving(false); }
  }

  function openEdit(ev) {
    setEditEvent(ev);
    setForm({ date:ev.date, time:ev.time||"", member:ev.member, note:ev.note });
    setModal("edit");
  }
  async function saveEdit() {
    if (!form.note.trim() || !form.date) return;
    setSaving(true);
    try {
      await sbPatch(`events?id=eq.${editEvent.id}`, { member:form.member, date:form.date, time:form.time||null, note:form.note });
      setEvents(prev => prev.map(e => e.id===editEvent.id ? {...e,...form,time:form.time||null} : e));
      setModal(null);
    } catch(e) { alert("Failed to save: " + e.message); }
    finally { setSaving(false); }
  }

  function askDelete(ev) { setDeleteTarget(ev); setModal("delete"); }
  async function confirmDelete() {
    setEvents(prev => prev.filter(e => e.id!==deleteTarget.id));
    setModal(null);
    try { await sbDelete(`events?id=eq.${deleteTarget.id}`); }
    catch { loadEvents(); }
  }

  function requirePin(next) { setPinInput(""); setPinError(false); setPinNext(next); setModal("pin"); }
  function checkPin() {
    if (pinInput===ADMIN_PIN) { setModal(pinNext); setPinNext(null); }
    else { setPinError(true); setPinInput(""); }
  }

  function openSettings() {
    setEditMembers(members.map(m=>({...m})));
    requirePin("settings");
  }
  function saveMemberEdit(i, field, val) {
    setEditMembers(prev => prev.map((m,idx) => idx===i ? {...m,[field]:val} : m));
  }
  function addMember() {
    const c = COLORS[editMembers.length % COLORS.length];
    setEditMembers(prev => [...prev, { id:slugify("member"), label:"New Member", emoji:"🧒", color:c.color, bg:c.bg }]);
  }
  function removeMember(i) { setEditMembers(prev => prev.filter((_,idx)=>idx!==i)); }
  function saveSettings() { setMembers(editMembers); setModal(null); }

  const totalDays = daysInMonth(calYear, calMonth);
  const startDay  = firstDayOf(calYear, calMonth);
  function calDs(d) { return `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  function calDayEvs(d) { return events.filter(e=>e.date===calDs(d)&&(filter==="semua"||e.member===filter)); }
  const calSelEvs = calSel ? events.filter(e=>e.date===calSel&&(filter==="semua"||e.member===filter)) : [];
  function prevCal() { calMonth===0?(setCalMonth(11),setCalYear(calYear-1)):setCalMonth(calMonth-1); }
  function nextCal() { calMonth===11?(setCalMonth(0),setCalYear(calYear+1)):setCalMonth(calMonth+1); }

  const getMember = id => members.find(m=>m.id===id)||{label:id,emoji:"👤",color:"#8A9088",bg:"#eee"};
  const visible  = events.filter(e=>filter==="semua"||e.member===filter);
  const upcoming = visible.filter(e=>e.date>=TODAY);
  const past     = visible.filter(e=>e.date<TODAY);

  return (
    <div style={{minHeight:"100vh",background:C.slate,fontFamily:F_BODY,color:C.chalk,maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{background:C.slateDeep,borderBottom:`1px solid ${C.chalkLine}`,padding:"16px 18px 6px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <div style={{fontSize:26,fontFamily:F_DISPLAY,color:C.chalk,letterSpacing:0.5,lineHeight:1}}>Family Schedule</div>
          <button className="fs-btn" onClick={openSettings} style={{background:"transparent",border:`1px solid ${C.chalkLine}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12,color:C.chalkDim,fontWeight:700,fontFamily:F_MONO,letterSpacing:0.5}}>⚙ SETTINGS</button>
        </div>
        <div style={{fontSize:12,color:C.chalkDim,marginTop:4,marginBottom:10,display:"flex",alignItems:"center",gap:10,fontFamily:F_MONO}}>
          {members.map(m=>m.label).join(" · ")}
          <button className="fs-btn" onClick={loadEvents} aria-label="Refresh" style={{background:"none",border:"none",cursor:"pointer",color:C.chalkDim,fontSize:14,padding:0}}>⟳</button>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",gap:22}}>
          {["list","calendar"].map(t=>(
            <button key={t} className="fs-tab fs-btn" onClick={()=>setTab(t)} style={{padding:"8px 0 10px",fontWeight:700,fontSize:14,border:"none",background:"none",cursor:"pointer",color:tab===t?C.chalk:C.chalkDim,borderBottom:tab===t?`2px solid ${C.accent}`:"2px solid transparent",fontFamily:F_BODY}}>
              {t==="list"?"List":"Calendar"}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="fs-scroll" style={{display:"flex",gap:6,overflowX:"auto",padding:"12px 16px",background:C.slate,borderBottom:`1px solid ${C.chalkLine}`}}>
        <button className="fs-btn" style={pill(filter==="semua",C.accent)} onClick={()=>setFilter("semua")}>All</button>
        {members.map(m=>(
          <button key={m.id} className="fs-btn" style={pill(filter===m.id,m.color)} onClick={()=>setFilter(m.id)}>{m.emoji} {m.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{padding:"6px 16px 0"}}>
        {loading && <div className="fs-fade" style={{textAlign:"center",padding:"50px 0",color:C.chalkDim,fontFamily:F_MONO,fontSize:13,letterSpacing:0.5}}>Loading…</div>}
        {errMsg && !loading && (
          <div className="fs-fade" style={{background:"#F6E2DE",borderRadius:10,padding:16,textAlign:"center",color:C.accent,marginBottom:12,marginTop:14}}>
            {errMsg}
            <button className="fs-btn" onClick={loadEvents} style={{display:"block",margin:"10px auto 0",background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontWeight:700}}>Try Again</button>
          </div>
        )}

        {/* LIST */}
        {!loading && !errMsg && tab==="list" && (
          <>
            {upcoming.length===0 && past.length===0 && (
              <div style={{textAlign:"center",color:C.chalkDim,padding:"50px 0",fontSize:14}}>Nothing pinned up yet.<br/>Tap the button below to add one.</div>
            )}
            {upcoming.length>0 && (
              <>
                <div style={{fontSize:11,fontWeight:700,color:C.chalkDim,marginTop:12,textTransform:"uppercase",letterSpacing:1.5,fontFamily:F_MONO}}>Upcoming</div>
                {groupByDate(upcoming).map(([date,evs])=>(
                  <div key={date}>
                    <div style={{fontSize:13,fontWeight:700,color:C.chalk,margin:"12px 0 0",paddingLeft:2,display:"flex",alignItems:"center",gap:8}}>
                      {formatDate(date)}
                      {date===TODAY && <span style={{fontSize:10,background:C.accent,color:"#fff",borderRadius:5,padding:"2px 7px",fontFamily:F_MONO,letterSpacing:0.5}}>TODAY</span>}
                    </div>
                    {evs.map(ev=><EventCard key={ev.id} ev={ev} members={members} onEdit={openEdit} onDelete={askDelete}/>)}
                  </div>
                ))}
              </>
            )}
            {past.length>0 && (
              <>
                <div style={{fontSize:11,fontWeight:700,color:C.chalkDim,marginTop:20,textTransform:"uppercase",letterSpacing:1.5,fontFamily:F_MONO}}>Past</div>
                {groupByDate([...past].reverse()).map(([date,evs])=>(
                  <div key={date} style={{opacity:0.55}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.chalkDim,margin:"12px 0 0",paddingLeft:2}}>{formatDate(date)}</div>
                    {evs.map(ev=><EventCard key={ev.id} ev={ev} members={members} onEdit={openEdit} onDelete={askDelete}/>)}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* CALENDAR */}
        {!loading && !errMsg && tab==="calendar" && (
          <div className="fs-fade" style={{background:C.paper,borderRadius:14,padding:"16px 14px",marginTop:14,boxShadow:C.shadow,transform:"rotate(-0.3deg)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <button className="fs-btn" onClick={prevCal} aria-label="Previous month" style={{background:C.paperDim,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:16,color:C.ink}}>‹</button>
              <span style={{fontSize:19,fontFamily:F_DISPLAY,color:C.ink}}>{MONTHS_FULL[calMonth]} {calYear}</span>
              <button className="fs-btn" onClick={nextCal} aria-label="Next month" style={{background:C.paperDim,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:16,color:C.ink}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.inkDim,fontFamily:F_MONO}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
              {Array(startDay).fill(null).map((_,i)=><div key={"b"+i}/>)}
              {Array(totalDays).fill(null).map((_,i)=>{
                const day=i+1,ds=calDs(day),evs=calDayEvs(day);
                const isToday=ds===TODAY,isSel=ds===calSel;
                return (
                  <button key={day} className="fs-btn" onClick={()=>setCalSel(isSel?null:ds)}
                    style={{minHeight:46,borderRadius:8,padding:"5px 3px 3px",background:isSel?C.accent:"transparent",border:isToday&&!isSel?`2px solid ${C.accent}`:"2px solid transparent",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:isSel?"#fff":isToday?C.accent:C.ink,marginBottom:3,fontFamily:F_MONO}}>{day}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                      {evs.slice(0,3).map(ev=>{const m=getMember(ev.member);return <div key={ev.id} style={{width:5,height:5,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.85)":m.color}}/>;} )}
                      {evs.length>3&&<span style={{fontSize:8,color:isSel?"#fff":C.inkDim}}>+{evs.length-3}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {calSel && (
              <div style={{borderTop:`1px solid ${C.paperDim}`,paddingTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontWeight:800,fontSize:14,color:C.ink}}>{formatDate(calSel)}</div>
                  <button className="fs-btn" onClick={()=>{setForm({...emptyForm,date:calSel});setModal("add");}} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Add</button>
                </div>
                {calSelEvs.length===0
                  ? <div style={{color:C.inkDim,textAlign:"center",padding:"16px 0",fontSize:13}}>No schedules yet</div>
                  : calSelEvs.map(ev=><EventCard key={ev.id} ev={ev} members={members} onEdit={openEdit} onDelete={askDelete}/>)
                }
              </div>
            )}
          </div>
        )}
        <div style={{height:84}}/>
      </div>

      {/* FAB */}
      {!loading && (
        <button className="fs-btn" onClick={()=>{setForm({...emptyForm,date:TODAY});setModal("add");}}
          style={{position:"fixed",bottom:20,right:"50%",transform:"translateX(50%)",maxWidth:448,width:"calc(100% - 32px)",background:C.accent,color:"#fff",border:"none",borderRadius:12,padding:"14px 0",cursor:"pointer",fontWeight:800,fontSize:16,boxShadow:"0 6px 18px rgba(214,69,69,0.45)",zIndex:20}}>
          + Add Schedule
        </button>
      )}

      {/* MODAL: ADD */}
      {modal==="add" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontSize:20,fontFamily:F_DISPLAY,marginBottom:14,marginTop:6,color:C.ink}}>Add Schedule</div>
          <FormFields form={form} setForm={setForm} members={members} modal={modal} onSubmit={addEvent}/>
          <div style={{display:"flex",gap:10}}>
            <button className="fs-btn" onClick={addEvent} disabled={saving} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:saving?0.7:1}}>
              {saving?"Saving...":"Save"}
            </button>
            <button className="fs-btn" onClick={()=>setModal(null)} style={{flex:1,background:C.paperDim,color:C.ink,border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDIT */}
      {modal==="edit" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontSize:20,fontFamily:F_DISPLAY,marginBottom:14,marginTop:6,color:C.ink}}>Edit Schedule</div>
          <FormFields form={form} setForm={setForm} members={members} modal={modal} onSubmit={saveEdit}/>
          <div style={{display:"flex",gap:10}}>
            <button className="fs-btn" onClick={saveEdit} disabled={saving} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:saving?0.7:1}}>
              {saving?"Saving...":"Save"}
            </button>
            <button className="fs-btn" onClick={()=>setModal(null)} style={{flex:1,background:C.paperDim,color:C.ink,border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* MODAL: DELETE */}
      {modal==="delete" && deleteTarget && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"10px 0 16px"}}>
            <div style={{fontSize:21,fontFamily:F_DISPLAY,color:C.accent,marginBottom:8}}>Delete this?</div>
            <div style={{fontSize:14,color:C.ink,fontWeight:700,marginBottom:2}}>{deleteTarget.note}</div>
            <div style={{fontSize:13,color:C.inkDim,marginBottom:20,fontFamily:F_MONO}}>{formatDate(deleteTarget.date)}</div>
            <div style={{display:"flex",gap:10}}>
              <button className="fs-btn" onClick={confirmDelete} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Yes, Delete</button>
              <button className="fs-btn" onClick={()=>setModal(null)} style={{flex:1,background:C.paperDim,color:C.ink,border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: PIN */}
      {modal==="pin" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"10px 0 16px"}}>
            <div style={{fontSize:20,fontFamily:F_DISPLAY,color:C.ink,marginBottom:16}}>Enter PIN</div>
            <input className="fs-field" type="password" inputMode="numeric" maxLength={4} value={pinInput}
              onChange={e=>setPinInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&checkPin()}
              placeholder="••••"
              style={{...inp,textAlign:"center",fontSize:24,letterSpacing:8,marginBottom:8,fontFamily:F_MONO}}/>
            {pinError && <div style={{color:C.accent,fontSize:13,marginBottom:8}}>Wrong PIN, try again.</div>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button className="fs-btn" onClick={checkPin} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Enter</button>
              <button className="fs-btn" onClick={()=>setModal(null)} style={{flex:1,background:C.paperDim,color:C.ink,border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: SETTINGS */}
      {modal==="settings" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontSize:20,fontFamily:F_DISPLAY,marginBottom:16,marginTop:6,color:C.ink}}>Manage Members</div>
          {editMembers.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,background:C.paperDim,borderRadius:10,padding:"10px 12px"}}>
              <select value={m.emoji} onChange={e=>saveMemberEdit(i,"emoji",e.target.value)}
                style={{fontSize:20,border:"none",background:"none",cursor:"pointer",padding:0}}>
                {EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}
              </select>
              <input className="fs-field" value={m.label} onChange={e=>saveMemberEdit(i,"label",e.target.value)}
                style={{flex:1,padding:"8px 10px",borderRadius:8,border:`1.5px solid ${C.paper}`,fontSize:14,background:C.paper,color:C.ink,fontFamily:F_BODY}}/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {COLORS.map((c,ci)=>(
                  <button key={ci} className="fs-swatch fs-btn" aria-label={`Color ${ci+1}`} onClick={()=>{saveMemberEdit(i,"color",c.color);saveMemberEdit(i,"bg",c.bg);}}
                    style={{width:18,height:18,borderRadius:"50%",background:c.color,cursor:"pointer",border:m.color===c.color?`2px solid ${C.ink}`:"2px solid transparent",padding:0}}/>
                ))}
              </div>
              <button className="fs-btn" onClick={()=>removeMember(i)} aria-label="Remove member" style={{background:"#F6E2DE",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:C.accent,fontSize:14,fontWeight:700}}>×</button>
            </div>
          ))}
          <button className="fs-btn" onClick={addMember} style={{width:"100%",background:"transparent",color:C.ink,border:`2px dashed ${C.paperDim}`,borderRadius:10,padding:"11px 0",cursor:"pointer",fontWeight:700,fontSize:14,marginBottom:16}}>
            + Add Member
          </button>
          <div style={{display:"flex",gap:10}}>
            <button className="fs-btn" onClick={saveSettings} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Save</button>
            <button className="fs-btn" onClick={()=>setModal(null)} style={{flex:1,background:C.paperDim,color:C.ink,border:"none",borderRadius:10,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
