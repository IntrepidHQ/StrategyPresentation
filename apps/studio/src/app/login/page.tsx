"use client";

// ============================================================
//  SP Studio — Login Page
//  apps/studio/src/app/login/page.tsx
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Set cookie and redirect — middleware will validate
    document.cookie = `sp_studio_session=${pass}; path=/; samesite=strict`;
    // Trigger a navigation to let middleware check
    router.push("/");
    // If middleware rejects, it'll redirect back here
    setTimeout(() => {
      if (window.location.pathname === "/login") setError(true);
    }, 300);
  }

  return (
    <div style={s.root}>
      <form onSubmit={handleSubmit} style={s.card}>
        <p style={s.eyebrow}>Private</p>
        <h1 style={s.title}>SP Studio</h1>
        <p style={s.sub}>strategypresentation.com internal tool</p>
        <input
          type="password"
          value={pass}
          onChange={(e) => { setPass(e.target.value); setError(false); }}
          placeholder="Passphrase"
          style={{ ...s.input, borderColor: error ? "#f87171" : "#2a2a2a" }}
          autoFocus
        />
        {error && <p style={s.err}>Incorrect passphrase</p>}
        <button type="submit" style={s.btn}>Enter Studio</button>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "40px", width: "360px", display: "flex", flexDirection: "column", gap: "12px" },
  eyebrow: { fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C9A44C", textAlign: "center", margin: 0 },
  title: { fontSize: "24px", fontWeight: 700, color: "#fff", textAlign: "center", margin: 0, letterSpacing: "-0.02em" },
  sub: { fontSize: "13px", color: "#555", textAlign: "center", margin: "0 0 8px" },
  input: { background: "#0a0a0a", border: "1px solid", borderRadius: "8px", color: "#fff", fontSize: "14px", padding: "12px 16px", outline: "none", fontFamily: "inherit", letterSpacing: "0.06em" },
  err: { fontSize: "12px", color: "#f87171", textAlign: "center", margin: 0 },
  btn: { padding: "12px", background: "#C9A44C", border: "none", borderRadius: "8px", color: "#0a0a08", fontSize: "14px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" },
};
