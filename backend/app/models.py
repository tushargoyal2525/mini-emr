
from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# ================================
# Requirement: Database employed; new entries can be added/modified
# Models cover: Users (patients), Appointments, Prescriptions
# Also cover: Seeded medication/dosage options (from provided JSON)
# ================================

class MedicationOption(Base):
    __tablename__ = "medication_options"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True)

class DosageOption(Base):
    __tablename__ = "dosage_options"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)

    # Requirement (Patient data CRU): name/email/password stored
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # (prompt allows plaintext for testing)

    appointments = relationship("Appointment", cascade="all,delete-orphan", back_populates="user")
    prescriptions = relationship("Prescription", cascade="all,delete-orphan", back_populates="user")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True)

    # Requirement (Appointment form fields): provider, first datetime, repeat schedule
    provider = Column(String, nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    repeat = Column(String, nullable=False, default="none")  # none|weekly|monthly

    # Requirement: Provide a way to end recurring appointments
    # If end_on is set, recurrence stops after that date.
    end_on = Column(Date, nullable=True)
    active = Column(Boolean, default=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="appointments")

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True)

    # Requirement (Prescription form fields): medication name, dosage, quantity, refill date, refill schedule
    medication = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    refill_on = Column(Date, nullable=False)
    refill_schedule = Column(String, nullable=False, default="monthly")  # monthly etc.

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="prescriptions")
