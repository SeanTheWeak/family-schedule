import { useState, useEffect } from "react";

const SUPABASE_URL = "https://sxfyzbjkmyhculyazaak.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Znl6YmprbXloY3VseWF6YWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDY1MDcsImV4cCI6MjA5ODIyMjUwN30.FaPUiY3tO1SSu74mfkr5tGUM9cOeUfy-g4qR5flpJGs";
const ADMIN_PIN = "8008";

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

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

// ── Supabase helpers ─────────────────────────────────────
async function sbGet(table, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbPost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: HEADERS, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbPatch(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: HEADERS, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: HEADERS });
  if (!res.ok) throw new Error(await res.text());
}

// ── Utils ─────────────────────────────────────────────────
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
  return str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + "_" + Date.now();
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const now = new Date();
  const TODAY = todayStr();

  // data
  const [events, setEvents]     = useState([]);
  const [members, setMembers]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("fs_members")) || DEFAULT_MEMBERS; } catch { return DEFAULT_MEMBERS; }
  });
  const [loading, setLoading]   = useState(true);
  const [errMsg, setErrMsg]     = useState(null);

  // ui state
  const [filter, setFilter]     = useState("semua");
  const [tab, setTab]           = useState("list");
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calSel, setCalSel]     = useState(null);

  // modals
  const [modal, setModal]       = useState(null); // "add" | "edit" | "delete" | "checkin" | "pin" | "settings"
  const [editEvent, setEditEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [checkinTarget, setCheckinTarget] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinNext, setPinNext]   = useState(null); // what to open after PIN

  // form
  const emptyForm = { date: TODAY, timeStart: "", timeEnd: "", member: members[0]?.id || "dad", note: "", location: "", checkedIn: false };
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  // settings
  const [editMembers, setEditMembers] = useState([]);

  // ── persist members ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("fs_members", JSON.stringify(members));
  }, [members]);

  function getMember(id) { return members.find(m => m.id === id) || { label: id, emoji: "👤", color: "#999", bg: "#eee" }; }

  // ── Load events ──────────────────────────────────────────
  async function loadEvents() {
    setLoading(true); setErrMsg(null);
    try { setEvents(await sbGet("events", "?order=date.asc,time_start.asc")); }
    catch { setErrMsg("Gagal memuat. Cek koneksi internet."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadEvents(); }, []);

  // ── Add event ────────────────────────────────────────────
  async function addEvent() {
    if (!form.note.trim() || !form.date) return;
    setSaving(true);
    try {
      const saved = await sbPost("events", {
        member: form.member, date: form.date,
        time_start: form.timeStart || null, time_end: form.timeEnd || null,
        note: form.note, location: form.location || null, checked_in: false,
      });
      setEvents(prev => [...prev, ...(Array.isArray(saved) ? saved : [saved])].sort((a,b) => a.date.localeCompare(b.date) || (a.time_start||"").localeCompare(b.time_start||"")));
      setForm(emptyForm);
      setModal(null);
    } catch(e) { alert("Gagal menyimpan: " + e.message); }
    finally { setSaving(false); }
  }

  // ── Edit event ───────────────────────────────────────────
  function openEdit(ev) {
    setEditEvent(ev);
    setForm({ date: ev.date, timeStart: ev.time_start||"", timeEnd: ev.time_end||"", member: ev.member, note: ev.note, location: ev.location||"", checkedIn: ev.checked_in||false });
    setModal("edit");
  }
  async function saveEdit() {
    if (!form.note.trim() || !form.date) return;
    setSaving(true);
    try {
      const updated = await sbPatch("events", editEvent.id, {
        member: form.member, date: form.date,
        time_start: form.timeStart || null, time_end: form.timeEnd || null,
        note: form.note, location: form.location || null,
      });
      setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...form, time_start: form.timeStart||null, time_end: form.timeEnd||null, location: form.location||null } : e));
      setModal(null);
    } catch(e) { alert("Gagal menyimpan: " + e.message); }
    finally { setSaving(false); }
  }

  // ── Delete event ─────────────────────────────────────────
  function askDelete(ev) { setDeleteTarget(ev); setModal("delete"); }
  async function confirmDelete() {
    setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
    setModal(null);
    try { await sbDelete("events", deleteTarget.id); }
    catch { loadEvents(); }
  }

  // ── Check-in ─────────────────────────────────────────────
  function openCheckin(ev) { setCheckinTarget(ev); setModal("checkin"); }
  async function doCheckin() {
    setLocLoading(true);
    try {
      let locStr = checkinTarget.location || "";
      if (navigator.geolocation) {
        await new Promise(resolve => {
          navigator.geolocation.getCurrentPosition(pos => {
            locStr = `📍 ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
            resolve();
          }, () => resolve(), { timeout: 5000 });
        });
      }
      const now2 = new Date();
      const timeStr = `${String(now2.getHours()).padStart(2,"0")}:${String(now2.getMinutes()).padStart(2,"0")}`;
      const checkinNote = `✓ Sampai jam ${timeStr}${locStr ? " · " + locStr : ""}`;
      await sbPatch("events", checkinTarget.id, { checked_in: true, checkin_note: checkinNote });
      setEvents(prev => prev.map(e => e.id === checkinTarget.id ? { ...e, checked_in: true, checkin_note: checkinNote } : e));
      setModal(null);
    } catch(e) { alert("Gagal check-in."); }
    finally { setLocLoading(false); }
  }

  // ── PIN ──────────────────────────────────────────────────
  function requirePin(next) { setPinInput(""); setPinError(false); setPinNext(next); setModal("pin"); }
  function checkPin() {
    if (pinInput === ADMIN_PIN) { setModal(pinNext); setPinNext(null); }
    else { setPinError(true); setPinInput(""); }
  }

  // ── Settings / members ───────────────────────────────────
  function openSettings() {
    setEditMembers(members.map(m => ({ ...m })));
    requirePin("settings");
  }
  function saveMemberEdit(i, field, val) {
    setEditMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  }
  function addMember() {
    const c = COLORS[editMembers.length % COLORS.length];
    setEditMembers(prev => [...prev, { id: slugify("anggota"), label: "Nama Baru", emoji: "🧒", color: c.color, bg: c.bg }]);
  }
  function removeMember(i) { setEditMembers(prev => prev.filter((_,idx) => idx !== i)); }
  function saveSettings() { setMembers(editMembers); setModal(null); }

  // ── Get location for form ────────────────────────────────
  function getLocation() {
    if (!navigator.geolocation) { alert("GPS tidak tersedia di browser ini."); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => ({ ...f, location: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` }));
      setLocLoading(false);
    }, () => { alert("Tidak bisa ambil lokasi."); setLocLoading(false); }, { timeout: 8000 });
  }

  // ── Calendar ─────────────────────────────────────────────
  const totalDays = daysInMonth(calYear, calMonth);
  const startDay  = firstDayOf(calYear, calMonth);
  function calDs(d) { return `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  function calDayEvs(d) { return events.filter(e => e.date === calDs(d) && (filter==="semua" || e.member===filter)); }
  const calSelEvs = calSel ? events.filter(e => e.date===calSel && (filter==="semua"||e.member===filter)) : [];
  function prevCal() { calMonth===0 ? (setCalMonth(11),setCalYear(calYear-1)) : setCalMonth(calMonth-1); }
  function nextCal() { calMonth===11 ? (setCalMonth(0),setCalYear(calYear+1)) : setCalMonth(calMonth+1); }

  // ── Derived ───────────────────────────────────────────────
  const visible  = events.filter(e => filter==="semua" || e.member===filter);
  const upcoming = visible.filter(e => e.date >= TODAY);
  const past     = visible.filter(e => e.date < TODAY);

  // ── Shared styles ─────────────────────────────────────────
  const inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #D0DDEF", fontSize:14, boxSizing:"border-box", background:"#fff", color:"#1A2340", marginBottom:10, outline:"none" };
  const pill = (a,c,bg) => ({ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", fontWeight:700, fontSize:13, background:a?c:bg||"#EEF3FC", color:a?"#fff":c, flexShrink:0 });

  // ── Event Card ────────────────────────────────────────────
  function EventCard({ ev }) {
    const m = getMember(ev.member);
    const timeLabel = ev.time_start ? (ev.time_end ? `⏰ ${ev.time_start} – ${ev.time_end}` : `⏰ ${ev.time_start}`) : null;
    return (
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", background:m.bg, borderRadius:14, padding:"12px 14px", marginBottom:9, boxShadow:"0 1px 4px rgba(74,123,200,0.07)" }}>
        <div style={{ width:40, height:40, borderRadius:10, background:m.color, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16, flexShrink:0 }}>
          <span>{m.emoji}</span>
          <span style={{fontSize:9,marginTop:1}}>{m.label}</span>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1A2340"}}>{ev.note}</div>
          <div style={{marginTop:4,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
            <span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,background:"#fff",color:m.color,fontSize:11,fontWeight:700}}>{m.label}</span>
            {timeLabel && <span style={{fontSize:12,color:"#8A9BBC"}}>{timeLabel}</span>}
          </div>
          {ev.location && <div style={{fontSize:12,color:"#8A9BBC",marginTop:3}}>📍 {ev.location}</div>}
          {ev.checked_in && <div style={{fontSize:12,color:"#5BAD8C",marginTop:3,fontWeight:600}}>{ev.checkin_note || "✓ Sudah sampai"}</div>}
          {!ev.checked_in && ev.date >= TODAY && (
            <button onClick={()=>openCheckin(ev)} style={{marginTop:6,background:"#5BAD8C",color:"#fff",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>
              📍 Sudah Sampai
            </button>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
          <button onClick={()=>openEdit(ev)} style={{background:"#EEF3FC",border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:13,color:"#4A7BC8"}}>✏️</button>
          <button onClick={()=>askDelete(ev)} style={{background:"#FEE2E2",border:"none",borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:13,color:"#E84A4A"}}>🗑️</button>
        </div>
      </div>
    );
  }

  // ── Form fields (shared add/edit) ─────────────────────────
  function FormFields() {
    return (
      <>
        <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:6}}>UNTUK SIAPA</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {members.map(m => (
            <button key={m.id} onClick={()=>setForm(f=>({...f,member:m.id}))}
              style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:form.member===m.id?m.color:m.bg,color:form.member===m.id?"#fff":m.color}}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>TANGGAL</div>
        <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/>

        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>JAM MULAI</div>
            <input type="time" value={form.timeStart} onChange={e=>setForm(f=>({...f,timeStart:e.target.value}))} style={inp}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>JAM SELESAI</div>
            <input type="time" value={form.timeEnd} onChange={e=>setForm(f=>({...f,timeEnd:e.target.value}))} style={inp}/>
          </div>
        </div>

        <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>KETERANGAN</div>
        <input type="text" placeholder="Contoh: Les piano, Vaksin..." value={form.note}
          onChange={e=>setForm(f=>({...f,note:e.target.value}))} style={inp}/>

        <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:4}}>LOKASI (opsional)</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input type="text" placeholder="Nama tempat / alamat" value={form.location}
            onChange={e=>setForm(f=>({...f,location:e.target.value}))}
            style={{...inp,marginBottom:0,flex:1}}/>
          <button onClick={getLocation} disabled={locLoading}
            style={{background:"#EEF3FC",border:"none",borderRadius:10,padding:"0 12px",cursor:"pointer",fontSize:18,flexShrink:0,opacity:locLoading?0.6:1}}>
            {locLoading?"⏳":"📍"}
          </button>
        </div>
      </>
    );
  }

  // ── Modal wrapper ─────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#F0F4FA",fontFamily:"'Segoe UI',system-ui,sans-serif",color:"#1A2340",maxWidth:480,margin:"0 auto"}}>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E2EAF4",padding:"14px 18px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:20,fontWeight:800,color:"#1A2340",letterSpacing:-0.5}}>🏠 Family Schedule</div>
          <button onClick={openSettings} style={{background:"#EEF3FC",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:"#4A7BC8",fontWeight:700}}>⚙️ Setting</button>
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
            {t==="list"?"📋 Semua Jadwal":"📅 Kalender"}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{display:"flex",gap:8,overflowX:"auto",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #E2EAF4"}}>
        <button style={pill(filter==="semua","#1A2340","#EEF3FC")} onClick={()=>setFilter("semua")}>👨‍👩‍👧‍👦 Semua</button>
        {members.map(m=>(
          <button key={m.id} style={pill(filter===m.id,m.color,m.bg)} onClick={()=>setFilter(m.id)}>{m.emoji} {m.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{padding:"14px 16px"}}>
        {loading && <div style={{textAlign:"center",padding:"40px 0",color:"#8A9BBC"}}><div style={{fontSize:32,marginBottom:8}}>⏳</div>Memuat jadwal...</div>}
        {errMsg && !loading && (
          <div style={{background:"#FEE2E2",borderRadius:12,padding:16,textAlign:"center",color:"#B91C1C",marginBottom:12}}>
            {errMsg}
            <button onClick={loadEvents} style={{display:"block",margin:"10px auto 0",background:"#B91C1C",color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",cursor:"pointer",fontWeight:700}}>Coba Lagi</button>
          </div>
        )}

        {/* LIST */}
        {!loading && !errMsg && tab==="list" && (
          <>
            {upcoming.length===0 && past.length===0 && (
              <div style={{textAlign:"center",color:"#8A9BBC",padding:"40px 0",fontSize:14}}>Belum ada jadwal.<br/>Tap tombol di bawah! 👇</div>
            )}
            {upcoming.length>0 && (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:7,textTransform:"uppercase",letterSpacing:0.5}}>📌 Mendatang</div>
                {groupByDate(upcoming).map(([date,evs])=>(
                  <div key={date}>
                    <div style={{fontSize:13,fontWeight:700,color:"#4A7BC8",margin:"10px 0 6px",paddingLeft:2}}>
                      {formatDate(date)}{date===TODAY&&<span style={{marginLeft:6,fontSize:11,background:"#4A7BC8",color:"#fff",borderRadius:5,padding:"1px 6px"}}>Hari ini</span>}
                    </div>
                    {evs.map(ev=><EventCard key={ev.id} ev={ev}/>)}
                  </div>
                ))}
              </>
            )}
            {past.length>0 && (
              <>
                <div style={{fontSize:12,fontWeight:700,color:"#8A9BBC",marginBottom:7,marginTop:18,textTransform:"uppercase",letterSpacing:0.5}}>🕐 Sudah lewat</div>
                {groupByDate([...past].reverse()).map(([date,evs])=>(
                  <div key={date} style={{opacity:0.5}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#8A9BBC",margin:"10px 0 6px",paddingLeft:2}}>{formatDate(date)}</div>
                    {evs.map(ev=><EventCard key={ev.id} ev={ev}/>)}
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
                  <button onClick={()=>{setForm({...emptyForm,date:calSel});setModal("add");}} style={{background:"#4A7BC8",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontWeight:700,fontSize:13}}>+ Tambah</button>
                </div>
                {calSelEvs.length===0
                  ? <div style={{color:"#8A9BBC",textAlign:"center",padding:"16px 0",fontSize:13}}>Belum ada jadwal</div>
                  : calSelEvs.map(ev=><EventCard key={ev.id} ev={ev}/>)
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
          + Tambah Jadwal
        </button>
      )}

      {/* ── MODAL: ADD ── */}
      {modal==="add" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16,color:"#1A2340"}}>➕ Tambah Jadwal</div>
          <FormFields/>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button onClick={addEvent} disabled={saving} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:saving?0.7:1}}>
              {saving?"Menyimpan...":"✓ Simpan"}
            </button>
            <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Batal</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL: EDIT ── */}
      {modal==="edit" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16,color:"#1A2340"}}>✏️ Edit Jadwal</div>
          <FormFields/>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button onClick={saveEdit} disabled={saving} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:saving?0.7:1}}>
              {saving?"Menyimpan...":"✓ Simpan"}
            </button>
            <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Batal</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL: DELETE CONFIRM ── */}
      {modal==="delete" && deleteTarget && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <div style={{fontWeight:800,fontSize:17,color:"#1A2340",marginBottom:8}}>Hapus Jadwal?</div>
            <div style={{fontSize:14,color:"#8A9BBC",marginBottom:4}}>{deleteTarget.note}</div>
            <div style={{fontSize:13,color:"#8A9BBC",marginBottom:20}}>{formatDate(deleteTarget.date)}</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={confirmDelete} style={{flex:1,background:"#E84A4A",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Ya, Hapus</button>
              <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Batal</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: CHECK-IN ── */}
      {modal==="checkin" && checkinTarget && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:40,marginBottom:12}}>📍</div>
            <div style={{fontWeight:800,fontSize:17,color:"#1A2340",marginBottom:8}}>Sudah Sampai?</div>
            <div style={{fontSize:14,color:"#8A9BBC",marginBottom:4}}>{checkinTarget.note}</div>
            {checkinTarget.location && <div style={{fontSize:13,color:"#8A9BBC",marginBottom:4}}>📍 {checkinTarget.location}</div>}
            <div style={{fontSize:13,color:"#8A9BBC",marginBottom:20}}>Lokasi GPS akan otomatis tercatat.</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={doCheckin} disabled={locLoading} style={{flex:1,background:"#5BAD8C",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15,opacity:locLoading?0.7:1}}>
                {locLoading?"Mencatat...":"✓ Sudah Sampai!"}
              </button>
              <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Batal</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: PIN ── */}
      {modal==="pin" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔐</div>
            <div style={{fontWeight:800,fontSize:17,color:"#1A2340",marginBottom:16}}>Masukkan PIN</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
              onChange={e=>setPinInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&checkPin()}
              placeholder="••••"
              style={{...inp,textAlign:"center",fontSize:24,letterSpacing:8,marginBottom:8}}/>
            {pinError && <div style={{color:"#E84A4A",fontSize:13,marginBottom:8}}>PIN salah, coba lagi.</div>}
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button onClick={checkPin} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Masuk</button>
              <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Batal</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: SETTINGS ── */}
      {modal==="settings" && (
        <Modal onClose={()=>setModal(null)}>
          <div style={{fontWeight:800,fontSize:17,marginBottom:16,color:"#1A2340"}}>⚙️ Kelola Anggota</div>
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
            + Tambah Anggota
          </button>
          <div style={{display:"flex",gap:10}}>
            <button onClick={saveSettings} style={{flex:1,background:"#4A7BC8",color:"#fff",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>✓ Simpan</button>
            <button onClick={()=>setModal(null)} style={{flex:1,background:"#EEF3FC",color:"#4A7BC8",border:"none",borderRadius:12,padding:"13px 0",cursor:"pointer",fontWeight:700,fontSize:15}}>Batal</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
