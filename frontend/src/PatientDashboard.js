

import { useEffect, useState } from "react";
import { patientSummary } from "./api";
import { useNavigate } from "react-router-dom"; //adding



function getPatient() {
  const raw = localStorage.getItem("patient");
  return raw ? JSON.parse(raw) : null;
}

export default function PatientDashboard() {
  // Requirement: After login, show summary page:
  // - basic patient info
  // - appointments in next 7 days
  // - refills in next 7 days
  const patient = getPatient();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate(); // adding


  useEffect(() => {
    if (!patient) {
      //window.location.href = "/";
      navigate("/", { replace: true }); //adding
      return;
    }
    patientSummary(patient.id)
      .then(setData)
      .catch(() => setErr("Failed to load summary."));
  }, []);

  function logout() {
    localStorage.removeItem("patient");
    //window.location.href = "/";
    navigate("/", { replace: true }); //adding
  }

  if (!patient) return null;

  return (
    //<div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
    <div className="page-container">

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Patient Portal</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <h3>{patient.name}</h3>
      <p>{patient.email}</p>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!data && !err && <p>Loading...</p>}

      {data && (
        <>
          <h3>Appointments in next 7 days</h3>
          {data.appointments_next_7_days.length === 0 ? (
            <p>No upcoming appointments.</p>
          ) : (
            <ul>
              {data.appointments_next_7_days.map((a) => (
                <li key={`${a.series_id}-${a.occurrence_datetime}`}>
                  <b>{a.provider}</b> — {new Date(a.occurrence_datetime).toLocaleString()} ({a.repeat})
                </li>
              ))}
            </ul>
          )}

          <h3>Medication refills in next 7 days</h3>
          {data.refills_next_7_days.length === 0 ? (
            <p>No refills due.</p>
          ) : (
            <ul>
              {data.refills_next_7_days.map((p) => (
                <li key={p.id}>
                  <b>{p.medication}</b> {p.dosage} — refill on {p.refill_on} ({p.refill_schedule})
                </li>
              ))}
            </ul>
          )}

          {/* Requirement: Drill-down links */}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button onClick={() => navigate("/patient/appointments")}>
              View all appointments (3 months)
            </button>
            <button onClick={() => navigate("/patient/prescriptions")}>
              View all prescriptions
            </button>
          </div>
        </>
      )}
    </div>
  );
}
