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

  // Close mobile menu when switching to desktop
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

  const revealEls = document.querySelectorAll(
    ".cap, .case, .method-list li, .contact-shell > *, .client-card"
  );
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
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
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
    const store = window.CX_STORE || { clients: [], projects: [] };
    const work = document.getElementById("work-list");
    const clientsWrap = document.getElementById("client-list");
    const clientsSec = document.getElementById("clients");
    const navClients = document.getElementById("nav-clients");
    const footerClients = document.querySelectorAll(".footer-clients");
    const dict = window.CX_I18N?.[window.CX_LANG || "fr"] || {};

    if (work) {
      const projects = (store.projects || []).filter((p) => p.published !== false);
      work.innerHTML = projects
        .map((p, i) => {
          const featuredId = projects.find((item) => item.featured)?.id;
          const featured = p.featured || (!featuredId && i === 0);
          const photos = (p.photos || []).filter(Boolean);
          const tags = (p.tags || []).map((tag) => `<li>${esc(tag)}</li>`).join("");
          const wip = /développ|wip|dev/i.test(p.status || "");
          const visual = photos.length
            ? `<div class="case-visual"><button type="button" class="case-photo" data-photo="${esc(photos[0])}"><img src="${esc(photos[0])}" alt=""></button>${
                photos.length > 1
                  ? `<div class="case-thumbs">${photos
                      .map((src) => `<button type="button" data-photo="${esc(src)}"><img src="${esc(src)}" alt=""></button>`)
                      .join("")}</div>`
                  : ""
              }</div>`
            : featured
              ? `<div class="case-visual" aria-hidden="true"><div class="mock"><div class="mock-stat"><strong>128</strong><span>${esc(
                  dict["case.mock.visits"] || ""
                )}</span></div><div class="mock-stat"><strong>42</strong><span>${esc(
                  dict["case.mock.points"] || ""
                )}</span></div><div class="mock-row"></div><div class="mock-row mock-row--short"></div></div></div>`
              : "";
          const copy = `
            <p class="case-sector">${esc(pick(p, "sector", "sectorEn"))}</p>
            <h3>${esc(pick(p, "title", "titleEn"))}</h3>
            <p>${esc(pick(p, "description", "descriptionEn"))}</p>
            ${tags ? `<ul class="tags">${tags}</ul>` : ""}`;
          if (featured) {
            return `<article class="case case--hero reveal is-in">
              <div class="case-top"><span class="case-num">${pad(i + 1)}</span><span class="case-status">${esc(pick(p, "status", "statusEn"))}</span></div>
              <div class="case-body"><div class="case-copy">${copy}</div>${visual}</div>
            </article>`;
          }
          return `<article class="case reveal is-in">
            <div class="case-top"><span class="case-num">${pad(i + 1)}</span><span class="case-status${wip ? " case-status--wip" : ""}">${esc(pick(p, "status", "statusEn"))}</span></div>
            ${copy}
            ${photos[0] ? `<button type="button" class="case-inline-photo" data-photo="${esc(photos[0])}"><img src="${esc(photos[0])}" alt=""></button>` : ""}
          </article>`;
        })
        .join("");
    }

    const clients = (store.clients || []).filter((c) => c.published !== false);
    const showClients = clients.length > 0;
    if (clientsSec) clientsSec.hidden = !showClients;
    if (navClients) navClients.hidden = !showClients;
    footerClients.forEach((el) => {
      el.hidden = !showClients;
    });
    if (clientsWrap) {
      clientsWrap.innerHTML = clients
        .map(
          (c) => `<article class="client-card reveal is-in">
            <div class="client-profile">${c.profileImage ? `<img src="${esc(c.profileImage)}" alt="">` : `<span>${esc((c.name || "C").slice(0, 1))}</span>`}</div>
            <div>
              <h3>${esc(c.name)}</h3>
              <p>${esc(c.needClean || c.need)}</p>
            </div>
          </article>`
        )
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
        window.CX_STORE = { clients: [], projects: [] };
      }
    }
    window.renderCxCatalog();
  })();
})();
