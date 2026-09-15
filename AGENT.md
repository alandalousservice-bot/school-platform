# منصة تسيير المدرسة الابتدائية

## نظرة عامة

منصة محلية ومتجاوبة لإدارة المدرسة الابتدائية والمطعم المدرسي في الجزائر. تتكون من واجهة React/Vite وخادم FastAPI وقاعدة SQLite محلية، وتدعم أدوار المدير والأستاذ ومشرف المطعم والعمل دون اتصال للأستاذ.

## بنية المشروع

- `frontend/`: تطبيق React وملفات الهوية ونظام التصميم.
- `frontend/src/pages/`: شاشات المدير والأستاذ والمطعم وتسجيل الدخول.
- `frontend/src/components/ui/`: مكوّنات الواجهة المشتركة.
- `frontend/public/`: Service Worker وسبرايت SVG المحلي.
- `backend/app/`: FastAPI والنماذج والمخططات والمسارات.
- `backend/school.db`: قاعدة البيانات المحلية، لا تُضاف إلى Git.

## أوامر التطوير

```powershell
# الواجهة
cd frontend
npm install
npm run dev -- --host 0.0.0.0
npm run build

# الخادم
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
.\venv\Scripts\python.exe -m compileall -q app
```

## قواعد البرمجة

- حافظ على اتجاه RTL وخط Tajawal وهوية المؤسسة الرسمية.
- استخدم متغيرات `theme.css` بدل ألوان HEX داخل JSX.
- استخدم مكوّنات `frontend/src/components/ui/` بدل أزرار أو بطاقات خام جديدة.
- استخدم الأيقونات من `frontend/public/school-icons.svg` فقط، ولا تضف إيموجي كأيقونات وظيفية.
- لا تغيّر مسارات API أو صلاحيات الأدوار عند تعديل بصري فقط.
- اجعل الواجهة متجاوبة مع الهاتف واللوحي والحاسوب.

## الاختبار قبل الحفظ والرفع

- شغّل `npm run build` من `frontend`.
- شغّل فحص `compileall` من `backend`.
- راجع `git diff` و`git status` قبل commit.
- لا تستخدم `git push --force` على الفرع الرئيسي.

## الأمان والبيانات

- لا تضع كلمات مرور أو مفاتيح API أو أسرارًا في المستودع.
- لا تشغّل migrations أو seed أو عمليات استيراد على بيانات المستخدم دون طلب صريح.
- احترم RBAC: المدير، الأستاذ، ومشرف المطعم.
- لا تغيّر بيانات الغياب أو النقاط أو المخزون أثناء تعديل الواجهة.

## الهوية البصرية

الألوان الرسمية معرفة مركزيًا في `frontend/src/theme.css`، والختم المحلي في `BrandSeal`. استخدم مكوّنات `Button`, `Card`, `Badge`, `Icon`, `DataList`, `Toast`, و`States` قبل إنشاء بديل جديد.
