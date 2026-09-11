"use client";

import { FormEvent, useEffect, useState } from "react";
import { STATUS_OPTIONS, statusLabel } from "@/lib/status";

type Project = {
  id: string;
  slug: string;
  title: string;
  year: string;
  status: string;
  sector: string;
  sectorEn: string;
  summary: string;
  summaryEn: string;
  stack: string;
  image: string;
  problem: string;
  problemEn: string;
  solution: string;
  solutionEn: string;
  result: string;
  resultEn: string;
  featured: boolean;
  published: boolean;
  notes: string;
  clientId: string | null;
};

type Client = { id: string; name: string };

const empty: Partial<Project> = {
  title: "",
  year: "",
  status: "mission",
  sector: "",
  sectorEn: "",
  summary: "",
  summaryEn: "",
  stack: "",
  image: "",
  problem: "",
  problemEn: "",
  solution: "",
  solutionEn: "",
  result: "",
  resultEn: "",
  featured: false,
  published: true,
  notes: "",
  clientId: null,
};

async function uploadFile(file: File) {
  const data = new FormData();
  data.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: data });
  if (!res.ok) throw new Error("upload");
  return res.json() as Promise<{ url: string }>;
}

export default function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, c] = await Promise.all([
      fetch("/api/admin/projects").then((r) => r.json()),
      fetch("/api/admin/clients").then((r) => r.json()),
    ]);
    setProjects(p);
    setClients(c);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing?.title) return;
    setSaving(true);
    const payload = { ...empty, ...editing };
    const url = editing.id ? `/api/admin/projects/${editing.id}` : "/api/admin/projects";
    const method = editing.id ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const togglePublish = async (p: Project) => {
    await fetch(`/api/admin/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce projet ?")) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    load();
  };

  const published = projects.filter((p) => p.published).length;

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-kicker">Atelier</p>
          <h1>Projets</h1>
        </div>
        <button type="button" className="copper-btn" onClick={() => setEditing({ ...empty })}>
          + Nouveau projet
        </button>
      </header>

      <div className="admin-stats">
        <div className="admin-stat">
          <b>{projects.length}</b>
          <span>Total</span>
        </div>
        <div className="admin-stat">
          <b>{published}</b>
          <span>Publiés sur le site</span>
        </div>
        <div className="admin-stat">
          <b>{projects.length - published}</b>
          <span>Brouillons</span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">Aucun projet. Ajoute FidApp ou un nouveau livrable.</div>
      ) : (
        <div className="card-grid">
          {projects.map((p) => (
            <article key={p.id} className="proj-card">
              <div className={`proj-card-media${p.image ? "" : " empty"}`}>
                {p.image ? <img src={p.image} alt="" /> : "CX"}
              </div>
              <div className="proj-card-body">
                <div className="proj-meta">
                  <span className={`pill pill--${p.status}`}>{statusLabel(p.status)}</span>
                  <span className="year">{p.year}</span>
                </div>
                <h3>{p.title}</h3>
                <p className="stack-line">{p.stack || p.sector}</p>
                <label className="toggle">
                  <input type="checkbox" checked={p.published} onChange={() => togglePublish(p)} />
                  {p.published ? "Publié" : "Brouillon"}
                </label>
                <div className="card-actions">
                  <button type="button" className="ghost-btn" onClick={() => setEditing(p)}>
                    Éditer
                  </button>
                  <button type="button" className="danger-btn" onClick={() => remove(p.id)}>
                    Suppr.
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing ? (
        <dialog className="admin-dialog" open onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <form className="dialog-form" onSubmit={save}>
            <h3>{editing.id ? "Éditer le projet" : "Nouveau projet"}</h3>
            <label>
              Titre
              <input required value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </label>
            <div className="row2">
              <label>
                Année
                <input value={editing.year || ""} onChange={(e) => setEditing({ ...editing, year: e.target.value })} />
              </label>
              <label>
                Statut
                <select value={editing.status || "mission"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Secteur (FR)
              <input value={editing.sector || ""} onChange={(e) => setEditing({ ...editing, sector: e.target.value })} />
            </label>
            <label>
              Secteur (EN)
              <input value={editing.sectorEn || ""} onChange={(e) => setEditing({ ...editing, sectorEn: e.target.value })} />
            </label>
            <label>
              Résumé FR
              <textarea rows={3} value={editing.summary || ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
            </label>
            <label>
              Résumé EN
              <textarea rows={3} value={editing.summaryEn || ""} onChange={(e) => setEditing({ ...editing, summaryEn: e.target.value })} />
            </label>
            <label>
              Stack
              <input value={editing.stack || ""} onChange={(e) => setEditing({ ...editing, stack: e.target.value })} />
            </label>
            <div className="row2">
              <label>
                Problème FR
                <textarea rows={2} value={editing.problem || ""} onChange={(e) => setEditing({ ...editing, problem: e.target.value })} />
              </label>
              <label>
                Problème EN
                <textarea rows={2} value={editing.problemEn || ""} onChange={(e) => setEditing({ ...editing, problemEn: e.target.value })} />
              </label>
            </div>
            <div className="row2">
              <label>
                Solution FR
                <textarea rows={2} value={editing.solution || ""} onChange={(e) => setEditing({ ...editing, solution: e.target.value })} />
              </label>
              <label>
                Solution EN
                <textarea rows={2} value={editing.solutionEn || ""} onChange={(e) => setEditing({ ...editing, solutionEn: e.target.value })} />
              </label>
            </div>
            <div className="row2">
              <label>
                Résultat FR
                <textarea rows={2} value={editing.result || ""} onChange={(e) => setEditing({ ...editing, result: e.target.value })} />
              </label>
              <label>
                Résultat EN
                <textarea rows={2} value={editing.resultEn || ""} onChange={(e) => setEditing({ ...editing, resultEn: e.target.value })} />
              </label>
            </div>
            <label>
              Client lié
              <select value={editing.clientId || ""} onChange={(e) => setEditing({ ...editing, clientId: e.target.value || null })}>
                <option value="">— Aucun —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Image
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const { url } = await uploadFile(file);
                  setEditing({ ...editing, image: url });
                }}
              />
            </label>
            {editing.image ? (
              <div className="preview"><img src={editing.image} alt="" /></div>
            ) : null}
            <label>
              Notes internes
              <textarea rows={2} value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </label>
            <label className="check">
              <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
              Mis en avant
            </label>
            <label className="check">
              <input type="checkbox" checked={editing.published !== false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
              Publié sur le site
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
