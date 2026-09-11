"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await signIn("credentials", { password, redirect: false });
    setLoading(false);
    if (res?.ok) router.push("/admin");
    else setError(true);
  };

  return (
    <div className="login-view">
      <form className="login-card" onSubmit={onSubmit}>
        <img src="/assets/logo-mark.svg" alt="" width={48} height={48} />
        <h1>CX Systems Admin</h1>
        <p>Espace privé — projets, clients, leads</p>
        <label>
          Mot de passe
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>{loading ? "…" : "Entrer"}</button>
        {error ? <p className="login-err">Mot de passe incorrect</p> : null}
        <a className="back-link" href="/">← Retour au site</a>
      </form>
    </div>
  );
}
