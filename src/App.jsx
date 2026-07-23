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

//Default Family Members
const DEFAULT_MEMBERS = [
  { id: "dad",   label: "Dad",   emoji: "👨", color: "#4A7BC8", bg: "#E3EBF9" },
  { id: "mom",   label: "Mom",   emoji: "👩", color: "#C85A8A", bg: "#FAEBF2" },
  { id: "sean",  label: "Sean",  emoji: "🧒", color: "#5BAD8C", bg: "#E6F4EE" },
  { id: "zac",   label: "Zac",   emoji: "🧒", color: "#E07B4F", bg: "#FCEEE6" },
  { id: "ace",   label: "Ace",   emoji: "🧒", color: "#A569BD", bg: "#F3EAF9" },
  { id: "chase", label: "Chase", emoji: "🧒", color: "#E8A825", bg: "#FDF4E1" },
];

const COLORS = [
  { color: "#4A7BC8", bg: "#E3EBF9" },
  { color: "#C85A8A", bg: "#FAEBF2" },
  { color: "#5BAD8C", bg: "#E6F4EE" },
  { color: "#E07B4F", bg: "#FCEEE6" },
  { color: "#A569BD", bg: "#F3EAF9" },
  { color: "#E8A825", bg: "#FDF4E1" },
  { color: "#E84A4A", bg: "#FDEAEA" },
  { color: "#2AACB8", bg: "#E0F5F7" },
];

const EMOJIS = ["👨","👩","🧒","👧","👦","🧑","👴","👵","🐶","🌟"];
const MONTHS_FULL  = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const DAYS_SHORT   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

const inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #D0DDEF", fontSize:14, boxSizing:"border-box", background:"#fff", color:"#1A2340", marginBottom:10, outline:"none" };
const pill = (a,c,bg) => ({ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontWeight:700, fontSize:13, background:a?c:bg||"#EEF3FC", color:a?"#fff":c, flexShrink:0 });

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
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(20,32,64,0.45)",zIndex:30,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 18px 36px",width:"100%",maxWidth:480,boxSizing:"border-box",maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

