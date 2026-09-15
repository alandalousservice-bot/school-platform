from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    user_id: int


class RefreshRequest(BaseModel):
    refresh_token: str


class StudentOut(BaseModel):
    id: int
    full_name: str
    barcode: str
    is_absent_today: bool = False

    class Config:
        from_attributes = True


class SubmitAbsencesRequest(BaseModel):
    classroom_id: int
    period: str  # MORNING / AFTERNOON
    absent_student_ids: list[int]


class ScanMealRequest(BaseModel):
    barcode: str
    period: str  # BREAKFAST / LUNCH


class ScanMealResponse(BaseModel):
    status: str  # "success" | "already_taken" | "absent_warning" | "not_found"
    message: str
    student_name: Optional[str] = None


class InventoryMovementRequest(BaseModel):
    delta: float
    reason: str


class InventoryItemOut(BaseModel):
    id: int
    name: str
    quantity: float
    unit: str
    low_stock_threshold: float

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_students: int
    absent_today: int
    meals_served_today: int
    low_stock_items: int


class AuditLogOut(BaseModel):
    id: int
    action: str
    entity: str
    entity_id: Optional[int]
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True


class ClassroomCreate(BaseModel):
    name: str


class StudentCreate(BaseModel):
    full_name: str
    barcode: str
    classroom_id: int
    parent_phone: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str


class GradeEntryCreate(BaseModel):
    student_id: int
    term: str
    subject: str
    continuous: Optional[float] = None
    exam: Optional[float] = None
    observation: Optional[str] = None


class GradeSubmitRequest(BaseModel):
    term: str
    subject: str


class StudentProfileUpdate(BaseModel):
    birth_date: Optional[str] = None
    national_id: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None
    health_notes: Optional[str] = None
    photo_url: Optional[str] = None


class TeacherProfileUpdate(BaseModel):
    specialty: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hire_date: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None
    service_type: Optional[str] = None
    weekly_target_minutes: Optional[int] = None
