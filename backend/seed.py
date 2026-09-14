"""
تعبئة بيانات تجريبية لتجربة المنصة مباشرة بعد التشغيل.
التشغيل: python seed.py
"""
from datetime import date

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.models import (
    User, Role, Classroom, Student, Schedule, AbsencePeriod,
    InventoryItem, DailyMeal, MealPeriod,
)

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(User).first():
    print("توجد بيانات مسبقًا — تم تجاوز التعبئة.")
else:
    admin = User(username="admin", password_hash=hash_password("admin123"), role=Role.ADMIN, full_name="مدير المدرسة")
    teacher = User(username="teacher1", password_hash=hash_password("teacher123"), role=Role.TEACHER, full_name="الأستاذ أحمد")
    restaurant = User(username="restaurant1", password_hash=hash_password("resto123"), role=Role.RESTAURANT_MANAGER, full_name="مشرف المطعم")
    db.add_all([admin, teacher, restaurant])
    db.commit()

    classroom = Classroom(name="السنة الخامسة أ")
    db.add(classroom)
    db.commit()

    students = [
        Student(barcode=f"100000{i}", full_name=name, classroom_id=classroom.id)
        for i, name in enumerate(["ياسين بلقاسم", "سارة عمراني", "محمد شريف", "أمينة بوزيد", "كريم حداد"], start=1)
    ]
    db.add_all(students)

    weekday_today = date.today().weekday()
    db.add(Schedule(teacher_id=teacher.id, classroom_id=classroom.id, day_of_week=weekday_today, period=AbsencePeriod.MORNING))
    db.add(Schedule(teacher_id=teacher.id, classroom_id=classroom.id, day_of_week=weekday_today, period=AbsencePeriod.AFTERNOON))

    db.add_all([
        InventoryItem(name="عدس", quantity=40, unit="كغ", low_stock_threshold=10),
        InventoryItem(name="أرز", quantity=8, unit="كغ", low_stock_threshold=10),
        InventoryItem(name="زيت", quantity=15, unit="لتر", low_stock_threshold=5),
    ])

    db.add(DailyMeal(date=date.today(), period=MealPeriod.LUNCH, description="عدس بالخضر وأرز"))

    db.commit()
    print("تمت تعبئة البيانات التجريبية بنجاح.")
    print("admin / admin123")
    print("teacher1 / teacher123")
    print("restaurant1 / resto123")

db.close()
