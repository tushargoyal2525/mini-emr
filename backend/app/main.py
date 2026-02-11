# from fastapi import FastAPI, Depends, HTTPException
# from sqlalchemy.orm import Session
# from .database import Base, engine, SessionLocal
# from .models import User, Appointment, Prescription
# from .schemas import *

# Base.metadata.create_all(bind=engine)
# app = FastAPI()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ---------- AUTH ----------
# @app.post("/login")
# def login(email: str, password: str, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.email == email, User.password == password).first()
#     if not user:
#         raise HTTPException(status_code=401)
#     return user

# # ---------- ADMIN ----------
# @app.get("/admin/users")
# def get_users(db: Session = Depends(get_db)):
#     return db.query(User).all()

# @app.post("/admin/users")
# def create_user(user: UserCreate, db: Session = Depends(get_db)):
#     u = User(**user.dict())
#     db.add(u)
#     db.commit()
#     return u

# @app.post("/admin/users/{user_id}/appointments")
# def add_appointment(user_id: int, appt: AppointmentCreate, db: Session = Depends(get_db)):
#     a = Appointment(**appt.dict(), user_id=user_id)
#     db.add(a)
#     db.commit()
#     return a

# @app.post("/admin/users/{user_id}/prescriptions")
# def add_prescription(user_id: int, rx: PrescriptionCreate, db: Session = Depends(get_db)):
#     p = Prescription(**rx.dict(), user_id=user_id)
#     db.add(p)
#     db.commit()
#     return p

# # ---------- PATIENT ----------
# @app.get("/patients/{user_id}")
# def patient_dashboard(user_id: int, db: Session = Depends(get_db)):
#     return db.query(User).filter(User.id == user_id).first()


## first time working updated one :


# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse

# from app.database import SessionLocal, engine
# from app.models import Base, User, Appointment, Prescription
# from app.schemas import UserCreate

# # Create all tables (if not already created)
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="Mini-EMR & Patient Portal API")

# # ----------------------------
# # CORS Configuration
# # ----------------------------
# origins = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000"
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,      # frontend URLs
#     allow_credentials=True,
#     allow_methods=["*"],        # allow GET, POST, PUT, DELETE
#     allow_headers=["*"],        # allow all headers
# )

# # ----------------------------
# # Dependency to get DB session
# # ----------------------------
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ----------------------------
# # Routes
# # ----------------------------

# # Test route
# @app.get("/")
# def root():
#     return {"message": "Mini-EMR API running!"}


# # ----------------------------
# # Admin Routes
# # ----------------------------
# @app.get("/admin/users")
# def get_users():
#     db = SessionLocal()
#     users = db.query(User).all()
#     result = []
#     for u in users:
#         result.append({
#             "id": u.id,
#             "name": u.name,
#             "email": u.email,
#             "appointments": [{"id": a.id, "provider": a.provider, "datetime": str(a.datetime), "repeat": a.repeat} for a in u.appointments],
#             "prescriptions": [{"id": p.id, "medication": p.medication, "dosage": p.dosage, "quantity": p.quantity,
#                                "refill_on": str(p.refill_on), "refill_schedule": p.refill_schedule} for p in u.prescriptions]
#         })
#     return result


# # ----------------------------
# # Patient Login Route
# # ----------------------------
# @app.post("/login")
# def login(email: str, password: str):
#     db = SessionLocal()
#     user = db.query(User).filter(User.email == email, User.password == password).first()
#     if not user:
#         raise HTTPException(status_code=401, detail="Invalid email or password")
#     return {
#         "id": user.id,
#         "name": user.name,
#         "email": user.email,
#         "appointments": [{"id": a.id, "provider": a.provider, "datetime": str(a.datetime), "repeat": a.repeat} for a in user.appointments],
#         "prescriptions": [{"id": p.id, "medication": p.medication, "dosage": p.dosage, "quantity": p.quantity,
#                            "refill_on": str(p.refill_on), "refill_schedule": p.refill_schedule} for p in user.prescriptions]
#     }


##New:
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from typing import List

from app.database import Base, engine, SessionLocal
from app.models import (
    User, Appointment, Prescription,
    MedicationOption, DosageOption
)
from app.schemas import (
    UserCreate, UserUpdate,
    AppointmentCreate, AppointmentUpdate,
    PrescriptionCreate, PrescriptionUpdate,
    LoginResponse, Occurrence
)

