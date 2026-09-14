// Service Worker — يدعم العمل دون اتصال في المنصة، وخصوصًا تطبيق الأستاذ
// الذي يعمل عبر Wi-Fi داخلي عرضة للانقطاع المؤقت.
//
// المبدأ:
// - يخزّن "قشرة" التطبيق (App Shell: HTML/JS/CSS) في الكاش عند أول تحميل،
//   كي تفتح الواجهة حتى لو انقطعت الشبكة تمامًا.
// - لا يتدخّل إطلاقًا في طلبات /api/ — تلك بيانات حيّة (قائمة القسم، حالة
//   الغياب...) يجب أن تُقرأ من الخادم مباشرة عند توفر الاتصال؛ التخزين
//   المؤقت لها يُدار داخل التطبيق نفسه عبر IndexedDB (انظر src/offline.js)
//   حتى تبقى دائمًا واعية بحالة المزامنة الفعلية بدل الاعتماد على كاش صامت.
// - يرسل إشارة لصفحات التطبيق المفتوحة عند توفر Background Sync كي تُحاول
//   مزامنة العمليات المعلَّقة فورًا بدل انتظار إعادة تحميل يدوية.

const CACHE_NAME = "school-app-shell-v2";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // فشل التخزين المسبق (مثلاً أول تشغيل دون اتصال) — لا مشكلة، سيُخزَّن
        // كل ملف تدريجيًا أول مرة يُطلب فيها بنجاح عبر معالج fetch أدناه.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // لا نخزّن أو نعترض طلبات API مطلقًا — يجب أن تصل للخادم مباشرة أو تفشل
  // بوضوح كي يتعامل التطبيق مع الفشل عبر طابور IndexedDB.
  if (url.pathname.startsWith("/api/")) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Background Sync — مدعومة في متصفحات Chromium (Chrome/Edge)، غير مدعومة
// في Safari/Firefox حاليًا؛ التطبيق يعتمد أيضًا على حدث "online" كبديل شامل.
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-absences") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((c) => c.postMessage({ type: "SYNC_ABSENCES" }));
      })
    );
  }
  if (event.tag === "sync-grades") {
    event.waitUntil(self.clients.matchAll().then((clients) => clients.forEach((c) => c.postMessage({ type: "SYNC_GRADES" }))));
  }
});
