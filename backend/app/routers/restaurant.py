from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_roles, log_action
from app.database import get_db
from app.models.models import (
    Student, DailyMeal, MealConsumption, Absence, InventoryItem,
    InventoryMovement, User, MealPeriod,
)
from app.schemas.schemas import (
    ScanMealRequest, ScanMealResponse, InventoryMovementRequest, InventoryItemOut,
)

router = APIRouter(prefix="/api/restaurant", tags=["المطعم"])

@router.post("/meals/{meal_id}/prepare")
def prepare_meal(meal_id: int, payload: dict, current_user: User = Depends(require_roles("RESTAURANT_MANAGER", "ADMIN")), db: Session = Depends(get_db)):
    """تسجيل استهلاك مادة أثناء إعداد وجبة مع حركة مخزون قابلة للتدقيق."""
    meal = db.query(DailyMeal).filter(DailyMeal.id == meal_id).first()
    item = db.query(InventoryItem).filter(InventoryItem.id == payload.get("item_id")).first()
    quantity = float(payload.get("quantity", 0))
    if not meal or not item or quantity <= 0: raise HTTPException(400, "الوجبة والمادة والكمية مطلوبة")
    if item.quantity < quantity: raise HTTPException(409, "الكمية المتوفرة في المخزون غير كافية")
    item.quantity -= quantity
    db.add(InventoryMovement(item_id=item.id, delta=-quantity, reason=f"تحضير وجبة: {meal.description}"))
    db.commit(); log_action(db, current_user.id, "PREPARE_MEAL", "DailyMeal", meal_id, {"item_id": item.id, "quantity": quantity})
    return {"message": "تم تسجيل تحضير الوجبة وخصم المخزون", "remaining": item.quantity}


@router.post("/scan-meal", response_model=ScanMealResponse)
def scan_meal(
    payload: ScanMealRequest,
    current_user: User = Depends(require_roles("RESTAURANT_MANAGER", "ADMIN")),
    db: Session = Depends(get_db),
):
    if payload.period != "LUNCH":
        return ScanMealResponse(status="not_found", message="المؤسسة تعتمد وجبة الغداء فقط")
    student = db.query(Student).filter(Student.barcode == payload.barcode).first()
    if not student:
        return ScanMealResponse(status="not_found", message="لم يتم العثور على تلميذ بهذا الرمز")

    today = date.today()
    try:
        period_enum = MealPeriod(payload.period)
    except ValueError:
        return ScanMealResponse(status="not_found", message="فترة الوجبة غير صحيحة")

    meal = db.query(DailyMeal).filter(DailyMeal.date == today, DailyMeal.period == period_enum).first()
    if not meal:
        return ScanMealResponse(status="not_found", message="لم يتم تحديد وجبة اليوم لهذه الفترة بعد")

    already = (
        db.query(MealConsumption)
        .filter(MealConsumption.student_id == student.id, MealConsumption.meal_id == meal.id)
        .first()
    )
    if already:
        return ScanMealResponse(
            status="already_taken", message="هذا التلميذ أخذ وجبته مسبقًا اليوم", student_name=student.full_name
        )

    is_absent = (
        db.query(Absence)
        .filter(Absence.student_id == student.id, Absence.date == today)
        .first()
    )

    db.add(MealConsumption(student_id=student.id, meal_id=meal.id, scanned_by=current_user.id))
    db.commit()
    log_action(db, current_user.id, "SCAN_MEAL", "Student", student.id, {"meal_id": meal.id})

    if is_absent:
        return ScanMealResponse(
            status="absent_warning",
            message="تنبيه: هذا التلميذ مسجَّل كغائب اليوم",
            student_name=student.full_name,
        )

    return ScanMealResponse(status="success", message="تم تسجيل الوجبة بنجاح", student_name=student.full_name)


@router.get("/inventory", response_model=list[InventoryItemOut])
def list_inventory(
    current_user: User = Depends(require_roles("RESTAURANT_MANAGER", "ADMIN")),
    db: Session = Depends(get_db),
):
    return db.query(InventoryItem).all()


@router.get("/inventory/low-stock", response_model=list[InventoryItemOut])
def low_stock(
    current_user: User = Depends(require_roles("RESTAURANT_MANAGER", "ADMIN")),
    db: Session = Depends(get_db),
):
    items = db.query(InventoryItem).all()
    return [i for i in items if i.quantity <= i.low_stock_threshold]


@router.put("/inventory/{item_id}/movement", response_model=InventoryItemOut)
def add_movement(
    item_id: int,
    payload: InventoryMovementRequest,
    current_user: User = Depends(require_roles("RESTAURANT_MANAGER", "ADMIN")),
    db: Session = Depends(get_db),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="المادة غير موجودة في المخزون")

    if item.quantity + payload.delta < 0:
        raise HTTPException(status_code=409, detail="لا يمكن أن يصبح رصيد المخزون سالبًا")
    item.quantity += payload.delta
    db.add(InventoryMovement(item_id=item_id, delta=payload.delta, reason=payload.reason))
    db.commit()
    db.refresh(item)
    log_action(db, current_user.id, "EDIT_INVENTORY", "InventoryItem", item_id, {"delta": payload.delta, "reason": payload.reason})
    return item
