
//const BASE = "http://127.0.0.1:8000";
// frontend/src/api.js
const BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";


async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/* =========================
   PATIENT PORTAL (Requirement)
   - login
   - summary
   - drill-down pages
========================= */

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
    method: "POST",
  });
  return handle(res);
}

export async function patientSummary(userId) {
  const res = await fetch(`${BASE}/patient/${userId}/summary`);
  return handle(res);
}

export async function patientAppointments(userId) {
  const res = await fetch(`${BASE}/patient/${userId}/appointments`);
  return handle(res);
}

export async function patientPrescriptions(userId) {
  const res = await fetch(`${BASE}/patient/${userId}/prescriptions`);
  return handle(res);
}

/* =========================
   ADMIN / MINI-EMR (Requirement)
   - users table + at-a-glance
   - patient CRU
   - appt CRUD (+ end recurring)
   - rx CRUD (seeded med/dosage)
========================= */

export async function getOptions() {
  const res = await fetch(`${BASE}/meta/options`);
  return handle(res);
}

export async function adminListUsers() {
  const res = await fetch(`${BASE}/admin/users`);
  return handle(res);
}

export async function adminCreateUser(payload) {
  const res = await fetch(`${BASE}/admin/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function adminGetUserDetail(userId) {
  const res = await fetch(`${BASE}/admin/users/${userId}`);
  return handle(res);
}

export async function adminUpdateUser(userId, payload) {
  const res = await fetch(`${BASE}/admin/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function adminCreateAppointment(userId, payload) {
  const res = await fetch(`${BASE}/admin/users/${userId}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function adminUpdateAppointment(appointmentId, payload) {
  const res = await fetch(`${BASE}/admin/appointments/${appointmentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function adminEndRecurring(appointmentId, end_on /* yyyy-mm-dd or null */) {
  const qs = end_on ? `?end_on=${encodeURIComponent(end_on)}` : "";
  const res = await fetch(`${BASE}/admin/appointments/${appointmentId}/end${qs}`, {
    method: "POST",
  });
  return handle(res);
}

export async function adminDeleteAppointment(appointmentId) {
  const res = await fetch(`${BASE}/admin/appointments/${appointmentId}`, { method: "DELETE" });
  return handle(res);
}

export async function adminCreatePrescription(userId, payload) {
  const res = await fetch(`${BASE}/admin/users/${userId}/prescriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function adminUpdatePrescription(prescriptionId, payload) {
  const res = await fetch(`${BASE}/admin/prescriptions/${prescriptionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function adminDeletePrescription(prescriptionId) {
  const res = await fetch(`${BASE}/admin/prescriptions/${prescriptionId}`, { method: "DELETE" });
  return handle(res);
}
