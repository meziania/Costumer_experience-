"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  createdAt: string;
};

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then(setLeads);
  }, []);

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-kicker">Inbox</p>
          <h1>Leads</h1>
        </div>
      </header>
      {leads.length === 0 ? (
        <div className="empty-state">Aucun message pour l’instant. Le formulaire du site crée une fiche ici.</div>
      ) : (
        <div>
          {leads.map((l) => (
            <article key={l.id} className="lead-row">
              <strong>{l.name}</strong>
              <span className="muted">
                {l.email}
                {l.phone ? ` · ${l.phone}` : ""} · {l.source} ·{" "}
                {new Date(l.createdAt).toLocaleString("fr-FR")}
              </span>
              <p>{l.message}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
