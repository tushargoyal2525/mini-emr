

import { useEffect, useState } from "react";
import { adminListUsers, adminCreateUser } from "./api";

export default function Admin() {
  // Requirement: Admin interface at /admin
  // - Table of users with at-a-glance data
  // - New patient form (Create)
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");

  // New patient form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");

  async function refresh() {
    setErr("");
    try {
      const rows = await adminListUsers();
      setUsers(rows);
    } catch {
      setErr("Failed to load users. Is backend running?");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createPatient(e) {
    e.preventDefault();
    setErr("");
    try {
      await adminCreateUser({ name, email, password });
      setName("");
      setEmail("");
      setPassword("Password123!");
      await refresh();
    } catch (ex) {
      setErr("Could not create user (email may already exist).");
    }
  }

  return (
    //<div style={{ maxWidth: 1000, margin: "30px auto", fontFamily: "Arial" }}>
    <div className="page-container">

      <h2>Mini-EMR Admin (No Authentication)</h2>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* Requirement: New patient form */}
      <h3>Create New Patient</h3>
      <form onSubmit={createPatient} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Create Patient</button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      {/* Requirement: Users table + at-a-glance data + drill-down */}
      <h3>Patients</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Total Appts</th>
            <th>Total Rx</th>
            <th>Appts Next 7d</th>
            <th>Refills Next 7d</th>
            <th>Manage</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.appointments_total}</td>
              <td>{u.prescriptions_total}</td>
              <td>{u.appointments_next_7_days}</td>
              <td>{u.refills_next_7_days}</td>
              <td>
                <button onClick={() => (window.location.href = `/admin/users/${u.id}`)}>
                  View / Manage
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="7">No users found. Run seed or create one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

