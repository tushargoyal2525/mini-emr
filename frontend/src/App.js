
//import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import { HashRouter as Router } from "react-router-dom";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import PatientDashboard from "./PatientDashboard";
import PatientAppointments from "./PatientAppointments";
import PatientPrescriptions from "./PatientPrescriptions";
import Admin from "./Admin";
import AdminUserDetail from "./AdminUserDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Requirement: Patient Portal resides at root "/" */}
        <Route path="/" element={<Login />} />

        {/* Patient pages */}
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/appointments" element={<PatientAppointments />} />
        <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />

        {/* Requirement: Mini-EMR resides at "/admin" and does not require auth */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
