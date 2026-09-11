"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { i18n, type I18nKey, type Lang } from "@/lib/i18n";
import { statusLabel } from "@/lib/status";
import { projectPhotos } from "@/lib/gallery";

export type PublicProject = {
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
  gallery: string[];
  problem: string;
  problemEn: string;
  solution: string;
  solutionEn: string;
  result: string;
  resultEn: string;
  featured: boolean;
};

const pick = (p: PublicProject, lang: Lang, fr: keyof PublicProject, en: keyof PublicProject) => {
  if (lang === "en" && p[en]) return String(p[en]);
  return String(p[fr] || "");
};

export default function HomeView({ projects }: { projects: PublicProject[] }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [slide, setSlide] = useState(0);
  const [active, setActive] = useState<PublicProject | null>(null);
  const [photo, setPhoto] = useState(0);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"ok" | "error" | "">("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", honey: "" });

  const t = (key: I18nKey) => i18n[lang][key];

  useEffect(() => {
    const saved = (localStorage.getItem("cx-lang") as Lang) || "fr";
    if (saved === "en" || saved === "fr") setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("cx-lang", lang);
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta.desc"));
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const slides = useMemo(
    () => projects.filter((p) => p.image).slice(0, 3),
    [projects]
  );

  const grouped = useMemo(() => {
    const years = Array.from(new Set(projects.map((p) => p.year || "—"))).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (Number.isFinite(na) && Number.isFinite(nb) && a !== "—" && b !== "—") return nb - na;
      return String(b).localeCompare(String(a));
    });
    return years.map((year) => ({
      year,
      items: projects.filter((p) => (p.year || "—") === year),
    }));
  }, [projects]);

  const sectorCount = useMemo(
    () => new Set(projects.map((p) => p.sector).filter(Boolean)).size,
    [projects]
  );

  const openProject = (p: PublicProject) => {
    setActive(p);
    setPhoto(0);
  };

  const activePhotos = active ? projectPhotos(active) : [];

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (!toast) return;
    const tmr = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(tmr);
  }, [toast]);

  const waUrl = () => {
    const isFr = lang === "fr";
    const text = isFr
      ? [
          "Bonjour CX Systems,",
          "",
          form.message || "Je souhaite échanger sur un projet.",
          "",
          form.name && `Nom / Société : ${form.name}`,
          form.email && `E-mail : ${form.email}`,
          form.phone && `Téléphone : ${form.phone}`,
        ]
      : [
          "Hello CX Systems,",
          "",
          form.message || "I would like to discuss a project.",
          "",
          form.name && `Name / Company: ${form.name}`,
          form.email && `Email: ${form.email}`,
          form.phone && `Phone: ${form.phone}`,
        ];
    return `https://wa.me/212699254247?text=${encodeURIComponent(text.filter(Boolean).join("\n"))}`;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          _honey: form.honey,
        }),
      });
      if (!res.ok) throw new Error("fail");
      setForm({ name: "", email: "", phone: "", message: "", honey: "" });
      setStatus(t("form.ok"));
      setStatusType("ok");
      setToast(t("form.toast"));
    } catch {
      setStatus(t("form.err"));
      setStatusType("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <header className={`header${scrolled ? " is-scrolled" : ""}`} id="top">
        <div className="header-inner">
          <a className="logo" href="#top" aria-label="CX Systems">
            <img src="/assets/logo-mark.svg" alt="" width={36} height={36} />
            <span>CX Systems</span>
          </a>
          <nav className={`nav${menuOpen ? " is-open" : ""}`} id="site-nav" aria-label="Principal">
            <a href="#studio" onClick={() => setMenuOpen(false)}>{t("nav.studio")}</a>
            <a href="#work" onClick={() => setMenuOpen(false)}>{t("nav.work")}</a>
            <a href="#craft" onClick={() => setMenuOpen(false)}>{t("nav.craft")}</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>{t("nav.contact")}</a>
            <a href="#contact" className="nav-cta-mobile" onClick={() => setMenuOpen(false)}>
              {t("nav.cta")}
            </a>
          </nav>
          <div className="lang-switch" role="group" aria-label="Language">
            <button type="button" className={`lang-btn${lang === "fr" ? " is-active" : ""}`} onClick={() => setLang("fr")} aria-pressed={lang === "fr"}>
              FR
            </button>
            <button type="button" className={`lang-btn${lang === "en" ? " is-active" : ""}`} onClick={() => setLang("en")} aria-pressed={lang === "en"}>
              EN
            </button>
          </div>
          <a className="header-cta" href="#contact">{t("nav.cta")}</a>
          <button
            className={`menu-btn${menuOpen ? " is-open" : ""}`}
            type="button"
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-stage">
            <p className="stamp">{t("hero.stamp")}</p>
            <p className="hero-brand">CX Systems</p>
            <h1>{t("hero.title")}</h1>
            <p className="hero-lead">{t("hero.lead")}</p>
            <div className="hero-actions">
              <a className="btn btn-ink" href="#work">{t("hero.cta1")}</a>
              <a className="btn btn-ghost" href="#contact">{t("hero.cta2")}</a>
            </div>
          </div>
          <aside className="hero-side">
            <div className="hero-carousel" aria-label="Captures produits">
              {(slides.length ? slides : [{ image: "/assets/shot-fidapp.png", title: "FidApp" }]).map((p, i) => (
                <div key={p.image + i} className={`hero-slide${i === slide ? " is-active" : ""}`}>
                  <img src={p.image} alt={p.title} />
                </div>
              ))}
              {slides.length > 1 && (
                <div className="hero-dots" role="tablist">
                  {slides.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      className={i === slide ? "is-active" : ""}
                      aria-label={p.title}
                      onClick={() => setSlide(i)}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="side-note">{t("hero.side")}</p>
          </aside>
        </section>

        <section className="studio" id="studio">
          <div className="shell studio-grid">
            <div className="studio-label">
              <span className="mono">{t("studio.label")}</span>
            </div>
            <div className="studio-body">
              <h2>{t("studio.title")}</h2>
              <div className="prose">
                <p>{t("studio.p1")}</p>
                <p>{t("studio.p2")}</p>
              </div>
              <dl className="facts">
                <div>
                  <dt>{t("studio.f1t")}</dt>
                  <dd>{t("studio.f1d")}</dd>
                </div>
                <div>
                  <dt>{t("studio.f2t")}</dt>
                  <dd>{t("studio.f2d")}</dd>
                </div>
                <div>
                  <dt>{t("studio.f3t")}</dt>
                  <dd>{t("studio.f3d")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="clients-strip" aria-label="Secteurs">
          <div className="shell">
            <p className="mono">{t("clients.label")}</p>
            <ul className="clients-list">
              <li>{t("clients.1")}</li>
              <li>{t("clients.2")}</li>
              <li>{t("clients.3")}</li>
              <li>{t("clients.4")}</li>
              <li>{t("clients.5")}</li>
              <li>{t("clients.6")}</li>
            </ul>
          </div>
        </section>

        <section className="work" id="work">
          <div className="shell">
            <div className="section-head">
              <span className="mono">{t("work.label")}</span>
              <h2>{t("work.title")}</h2>
              <p className="lede">{t("work.lede")}</p>
              <dl className="work-stats">
                <div>
                  <dt>{t("work.statYears")}</dt>
                  <dd>{t("work.statYearsV")}</dd>
                </div>
                <div>
                  <dt>{t("work.statCount")}</dt>
                  <dd>{projects.length}</dd>
                </div>
                <div>
                  <dt>{t("work.statSectors")}</dt>
                  <dd>{sectorCount}</dd>
                </div>
              </dl>
            </div>
            <div className="work-index">
              {grouped.map((group) => (
                <div key={group.year} className="work-year">
                  <p className="work-year-label">{group.year}</p>
                  {group.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`work-item${p.featured ? " work-item--lead" : ""}`}
                      onClick={() => openProject(p)}
                    >
                      {projectPhotos(p)[0] ? (
                        <div className="work-thumb"><img src={projectPhotos(p)[0]} alt="" /></div>
                      ) : (
                        <div className="work-thumb work-thumb--empty">CX</div>
                      )}
                      <div className="work-body">
                        <div className="work-meta">
                          <span className={`pill pill--${p.status}`}>{statusLabel(p.status, lang)}</span>
                          {projectPhotos(p).length > 1 ? (
                            <span className="year">{projectPhotos(p).length} {t("work.photos")}</span>
                          ) : null}
                        </div>
                        <h3>{p.title}</h3>
                        <p className="work-sector">{pick(p, lang, "sector", "sectorEn")}</p>
                        <p className="work-summary">{pick(p, lang, "summary", "summaryEn")}</p>
                        {p.stack ? <p className="stack">{p.stack}</p> : null}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="craft" id="craft">
          <div className="shell">
            <div className="section-head">
              <span className="mono">{t("craft.label")}</span>
              <h2>{t("craft.title")}</h2>
            </div>
            <div className="craft-rows">
              <article className="craft-row">
                <h3>{t("craft.1.t")}</h3>
                <p>{t("craft.1.p")}</p>
              </article>
              <article className="craft-row">
                <h3>{t("craft.2.t")}</h3>
                <p>{t("craft.2.p")}</p>
              </article>
              <article className="craft-row">
                <h3>{t("craft.3.t")}</h3>
                <p>{t("craft.3.p")}</p>
              </article>
            </div>
            <blockquote className="note">{t("craft.note")}</blockquote>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="shell contact-layout">
            <div className="contact-copy">
              <span className="mono mono-light">{t("contact.label")}</span>
              <h2>{t("contact.title")}</h2>
              <p>{t("contact.lede")}</p>
              <a className="wa-block" href="https://wa.me/212699254247" target="_blank" rel="noopener noreferrer">
                <span>{t("contact.waLabel")}</span>
                <strong>+212 699 254 247</strong>
              </a>
              <div className="social-row">
                <a href="https://www.linkedin.com/in/cx-systems-418985395/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a href="https://www.instagram.com/cx_sys_tems/" target="_blank" rel="noopener noreferrer">Instagram</a>
              </div>
            </div>

            <form className="form" onSubmit={onSubmit} noValidate>
              <input type="text" name="_honey" className="honey" tabIndex={-1} autoComplete="off" value={form.honey} onChange={(e) => setForm({ ...form, honey: e.target.value })} />
              <label>
                <span>{t("form.name")}</span>
                <input required placeholder={t("form.namePh")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                <span>{t("form.email")}</span>
                <input type="email" required placeholder={t("form.emailPh")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label>
                <span>{t("form.phone")}</span> <em>{t("form.phoneOpt")}</em>
                <input type="tel" placeholder={t("form.phonePh")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>
                <span>{t("form.message")}</span>
                <textarea rows={5} required placeholder={t("form.messagePh")} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn btn-ink" disabled={sending}>
                  {sending ? t("form.sending") : t("form.submit")}
                </button>
                <a className="btn btn-ghost" href={waUrl()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
              {status ? (
                <p className={`form-status is-${statusType}`} role="status">{status}</p>
              ) : null}
            </form>
          </div>
        </section>
      </main>

      {active ? (
        <dialog className="project-modal" open onClick={(e) => { if (e.target === e.currentTarget) setActive(null); }}>
          <div className="project-modal-inner">
            <button type="button" className="modal-close" onClick={() => setActive(null)} aria-label="Fermer">×</button>
            <div
              className={`modal-media${activePhotos.length ? "" : " modal-media--empty"}${activePhotos.length > 1 ? " modal-media--cycle" : ""}`}
              onClick={() => {
                if (activePhotos.length > 1) setPhoto((i) => (i + 1) % activePhotos.length);
              }}
            >
              {activePhotos.length ? (
                <img src={activePhotos[photo] || activePhotos[0]} alt={active.title} />
              ) : (
                "CX"
              )}
            </div>
            {activePhotos.length > 1 ? (
              <div className="modal-thumbs" aria-label={t("modal.gallery")}>
                {activePhotos.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    className={i === photo ? "is-active" : ""}
                    onClick={() => setPhoto(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="modal-body">
              <p className="mono">{active.year} · {statusLabel(active.status, lang)} · {pick(active, lang, "sector", "sectorEn")}</p>
              <h3>{active.title}</h3>
              <p className="modal-stack">{active.stack}</p>
              <p className="work-summary">{pick(active, lang, "summary", "summaryEn")}</p>
              <div className="modal-grid">
                <div>
                  <h4>{t("modal.problem")}</h4>
                  <p>{pick(active, lang, "problem", "problemEn")}</p>
                </div>
                <div>
                  <h4>{t("modal.solution")}</h4>
                  <p>{pick(active, lang, "solution", "solutionEn")}</p>
                </div>
                <div>
                  <h4>{t("modal.result")}</h4>
                  <p>{pick(active, lang, "result", "resultEn")}</p>
                </div>
              </div>
            </div>
          </div>
        </dialog>
      ) : null}

      <div className={`toast${toast ? " is-visible" : ""}`} role="status" hidden={!toast}>
        <span className="toast__text">{toast || t("form.toast")}</span>
      </div>

      <footer className="footer">
        <div className="shell footer-row">
          <div>
            <strong>CX Systems</strong>
            <p>{t("footer.line")}</p>
          </div>
          <p className="footer-sign">{t("footer.sign")}</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
