"use client";

import { FormEvent, useEffect, useState } from "react";
import { parseGallery, projectPhotos } from "@/lib/gallery";
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
  gallery: string[] | string;
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
  gallery: [],
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

function withPhotos(project: Partial<Project>, urls: string[]): Partial<Project> {
  return { ...project, image: urls[0] || "", gallery: urls };
}

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
  const [uploading, setUploading] = useState(false);

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
    const photos = projectPhotos({ image: editing.image, gallery: editing.gallery });
    const payload = { ...empty, ...editing, image: photos[0] || "", gallery: photos };
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
        <button type="button" className="copper-btn" onClick={() => setEditing({ ...empty, gallery: [] })}>
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
              <div className={`proj-card-media${projectPhotos(p)[0] ? "" : " empty"}`}>
                {projectPhotos(p)[0] ? <img src={projectPhotos(p)[0]} alt="" /> : "CX"}
              </div>
              <div className="proj-card-body">
                <div className="proj-meta">
                  <span className={`pill pill--${p.status}`}>{statusLabel(p.status)}</span>
                  <span className="year">{p.year}</span>
                  {projectPhotos(p).length ? (
                    <span className="photo-count">{projectPhotos(p).length} photo{projectPhotos(p).length > 1 ? "s" : ""}</span>
                  ) : null}
                </div>
                <h3>{p.title}</h3>
                <p className="stack-line">{p.stack || p.sector}</p>
                <label className="toggle">
                  <input type="checkbox" checked={p.published} onChange={() => togglePublish(p)} />
                  {p.published ? "Publié" : "Brouillon"}
                </label>
                <div className="card-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setEditing({ ...p, gallery: parseGallery(p.gallery) })}
                  >
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
            <div className="gallery-editor">
              <label>
                Photos du projet
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploading}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    if (!files.length || !editing) return;
                    setUploading(true);
                    try {
                      const uploaded: string[] = [];
                      for (const file of files) {
                        const { url } = await uploadFile(file);
                        uploaded.push(url);
                      }
                      const next = [...projectPhotos(editing), ...uploaded];
                      setEditing(withPhotos(editing, next));
                    } catch {
                      alert("Impossible d'envoyer une ou plusieurs photos.");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
              <p className="gallery-hint">
                Plusieurs images. La première est la couverture du site. Formats PNG, JPG, WebP — 8 Mo max.
              </p>
              {uploading ? <p className="gallery-hint">Envoi des photos…</p> : null}
              {projectPhotos(editing).length ? (
                <div className="gallery-grid">
                  {projectPhotos(editing).map((src, i) => (
                    <div key={src + i} className={`gallery-item${i === 0 ? " is-cover" : ""}`}>
                      <img src={src} alt="" />
                      <div className="gallery-item-actions">
                        {i === 0 ? (
                          <span>Couverture</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const photos = projectPhotos(editing);
                              const next = [photos[i], ...photos.filter((_, idx) => idx !== i)];
                              setEditing(withPhotos(editing, next));
                            }}
                          >
                            Couverture
                          </button>
                        )}
                        <button
                          type="button"
                          className="danger-text"
                          onClick={() => {
                            const next = projectPhotos(editing).filter((_, idx) => idx !== i);
                            setEditing(withPhotos(editing, next));
                          }}
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
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
              <button type="submit" className="copper-btn" disabled={saving || uploading}>{saving ? "…" : "Enregistrer"}</button>
              <button type="button" className="ghost-btn" onClick={() => setEditing(null)}>Annuler</button>
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  );
}
