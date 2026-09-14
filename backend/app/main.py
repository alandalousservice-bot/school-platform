from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import models  # noqa: F401  يضمن تسجيل كل النماذج قبل create_all
from app.routers import auth, teacher, restaurant, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="منصة الإدارة المدرسية والمطعم",
    description="واجهة برمجية محلية (Intranet) لإدارة الغيابات والمطعم المدرسي",
    version="2.0.0",
)

# في الإنتاج على الشبكة المحلية يُستحسن حصر origins بعنوان IP الحقيقي للخادم
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(teacher.router)
app.include_router(restaurant.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "الخادم يعمل بشكل طبيعي"}
