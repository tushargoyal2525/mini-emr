// import { useEffect, useState } from "react";
// import { patientPrescriptions } from "./api";

// export default function PatientPrescriptions() {
//   const user = JSON.parse(localStorage.getItem("user"));
//   const [prescriptions, setPrescriptions] = useState([]);

//   useEffect(() => {
//     patientPrescriptions(user.id).then(setPrescriptions);
//   }, []);

//   return (
//     <div>
//       <h2>All Prescriptions</h2>
//       <ul>
//         {prescriptions.map(p => (
//           <li key={p.id}>{p.medication} ({p.dosage}) - Refill on: {p.refill_on}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { patientPrescriptions } from "./api";

function getPatient() {
  const raw = localStorage.getItem("patient");
  return raw ? JSON.parse(raw) : null;
}

export default function PatientPrescriptions() {
  // Requirement: Patient can drill down and see all prescriptions
  const patient = getPatient();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!patient) {
      window.location.href = "/";
      return;
    }
    patientPrescriptions(patient.id)
      .then(setItems)
      .catch(() => setErr("Failed to load prescriptions."));
  }, []);

  return (
    //<div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
    <div className="page-container">

      <h2>Prescriptions</h2>
      <button onClick={() => (window.location.href = "/patient")}>Back</button>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {!err && items.length === 0 && <p>No prescriptions found.</p>}

      <table border="1" cellPadding="8" style={{ marginTop: 12, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Qty</th>
            <th>Refill On</th>
            <th>Schedule</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.medication}</td>
              <td>{p.dosage}</td>
              <td>{p.quantity}</td>
              <td>{p.refill_on}</td>
              <td>{p.refill_schedule}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

