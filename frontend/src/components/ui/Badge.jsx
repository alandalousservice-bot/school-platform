/** Badge props: variant success|warning|danger|info|online|offline|draft|submitted|approved, children. */
const labels = { success: "نجاح", warning: "تنبيه", danger: "خطر", info: "معلومة", online: "متصل", offline: "غير متصل", draft: "مسودة", submitted: "بانتظار الاعتماد", approved: "معتمد" };
export default function Badge({ variant = "info", children }) {
  return <span className={`ui-badge ui-badge-${variant}`}><i aria-hidden="true" />{children ?? labels[variant] ?? variant}</span>;
}
