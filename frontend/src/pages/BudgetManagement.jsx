import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../components/ui/Icon";
import Toast from "../components/ui/Toast";

const CATEGORY_OPTIONS = [
  ["OPERATING", "التسيير اليومي"],
  ["CANTEEN", "المطعم المدرسي"],
  ["EQUIPMENT", "التجهيزات"],
  ["MAINTENANCE", "الصيانة والإصلاح"],
  ["ACTIVITIES", "الأنشطة التربوية"],
  ["EMERGENCY", "الطوارئ"],
];

const EMPTY_FORM = { title: "", category: "OPERATING", allocated_amount: "", notes: "" };

function money(value) {
  return new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function percent(value) {
  return `${Math.min(100, Math.max(0, Number(value || 0))).toFixed(0)}%`;
}

export default function BudgetManagement() {
  const [schoolYear, setSchoolYear] = useState("2026/2027");
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expense, setExpense] = useState({ lineId: null, amount: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/budget/summary", { params: { school_year: schoolYear } });
      setSummary(data);
      setError("");
    } catch {
      setError("تعذّر تحميل الخطة المالية. تحقق من اتصال الخادم.");
    } finally {
      setLoading(false);
    }
  }, [schoolYear]);

  // إعادة تحميل الملخص عند تغيير السنة الدراسية؛ الاستثناء مقصود لمزامنة الخادم.
  // oxlint-disable-next-line react(set-state-in-effect)
  useEffect(() => { load(); }, [load]);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  async function addLine(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/admin/budget/lines", { ...form, school_year: schoolYear, allocated_amount: Number(form.allocated_amount) });
      setForm(EMPTY_FORM);
      notify("تمت إضافة بند جديد إلى الخطة المالية");
      await load();
    } catch (requestError) {
      notify(requestError.response?.data?.detail || "تعذّرت إضافة البند", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addExpense(event) {
    event.preventDefault();
    if (!expense.lineId) return;
    setSaving(true);
    try {
      await api.post(`/api/admin/budget/lines/${expense.lineId}/expense`, { amount: Number(expense.amount), description: expense.description });
      setExpense({ lineId: null, amount: "", description: "" });
      notify("تم تسجيل النفقة وتحديث الرصيد المتبقي");
      await load();
    } catch (requestError) {
      notify(requestError.response?.data?.detail || "تعذّر تسجيل النفقة", "error");
    } finally {
      setSaving(false);
    }
  }

  const totals = summary?.totals || { allocated: 0, spent: 0, remaining: 0, utilization: 0 };
  const activeLines = useMemo(() => summary?.lines?.filter(line => line.status === "ACTIVE") || [], [summary]);

  return (
    <section className="budget-page">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="budget-hero">
        <div>
          <span className="eyebrow">الإدارة المالية</span>
          <h1>الميزانية والاعتمادات</h1>
          <p>نظّم الاعتمادات حسب المحور، وسجّل كل نفقة مع وصف واضح حتى تبقى الصورة المالية قابلة للمراجعة.</p>
        </div>
        <label className="year-selector">
          <span>السنة الدراسية</span>
          <input value={schoolYear} onChange={event => setSchoolYear(event.target.value)} aria-label="السنة الدراسية" />
        </label>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && !summary ? <div className="budget-loading">جارِ تجهيز لوحة الميزانية...</div> : (
        <>
          <div className="budget-kpis">
            <article className="budget-kpi budget-kpi-primary"><span className="kpi-icon"><Icon name="dashboard" size={20} /></span><div><small>إجمالي الاعتماد</small><strong>{money(totals.allocated)} <em>دج</em></strong></div></article>
            <article className="budget-kpi"><span className="kpi-icon"><Icon name="inventory" size={20} /></span><div><small>المصروف فعليًا</small><strong>{money(totals.spent)} <em>دج</em></strong></div></article>
            <article className="budget-kpi"><span className="kpi-icon"><Icon name="schedule" size={20} /></span><div><small>المتبقي</small><strong className={totals.remaining < 0 ? "danger-text" : "good-text"}>{money(totals.remaining)} <em>دج</em></strong></div></article>
            <article className="budget-kpi"><span className="kpi-icon"><Icon name="attendance" size={20} /></span><div><small>نسبة التنفيذ</small><strong>{percent(totals.utilization)}</strong></div></article>
          </div>

          <div className="budget-layout">
            <form className="panel budget-form" onSubmit={addLine}>
              <div className="panel-head"><div><h2>إضافة اعتماد</h2><small>أنشئ بندًا واضحًا قبل تسجيل أي صرف.</small></div><span className="form-step">01</span></div>
              <label>اسم البند<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="مثال: صيانة دورات المياه" /></label>
              <label>المحور<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{CATEGORY_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>المبلغ المرصود <span className="field-hint">بالدينار الجزائري</span><input required min="0" type="number" value={form.allocated_amount} onChange={event => setForm({ ...form, allocated_amount: event.target.value })} placeholder="0" /></label>
              <label>ملاحظة <span className="field-hint">اختياري</span><textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} placeholder="مصدر التمويل أو ملاحظات المتابعة" rows="3" /></label>
              <button className="primary budget-submit" disabled={saving}>{saving ? "جارِ الحفظ..." : "حفظ الاعتماد"}</button>
            </form>

            <section className="panel budget-distribution">
              <div className="panel-head"><div><h2>توزيع الاعتمادات</h2><small>قراءة سريعة حسب محاور الإنفاق</small></div><span className="count">{summary?.categories?.length || 0} محاور</span></div>
              {summary?.categories?.length ? summary.categories.map(category => {
                const ratio = category.allocated ? category.spent / category.allocated * 100 : 0;
                return <div className="budget-category" key={category.category}><div className="budget-category-head"><b>{category.label}</b><span>{money(category.spent)} / {money(category.allocated)} دج</span></div><div className="budget-progress"><i style={{ width: `${Math.min(100, ratio)}%` }} /></div><small>{percent(ratio)} مستهلك · المتبقي {money(category.remaining)} دج</small></div>;
              }) : <div className="budget-empty"><Icon name="dashboard" size={26} /><b>لم تُسجّل اعتمادات بعد</b><span>ابدأ بإضافة أول بند من النموذج.</span></div>}
            </section>
          </div>

          <section className="panel budget-lines-panel">
            <div className="panel-head"><div><h2>سجل الاعتمادات</h2><small>كل بند له سقف إنفاق مستقل لتفادي التجاوز.</small></div><span className="count">{summary?.lines?.length || 0} بند</span></div>
            {summary?.lines?.length ? <div className="budget-lines-table"><div className="budget-table-row budget-table-head"><span>البند والمحور</span><span>الاعتماد</span><span>المصروف</span><span>المتبقي</span><span>الإجراء</span></div>{summary.lines.map(line => <div className="budget-table-row" key={line.id}><div><b>{line.title}</b><small>{line.category_label}{line.notes ? ` · ${line.notes}` : ""}</small></div><strong>{money(line.allocated_amount)} دج</strong><span>{money(line.spent_amount)} دج</span><strong className={line.remaining_amount < 0 ? "danger-text" : "good-text"}>{money(line.remaining_amount)} دج</strong><button className="outline" onClick={() => setExpense({ lineId: line.id, amount: "", description: "" })}>تسجيل صرف</button></div>)}</div> : <div className="budget-empty budget-empty-wide"><Icon name="inventory" size={30} /><b>السجل فارغ حاليًا</b><span>أضف اعتمادًا من النموذج أعلاه لتنظيم الميزانية.</span></div>}
          </section>

          <div className="budget-bottom-grid">
            <section className="panel budget-expense-panel">
              <div className="panel-head"><div><h2>تسجيل نفقة</h2><small>لا يمكن تجاوز سقف البند المرصود.</small></div><span className="form-step">02</span></div>
              <form onSubmit={addExpense}>
                <label>البند<select required value={expense.lineId || ""} onChange={event => setExpense({ ...expense, lineId: Number(event.target.value) || null })}><option value="">اختر بندًا</option>{activeLines.map(line => <option value={line.id} key={line.id}>{line.title} · متبقٍ {money(line.remaining_amount)} دج</option>)}</select></label>
                <label>قيمة النفقة<input required min="1" type="number" value={expense.amount} onChange={event => setExpense({ ...expense, amount: event.target.value })} placeholder="0" /></label>
                <label>وصف النفقة<textarea required rows="2" value={expense.description} onChange={event => setExpense({ ...expense, description: event.target.value })} placeholder="مثال: فاتورة رقم 2026/14" /></label>
                <button className="primary" disabled={saving || !expense.lineId}>{saving ? "جارِ التسجيل..." : "تسجيل النفقة"}</button>
              </form>
            </section>
            <section className="panel budget-transactions">
              <div className="panel-head"><div><h2>آخر الحركات</h2><small>سجل آخر عمليات الصرف</small></div></div>
              {summary?.transactions?.length ? summary.transactions.map(transaction => <div className="transaction-row" key={transaction.id}><span className="transaction-icon">↙</span><div><b>{transaction.description}</b><small>{transaction.title} · {transaction.created_at?.slice(0, 10)}</small></div><strong>- {money(transaction.amount)} دج</strong></div>) : <p className="muted">لا توجد حركات مالية بعد.</p>}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
