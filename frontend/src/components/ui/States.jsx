import Icon from "./Icon";

/** EmptyState: iconName (school-icons.svg symbol), title, message. */
export function LoadingState({ message = "جارِ التحميل..." }) { return <div className="ui-state ui-state-loading" role="status"><span className="ui-spinner" />{message}</div>; }
export function EmptyState({ iconName = "dashboard", title = "لا توجد بيانات", message }) { return <div className="ui-state ui-state-empty"><span className="ui-empty-icon" aria-hidden="true"><Icon name={iconName} size={28} /></span><b>{title}</b>{message && <small>{message}</small>}</div>; }
/** ErrorState props: message. */
export function ErrorState({ message = "حدث خطأ غير متوقع" }) { return <div className="ui-state ui-state-error" role="alert"><Icon name="empty" size={24} /><b>تعذر إكمال العملية</b><span>{message}</span></div>; }