function FormFields({ form, setForm, members, modal, onSubmit }) {
  return (
    <>
      <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:6}}>FOR WHO</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        {members.map(m => (
          <button key={m.id} onClick={()=>setForm(f=>({...f,member:m.id}))}
            style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:form.member===m.id?m.color:m.bg,color:form.member===m.id?"#fff":m.color}}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>DATE</div>
      <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/>
      <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>TIME (optional)</div>
      <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={inp}/>
      <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>DESCRIPTION</div>
      <input
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
  const m = members.find(x => x.id === ev.member) || { label: ev.member, emoji: "👤", color: "#999", bg: "#eee" };
  return (
    <div style={{display:"flex",gap:12,alignItems:"flex-start",background:m.bg,borderRadius:14,padding:"12px 14px",marginBottom:9,boxShadow:"0 1px 4px rgba(74,123,200,0.07)"}}>
      <div style={{width:40,height:40,borderRadius:10,background:m.color,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:16,flexShrink:0}}>
        <span>{m.emoji}</span>
        <span style={{fontSize:9,marginTop:1}}>{m.label}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1A2340"}}>{ev.note}</div>
        <div style={{marginTop:4,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
          <span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,background:"#fff",color:m.color,fontSize:11,fontWeight:700}}>{m.label}</span>
          {ev.time && <span style={{fontSize:12,color:"#8A9BBC"}}>⏰ {ev.time}</span>}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
        <button onClick={()=>onEdit(ev)} style={{background:"#EEF3FC",border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:13}}>✏️</button>
        <button onClick={()=>onDelete(ev)} style={{background:"#FEE2E2",border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:13}}>🗑️</button>
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

  const getMember = id => members.find(m=>m.id===id)||{label:id,emoji:"👤",color:"#999",bg:"#eee"};
  const visible  = events.filter(e=>filter==="semua"||e.member===filter);
  const upcoming = visible.filter(e=>e.date>=TODAY);
  const past     = visible.filter(e=>e.date<TODAY);

  return (
    <div style={{minHeight:"100vh",background:"#F0F4FA",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#1A2340",maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E2EAF4",padding:"14px 18px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#1A2340",letterSpacing:-0.5}}>🏠 Family Schedule</div>
          <button onClick={openSettings} style={{background:"#EEF3FC",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:"#4A7BC8",fontWeight:700}}>⚙️ Settings</button>
        </div>
        <div style={{fontSize:12,color:"#8A9BBC",marginTop:2,display:"flex",alignItems:"center",gap:8}}>
          {members.map(m=>m.label).join(" · ")}
          <button onClick={loadEvents} style={{background:"none",border:"none",cursor:"pointer",color:"#4A7BC8",fontSize:13,padding:0,fontWeight:700}}>⟳</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#fff",borderBottom:"1px solid #E2EAF4",padding:"0 18px"}}>
        {["list","calendar"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"11px 18px",fontWeight:700,fontSize:14,border:"none",background:"none",cursor:"pointer",color:tab===t?"#4A7BC8":"#8A9BBC",borderBottom:tab===t?"2px solid #4A7BC8":"2px solid transparent"}}>
            {t==="list"?"📋 All Schedules":"📅 Calendar"}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #E2EAF4"}}>
        <button style={pill(filter==="semua","#1A2340","#EEF3FC")} onClick={()=>setFilter("semua")}>👨‍👩‍👧‍👦 All</button>
        {members.map(m=>(
          <button key={m.id} style={pill(filter===m.id,m.color,m.bg)} onClick={()=>setFilter(m.id)}>{m.emoji} {m.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{padding:"14px 16px"}}>
        {loading && <div style={{textAlign:"center",padding:"40px 0",color:"#8A9BBC"}}><div style={{fontSize:32,marginBottom:8}}>⏳</div>Loading schedules...</div>}
        {errMsg && !loading && (
          <div style={{background:"#FEE2E2",borderRadius:12,padding:16,textAlign:"center",color:"#B91C1C",marginBottom:12}}>
            {errMsg}
            <button onClick={loadEvents} style={{display:"block",margin:"10px auto 0",background:"#B91C1C",color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",cursor:"pointer",fontWeight:700}}>Try Again</button>
          </div>
        )}

        {/* LIST */}
        {!loading && !errMsg && tab==="list" && (
          <>
            {upcoming.length===0 && past.length===0 && (
              <div style={{textAlign:"center",color:"#8A9BBC",padding:"40px 0",fontSize:14}}>No schedules yet.<br/>Tap the button below! 👇</div>
            )}
            {upcoming.length>0 && (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:7,textTransform:"uppercase",letterSpacing:0.5}}>📌 Upcoming</div>
                {groupByDate(upcoming).map(([date,evs])=>(
                  <div key={date}>
                    <div style={{fontSize:13,fontWeight:700,color:"#4A7BC8",margin:"10px 0 6px",paddingLeft:2}}>
                      {formatDate(date)}{date===TODAY&&<span style={{marginLeft:6,fontSize:11,background:"#4A7BC8",color:"#fff",borderRadius:5,padding:"1px 6px"}}>Today</span>}
                    </div>
                    {evs.map(ev=><EventCard key={ev.id} ev={ev} members={members} onEdit={openEdit} onDelete={askDelete}/>)}
                  </div>
                ))}
              </>
            )}
            {past.length>0 && (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:7,marginTop:18,textTransform:"uppercase",letterSpacing:0.5}}>🕐 Past</div>
                {groupByDate([...past].reverse()).map(([date,evs])=>(
                  <div key={date} style={{opacity:0.5}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#8A9BBC",margin:"10px 0 6px",paddingLeft:2}}>{formatDate(date)}</div>
                    {evs.map(ev=><EventCard key={ev.id} ev={ev} members={members} onEdit={openEdit} onDelete={askDelete}/>)}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* CALENDAR */}
        {!loading && !errMsg && tab==="calendar" && (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <button onClick={prevCal} style={{background:"#EEF3FC",border:"none",borderRadius:8,padding:"6px 16px",cursor:"pointer",fontSize:18,color:"#4A7BC8"}}>‹</button>
              <span style={{fontWeight:800,fontSize:16,color:"#1A2340"}}>{MONTHS_FULL[calMonth]} {calYear}</span>
              <button onClick={nextCal} style={{background:"#EEF3FC",border:"none",borderRadius:8,padding:"6px 16px",cursor:"pointer",fontSize:18,color:"#4A7BC8"}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#8A9BBC"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:16}}>
              {Array(startDay).fill(null).map((_,i)=><div key={"b"+i}/>)}
              {Array(totalDays).fill(null).map((_,i)=>{
                const day=i+1,ds=calDs(day),evs=calDayEvs(day);
                const isToday=ds===TODAY,isSel=ds===calSel;
                return (
                  <div key={day} onClick={()=>setCalSel(isSel?null:ds)}
                    style={{minHeight:48,borderRadius:10,padding:"5px 3px 3px",background:isSel?"#4A7BC8":isToday?"#EEF3FC":"#fff",border:isToday&&!isSel?"2px solid #4A7BC8":"2px solid transparent",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:isSel?"#fff":isToday?"#4A7BC8":"#1A2340",marginBottom:3}}>{day}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>
                      {evs.slice(0,3).map(ev=>{const m=getMember(ev.member);return <div key={ev.id} style={{width:6,height:6,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.8)":m.color}}/>;} )}
                      {evs.length>3&&<span style={{fontSize:8,color:isSel?"#fff":"#8A9BBC"}}>+{evs.length-3}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {calSel && (
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(74,123,200,0.09)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1A2340"}}>{formatDate(calSel)}</div>
                  <button onClick={()=>{setForm({...emptyForm,date:calSel});setModal("add");}} style={{background:"#4A7BC8",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Add</button>
                </div>
                {calSelEvs.length===0
                  ? <div style={{color:"#8A9BBC",textAlign:"center",padding:"16px 0",fontSize:13}}>No schedules yet</div>
                  : calSelEvs.map(ev=><EventCard key={ev.id} ev={ev} members={members} onEdit={openEdit} onDelete={askDelete}/>)
                }
              </div>
            )}
          </>
        )}
        <div style={{height:80}}/>
      </div>

      {/* FAB */}
      {!loading && (
        <button onClick={()=>{setForm({...emptyForm,date:TODAY});setModal("add");}}
          style={{position:"fixed",bottom:24,right:"50%",transform:"translateX(50%)",maxWidth:448,width:"calc(100% - 32px)",background:"#4A7BC8",color:"#fff",border:"none",borderRadius:14,padding:"14px 0",cursor:"pointer",fontWeight:700,fontSize:16,boxShadow:"0 4px 16px rgba(74,123,200,0.35)",zIndex:20}}>
          + Add Schedule
        </button>
      )}

      {/* MODAL: ADD */}
      {modal==="add" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16,color:"#1A2340"}}>➕ Add Schedule</div>
          <FormFields form={form} setForm={setForm} members={members} modal={modal} onSubmit={addEvent}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={addEvent} disabled={saving} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:saving?0.7:1}}>
              {saving?"Saving...":"✓ Save"}
            </button>
            <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* MODAL: EDIT */}
      {modal==="edit" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16,color:"#1A2340"}}>✏️ Edit Schedule</div>
          <FormFields form={form} setForm={setForm} members={members} modal={modal} onSubmit={saveEdit}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={saveEdit} disabled={saving} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:saving?0.7:1}}>
              {saving?"Saving...":"✓ Save"}
            </button>
            <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* MODAL: DELETE */}
      {modal==="delete" && deleteTarget && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontWeight:800,fontSize:17,color:"#1A2340",marginBottom:8}}>Delete Schedule?</div>
            <div style={{fontSize:14,color:"#8A9BBC",marginBottom:4}}>{deleteTarget.note}</div>
            <div style={{fontSize:13,color:"#8A9BBC",marginBottom:20}}>{formatDate(deleteTarget.date)}</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={confirmDelete} style={{flex:1,background:"#E84A4A",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Yes, Delete</button>
              <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: PIN */}
      {modal==="pin" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔐</div>
            <div style={{fontWeight:800,fontSize:17,color:"#1A2340",marginBottom:16}}>Enter PIN</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
              onChange={e=>setPinInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&checkPin()}
              placeholder="••••"
              style={{...inp,textAlign:"center",fontSize:24,letterSpacing:8,marginBottom:8}}/>
            {pinError && <div style={{color:"#E84A4A",fontSize:13,marginBottom:8}}>Wrong PIN, try again.</div>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={checkPin} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Enter</button>
              <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: SETTINGS */}
      {modal==="settings" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16,color:"#1A2340"}}>⚙️ Manage Members</div>
          {editMembers.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,background:"#F0F4FA",borderRadius:12,padding:"10px 12px"}}>
              <select value={m.emoji} onChange={e=>saveMemberEdit(i,"emoji",e.target.value)}
                style={{fontSize:20,border:"none",background:"none",cursor:"pointer",padding:0}}>
                {EMOJIS.map(em=><option key={em} value={em}>{em}</option>)}
              </select>
              <input value={m.label} onChange={e=>saveMemberEdit(i,"label",e.target.value)}
                style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1.5px solid #D0DDEF",fontSize:14,outline:"none"}}/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {COLORS.map((c,ci)=>(
                  <div key={ci} onClick={()=>{saveMemberEdit(i,"color",c.color);saveMemberEdit(i,"bg",c.bg);}}
                    style={{width:16,height:16,borderRadius:"50%",background:c.color,cursor:"pointer",border:m.color===c.color?"2px solid #1A2340":"2px solid transparent"}}/>
                ))}
              </div>
              <button onClick={()=>removeMember(i)} style={{background:"#FEE2E2",border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",color:"#E84A4A",fontSize:14,fontWeight:700}}>×</button>
            </div>
          ))}
          <button onClick={addMember} style={{width:"100%",background:"#EEF3FC",color:"#4A7BC8",border:"2px dashed #A8C4E8",borderRadius:12,padding:"11px 0",cursor:"pointer",fontWeight:700,fontSize:14,marginBottom:14}}>
            + Add Member
          </button>
          <div style={{display:"flex",gap:10}}>
            <button onClick={saveSettings} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>✓ Save</button>
            <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
