import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const ROLE_ROUTES = {
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  RESTAURANT_MANAGER: "/restaurant",
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { username, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("full_name", data.full_name);
      navigate(ROLE_ROUTES[data.role] || "/");
    } catch {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>منصة المدرسة</h1>
        <p style={styles.subtitle}>الدخول إلى الحساب</p>

        <label style={styles.label}>اسم المستخدم</label>
        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />

        <label style={styles.label}>كلمة المرور</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.button} disabled={loading}>
          {loading ? "جارِ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--brand)",
  },
  card: {
    background: "var(--surface)",
    padding: "40px 36px",
    borderRadius: "var(--radius)",
    width: "min(90vw, 380px)",
    boxShadow: "0 8px 30px rgba(20,33,61,0.25)",
  },
  title: { margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "var(--brand)" },
  subtitle: { margin: "4px 0 28px", color: "var(--ink-soft)" },
  label: { display: "block", fontSize: "0.9rem", marginBottom: 6, color: "var(--ink-soft)" },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 18,
    border: "1px solid var(--line)",
    borderRadius: 8,
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  button: {
    width: "100%",
    padding: "13px",
    background: "var(--brand)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    background: "var(--danger-bg)",
    color: "var(--danger)",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: "0.9rem",
    marginBottom: 16,
  },
};
