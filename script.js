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

  if (typeof window.applyCxLang === "function") {
    window.applyCxLang("fr");
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

  const fieldValue = (name) => form?.elements.namedItem(name)?.value?.trim() || "";

  const fieldLabel = (name) => {
    const el = form?.elements.namedItem(name);
    if (!el || el.tagName !== "SELECT" || !el.value) return "";
    return el.selectedOptions[0]?.textContent?.trim() || "";
  };

  const brief = () => {
    const isFr = (window.CX_LANG || "fr") === "fr";
    const name = fieldValue("name");
    const company = fieldValue("company");
    const email = fieldValue("email");
    const phone = fieldValue("phone");
    const city = fieldValue("city");
    const need = fieldLabel("need");
    const current = fieldLabel("current");
    const when = fieldLabel("when");
    const message = fieldValue("message");
    const lines = isFr
      ? [
          `Nouveau brief — ${company || name || "CX Systems"}`,
          "",
          "Contact",
          name && `Nom : ${name}`,
          company && `Société : ${company}`,
          email && `E-mail : ${email}`,
          phone && `Téléphone : ${phone}`,
          city && `Ville : ${city}`,
          "",
          "Besoin",
          need && `Offre : ${need}`,
          current && `Outil actuel : ${current}`,
          when && `Échéance : ${when}`,
          "",
          "Problème à résoudre",
          message,
        ]
      : [
          `New brief — ${company || name || "CX Systems"}`,
          "",
          "Contact",
          name && `Name: ${name}`,
          company && `Company: ${company}`,
          email && `Email: ${email}`,
          phone && `Phone: ${phone}`,
          city && `City: ${city}`,
          "",
          "Need",
          need && `Offer: ${need}`,
          current && `Current tool: ${current}`,
          when && `Timeline: ${when}`,
          "",
          "Problem to solve",
          message,
        ];
    return {
      name,
      company,
      email,
      phone,
      city,
      need,
      current,
      when,
      message,
      letter: lines.filter((line) => line !== false).join("\n").replace(/\n{3,}/g, "\n\n"),
    };
  };

  const waUrl = () => {
    const data = brief();
    const isFr = (window.CX_LANG || "fr") === "fr";
    const text = [
      isFr ? "Bonjour CX Systems," : "Hello CX Systems,",
      "",
      data.letter || (isFr ? "Je souhaite échanger sur un projet." : "I would like to discuss a project."),
    ];
    return `https://wa.me/212699254247?text=${encodeURIComponent(text.join("\n"))}`;
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

    const data = brief();
    const subject = data.need
      ? `Brief — ${data.need} — ${data.company || data.name}`
      : `Nouveau brief — ${data.company || data.name || "CX Systems"}`;
    const payload = {
      name: data.name,
      email: data.email,
      _replyto: data.email,
      _subject: subject,
      _template: "basic",
      _captcha: "false",
      message: data.letter,
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
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === "false") throw new Error("send_failed");

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
      const projects = (store.projects || [])
        .filter((p) => p.published === true)
        .slice()
        .sort((a, b) => {
          const af = a.featured ? 1 : 0;
          const bf = b.featured ? 1 : 0;
          if (bf !== af) return bf - af;
          const ap = (a.photos || []).length ? 1 : 0;
          const bp = (b.photos || []).length ? 1 : 0;
          return bp - ap;
        });
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

    const reelShots = (store.projects || [])
      .filter((p) => p.published === true)
      .flatMap((p) =>
        (p.photos || [])
          .filter(Boolean)
          .slice(0, 1)
          .map((src) => ({ src, title: pick(p, "title", "titleEn") }))
      )
      .slice(0, 8);
    window.CX_HERO_SHOTS = reelShots;
    renderHeroReel(reelShots);

    if (offersWrap) {
      const offers = (store.offers || []).filter((o) => o.published === true);
      offersWrap.innerHTML = offers
        .map((o, i) => {
          const details = pick(o, "details", "detailsEn");
          return `<article class="offer-card reveal is-in">
            <span class="offer-idx">${pad(i + 1)}</span>
            <h3>${esc(pick(o, "title", "titleEn"))}</h3>
            <p>${esc(pick(o, "description", "descriptionEn"))}</p>
            ${details ? `<p class="offer-details">${esc(details)}</p>` : ""}
            <a class="offer-cta" href="#contact">${esc(dict["offers.cta"] || "En parler")}</a>
          </article>`;
        })
        .join("");
    }
  };

  let heroReelTimer = 0;
  let heroReelIndex = 0;

  function showHeroShot(index) {
    const shots = window.CX_HERO_SHOTS || [];
    if (!shots.length) return;
    heroReelIndex = ((index % shots.length) + shots.length) % shots.length;
    const shot = shots[heroReelIndex];
    const frame = document.getElementById("hero-reel-frame");
    const img = document.getElementById("hero-reel-img");
    const title = document.getElementById("hero-reel-title");
    if (img) {
      img.src = shot.src;
      img.alt = shot.title;
    }
    if (title) title.textContent = shot.title;
    if (frame) {
      frame.dataset.photo = shot.src;
      frame.classList.remove("is-swap");
      void frame.offsetWidth;
      frame.classList.add("is-swap");
    }
    document.querySelectorAll(".hero-reel__thumb").forEach((thumb, i) => {
      thumb.classList.toggle("is-active", i % shots.length === heroReelIndex);
    });
  }

  function renderHeroReel(shots) {
    const track = document.getElementById("hero-reel-track");
    if (!track) return;
    window.clearInterval(heroReelTimer);
    if (!shots.length) {
      track.innerHTML = "";
      return;
    }
    const cell = (shot, i) =>
      `<button type="button" class="hero-reel__thumb" data-reel-index="${i}" data-photo="${esc(shot.src)}" aria-label="${esc(shot.title)}">
        <img src="${esc(shot.src)}" alt="" />
      </button>`;
    track.innerHTML = `${shots.map(cell).join("")}${shots.map(cell).join("")}`;
    showHeroShot(0);
    if (shots.length > 1) {
      heroReelTimer = window.setInterval(() => showHeroShot(heroReelIndex + 1), 4200);
    }
  }

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
  document.getElementById("hero-reel")?.addEventListener("click", (e) => {
    const thumb = e.target.closest("[data-reel-index]");
    if (thumb) {
      showHeroShot(Number(thumb.getAttribute("data-reel-index")));
      return;
    }
    const frame = e.target.closest("[data-photo]");
    if (frame) openPhoto(frame.getAttribute("data-photo"));
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
        if (res.ok) {
          const raw = await res.json();
          // Fichier brut : n’afficher que ce qui est explicitement publié dans l’admin
          window.CX_STORE = {
            projects: (raw.projects || []).filter((p) => p.published === true),
            offers: (raw.offers || []).filter((o) => o.published === true),
          };
        }
      } catch {
        window.CX_STORE = { projects: [], offers: [] };
      }
    }
    // Ne pas fusionner localStorage ici : l’admin a sa copie privée ;
    // le site public ne montre que l’API / le store publié.
    window.renderCxCatalog();
  })();
})();
