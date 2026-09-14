from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_roles, log_action
from app.database import get_db
from app.models.models import Schedule, Student, Absence, AbsencePeriod, User, GradeEntry, TeacherProfile
from app.schemas.schemas import StudentOut, SubmitAbsencesRequest, GradeEntryCreate, GradeSubmitRequest

router = APIRouter(prefix="/api/teacher", tags=["الأستاذ"])

@router.get("/my-profile")
def my_profile(current_user: User = Depends(require_roles("TEACHER")), db: Session = Depends(get_db)):
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    return {"full_name": current_user.full_name, "username": current_user.username, "specialty": profile.specialty if profile else "", "service_type": profile.service_type if profile else "FULL_TIME", "weekly_target_minutes": profile.weekly_target_minutes if profile else 1440}

@router.get("/absence-history")
def absence_history(current_user: User = Depends(require_roles("TEACHER")), db: Session = Depends(get_db), limit: int = 60):
    classroom_ids = db.query(Schedule.classroom_id).filter(Schedule.teacher_id == current_user.id).subquery()
    rows = (db.query(Absence).join(Student, Absence.student_id == Student.id)
            .filter(Student.classroom_id.in_(classroom_ids)).order_by(Absence.date.desc()).limit(limit).all())
    seen = set(); result = []
    for row in rows:
        key = (row.id, row.student_id)
        if key in seen: continue
        seen.add(key); result.append({"date": row.date.isoformat(), "period": row.period.value, "student": row.student.full_name, "classroom": row.student.classroom.name})
    return result

@router.get("/my-schedule")
def my_schedule(current_user: User = Depends(require_roles("TEACHER")), db: Session = Depends(get_db)):
    rows = db.query(Schedule).filter(Schedule.teacher_id == current_user.id).order_by(Schedule.day_of_week, Schedule.period).all()
    return [{"day": r.day_of_week, "period": r.period.value, "subject": r.subject or "", "classroom": r.classroom.name} for r in rows]


@router.get("/grades")
def list_grades(term: str, subject: str, current_user: User = Depends(require_roles("TEACHER")), db: Session = Depends(get_db)):
    rows = db.query(GradeEntry).filter(GradeEntry.teacher_id == current_user.id, GradeEntry.term == term, GradeEntry.subject == subject).all()
    return [{"id": r.id, "student_id": r.student_id, "student_name": r.student.full_name, "continuous": r.continuous, "exam": r.exam, "observation": r.observation, "status": r.status} for r in rows]


@router.post("/grades")
def save_grade(payload: GradeEntryCreate, current_user: User = Depends(require_roles("TEACHER")), db: Session = Depends(get_db)):
    if payload.continuous is not None and not 0 <= payload.continuous <= 10: raise HTTPException(400, "علامة التقويم يجب أن تكون بين 0 و10")
    if payload.exam is not None and not 0 <= payload.exam <= 10: raise HTTPException(400, "علامة الاختبار يجب أن تكون بين 0 و10")
    row = db.query(GradeEntry).filter(GradeEntry.student_id == payload.student_id, GradeEntry.term == payload.term, GradeEntry.subject == payload.subject).first()
    if row: row.continuous, row.exam, row.observation, row.teacher_id, row.status = payload.continuous, payload.exam, payload.observation, current_user.id, "DRAFT"
    else: row = GradeEntry(**payload.model_dump(), teacher_id=current_user.id); db.add(row)
    db.commit(); db.refresh(row); return {"id": row.id, "status": row.status}


@router.post("/grades/submit")
def submit_grades(payload: GradeSubmitRequest, current_user: User = Depends(require_roles("TEACHER")), db: Session = Depends(get_db)):
    count = db.query(GradeEntry).filter(GradeEntry.teacher_id == current_user.id, GradeEntry.term == payload.term, GradeEntry.subject == payload.subject).update({"status": "SUBMITTED"}, synchronize_session=False)
    db.commit(); log_action(db, current_user.id, "SUBMIT_GRADES", "GradeBook", None, {"term": payload.term, "subject": payload.subject, "count": count}); return {"count": count, "status": "SUBMITTED"}


def _current_period() -> str:
    """تحديد الفترة الحالية بناءً على توقيت الخادم (صباحية قبل الساعة 12، مسائية بعدها)."""
    from datetime import datetime
    return "MORNING" if datetime.now().hour < 12 else "AFTERNOON"


@router.get("/my-current-class")
def my_current_class(
    current_user: User = Depends(require_roles("TEACHER")),
    db: Session = Depends(get_db),
):
    today_weekday = date.today().weekday()  # الاثنين=0 ... نحوّله لاحقًا حسب التقويم الجزائري إذا لزم
    period = _current_period()

    schedule = (
        db.query(Schedule)
        .filter(
            Schedule.teacher_id == current_user.id,
            Schedule.day_of_week == today_weekday,
            Schedule.period == period,
        )
        .first()
    )
    if not schedule:
        return {"classroom": None, "students": [], "message": "لا توجد حصة مسندة إليك في هذا التوقيت"}

    today = date.today()
    already_absent = {
        a.student_id
        for a in db.query(Absence).filter(Absence.date == today, Absence.period == period).all()
    }
    students = db.query(Student).filter(Student.classroom_id == schedule.classroom_id).all()
    result = [
        StudentOut(id=s.id, full_name=s.full_name, barcode=s.barcode, is_absent_today=s.id in already_absent)
        for s in students
    ]
    return {
        "classroom": {"id": schedule.classroom_id, "name": schedule.classroom.name},
        "subject": schedule.subject or "",
        "period": period,
        "students": result,
    }


@router.post("/submit-absences")
def submit_absences(
    payload: SubmitAbsencesRequest,
    current_user: User = Depends(require_roles("TEACHER")),
    db: Session = Depends(get_db),
):
    today = date.today()
    try:
        period_enum = AbsencePeriod(payload.period)
    except ValueError:
        raise HTTPException(status_code=400, detail="فترة غير صحيحة")

    # إزالة أي غياب سابق مسجّل خطأً لهذا اليوم/الفترة لهذا القسم قبل إعادة التسجيل
    existing = (
        db.query(Absence)
        .join(Student)
        .filter(Student.classroom_id == payload.classroom_id, Absence.date == today, Absence.period == period_enum)
        .all()
    )
    for a in existing:
        db.delete(a)

    for student_id in payload.absent_student_ids:
        db.add(Absence(student_id=student_id, date=today, period=period_enum))

    db.commit()
    log_action(
        db, current_user.id, "SUBMIT_ABSENCE", "Classroom", payload.classroom_id,
        {"count": len(payload.absent_student_ids), "period": payload.period},
    )
    return {"message": "تم تسجيل الغيابات بنجاح", "count": len(payload.absent_student_ids)}
