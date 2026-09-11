"use client";

import { FormEvent, useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  sector: string;
  profileImage: string;
  specsPdf: string;
  specsPdfName: string;
  projectDescription: string;
  notes: string;
  _count?: { projects: number };
};

const empty: Partial<Client> = {
  name: "",
  sector: "",
  profileImage: "",
  specsPdf: "",
  specsPdfName: "",
  projectDescription: "",
  notes: "",
};

async function uploadFile(file: File) {
  const data = new FormData();
  data.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: data });
  if (!res.ok) throw new Error("upload");
  return res.json() as Promise<{ url: string; name: string }>;
}

export default function ClientBoard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setClients(await fetch("/api/admin/clients").then((r) => r.json()));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing?.name) return;
    setSaving(true);
    const url = editing.id ? `/api/admin/clients/${editing.id}` : "/api/admin/clients";
    await fetch(url, {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...empty, ...editing }),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-kicker">Privé</p>
          <h1>Clients</h1>
        </div>
        <button type="button" className="copper-btn" onClick={() => setEditing({ ...empty })}>
          + Nouveau client
        </button>
      </header>

      {clients.length === 0 ? (
        <div className="empty-state">Aucun client pour l’instant — les fiches restent hors du site public.</div>
      ) : (
        <div className="card-grid">
          {clients.map((c) => (
            <article key={c.id} className="client-card">
              <div className="client-card-body">
                {c.profileImage ? <img src={c.profileImage} alt="" width={48} height={48} style={{ borderRadius: 8, objectFit: "cover" }} /> : null}
                <h3>{c.name}</h3>
                <p className="muted">{c.sector || "Secteur non renseigné"} · {c._count?.projects || 0} projet(s)</p>
                {c.specsPdfName ? <p className="muted">PDF : {c.specsPdfName}</p> : null}
                <div className="card-actions">
                  <button type="button" className="ghost-btn" onClick={() => setEditing(c)}>Éditer</button>
                  <button type="button" className="danger-btn" onClick={() => remove(c.id)}>Suppr.</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <dialog className="admin-dialog" open onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <form className="dialog-form" onSubmit={save}>
            <h3>{editing.id ? "Éditer le client" : "Nouveau client"}</h3>
            <label>Nom / Société
              <input required value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <label>Secteur
              <input value={editing.sector || ""} onChange={(e) => setEditing({ ...editing, sector: e.target.value })} />
            </label>
            <label>Photo
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { url } = await uploadFile(file);
                setEditing({ ...editing, profileImage: url });
              }} />
            </label>
            {editing.profileImage ? <div className="preview"><img src={editing.profileImage} alt="" /></div> : null}
            <label>Cahier des charges (PDF)
              <input type="file" accept="application/pdf" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const { url, name } = await uploadFile(file);
                setEditing({ ...editing, specsPdf: url, specsPdfName: name });
              }} />
            </label>
            {editing.specsPdfName ? <p className="muted">{editing.specsPdfName}</p> : null}
            <label>Description projet
              <textarea rows={3} value={editing.projectDescription || ""} onChange={(e) => setEditing({ ...editing, projectDescription: e.target.value })} />
            </label>
            <label>Notes internes
              <textarea rows={3} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </label>
            <div className="dialog-actions">
              <button type="submit" className="copper-btn" disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
              <button type="button" className="ghost-btn" onClick={() => setEditing(null)}>Annuler</button>
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  );
}
