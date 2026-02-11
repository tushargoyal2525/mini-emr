
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List, Literal

# ================================
# Requirement: CRUD input validation
# ================================

RepeatType = Literal["none", "weekly", "monthly"]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class AppointmentCreate(BaseModel):
    provider: str
    start_datetime: datetime
    repeat: RepeatType = "none"
    end_on: Optional[date] = None
    active: bool = True

class AppointmentUpdate(BaseModel):
    provider: Optional[str] = None
    start_datetime: Optional[datetime] = None
    repeat: Optional[RepeatType] = None
    end_on: Optional[date] = None
    active: Optional[bool] = None

class PrescriptionCreate(BaseModel):
    medication: str
    dosage: str
    quantity: int
    refill_on: date
    refill_schedule: str = "monthly"

class PrescriptionUpdate(BaseModel):
    medication: Optional[str] = None
    dosage: Optional[str] = None
    quantity: Optional[int] = None
    refill_on: Optional[date] = None
    refill_schedule: Optional[str] = None

class LoginResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

class Occurrence(BaseModel):
    series_id: int
    occurrence_datetime: datetime
    provider: str
    repeat: str

