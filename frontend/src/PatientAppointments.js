



import { useEffect, useState } from "react";
import { patientAppointments } from "./api";

function getPatient() {
  const raw = localStorage.getItem("patient");
  return raw ? JSON.parse(raw) : null;
}

export default function PatientAppointments() {
  // Requirement: Patient can drill down and see full upcoming schedule (up to 3 months)
  const patient = getPatient();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!patient) {
      window.location.href = "/";
      return;
    }
    patientAppointments(patient.id)
      .then(setItems)
      .catch(() => setErr("Failed to load appointments."));
  }, []);

  return (
    //<div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
    <div className="page-container">

      <h2>Upcoming Appointments (Next 3 Months)</h2>
      <button onClick={() => (window.location.href = "/patient")}>Back</button>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!err && items.length === 0 && <p>No upcoming appointments.</p>}

      <ul>
        {items.map((a) => (
          <li key={`${a.series_id}-${a.occurrence_datetime}`}>
            <b>{a.provider}</b> — {new Date(a.occurrence_datetime).toLocaleString()} ({a.repeat})
          </li>
        ))}
      </ul>
    </div>
  );
}