# ================================
# Init DB
# ================================
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini-EMR + Patient Portal")

# ================================
# Requirement: Frontend (localhost:3000) must call backend → enable CORS
# ================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================================
# Requirement: Seeded medications + dosages should be usable in Rx form
# Frontend calls this to populate dropdowns.
# ================================
@app.get("/meta/options")
def get_options(db: Session = Depends(get_db)):
    meds = [m.name for m in db.query(MedicationOption).order_by(MedicationOption.name).all()]
    dosages = [d.name for d in db.query(DosageOption).order_by(DosageOption.name).all()]
    return {"medications": meds, "dosages": dosages}

# ==========================================================
# SECTION 2: PATIENT PORTAL (root "/")
# - Login with email/password
# - Summary: next 7 days appointments & refills
# - Drill-down: appointments up to 3 months, all prescriptions
# ==========================================================

@app.post("/auth/login", response_model=LoginResponse)
def login(email: str, password: str, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == email, User.password == password).first()
    if not u:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return LoginResponse(id=u.id, name=u.name, email=u.email)

def expand_appointment_series(
    appt: Appointment,
    horizon_end: datetime
) -> List[Occurrence]:
    """
    Requirement: Patients/Admins should see upcoming schedule; recurring appointments must be supported
    and can be ended via end_on or active=false.
    We expand occurrences up to horizon_end (3 months for drill-down, 7 days for summary).
    """
    if not appt.active:
        return []

    occurrences: List[Occurrence] = []
    start = appt.start_datetime
    end_date_limit = appt.end_on  # date or None

    def is_past_end_on(dt: datetime) -> bool:
        return end_date_limit is not None and dt.date() > end_date_limit

    # Add occurrences
    cur = start
    while cur <= horizon_end:
        if is_past_end_on(cur):
            break
        # Only include occurrences in future/present relative to now (for portal views)
        occurrences.append(Occurrence(
            series_id=appt.id,
            occurrence_datetime=cur,
            provider=appt.provider,
            repeat=appt.repeat
        ))
        if appt.repeat == "none":
            break
        if appt.repeat == "weekly":
            cur = cur + timedelta(days=7)
        elif appt.repeat == "monthly":
            cur = cur + relativedelta(months=1)
        else:
            break

    return occurrences

@app.get("/patient/{user_id}/summary")
def patient_summary(user_id: int, db: Session = Depends(get_db)):
    """
    Requirement: Summary page:
    - basic patient info
    - appointments within next 7 days
    - refills scheduled within next 7 days
    """
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    now = datetime.now()
    horizon = now + timedelta(days=7)

    # Expand appointments to occurrences, then filter within window
    occs: List[Occurrence] = []
    for a in user.appointments:
        occs.extend(expand_appointment_series(a, horizon))

    upcoming_7 = [o for o in occs if now <= o.occurrence_datetime <= horizon]
    upcoming_7.sort(key=lambda x: x.occurrence_datetime)

    today = date.today()
    refill_horizon = today + timedelta(days=7)
    refill_7 = [
        p for p in user.prescriptions
        if today <= p.refill_on <= refill_horizon
    ]
    refill_7.sort(key=lambda p: p.refill_on)

    return {
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "appointments_next_7_days": [o.dict() for o in upcoming_7],
        "refills_next_7_days": [
            {
                "id": p.id,
                "medication": p.medication,
                "dosage": p.dosage,
                "quantity": p.quantity,
                "refill_on": p.refill_on.isoformat(),
                "refill_schedule": p.refill_schedule
            } for p in refill_7
        ],
    }

@app.get("/patient/{user_id}/appointments")
def patient_appointments(user_id: int, db: Session = Depends(get_db)):
    """
    Requirement: Patient drill-down: full upcoming schedule up to 3 months
    """
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    now = datetime.now()
    horizon = now + timedelta(days=90)

    occs: List[Occurrence] = []
    for a in user.appointments:
        occs.extend(expand_appointment_series(a, horizon))

    upcoming = [o for o in occs if o.occurrence_datetime >= now]
    upcoming.sort(key=lambda x: x.occurrence_datetime)
    return [o.dict() for o in upcoming]

