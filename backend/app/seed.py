
import json
from datetime import datetime, date
from pathlib import Path

from app.database import SessionLocal, engine, Base
from app.models import User, Appointment, Prescription, MedicationOption, DosageOption

# ================================
# Requirement: Seed DB from provided JSON (users + medications + dosages)
# ================================

Base.metadata.create_all(bind=engine)

DATA_PATH = Path(__file__).parent / "data.json"

def main():
    db = SessionLocal()
    try:
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

        # Seed medication options
        for m in data.get("medications", []):
            if not db.query(MedicationOption).filter(MedicationOption.name == m).first():
                db.add(MedicationOption(name=m))

        # Seed dosage options
        for d in data.get("dosages", []):
            if not db.query(DosageOption).filter(DosageOption.name == d).first():
                db.add(DosageOption(name=d))

        db.commit()

        # Seed users + nested appointments + prescriptions
        for u in data.get("users", []):
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                continue

            user = User(
                name=u["name"],
                email=u["email"],
                password=u["password"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            for a in u.get("appointments", []):
                # iso strings in sample include timezone. We'll parse safely by slicing to seconds and letting fromisoformat handle offset.
                dt = datetime.fromisoformat(a["datetime"])
                db.add(Appointment(
                    provider=a["provider"],
                    start_datetime=dt,
                    repeat=a.get("repeat", "none"),
                    end_on=None,
                    active=True,
                    user_id=user.id
                ))

            for p in u.get("prescriptions", []):
                db.add(Prescription(
                    medication=p["medication"],
                    dosage=p["dosage"],
                    quantity=p["quantity"],
                    refill_on=date.fromisoformat(p["refill_on"]),
                    refill_schedule=p.get("refill_schedule", "monthly"),
                    user_id=user.id
                ))

            db.commit()

        print("✅ Seed complete.")
    finally:
        db.close()

if __name__ == "__main__":
    main()

