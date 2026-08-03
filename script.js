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
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

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
    const text = [
      "Bonjour CX Systems,",
      "",
      message || "Je souhaite échanger sur un projet.",
      "",
      name && `Nom / Société : ${name}`,
      email && `E-mail : ${email}`,
      phone && `Téléphone : ${phone}`,
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/212699254247?text=${encodeURIComponent(text)}`;
  };

  waBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(waUrl(), "_blank", "noopener,noreferrer");
  });

  // Close mobile menu when switching to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760 && nav?.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      menuBtn?.setAttribute("aria-expanded", "false");
    }
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
      submitBtn.textContent = "Envoi…";
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
      setStatus("Message envoyé avec succès.", "ok");
      showToast("Message envoyé avec succès");
    } catch {
      setStatus(
        "Envoi impossible pour le moment. Utilisez WhatsApp, merci.",
        "error"
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Envoyer le message";
      }
    }

    return false;
  });

  const revealEls = document.querySelectorAll(
    ".cap, .case, .method-list li, .contact-shell > *"
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
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }
})();
