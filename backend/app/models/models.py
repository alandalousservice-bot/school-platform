"""
نماذج قاعدة البيانات — تطابق المخطط المطوَّر (v2) المتفق عليه:
مستخدمون بأدوار متعددة، جلسات قابلة للإبطال، سجل تدقيق، حركات مخزون.
"""
import enum
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String,
    UniqueConstraint, JSON, Date,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Role(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    TEACHER = "TEACHER"
    RESTAURANT_MANAGER = "RESTAURANT_MANAGER"


class MealPeriod(str, enum.Enum):
    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"


class AbsencePeriod(str, enum.Enum):
    MORNING = "MORNING"
    AFTERNOON = "AFTERNOON"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    schedules = relationship("Schedule", back_populates="teacher")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    students = relationship("Student", back_populates="classroom")
    schedules = relationship("Schedule", back_populates="classroom")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    parent_phone = Column(String, nullable=True)

    classroom = relationship("Classroom", back_populates="students")
    absences = relationship("Absence", back_populates="student")
    meals = relationship("MealConsumption", back_populates="student")
    profile = relationship("StudentProfile", back_populates="student", uselist=False)


class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    birth_date = Column(Date, nullable=True)
    national_id = Column(String, nullable=True)
    parent_name = Column(String, nullable=True)
    parent_phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    health_notes = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    student = relationship("Student", back_populates="profile")


class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    specialty = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    hire_date = Column(Date, nullable=True)
    address = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    service_type = Column(String, nullable=False, default="FULL_TIME")
    weekly_target_minutes = Column(Integer, nullable=False, default=1440)
    user = relationship("User")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=الأحد ... 4=الخميس
    period = Column(Enum(AbsencePeriod), nullable=False)
    subject = Column(String, nullable=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    status = Column(String, nullable=False, default="DRAFT")

    teacher = relationship("User", back_populates="schedules")
    classroom = relationship("Classroom", back_populates="schedules")


class SchoolScheduleConfig(Base):
    __tablename__ = "school_schedule_configs"
    id = Column(Integer, primary_key=True, index=True)
    school_year = Column(String, nullable=False, default="2026/2027")
    mode = Column(String, nullable=False, default="SINGLE")  # SINGLE / DOUBLE
    morning_start = Column(String, nullable=False, default="08:00")
    morning_end = Column(String, nullable=False, default="12:00")
    afternoon_start = Column(String, nullable=False, default="13:30")
    afternoon_end = Column(String, nullable=False, default="16:30")
    lesson_minutes = Column(Integer, nullable=False, default=45)
    break_minutes = Column(Integer, nullable=False, default=15)
    working_days = Column(Integer, nullable=False, default=5)


class Facility(Base):
    __tablename__ = "facilities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    kind = Column(String, nullable=False, default="CLASSROOM")
    capacity = Column(Integer, nullable=True)
    is_available = Column(Boolean, default=True)


class SubjectWeeklyQuota(Base):
    __tablename__ = "subject_weekly_quotas"
    id = Column(Integer, primary_key=True, index=True)
    school_year = Column(String, nullable=False, default="2026/2027")
    level = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    lessons_per_week = Column(Float, nullable=False, default=1)
    minutes_per_lesson = Column(Integer, nullable=False, default=45)
    required = Column(Boolean, default=True)


class Absence(Base):
    __tablename__ = "absences"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    period = Column(Enum(AbsencePeriod), nullable=False)

    student = relationship("Student", back_populates="absences")

    __table_args__ = (UniqueConstraint("student_id", "date", "period"),)


class GradeEntry(Base):
    __tablename__ = "grade_entries"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    term = Column(String, nullable=False)  # الفصل الأول / الثاني / الثالث
    subject = Column(String, nullable=False)
    continuous = Column(Float, nullable=True)
    exam = Column(Float, nullable=True)
    observation = Column(String, nullable=True)
    status = Column(String, default="DRAFT", nullable=False)  # DRAFT / SUBMITTED / APPROVED
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student")
    teacher = relationship("User")
    __table_args__ = (UniqueConstraint("student_id", "term", "subject"),)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Float, default=0)
    unit = Column(String, nullable=False)
    low_stock_threshold = Column(Float, default=5)
    image_url = Column(String, nullable=True)

    movements = relationship("InventoryMovement", back_populates="item")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    delta = Column(Float, nullable=False)  # موجب = إضافة، سالب = استهلاك
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    item = relationship("InventoryItem", back_populates="movements")


class DailyMeal(Base):
    __tablename__ = "daily_meals"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    period = Column(Enum(MealPeriod), nullable=False)
    description = Column(String, nullable=False)
    price = Column(Float, nullable=True)

    consumptions = relationship("MealConsumption", back_populates="meal")

    __table_args__ = (UniqueConstraint("date", "period"),)


class MealConsumption(Base):
    __tablename__ = "meal_consumptions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    meal_id = Column(Integer, ForeignKey("daily_meals.id"), nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    scanned_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    student = relationship("Student", back_populates="meals")
    meal = relationship("DailyMeal", back_populates="consumptions")

    __table_args__ = (UniqueConstraint("student_id", "meal_id"),)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    log_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
