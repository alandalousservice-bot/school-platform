import axios from "axios";

// عنوان الخادم المحلي — عدّله ليطابق IP حاسوب الإدارة عند النشر الفعلي.
// ملاحظة: VITE_API_BASE="" (سلسلة فارغة) مقصودة عند النشر عبر Docker/nginx —
// تعني "استخدم مسارات نسبية على نفس الأصل" (nginx يمرّرها إلى backend)،
// لذا نستخدم ?? بدل || كي لا تُستبدل السلسلة الفارغة بالقيمة الافتراضية.
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// عند انتهاء صلاحية التوكن، نحاول تجديده مرة واحدة تلقائيًا قبل تسجيل خروج المستخدم
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
