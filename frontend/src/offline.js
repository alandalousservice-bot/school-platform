// أدوات العمل دون اتصال (Offline-first) لتطبيق الأستاذ.
// عند فشل إرسال الغيابات بسبب انقطاع الشبكة، تُخزَّن العملية في IndexedDB
// (تصمد بعد إغلاق المتصفح، بخلاف الذاكرة العادية) ثم تُزامَن تلقائيًا عند
// عودة الاتصال أو عند استلام إشارة Background Sync من الـ Service Worker.

const DB_NAME = "school-offline";
const DB_VERSION = 2;
const STORE = "pending-absences";
const GRADE_STORE = "pending-grades";
const SNAPSHOT_KEY = "teacher_last_class_snapshot";

function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB غير مدعوم في هذا المتصفح"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(GRADE_STORE)) {
        db.createObjectStore(GRADE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueAbsenceSubmission(payload) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add({ payload, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingSubmissions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function countPendingSubmissions() {
  try {
    const rows = await getPendingSubmissions();
    return rows.length;
  } catch {
    return 0;
  }
}

async function removePendingSubmission(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * يحاول إرسال كل العمليات المعلّقة عبر api المُمرَّر.
 * يتوقف فورًا عند أول خطأ شبكة حقيقي (لا يوجد رد من الخادم) كي يُعاد
 * ترتيب المحاولة لاحقًا، لكنه يتجاوز (ويحذف) أي عملية رفضها الخادم صراحة
 * (400/401...) لتفادي محاولة إعادة إرسال فاشلة إلى الأبد.
 */
export async function syncPendingSubmissions(api) {
  let pending;
  try {
    pending = await getPendingSubmissions();
  } catch {
    return { synced: 0, remaining: 0 };
  }

  let synced = 0;
  for (const item of pending.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      await api.post("/api/teacher/submit-absences", item.payload);
      await removePendingSubmission(item.id);
      synced++;
    } catch (err) {
      if (!err.response) break; // خطأ شبكة — نتوقف ونحاول لاحقًا
      await removePendingSubmission(item.id); // مرفوض من الخادم — لا فائدة من إعادة المحاولة
    }
  }

  const remaining = await countPendingSubmissions();
  return { synced, remaining };
}

// نسخة محلية من آخر قائمة قسم معروفة، لعرضها إن تعذّر تحميلها من الخادم دون اتصال
export function cacheClassSnapshot(data) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // تجاهل أخطاء التخزين (مثلاً القرص ممتلئ) — الميزة اختيارية وليست حرجة
  }
}

export function readClassSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      if ("sync" in reg) return reg.sync.register("sync-absences");
    })
    .catch(() => {
      // المتصفح لا يدعم Background Sync — لا مشكلة، سنعتمد على حدث "online" كبديل
    });
}

export function registerGradeBackgroundSync() {
  if (!navigator.serviceWorker) return;
  navigator.serviceWorker.ready.then(reg => reg.sync?.register("sync-grades")).catch(() => {});
}

export async function queueGradeSubmission(payload) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GRADE_STORE, "readwrite");
    tx.objectStore(GRADE_STORE).add({ payload, createdAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncPendingGradeSubmissions(api) {
  const db = await openDb();
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(GRADE_STORE, "readonly");
    const req = tx.objectStore(GRADE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  let synced = 0;
  for (const item of rows.sort((a, b) => a.createdAt - b.createdAt)) {
    try {
      await api.post("/api/teacher/grades", item.payload);
      await new Promise((resolve, reject) => {
        const tx = db.transaction(GRADE_STORE, "readwrite");
        tx.objectStore(GRADE_STORE).delete(item.id);
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
      synced++;
    } catch (err) { if (!err.response) break; }
  }
  const remaining = await new Promise(resolve => {
    const tx = db.transaction(GRADE_STORE, "readonly"); const req = tx.objectStore(GRADE_STORE).count();
    req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(0);
  });
  return { synced, remaining };
}
