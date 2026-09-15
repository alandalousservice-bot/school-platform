import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import BrandSeal from "../components/ui/BrandSeal";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import { SCHOOL_BRAND } from "../brand";

const ROLE_ROUTES = {
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  RESTAURANT_MANAGER: "/restaurant",
};

const highlights = [
  ["attendance", "الحضور والغياب", "متابعة يومية واضحة حسب القسم والفترة"],
  ["students", "ملفات التلاميذ", "سجل موحد وآمن يسهل الوصول إليه"],
  ["dashboard", "الإدارة والميزانية", "قرارات مبنية على مؤشرات وتقارير موثقة"],
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { username, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("full_name", data.full_name);
      localStorage.setItem("user_id", data.user_id);
      navigate(ROLE_ROUTES[data.role] || "/");
    } catch {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <section className="login-showcase">
        <div className="login-brand-lockup"><BrandSeal size={58} /><div><b>{SCHOOL_BRAND.institution}</b><small>{SCHOOL_BRAND.wilaya} · {SCHOOL_BRAND.ministry}</small></div></div>
        <div className="login-intro"><span className="login-kicker">منصة الإدارة المدرسية</span><h1>كل تفاصيل المدرسة،<br /><em>في مكان واحد.</em></h1><p>مساحة عمل هادئة ومنظمة تساعد فريق المؤسسة على المتابعة، التعاون، واتخاذ القرار بثقة.</p></div>
        <div className="login-highlights">{highlights.map(([icon, title, text]) => <div className="login-highlight" key={title}><span><Icon name={icon} size={18} /></span><div><b>{title}</b><small>{text}</small></div></div>)}</div>
        <div className="login-quote">« التنظيم الجيد يترك وقتًا أكبر لما يهم: تعليم أبنائنا »</div>
      </section>

      <section className="login-card-wrap">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-mark"><BrandSeal size={48} /></div>
          <span className="login-card-kicker">مرحبًا بعودتك</span>
          <h2>تسجيل الدخول</h2>
          <p className="login-card-subtitle">أدخل بيانات حسابك للوصول إلى مساحة العمل.</p>
          <label>اسم المستخدم<input value={username} onChange={event => setUsername(event.target.value)} autoFocus required autoComplete="username" placeholder="أدخل اسم المستخدم" /></label>
          <label>كلمة المرور<input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" placeholder="أدخل كلمة المرور" /></label>
          {error && <div className="login-error" role="alert"><Icon name="empty" size={17} />{error}</div>}
          <Button className="login-button" style={{ width: "100%", marginTop: 8 }} disabled={loading}>{loading ? "جارِ التحقق..." : "الدخول إلى المنصة"}<span aria-hidden="true">←</span></Button>
          <div className="login-security"><span>●</span> اتصال محلي آمن · صلاحيات حسب الدور</div>
          <button type="button" className="login-home-link" onClick={() => navigate("/")}>← العودة إلى الصفحة الرئيسية</button>
        </form>
        <small className="login-footer">{SCHOOL_BRAND.republic} · {SCHOOL_BRAND.ministry}</small>
      </section>
    </main>
  );
}
