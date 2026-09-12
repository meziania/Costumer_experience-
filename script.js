(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector(".header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav") || document.querySelector(".nav");

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

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });

  const t = (key) => {
    const lang = window.CX_LANG || "fr";
    return window.CX_I18N?.[lang]?.[key] || window.CX_I18N?.fr?.[key] || key;
  };

  const savedLang = localStorage.getItem("cx-lang") || "fr";
  if (typeof window.applyCxLang === "function") {
    window.applyCxLang(savedLang);
  }
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang");
      if (lang && typeof window.applyCxLang === "function") {
        window.applyCxLang(lang);
      }
    });
  });

  const form = document.getElementById("contact-form");
  const waBtn = document.getElementById("whatsapp-btn");
  const submitBtn = document.getElementById("submit-btn");
  const formStatus = document.getElementById("form-status");
  const toast = document.getElementById("toast");
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

  const revealEls = document.querySelectorAll(".offer-card, .case, .method-list li, .contact-shell > *");
  revealEls.forEach((el) => el.classList.add("reveal"));

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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
    window.cxObserve = (els) => {
      els.forEach((el) => {
        el.classList.add("reveal");
        io.observe(el);
      });
    };
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
    window.cxObserve = (els) => els.forEach((el) => el.classList.add("reveal", "is-in"));
  }

  const esc = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const pick = (item, fr, en) => {
    const lang = window.CX_LANG || "fr";
    if (lang === "en" && item[en]) return item[en];
    return item[fr] || item[en] || "";
  };

  const pad = (n) => String(n).padStart(2, "0");

  window.renderCxCatalog = function renderCxCatalog() {
    const store = window.CX_STORE || { projects: [], offers: [] };
    const work = document.getElementById("work-list");
    const offersWrap = document.getElementById("offer-list");
    const dict = window.CX_I18N?.[window.CX_LANG || "fr"] || {};

    if (work) {
      const projects = (store.projects || []).filter((p) => p.published !== false);
      work.innerHTML = projects
        .map((p) => {
          const photos = (p.photos || []).filter(Boolean);
          const wip = /développ|wip|dev/i.test(p.status || "");
          const photo = photos[0]
            ? `<button type="button" class="case-cover" data-photo="${esc(photos[0])}"><img src="${esc(photos[0])}" alt=""></button>`
            : "";
          return `<article class="case reveal is-in">
            ${photo}
            <div class="case-body">
              <p class="case-sector">${esc(pick(p, "sector", "sectorEn"))}</p>
              <h3>${esc(pick(p, "title", "titleEn"))}</h3>
              <p>${esc(pick(p, "description", "descriptionEn"))}</p>
              <p class="case-status${wip ? " case-status--wip" : ""}">${esc(pick(p, "status", "statusEn"))}</p>
            </div>
          </article>`;
        })
        .join("");
    }

    if (offersWrap) {
      const offers = (store.offers || []).filter((o) => o.published !== false);
      offersWrap.innerHTML = offers
        .map((o, i) => `<article class="offer-card reveal is-in">
            <span class="offer-idx">${pad(i + 1)}</span>
            <h3>${esc(pick(o, "title", "titleEn"))}</h3>
            <p>${esc(pick(o, "description", "descriptionEn"))}</p>
            <a class="offer-cta" href="#contact">${esc(dict["offers.cta"] || "En parler")}</a>
          </article>`)
        .join("");
    }
  };

  const openPhoto = (src) => {
    const modal = document.getElementById("photo-modal");
    const img = document.getElementById("photo-modal-img");
    if (!modal || !img || !src) return;
    img.src = src;
    modal.showModal();
  };

  document.getElementById("work-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-photo]");
    if (btn) openPhoto(btn.getAttribute("data-photo"));
  });
  document.getElementById("photo-modal-close")?.addEventListener("click", () => {
    document.getElementById("photo-modal")?.close();
  });
  document.getElementById("photo-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "photo-modal") e.currentTarget.close();
  });

  (async () => {
    try {
      const res = await fetch("/api/store");
      if (res.ok) window.CX_STORE = await res.json();
    } catch {
      /* fallback below */
    }
    if (!window.CX_STORE) {
      try {
        const res = await fetch("data/store.json");
        if (res.ok) window.CX_STORE = await res.json();
      } catch {
        window.CX_STORE = { projects: [], offers: [] };
      }
    }
    try {
      const local = localStorage.getItem("cx-store");
      if (local) {
        const parsed = JSON.parse(local);
        const incoming = window.CX_STORE || { projects: [], offers: [] };
        parsed.projects = (parsed.projects || []).map((project) => {
          if (project.photos?.length) return project;
          const fresh = (incoming.projects || []).find((item) => item.id === project.id);
          return fresh?.photos?.length ? { ...project, photos: fresh.photos } : project;
        });
        if (!parsed.offers?.length && incoming.offers?.length) {
          parsed.offers = incoming.offers;
        }
        window.CX_STORE = parsed;
      }
    } catch {
      /* keep fetched store */
    }
    window.renderCxCatalog();
  })();
})();
