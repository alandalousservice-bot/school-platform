import { useEffect, useState } from "react";
import api from "../api";
import TopBar from "../components/TopBar";
import { LABELS } from "../labels";
import {
  queueAbsenceSubmission,
  syncPendingSubmissions,
  countPendingSubmissions,
  cacheClassSnapshot,
  readClassSnapshot,
  registerBackgroundSync,
  queueGradeSubmission,
  syncPendingGradeSubmissions,
  registerGradeBackgroundSync,
} from "../offline";

export default function TeacherApp() {
  const [data, setData] = useState(null);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const [gradeSubject, setGradeSubject] = useState("التربية البدنية والرياضية");
  const [term, setTerm] = useState("الفصل الثالث");
  const [grades, setGrades] = useState({});
  const [mySchedule, setMySchedule] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    load();
    api.get("/api/teacher/my-schedule").then(({ data }) => setMySchedule(data)).catch(() => {});
    api.get("/api/teacher/my-profile").then(({ data }) => setTeacherProfile(data)).catch(() => {});
    refreshPendingCount();
    const heartbeat = () => api.post("/api/auth/heartbeat").catch(() => {});
    heartbeat();
    const heartbeatTimer = setInterval(heartbeat, 30000);

    function handleOnline() {
      setIsOnline(true);
      trySync();
      trySyncGrades();
    }
    function handleOffline() {
      setIsOnline(false);
    }
    function handleSwMessage(event) {
      if (event.data?.type === "SYNC_ABSENCES") trySync();
      if (event.data?.type === "SYNC_GRADES") trySyncGrades();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener?.("message", handleSwMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener?.("message", handleSwMessage);
      clearInterval(heartbeatTimer);
    };
  }, []);

  async function refreshPendingCount() {
    setPendingCount(await countPendingSubmissions());
  }

  async function trySync() {
    const { synced, remaining } = await syncPendingSubmissions(api);
    setPendingCount(remaining);
    if (synced > 0) {
      setStatus({ type: "success", message: `تمت مزامنة ${synced} عملية غياب كانت بانتظار الاتصال.` });
      load(); // نحدّث القائمة بعد المزامنة كي تعكس آخر حالة من الخادم
    }
  }

  async function trySyncGrades() {
    try {
      const result = await syncPendingGradeSubmissions(api);
      if (result.synced > 0) setStatus({ type: "success", message: `تمت مزامنة ${result.synced} نقطة محفوظة محليًا.` });
    } catch {}
  }

  async function load() {
    setStatus({ type: "loading", message: "" });
    try {
      const { data } = await api.get("/api/teacher/my-current-class");
      setData(data);
      setFromCache(false);
      cacheClassSnapshot(data);
      setAbsentIds(new Set(data.students?.filter((s) => s.is_absent_today).map((s) => s.id)));
      setStatus({ type: "idle", message: "" });
    } catch {
      const snapshot = readClassSnapshot();
      if (snapshot) {
        setData(snapshot.data);
        setFromCache(true);
        setAbsentIds(new Set(snapshot.data.students?.filter((s) => s.is_absent_today).map((s) => s.id)));
        setStatus({ type: "idle", message: "" });
      } else {
        setStatus({ type: "error", message: "تعذّر تحميل بيانات القسم. تحقّق من الاتصال بالشبكة." });
      }
    }
  }

  function toggle(id) {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function markAllAbsent() {
    setAbsentIds(new Set(data.students.map((s) => s.id)));
  }

  function markAllPresent() {
    setAbsentIds(new Set());
  }

  async function loadGrades() {
    const { data: rows } = await api.get("/api/teacher/grades", { params: { term, subject: gradeSubject } });
    const next = {}; rows.forEach((r) => { next[r.student_id] = r; }); setGrades(next);
  }
  async function saveGrade(studentId) {
    const value = grades[studentId] || {};
    const payload = { student_id: studentId, term, subject: gradeSubject, continuous: value.continuous === "" ? null : Number(value.continuous), exam: value.exam === "" ? null : Number(value.exam), observation: value.observation || null };
    try {
      if (!isOnline) throw new Error("offline");
      await api.post("/api/teacher/grades", payload);
      setStatus({ type: "success", message: "تم حفظ النقطة كمسودة." });
    } catch (err) {
      if (!err.response) { await queueGradeSubmission(payload); registerGradeBackgroundSync(); setStatus({ type: "success", message: "لا يوجد اتصال — حُفظت النقطة محليًا وستُزامن تلقائيًا." }); }
      else setStatus({ type: "error", message: "تعذّر حفظ النقطة." });
    }
  }
  async function submitGrades() { await api.post("/api/teacher/grades/submit", { term, subject: gradeSubject }); setStatus({ type: "success", message: "تم إرسال دفتر النقاط إلى المدير للاعتماد." }); }

  async function submit() {
    const payload = {
      classroom_id: data.classroom.id,
      period: data.period,
      absent_student_ids: Array.from(absentIds),
    };

    setStatus({ type: "loading", message: "" });

    if (!isOnline) {
      await queueAbsenceSubmission(payload);
      registerBackgroundSync();
      await refreshPendingCount();
      setStatus({ type: "success", message: "لا يوجد اتصال حاليًا — تم حفظ الغيابات محليًا وستُرسَل تلقائيًا عند عودة الشبكة." });
      return;
    }

    try {
      await api.post("/api/teacher/submit-absences", payload);
      setStatus({ type: "success", message: "تم إرسال الغيابات بنجاح." });
    } catch (err) {
      if (!err.response) {
        // فشل بسبب الشبكة تحديدًا (لا رفض من الخادم) — نحفظ محليًا بدل فقدان العمل
        await queueAbsenceSubmission(payload);
        registerBackgroundSync();
        await refreshPendingCount();
        setStatus({ type: "success", message: "تعذّر الوصول للخادم — تم حفظ الغيابات محليًا وستُرسَل تلقائيًا عند عودة الاتصال." });
      } else {
        setStatus({ type: "error", message: "تعذّر الإرسال — سيتم الاحتفاظ باختياراتك، أعد المحاولة." });
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <TopBar accent="var(--teacher-accent)" title={LABELS.teacher} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        {mySchedule.length > 0 && <section style={teacherSchedule}><b>جدولي الأسبوعي</b>{mySchedule.map((s, i) => <div key={i} style={scheduleLine}><span>{["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس"][s.day]}</span><span>{s.period === "MORNING" ? "صباحية" : "مسائية"}</span><b>{s.subject || "حصة"}</b><span>{s.classroom}</span></div>)}</section>}
        {teacherProfile && <section style={teacherProfileCard}><b>{teacherProfile.full_name}</b><span>{teacherProfile.specialty || "أستاذ التعليم الابتدائي"}</span><small>{teacherProfile.service_type === "PART_TIME" ? "خدمة جزئية" : "خدمة كاملة"} · النصاب: {Math.round(teacherProfile.weekly_target_minutes / 60)} ساعة أسبوعيًا</small></section>}
        <button style={historyToggle} onClick={async()=>{setShowHistory(v=>!v); if(!history.length){const r=await api.get("/api/teacher/absence-history").catch(()=>({data:[]})); setHistory(r.data);}}}>{showHistory ? "إخفاء سجل الغياب" : "عرض سجل الغياب"}</button>
        {showHistory && <section style={historyPanel}><b>آخر الغيابات المسجلة</b>{history.length ? history.map((h,i)=><div key={i} style={historyLine}><span>{h.date}</span><span>{h.student}</span><small>{h.classroom} · {h.period === "MORNING" ? "صباحية" : "مسائية"}</small></div>) : <small>لا توجد سجلات متاحة.</small>}</section>}
        <div style={connectivityBar(isOnline)}>
          <span>{isOnline ? "🟢 متصل" : "🟠 غير متصل — سيُزامن لاحقًا"}</span>
          {pendingCount > 0 && <span style={pendingBadge}>{pendingCount} عملية بانتظار الإرسال</span>}
        </div>

        {fromCache && (
          <div style={banner("var(--warning-bg)", "var(--warning)")}>
            تعرض هذه القائمة آخر نسخة محفوظة محليًا (دون اتصال بالخادم حاليًا).
          </div>
        )}

        {status.type === "loading" && !data && <p style={{ textAlign: "center" }}>جارِ التحميل...</p>}
        {status.type === "error" && <div style={banner("var(--danger-bg)", "var(--danger)")}>{status.message}</div>}

        {data && !data.classroom && (
          <div style={banner("var(--warning-bg)", "var(--warning)")}>
            لا توجد حصة مسندة إليك في هذا التوقيت.
          </div>
        )}

        {data?.classroom && (
          <>
            <div style={classHeader}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>{data.classroom.name}</div>
                <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
                  {data.period === "MORNING" ? "الحصة الصباحية" : "الحصة المسائية"}
                  {data.subject && <div style={{ color: "var(--teacher-accent)", fontWeight: 800 }}>{data.subject}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={ghostBtn} onClick={() => { setShowGrades((v) => !v); if (!showGrades) loadGrades(); }}>دفتر النقاط</button>
                <button style={ghostBtn} onClick={markAllPresent}>الكل حاضر</button>
                <button style={ghostBtn} onClick={markAllAbsent}>الكل غائب</button>
              </div>
            </div>
            <div style={attendanceSummary}><span>إجمالي: <b>{data.students.length}</b></span><span style={{color:"var(--restaurant-accent)"}}>حاضر: <b>{data.students.length - absentIds.size}</b></span><span style={{color:"var(--danger)"}}>غائب: <b>{absentIds.size}</b></span></div>

            {showGrades && <section style={gradePanel}><div style={gradeToolbar}><select value={term} onChange={(e) => setTerm(e.target.value)}><option>الفصل الأول</option><option>الفصل الثاني</option><option>الفصل الثالث</option></select><input value={gradeSubject} onChange={(e) => setGradeSubject(e.target.value)} placeholder="اسم المادة" /><button style={ghostBtn} onClick={loadGrades}>تحميل</button><button style={gradeSubmit} onClick={submitGrades}>إرسال للاعتماد</button></div><p style={{ color: "var(--ink-soft)", fontSize: ".82rem" }}>النموذج مطابق لدفاتر الحجز الجزائرية: العلامات على 10، والملاحظات اختيارية.</p>{data.students.map((s) => <div style={gradeRow} key={s.id}><b>{s.full_name}</b><input type="number" min="0" max="10" step="0.25" placeholder="التقويم /10" value={grades[s.id]?.continuous ?? ""} onChange={(e) => setGrades({ ...grades, [s.id]: { ...grades[s.id], continuous: e.target.value } })} /><input type="number" min="0" max="10" step="0.25" placeholder="الاختبار /10" value={grades[s.id]?.exam ?? ""} onChange={(e) => setGrades({ ...grades, [s.id]: { ...grades[s.id], exam: e.target.value } })} /><input style={gradeNote} placeholder="ملاحظة تربوية" value={grades[s.id]?.observation ?? ""} onChange={(e) => setGrades({ ...grades, [s.id]: { ...grades[s.id], observation: e.target.value } })} /><button style={saveGradeBtn} onClick={() => saveGrade(s.id)}>حفظ</button></div>)}</section>}

            <input style={studentSearchInput} placeholder="ابحث باسم التلميذ أو الباركود..." value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {data.students.filter(s => `${s.full_name} ${s.barcode}`.toLowerCase().includes(studentSearch.toLowerCase())).map((s) => {
                const absent = absentIds.has(s.id);
                return (
                  <li key={s.id} style={studentRow(absent)}>
                    <span style={{ fontWeight: 600 }}>{s.full_name}</span>
                    <button
                      onClick={() => toggle(s.id)}
                      style={toggleBtn(absent)}
                      aria-pressed={absent}
                    >
                      {absent ? "غائب" : "حاضر"}
                    </button>
                  </li>
                );
              })}
            </ul>

            {status.type === "success" && <div style={banner("var(--success-bg)", "var(--restaurant-accent)")}>{status.message}</div>}

            <button style={submitBtn} onClick={submit} disabled={status.type === "loading"}>
              {status.type === "loading" ? "جارِ الإرسال..." : "إرسال الغيابات"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const banner = (bg, color) => ({
  background: bg,
  color,
  padding: "12px 14px",
  borderRadius: 8,
  margin: "12px 0",
  fontSize: "0.92rem",
});

const connectivityBar = (online) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  fontSize: "0.82rem",
  fontWeight: 700,
  color: online ? "var(--restaurant-accent)" : "var(--warning)",
  padding: "8px 4px",
});

const pendingBadge = {
  background: "var(--warning-bg)",
  color: "var(--warning)",
  borderRadius: 20,
  padding: "3px 10px",
  fontSize: "0.78rem",
};

const classHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 4px",
  borderBottom: "1px solid var(--line)",
  marginBottom: 8,
  flexWrap: "wrap",
  gap: 8,
};

const ghostBtn = {
  border: "1px solid var(--line)",
  background: "var(--surface)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: "0.82rem",
  cursor: "pointer",
};

const studentRow = (absent) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 12px",
  marginBottom: 8,
  borderRadius: 10,
  background: absent ? "var(--danger-bg)" : "var(--surface)",
  border: "1px solid var(--line)",
});

const toggleBtn = (absent) => ({
  border: "none",
  padding: "8px 18px",
  borderRadius: 20,
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
  color: "var(--surface)",
  background: absent ? "var(--danger)" : "var(--restaurant-accent)",
  minWidth: 74,
});

const submitBtn = {
  width: "100%",
  padding: "15px",
  background: "var(--teacher-accent)",
  color: "var(--surface)",
  border: "none",
  borderRadius: 10,
  fontSize: "1rem",
  fontWeight: 800,
  cursor: "pointer",
  margin: "20px 0 32px",
};

const gradePanel = { background: "var(--success-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginTop: 18 };
const gradeToolbar = { display: "flex", gap: 8, flexWrap: "wrap" };
const gradeRow = { display: "grid", gridTemplateColumns: "1fr 105px 105px minmax(120px,1fr) 55px", gap: 7, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line)" };
const gradeNote = { minWidth: 0, border: "1px solid var(--line)", borderRadius: 7, padding: "8px 6px", font: "inherit", fontSize: ".75rem" };
const saveGradeBtn = { border: 0, borderRadius: 7, padding: "8px 5px", background: "var(--teacher-accent)", color: "var(--surface)", cursor: "pointer" };
const gradeSubmit = { ...saveGradeBtn, background: "var(--brand)" };
const teacherSchedule = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 12, boxShadow: "var(--elevation-1)" };
const scheduleLine = { display: "grid", gridTemplateColumns: "1fr .8fr 1.4fr 1fr", gap: 6, padding: "7px 0", borderTop: "1px solid var(--line)", fontSize: ".76rem", marginTop: 7 };
const teacherProfileCard = { display: "flex", flexDirection: "column", gap: 4, background: "var(--success-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 12 }; 
const historyToggle = { border: "1px solid var(--line)", background: "var(--success-bg)", color: "var(--brand-deep)", borderRadius: 9, padding: "10px 12px", cursor: "pointer", fontWeight: 700, width: "100%" };
const historyPanel = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, margin: "10px 0 14px" };
const historyLine = { display: "grid", gridTemplateColumns: "90px 1fr 1fr", gap: 7, padding: "8px 0", borderTop: "1px solid var(--line)", fontSize: ".75rem", marginTop: 7 };
const attendanceSummary = { display: "flex", justifyContent: "space-around", padding: "10px 4px", margin: "8px 0", background: "var(--surface)", borderRadius: 10, fontSize: ".82rem" };
const studentSearchInput = { width: "100%", boxSizing: "border-box", padding: "11px 12px", margin: "8px 0 12px", border: "1px solid var(--line)", borderRadius: 9, font: "inherit" };
