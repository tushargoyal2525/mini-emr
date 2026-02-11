


import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  adminGetUserDetail,
  adminUpdateUser,
  getOptions,
  adminCreateAppointment,
  adminUpdateAppointment,
  adminEndRecurring,
  adminDeleteAppointment,
  adminCreatePrescription,
  adminUpdatePrescription,
  adminDeletePrescription,
} from "./api";

export default function AdminUserDetail() {
  // Requirement: Drill-down patient record; manage appointments/prescriptions (CRUD)
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [options, setOptions] = useState({ medications: [], dosages: [] });
  const [err, setErr] = useState("");

  // Patient update form (CRU)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Appointment create form
  const [provider, setProvider] = useState("");
  const [startDt, setStartDt] = useState(""); // datetime-local
  const [repeat, setRepeat] = useState("none");
  const [endOn, setEndOn] = useState(""); // date optional

  // Prescription create form (uses seeded options)
  const [med, setMed] = useState("");
  const [dosage, setDosage] = useState("");
  const [qty, setQty] = useState(1);
  const [refillOn, setRefillOn] = useState("");
  const [refillSchedule, setRefillSchedule] = useState("monthly");

  async function load() {
    setErr("");
    try {
      const [u, opt] = await Promise.all([
        adminGetUserDetail(id),
        getOptions(),
      ]);
      setUser(u);
      setOptions(opt);
      setName(u.name);
      setEmail(u.email);
      if (!med && opt.medications.length) setMed(opt.medications[0]);
      if (!dosage && opt.dosages.length) setDosage(opt.dosages[0]);
    } catch {
      setErr("Failed to load patient details.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveUser(e) {
    e.preventDefault();
    setErr("");
    try {
      await adminUpdateUser(id, { name, email });
      await load();
    } catch {
      setErr("Failed to update user (email may already exist).");
    }
  }

  async function createAppt(e) {
    e.preventDefault();
    setErr("");
    try {
      // datetime-local returns "YYYY-MM-DDTHH:mm"
      // Backend expects ISO; browser format is acceptable.
      await adminCreateAppointment(id, {
        provider,
        start_datetime: startDt,
        repeat,
        end_on: endOn || null,
        active: true,
      });
      setProvider("");
      setStartDt("");
      setRepeat("none");
      setEndOn("");
      await load();
    } catch (ex) {
      setErr("Failed to create appointment. Check fields.");
    }
  }

  async function updateAppt(aid, patch) {
    setErr("");
    try {
      await adminUpdateAppointment(aid, patch);
      await load();
    } catch {
      setErr("Failed to update appointment.");
    }
  }

  async function endRecurring(aid) {
    setErr("");
    try {
      await adminEndRecurring(aid, null); // ends today
      await load();
    } catch {
      setErr("Failed to end recurring appointment.");
    }
  }

  async function deleteAppt(aid) {
    setErr("");
    try {
      await adminDeleteAppointment(aid);
      await load();
    } catch {
      setErr("Failed to delete appointment.");
    }
  }

  async function createRx(e) {
    e.preventDefault();
    setErr("");
    try {
      await adminCreatePrescription(id, {
        medication: med,
        dosage,
        quantity: Number(qty),
        refill_on: refillOn,
        refill_schedule: refillSchedule,
      });
      setQty(1);
      setRefillOn("");
      setRefillSchedule("monthly");
      await load();
    } catch {
      setErr("Failed to create prescription (ensure med/dosage are selected).");
    }
  }

  async function updateRx(pid, patch) {
    setErr("");
    try {
      await adminUpdatePrescription(pid, patch);
      await load();
    } catch {
      setErr("Failed to update prescription.");
    }
  }

  async function deleteRx(pid) {
    setErr("");
    try {
      await adminDeletePrescription(pid);
      await load();
    } catch {
      setErr("Failed to delete prescription.");
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
        <button onClick={() => (window.location.href = "/admin")}>Back</button>
        <p>Loading...</p>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </div>
    );
  }

  return (
   // <div style={{ maxWidth: 1000, margin: "30px auto", fontFamily: "Arial" }}>
   <div className="page-container">

      <button onClick={() => (window.location.href = "/admin")}>Back to Admin</button>
      <h2>Manage Patient</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* Requirement: Patient data CRU (Update) */}
      <h3>Patient Info</h3>
      <form onSubmit={saveUser} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <input value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit">Save Patient</button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      {/* Requirement: Appointments CRUD + end recurring */}
      <h3>Appointments (Series)</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Start</th>
            <th>Repeat</th>
            <th>End On</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {user.appointments.map((a) => (
            <tr key={a.id}>
              <td>{a.provider}</td>
              <td>{new Date(a.start_datetime).toLocaleString()}</td>
              <td>{a.repeat}</td>
              <td>{a.end_on || "-"}</td>
              <td>{String(a.active)}</td>
              <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => updateAppt(a.id, { active: !a.active })}>
                  Toggle Active
                </button>
                {a.repeat !== "none" && (
                  <button onClick={() => endRecurring(a.id)}>
                    End Recurrence (Today)
                  </button>
                )}
                <button onClick={() => deleteAppt(a.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {user.appointments.length === 0 && (
            <tr>
              <td colSpan="6">No appointments yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h4>Add Appointment</h4>
      <form onSubmit={createAppt} style={{ display: "grid", gap: 8, maxWidth: 620 }}>
        <input placeholder="Provider (free text)" value={provider} onChange={(e) => setProvider(e.target.value)} required />
        <input type="datetime-local" value={startDt} onChange={(e) => setStartDt(e.target.value)} required />
        <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
          <option value="none">none</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
        </select>
        <input type="date" value={endOn} onChange={(e) => setEndOn(e.target.value)} placeholder="End on (optional)" />
        <button type="submit">Create Appointment</button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      {/* Requirement: Prescriptions CRUD (with seeded meds/dosages) */}
      <h3>Prescriptions</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Qty</th>
            <th>Refill On</th>
            <th>Schedule</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {user.prescriptions.map((p) => (
            <tr key={p.id}>
              <td>{p.medication}</td>
              <td>{p.dosage}</td>
              <td>{p.quantity}</td>
              <td>{p.refill_on}</td>
              <td>{p.refill_schedule}</td>
              <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => updateRx(p.id, { quantity: p.quantity + 1 })}>
                  +1 Qty
                </button>
                <button onClick={() => deleteRx(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {user.prescriptions.length === 0 && (
            <tr>
              <td colSpan="6">No prescriptions yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <h4>Add Prescription</h4>
      <form onSubmit={createRx} style={{ display: "grid", gap: 8, maxWidth: 620 }}>
        <select value={med} onChange={(e) => setMed(e.target.value)} required>
          {options.medications.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select value={dosage} onChange={(e) => setDosage(e.target.value)} required>
          {options.dosages.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        <input type="date" value={refillOn} onChange={(e) => setRefillOn(e.target.value)} required />
        <input value={refillSchedule} onChange={(e) => setRefillSchedule(e.target.value)} />
        <button type="submit">Create Prescription</button>
      </form>
    </div>
  );
}
