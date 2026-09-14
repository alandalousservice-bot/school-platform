import Icon from "./Icon";

/** Toast: type (success/error/info), message, onClose. */
export default function Toast({ type = "info", message, onClose }) {
  if (!message) return null;
  const icon = type === "success" ? "attendance" : type === "error" ? "empty" : "dashboard";
  return <button className={`ui-toast ui-toast-${type}`} onClick={onClose} role="status"><Icon name={icon} size={18} /><span>{message}</span></button>;
}
