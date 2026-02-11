// import { useState } from "react";
// import { login } from "./api";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const submit = async () => {
//     const user = await login(email, password);
//     //alert(`Welcome ${user.name}`);
//     // alert(
//     //     `Welcome ${user.name}\nAppointments: ${user.appointments}\nPrescriptions: ${user.prescriptions}`
//     //   );
//     alert(
//         `Welcome ${user.name} | Appointments: ${user.appointments.map(a => `${a.provider} @ ${a.datetime}`).join(', ')} | Prescriptions: ${user.prescriptions.map(p => p.medication).join(', ')}`
//       );
      
      
//   };

//   return (
//     <div>
//       <h2>Patient Login</h2>
//       <input onChange={e => setEmail(e.target.value)} placeholder="Email" />
//       <input onChange={e => setPassword(e.target.value)} type="password" />
//       <button onClick={submit}>Login</button>
//     </div>
//   );
// }

//New:

import { useState } from "react";
import { login } from "./api";

export default function Login() {
  // Requirement: Login form at "/" with email/password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const u = await login(email, password);
      localStorage.setItem("patient", JSON.stringify(u));
      window.location.href = "/patient";
    } catch (ex) {
      setErr("Invalid email or password (or backend not reachable).");
    }
  }

  return (
    //<div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "Arial" }}>
    <div className="page-container">

      <h2>Patient Portal Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <hr />
      <p>
        Admin EMR: go to <b>/admin</b> (no login required).
      </p>
    </div>
  );
}