@app.get("/patient/{user_id}/prescriptions")
def patient_prescriptions(user_id: int, db: Session = Depends(get_db)):
    """
    Requirement: Patient drill-down: see all prescriptions
    """
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    return [
        {
            "id": p.id,
            "medication": p.medication,
            "dosage": p.dosage,
            "quantity": p.quantity,
            "refill_on": p.refill_on.isoformat(),
            "refill_schedule": p.refill_schedule
        } for p in user.prescriptions
    ]

# ==========================================================
# SECTION 1: MINI-EMR (ADMIN at "/admin")
# - No authentication
# - Users table with at-a-glance data
# - Drill down into patient, manage CRU for patient
# - Appointments CRUD + end recurring
# - Prescriptions CRUD
# ==========================================================

@app.get("/admin/users")
def admin_list_users(db: Session = Depends(get_db)):
    """
    Requirement: Admin main page table of users + at-a-glance data
    We return counts + next-7-days appointment/refill counts for quick visibility.
    """
    now = datetime.now()
    horizon = now + timedelta(days=7)
    today = date.today()
    refill_horizon = today + timedelta(days=7)

    users = db.query(User).order_by(User.id).all()
    rows = []
    for u in users:
        # appointment occurrences next 7 days
        occs: List[Occurrence] = []
        for a in u.appointments:
            occs.extend(expand_appointment_series(a, horizon))
        appt_7 = [o for o in occs if now <= o.occurrence_datetime <= horizon]

        refill_7 = [p for p in u.prescriptions if today <= p.refill_on <= refill_horizon]

        rows.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "appointments_total": len(u.appointments),
            "prescriptions_total": len(u.prescriptions),
            "appointments_next_7_days": len(appt_7),
            "refills_next_7_days": len(refill_7),
        })
    return rows

