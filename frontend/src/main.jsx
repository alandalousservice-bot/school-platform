import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./theme.css";
import "./theme-overrides.css";
import "./index.css";
import "./data-list.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// تسجيل Service Worker لدعم العمل دون اتصال (خصوصًا تطبيق الأستاذ داخل القسم)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // فشل التسجيل لا يجب أن يوقف التطبيق — العمل دون اتصال يصبح غير متاح فقط
    });
  });
}
