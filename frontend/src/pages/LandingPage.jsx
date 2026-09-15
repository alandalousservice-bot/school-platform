import { useNavigate } from "react-router-dom";
import BrandSeal from "../components/ui/BrandSeal";
import Icon from "../components/ui/Icon";
import { SCHOOL_BRAND } from "../brand";

const features = [
  ["dashboard", "لوحة قيادة واحدة", "صورة يومية واضحة عن المؤسسة، الحضور، المطعم، والموارد."],
  ["students", "سجل مدرسي موحد", "ملفات التلاميذ والأقسام والنقاط في مسار منظم وسهل المراجعة."],
  ["budget", "ميزانية تحت السيطرة", "اعتمادات مرتبة، نفقات موثقة، ورصيد متبقٍ يظهر قبل اتخاذ القرار."],
];

const roles = [
  ["👩‍💼", "مدير المؤسسة", "إدارة شاملة وتقارير موثقة"],
  ["👨‍🏫", "الأستاذ", "غياب ونقاط دون تعقيد"],
  ["🍽️", "مشرف المطعم", "مسح سريع ومخزون محدث"],
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="index-page">
      <header className="index-header">
        <a className="index-brand" href="#top" aria-label="العودة إلى بداية الصفحة"><BrandSeal size={46} /><span><b>{SCHOOL_BRAND.institution}</b><small>{SCHOOL_BRAND.wilaya} · منصة الإدارة المدرسية</small></span></a>
        <nav className="index-nav" aria-label="التنقل الرئيسي"><a href="#features">المزايا</a><a href="#workflow">كيف تعمل</a><a href="#roles">المستخدمون</a></nav>
        <button className="index-login-button" onClick={() => navigate("/login")}>دخول المنصة <span aria-hidden="true">←</span></button>
      </header>

      <section className="index-hero" id="top">
        <div className="index-hero-copy"><span className="index-eyebrow"><i /> منصة رقمية هادئة لإدارة المدرسة</span><h1>إدارة أوضح.<br /><em>مدرسة أقوى.</em></h1><p>منصة واحدة تساعد فريق المؤسسة على تنظيم اليوم الدراسي، حماية البيانات، ومتابعة القرارات المهمة دون أوراق متفرقة أو معلومات مشتتة.</p><div className="index-actions"><button className="index-primary" onClick={() => navigate("/login")}>ابدأ من مساحة العمل <span>←</span></button><a className="index-text-link" href="#features">اكتشف المزايا <span>↓</span></a></div><div className="index-trust"><span className="trust-check">✓</span><span>صلاحيات حسب الدور</span><span className="trust-dot" /><span>سجل تدقيق للعمليات</span><span className="trust-dot" /><span>عمل محلي سريع</span></div></div>
        <div className="index-hero-visual"><div className="index-image-frame"><img src="/school-hero.png" alt="باحة مدرسة مضيئة" /><div className="image-caption"><span className="image-caption-icon"><Icon name="attendance" size={17} /></span><span><b>يوم دراسي منظم</b><small>كل ما تحتاجه الإدارة في متناولك</small></span><strong>●</strong></div></div><div className="hero-floating-card hero-floating-card-top"><span className="floating-icon"><Icon name="budget" size={18} /></span><span><small>تنفيذ الميزانية</small><b>28%</b></span><em>هذا الفصل</em></div><div className="hero-floating-card hero-floating-card-bottom"><span className="floating-avatars"><i>ي</i><i>س</i><i>أ</i></span><span><b>فريق المؤسسة</b><small>إدارة · أساتذة · مطعم</small></span></div></div>
      </section>

      <section className="index-stats" aria-label="ملخص المنصة"><div><strong>03</strong><span>مساحات عمل حسب الدور</span></div><div><strong>01</strong><span>سجل مدرسي موحد</span></div><div><strong>24/7</strong><span>بيانات متاحة محليًا</span></div><div><strong>100%</strong><span>واجهة عربية RTL</span></div></section>

      <section className="index-section" id="features"><div className="index-section-heading"><span className="index-eyebrow">مصممة لواقع المؤسسة</span><h2>كل قسم يخدم قرارًا واضحًا.</h2><p>بدل التنقل بين أدوات منفصلة، تجمع المنصة العمليات اليومية في تجربة واحدة مفهومة لكل عضو في الفريق.</p></div><div className="index-feature-grid">{features.map(([icon, title, text], index) => <article className="index-feature-card" key={title}><span className="feature-number">0{index + 1}</span><span className="feature-icon"><Icon name={icon} size={23} /></span><h3>{title}</h3><p>{text}</p><a href="#workflow">اعرف المزيد <span>←</span></a></article>)}</div></section>

      <section className="index-workflow" id="workflow"><div className="workflow-copy"><span className="index-eyebrow">من أول تسجيل إلى آخر تقرير</span><h2>تدفق بسيط،<br /><em>نتائج يمكن الوثوق بها.</em></h2><p>كل عملية تبدأ من المكان الصحيح وتنتهي بمعلومة يمكن الرجوع إليها. الغياب، النقاط، المخزون، والميزانية تعمل ضمن صلاحيات وسجل واضح.</p><button className="index-outline-button" onClick={() => navigate("/login")}>الدخول إلى المنصة <span>←</span></button></div><div className="workflow-steps"><div className="workflow-step"><span>01</span><div><b>سجّل</b><small>أدخل البيانات مرة واحدة وبشكل منظم.</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>02</span><div><b>تابع</b><small>راقب المؤشرات والتنبيهات التي تحتاج قرارًا.</small></div></div><div className="workflow-line" /><div className="workflow-step"><span>03</span><div><b>اعتمد</b><small>حوّل العمليات إلى تقارير موثقة قابلة للمراجعة.</small></div></div></div></section>

      <section className="index-roles" id="roles"><div className="index-section-heading"><span className="index-eyebrow">مساحات مختلفة، هدف واحد</span><h2>كل مستخدم يرى ما يحتاجه فقط.</h2></div><div className="index-role-grid">{roles.map(([emoji, title, text]) => <div className="index-role-card" key={title}><span>{emoji}</span><div><b>{title}</b><small>{text}</small></div><i>↗</i></div>)}</div></section>

      <section className="index-cta"><div><span className="index-eyebrow">ابدأ بخطوة واحدة</span><h2>اجعل يوم المدرسة أكثر هدوءًا.</h2><p>سجّل الدخول للوصول إلى مساحة العمل الخاصة بك.</p></div><button className="index-primary index-cta-button" onClick={() => navigate("/login")}>فتح مساحة العمل <span>←</span></button></section>

      <footer className="index-footer"><div className="index-brand"><BrandSeal size={38} /><span><b>{SCHOOL_BRAND.institution}</b><small>{SCHOOL_BRAND.republic}</small></span></div><span>© {new Date().getFullYear()} · {SCHOOL_BRAND.ministry}</span></footer>
    </main>
  );
}
