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

  // Destination inbox — not shown in the UI
  const inbox = ["a.meziani.dev", "gmail.com"].join("@");
  if (form) {
    form.action = `https://formsubmit.co/${inbox}`;
  }

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