@app.post("/admin/users")
def admin_create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Requirement: Patient data can be managed (CRU) + New patient form
    """
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(409, "Email already exists")

    u = User(name=payload.name, email=payload.email, password=payload.password)
    db.add(u)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "name": u.name, "email": u.email}

@app.get("/admin/users/{user_id}")
def admin_user_detail(user_id: int, db: Session = Depends(get_db)):
    """
    Requirement: Drill-down into patient record; view upcoming appointments + prescriptions
    """
    u = db.query(User).get(user_id)
    if not u:
        raise HTTPException(404, "User not found")

    # Provide next 90 days occurrences for EMR viewing convenience
    now = datetime.now()
    horizon = now + timedelta(days=90)
    occs: List[Occurrence] = []
    for a in u.appointments:
        occs.extend(expand_appointment_series(a, horizon))
    occs.sort(key=lambda x: x.occurrence_datetime)

    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "appointments": [
            {
                "id": a.id,
                "provider": a.provider,
                "start_datetime": a.start_datetime.isoformat(),
                "repeat": a.repeat,
                "end_on": a.end_on.isoformat() if a.end_on else None,
                "active": a.active,
            } for a in u.appointments
        ],
        "appointments_occurrences_next_90_days": [o.dict() for o in occs],
        "prescriptions": [
            {
                "id": p.id,
                "medication": p.medication,
                "dosage": p.dosage,
                "quantity": p.quantity,
                "refill_on": p.refill_on.isoformat(),
                "refill_schedule": p.refill_schedule
            } for p in u.prescriptions
        ],
    }

@app.put("/admin/users/{user_id}")
def admin_update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    """
    Requirement: Patient data CRU (Update)
    """
    u = db.query(User).get(user_id)
    if not u:
        raise HTTPException(404, "User not found")

    if payload.email and payload.email != u.email:
        exists = db.query(User).filter(User.email == payload.email).first()
        if exists:
            raise HTTPException(409, "Email already exists")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(u, field, value)
    db.commit()
    db.refresh(u)
    return {"id": u.id, "name": u.name, "email": u.email}

# ---------- Appointments CRUD ----------
@app.post("/admin/users/{user_id}/appointments")
def admin_create_appointment(user_id: int, payload: AppointmentCreate, db: Session = Depends(get_db)):
    """
    Requirement: Patient appointments can be managed (CRUD)
    Requirement: Appointment form includes provider, first datetime, repeat schedule
    Requirement: Provide way to end recurring appointments (end_on/active)
    """
    u = db.query(User).get(user_id)
    if not u:
        raise HTTPException(404, "User not found")

    a = Appointment(
        user_id=user_id,
        provider=payload.provider,
        start_datetime=payload.start_datetime,
        repeat=payload.repeat,
        end_on=payload.end_on,
        active=payload.active,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id,
        "provider": a.provider,
        "start_datetime": a.start_datetime.isoformat(),
        "repeat": a.repeat,
        "end_on": a.end_on.isoformat() if a.end_on else None,
        "active": a.active,
    }

@app.put("/admin/appointments/{appointment_id}")
def admin_update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db)):
    """
    Requirement: Appointment Update
    """
    a = db.query(Appointment).get(appointment_id)
    if not a:
        raise HTTPException(404, "Appointment not found")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(a, field, value)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id,
        "provider": a.provider,
        "start_datetime": a.start_datetime.isoformat(),
        "repeat": a.repeat,
        "end_on": a.end_on.isoformat() if a.end_on else None,
        "active": a.active,
    }

@app.post("/admin/appointments/{appointment_id}/end")
def admin_end_recurring(appointment_id: int, end_on: date | None = None, db: Session = Depends(get_db)):
    """
    Requirement: Provide a way to end recurring appointments
    If end_on not provided, we set it to today.
    """
    a = db.query(Appointment).get(appointment_id)
    if not a:
        raise HTTPException(404, "Appointment not found")

    a.end_on = end_on or date.today()
    db.commit()
    db.refresh(a)
    return {"id": a.id, "end_on": a.end_on.isoformat(), "active": a.active}

@app.delete("/admin/appointments/{appointment_id}")
def admin_delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """
    Requirement: Appointment Delete
    """
    a = db.query(Appointment).get(appointment_id)
    if not a:
        raise HTTPException(404, "Appointment not found")
    db.delete(a)
    db.commit()
    return {"deleted": True}

# ---------- Prescriptions CRUD ----------
@app.post("/admin/users/{user_id}/prescriptions")
def admin_create_prescription(user_id: int, payload: PrescriptionCreate, db: Session = Depends(get_db)):
    """
    Requirement: Patient prescriptions can be managed (CRUD)
    Requirement: Prescription form uses seeded medication/dosage options
    """
    u = db.query(User).get(user_id)
    if not u:
        raise HTTPException(404, "User not found")

    # Optional validation: ensure medication/dosage are from seeded list
    med_ok = db.query(MedicationOption).filter(MedicationOption.name == payload.medication).first()
    dose_ok = db.query(DosageOption).filter(DosageOption.name == payload.dosage).first()
    if not med_ok or not dose_ok:
        raise HTTPException(400, "Medication or dosage not in seeded options")

    p = Prescription(
        user_id=user_id,
        medication=payload.medication,
        dosage=payload.dosage,
        quantity=payload.quantity,
        refill_on=payload.refill_on,
        refill_schedule=payload.refill_schedule,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "medication": p.medication,
        "dosage": p.dosage,
        "quantity": p.quantity,
        "refill_on": p.refill_on.isoformat(),
        "refill_schedule": p.refill_schedule,
    }

@app.put("/admin/prescriptions/{prescription_id}")
def admin_update_prescription(prescription_id: int, payload: PrescriptionUpdate, db: Session = Depends(get_db)):
    """
    Requirement: Prescription Update
    """
    p = db.query(Prescription).get(prescription_id)
    if not p:
        raise HTTPException(404, "Prescription not found")

    updates = payload.dict(exclude_unset=True)

    # validate medication/dosage if changing
    if "medication" in updates:
        med_ok = db.query(MedicationOption).filter(MedicationOption.name == updates["medication"]).first()
        if not med_ok:
            raise HTTPException(400, "Medication not in seeded options")
    if "dosage" in updates:
        dose_ok = db.query(DosageOption).filter(DosageOption.name == updates["dosage"]).first()
        if not dose_ok:
            raise HTTPException(400, "Dosage not in seeded options")

    for field, value in updates.items():
        setattr(p, field, value)

    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "medication": p.medication,
        "dosage": p.dosage,
        "quantity": p.quantity,
        "refill_on": p.refill_on.isoformat(),
        "refill_schedule": p.refill_schedule,
    }

@app.delete("/admin/prescriptions/{prescription_id}")
def admin_delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    """
    Requirement: Prescription Delete
    """
    p = db.query(Prescription).get(prescription_id)
    if not p:
        raise HTTPException(404, "Prescription not found")
    db.delete(p)
    db.commit()
    return {"deleted": True}


