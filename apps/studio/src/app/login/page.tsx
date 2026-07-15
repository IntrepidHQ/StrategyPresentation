"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: pass }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-root">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card-inner">
          <div className="brand-lockup">
            <span className="brand-mark">SP</span>
            <div>
              <p className="brand-title">Strategy Presentation Studio</p>
              <p className="brand-subtitle">Private review environment</p>
            </div>
          </div>

          <div>
            <p className="eyebrow">Private</p>
            <h1 className="login-title">Studio access</h1>
            <p className="login-copy">Enter the studio passphrase.</p>
          </div>

          <input
            autoFocus
            className={`field ${error ? "danger-border" : ""}`}
            onChange={(event) => {
              setPass(event.target.value);
              setError(false);
            }}
            placeholder="Passphrase"
            type="password"
            value={pass}
          />
          {error && <p className="login-error">Incorrect passphrase</p>}
          <button className="btn btn-primary btn-block" disabled={submitting} type="submit">
            {submitting ? "Checking..." : "Enter Studio"}
          </button>
        </div>
      </form>
    </main>
  );
}
