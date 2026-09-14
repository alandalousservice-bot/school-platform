import { useEffect, useRef, useState } from "react";
import api from "../api";
import TopBar from "../components/TopBar";
import { LABELS } from "../labels";

const FEEDBACK = {
  success: { bg: "var(--restaurant-accent)", label: "تم بنجاح" },
  already_taken: { bg: "var(--warning)", label: "أُخذت مسبقًا" },
  absent_warning: { bg: "var(--warning)", label: "تنبيه غياب" },
  not_found: { bg: "var(--danger)", label: "غير موجود" },
};

export default function RestaurantScanner() {
  const [barcode, setBarcode] = useState("");
  const period = "LUNCH";
  const [feedback, setFeedback] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [feedback]);

  function announce(result) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = result.status === "success" ? 880 : 220; gain.gain.value = 0.06;
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  useEffect(() => {
    const heartbeat = () => api.post("/api/auth/heartbeat").catch(() => {});
    heartbeat();
    const timer = setInterval(heartbeat, 30000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!barcode.trim()) return;
    try {
      const { data } = await api.post("/api/restaurant/scan-meal", { barcode: barcode.trim(), period });
      setFeedback(data); announce(data);
    } catch {
      const result = { status: "not_found", message: "تعذّر الاتصال بالخادم", student_name: null }; setFeedback(result); announce(result);
    }
    setBarcode("");
  }

  const f = feedback ? FEEDBACK[feedback.status] : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <TopBar accent="var(--restaurant-accent)" title={LABELS.restaurant} />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>
        <div style={periodRow}>
          {["LUNCH"].map((p) => (
            <button
              key={p}
              style={periodBtn(period === p)}
            >
              {p === "BREAKFAST" ? "الفطور" : "الغداء"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="امسح أو أدخل رمز التلميذ"
            style={scanInput}
            autoFocus
          />
        </form>

        <div style={feedbackPanel(f)}>
          {feedback ? (
            <>
              <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>{f.label}</div>
              {feedback.student_name && <div style={{ fontSize: "1.1rem", marginTop: 6 }}>{feedback.student_name}</div>}
              <div style={{ marginTop: 8, fontSize: "0.95rem", opacity: 0.95 }}>{feedback.message}</div>
            </>
          ) : (
            <div style={{ color: "var(--ink-soft)" }}>في انتظار المسح الأول...</div>
          )}
        </div>
      </div>
    </div>
  );
}

const periodRow = { display: "flex", gap: 10, marginBottom: 18 };

const periodBtn = (active) => ({
  flex: 1,
  padding: "10px",
  borderRadius: 8,
  border: active ? "2px solid var(--restaurant-accent)" : "1px solid var(--line)",
  background: active ? "#EAF6EE" : "var(--surface)",
  fontWeight: 700,
  cursor: "pointer",
});

const scanInput = {
  width: "100%",
  padding: "18px 16px",
  fontSize: "1.2rem",
  borderRadius: 10,
  border: "2px solid var(--line)",
  textAlign: "center",
  marginBottom: 20,
};

const feedbackPanel = (f) => ({
  minHeight: 160,
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 24,
  background: f ? f.bg : "var(--surface)",
  color: f ? "#fff" : "var(--ink-soft)",
  border: f ? "none" : "1px dashed var(--line)",
  transition: "background 120ms ease",
});
