import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Icon from "../components/ui/Icon";
import BrandSeal from "../components/ui/BrandSeal";
import Toast from "../components/ui/Toast";
import DataList from "../components/ui/DataList";
import FileDropzone from "../components/ui/FileDropzone";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";

const colors = [["--brand", "الهوية الأساسية"], ["--brand-deep", "العناوين الداكنة"], ["--warning", "التنبيه"], ["--danger", "الخطر"], ["--paper", "الخلفية الورقية"], ["--surface", "السطح"], ["--ink", "النص الأساسي"], ["--ink-soft", "النص الثانوي"], ["--line", "الفواصل"]];
const icons = ["dashboard", "attendance", "students", "grades", "schedule", "inventory", "users", "empty"];

export default function DesignSystem() {
  return <main className="design-system-page"><header className="design-system-header"><BrandSeal /><div><span className="eyebrow">مرجع الفريق الداخلي</span><h1>فهرس نظام التصميم</h1><p>مكوّنات وهوية منصة إدارة المدرسة.</p></div></header>
    <section className="design-section"><h2>الألوان</h2><div className="color-grid">{colors.map(([name, use]) => <div className="color-swatch" key={name}><i style={{ background: `var(${name})` }} /><b>{name}</b><small>{use}</small></div>)}</div></section>
    <section className="design-section"><h2>الأزرار والشارات</h2><div className="component-row"><Button>إجراء أساسي</Button><Button variant="secondary">إجراء ثانوي</Button><Button variant="danger">حذف</Button><Button disabled>معطّل</Button></div><div className="component-row">{["success", "warning", "danger", "info", "online", "offline", "draft", "submitted", "approved"].map(v => <Badge variant={v} key={v} />)}</div></section>
    <section className="design-section"><h2>البطاقات والحالات</h2><Card><h3>بطاقة نموذجية</h3><p>محتوى بطاقة موحد ومتجاوب.</p></Card><LoadingState message="مثال حالة التحميل" /><EmptyState iconName="empty" title="لا توجد عناصر" message="تظهر هنا البيانات عند توفرها." /><ErrorState message="مثال لحالة الخطأ" /></section>
    <section className="design-section"><h2>الأيقونات المحلية</h2><div className="icon-grid">{icons.map(name => <div key={name}><Icon name={name} size={28} /><small>{name}</small></div>)}</div></section>
    <section className="design-section"><h2>الإشعار المؤقت</h2><Toast type="info" message="مثال إشعار معلومات" onClose={() => {}} /></section><section className="design-section"><h2>قالب عرض البيانات</h2><DataList columns={[{ key: "name", label: "الاسم", sortable: true }, { key: "status", label: "الحالة", render: value => <Badge variant="online">{value}</Badge> }]} data={[{ id: 1, name: "قسم السنة الأولى", status: "متصل" }, { id: 2, name: "قسم السنة الثانية", status: "متصل" }]} /></section>
    <section className="design-section"><h2>رفع الملفات</h2><FileDropzone onChange={() => {}} /></section>
  </main>;
}
