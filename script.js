(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector(".header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".nav");

  const closeMenu = () => {
    nav?.classList.remove("is-open");
    menuBtn?.classList.remove("is-open");
    menuBtn?.setAttribute("aria-expanded", "false");
  };

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = nav.classList.toggle("is-open");
      menuBtn.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || menuBtn.contains(e.target)) return;
      closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  const t = (key) => {
    const lang = window.CX_LANG || "fr";
    return window.CX_I18N?.[lang]?.[key] || window.CX_I18N?.fr?.[key] || key;
  };

  const statusLabel = (status) => {
    const map = {
      live: { fr: "Live", en: "Live" },
      prod: { fr: "Prod", en: "Prod" },
      delivered: { fr: "Livré", en: "Shipped" },
      mission: { fr: "Mission", en: "Mission" },
      wip: { fr: "En cours", en: "In progress" },
    };
    const lang = window.CX_LANG || "fr";
    return map[status]?.[lang] || status;
  };

  let projects = [];

  const pick = (p, frKey, enKey) => {
    const lang = window.CX_LANG || "fr";
    if (lang === "en" && p[enKey]) return p[enKey];
    return p[frKey] || "";
  };

  const modal = document.getElementById("project-modal");
  const openProject = (p) => {
    if (!modal || !p) return;
    const media = document.getElementById("modal-media");
    const meta = document.getElementById("modal-meta");
    const title = document.getElementById("modal-title");
    const stack = document.getElementById("modal-stack");
    if (media) {
      if (p.image) {
        media.className = "modal-media";
        media.innerHTML = `<img src="${p.image}" alt="${p.title}" />`;
      } else {
        media.className = "modal-media modal-media--empty";
        media.textContent = "CX";
      }
    }
    if (meta) {
      meta.textContent = `${p.year || ""} · ${statusLabel(p.status)} · ${pick(p, "sector", "sectorEn")}`;
    }
    if (title) title.textContent = p.title || "";
    if (stack) stack.textContent = p.stack || "";
    const problem = document.getElementById("modal-problem");
    const solution = document.getElementById("modal-solution");
    const result = document.getElementById("modal-result");
    if (problem) problem.textContent = pick(p, "problem", "problemEn");
    if (solution) solution.textContent = pick(p, "solution", "solutionEn");
    if (result) result.textContent = pick(p, "result", "resultEn");
    if (typeof modal.showModal === "function") modal.showModal();
  };

  document.getElementById("modal-close")?.addEventListener("click", () => {
    modal?.close();
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  const renderWork = () => {
    const root = document.getElementById("work-index");
    if (!root) return;
    const sorted = [...projects].sort(
      (a, b) => (a.sortOrder || 99) - (b.sortOrder || 99)
    );
    root.innerHTML = "";
    sorted.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `work-item${p.featured ? " work-item--lead" : ""} reveal`;
      const thumb = p.image
        ? `<div class="work-thumb"><img src="${p.image}" alt="" loading="lazy" /></div>`
        : `<div class="work-thumb work-thumb--empty">CX</div>`;
      btn.innerHTML = `
        ${thumb}
        <div class="work-body">
          <div class="work-meta">
            <span class="year">${p.year || ""}</span>
            <span class="pill pill--${p.status || "mission"}">${statusLabel(p.status)}</span>
          </div>
          <h3>${p.title || ""}</h3>
          <p class="work-sector">${pick(p, "sector", "sectorEn")}</p>
          <p class="work-summary">${pick(p, "summary", "summaryEn")}</p>
          ${p.stack ? `<p class="stack">${p.stack}</p>` : ""}
        </div>
      `;
      btn.addEventListener("click", () => openProject(p));
      root.appendChild(btn);
    });
    observeReveals(root.querySelectorAll(".reveal"));
  };

  window.CX_RENDER_WORK = renderWork;

  const loadProjects = async () => {
    try {
      const res = await fetch("data/projects.json", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch");
      projects = await res.json();
    } catch {
      projects = [];
    }
    renderWork();
  };

  // Hero carousel
  const carousel = document.getElementById("hero-carousel");
  if (carousel) {
    const slides = [...carousel.querySelectorAll(".hero-slide")];
    const dots = [...carousel.querySelectorAll(".hero-dots button")];
    let idx = 0;
    let timer;

    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => go(idx + 1), 4200);
    };

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        go(i);
        start();
      });
    });

    start();
  }

  // Language switch FR / EN
  const savedLang = localStorage.getItem("cx-lang") || "fr";
  if (typeof window.applyCxLang === "function") {
    window.applyCxLang(savedLang);
  }
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (lang && typeof window.applyCxLang === "function") {
        window.applyCxLang(lang);
        renderWork();
      }
    });
  });

  const form = document.getElementById("contact-form");
  const waBtn = document.getElementById("whatsapp-btn");
  const submitBtn = document.getElementById("submit-btn");
  const formStatus = document.getElementById("form-status");
  const toast = document.getElementById("toast");

  // Destination inbox — not shown in the UI
  const inbox = ["a.meziani.dev", "gmail.com"].join("@");

  const waUrl = () => {
    const name = form?.elements.namedItem("name")?.value?.trim() || "";
    const email = form?.elements.namedItem("email")?.value?.trim() || "";
    const phone = form?.elements.namedItem("phone")?.value?.trim() || "";
    const message = form?.elements.namedItem("message")?.value?.trim() || "";
    const isFr = (window.CX_LANG || "fr") === "fr";
    const text = isFr
      ? [
          "Bonjour CX Systems,",
          "",
          message || "Je souhaite échanger sur un projet.",
          "",
          name && `Nom / Société : ${name}`,
          email && `E-mail : ${email}`,
          phone && `Téléphone : ${phone}`,
        ]
      : [
          "Hello CX Systems,",
          "",
          message || "I would like to discuss a project.",
          "",
          name && `Name / Company: ${name}`,
          email && `Email: ${email}`,
          phone && `Phone: ${phone}`,
        ];
    return `https://wa.me/212699254247?text=${encodeURIComponent(
      text.filter(Boolean).join("\n")
    )}`;
  };

  waBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(waUrl(), "_blank", "noopener,noreferrer");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

  const showToast = (message) => {
    if (!toast) return;
    const text = toast.querySelector(".toast__text");
    if (text) text.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.hidden = true;
      }, 280);
    }, 4200);
  };

  const setStatus = (message, type) => {
    if (!formStatus) return;
    formStatus.hidden = !message;
    formStatus.textContent = message || "";
    formStatus.classList.toggle("is-error", type === "error");
    formStatus.classList.toggle("is-ok", type === "ok");
  };

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }

    const data = {
      name: form.elements.namedItem("name")?.value?.trim() || "",
      email: form.elements.namedItem("email")?.value?.trim() || "",
      phone: form.elements.namedItem("phone")?.value?.trim() || "",
      message: form.elements.namedItem("message")?.value?.trim() || "",
      _subject: "Nouveau message — CX Systems",
      _template: "table",
      _captcha: "false",
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t("form.sending");
    }
    setStatus("");

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${inbox}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.success === "false") throw new Error("send_failed");

      form.reset();
      setStatus(t("form.ok"), "ok");
      showToast(t("form.toast"));
    } catch {
      setStatus(t("form.err"), "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t("form.submit");
      }
    }

    return false;
  });

  const observeReveals = (els) => {
    const list = [...els];
    if (!list.length) return;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
      );
      list.forEach((el) => io.observe(el));
    } else {
      list.forEach((el) => el.classList.add("is-in"));
    }
  };

  document
    .querySelectorAll(".craft-row, .studio-body, .contact-layout > *")
    .forEach((el) => el.classList.add("reveal"));
  observeReveals(
    document.querySelectorAll(".craft-row.reveal, .studio-body.reveal, .contact-layout > *.reveal")
  );

  loadProjects();
})();
