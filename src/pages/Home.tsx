import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { api } from "../api";
import type { Me } from "../types";

export default function Home() {
  const auth = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = auth.user?.access_token;
    if (!token) return;
    api.me(token).then(setMe).catch((e) => setError(e.message));
  }, [auth.user]);

  return (
    <section>
      <h1>Welcome</h1>
      {error && <p className="error">{error}</p>}
      {me ? (
        <ul>
          <li><b>Subject:</b> {me.subject}</li>
          <li><b>Email:</b> {me.email}</li>
          <li><b>Roles:</b> {me.roles.join(", ") || "—"}</li>
        </ul>
      ) : (
        <p>Loading your identity…</p>
      )}
    </section>
  );
}