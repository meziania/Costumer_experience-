(() => {
  const TOKEN_KEY = "cx-admin-token";
  const loginView = document.getElementById("login-view");
  const appView = document.getElementById("app-view");
  const editor = document.getElementById("editor");
  const editorForm = document.getElementById("editor-form");

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const LOCAL_KEY = "cx-store";
  const LOCAL_PASS = "cxadmin2024";
  let token = sessionStorage.getItem(TOKEN_KEY) || "";
  let localMode = token === "local";
  let store = { clients: [], projects: [], offers: [] };
  let mode = null;
  let currentId = null;

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const uid = () => `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;

  const WORK_STATUSES = [
    ["new", "Nouveau"],
    ["discovery", "Cadrage"],
    ["design", "Conception"],
    ["build", "En construction"],
    ["launch", "Mise en production"],
    ["live", "En production"],
    ["support", "Suivi"],
    ["paused", "En pause"],
    ["done", "Terminé"],
  ];

  const statusLabel = (id) => WORK_STATUSES.find((item) => item[0] === id)?.[1] || "Nouveau";

  const statusOptions = (selected) =>
    WORK_STATUSES.map(
      ([id, label]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${label}</option>`
    ).join("");

  const workRowHtml = (work) => `
    <div class="work-row" data-work-row data-work-id="${esc(work.id || uid())}">
      <label>Projet / livrable
        <input name="workTitle" value="${esc(work.title)}" placeholder="Ex. Caisse 2R Parts" />
      </label>
      <label>Statut d’évolution
        <select name="workStatus">${statusOptions(work.status || "new")}</select>
      </label>
      <label>Note interne
        <input name="workNote" value="${esc(work.note)}" placeholder="Prochaine étape, blocage…" />
      </label>
      <button type="button" class="danger" data-remove-work>Retirer</button>
    </div>`;

  const collectWorks = () =>
    [...editorForm.querySelectorAll("[data-work-row]")].map((row) => ({
      id: row.getAttribute("data-work-id") || uid(),
      title: row.querySelector("[name='workTitle']")?.value.trim() || "",
      status: row.querySelector("[name='workStatus']")?.value || "new",
      note: row.querySelector("[name='workNote']")?.value.trim() || "",
    })).filter((item) => item.title || item.note);

  const esc = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const snippet = (value) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > 110 ? `${text.slice(0, 107)}…` : text;
  };

  function localReformulate(raw) {
    const text = String(raw || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const body = part.charAt(0).toUpperCase() + part.slice(1);
        return /[.!?]$/.test(body) ? body : `${body}.`;
      });
    return ["Besoin client (reformulé)", "", sentences.join(" ")].join("\n");
  }

  async function readImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      const canvas = document.createElement("canvas");
      const max = 1400;
      let { width, height } = img;
      if (width > max) {
        height = Math.round((height * max) / width);
        width = max;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.82);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function extractPdf(file) {
    if (!window.pdfjsLib) throw new Error("pdf");
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [];
    const max = Math.min(pdf.numPages, 12);
    for (let i = 1; i <= max; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n\n").replace(/[ \t]+/g, " ").trim();
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function loadStore() {
    if (!localMode) {
      try {
        const res = await fetch("/api/store", { headers: headers() });
        if (res.ok) {
          store = await res.json();
          store.clients = store.clients || [];
          store.projects = store.projects || [];
          store.offers = store.offers || [];
          localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
          return;
        }
      } catch {
        /* fallback */
      }
    }
    const cached = localStorage.getItem(LOCAL_KEY);
    if (cached) {
      store = JSON.parse(cached);
    } else {
      const res = await fetch("/data/store.json");
      store = res.ok ? await res.json() : { clients: [], projects: [], offers: [] };
    }
    store.clients = store.clients || [];
    store.projects = store.projects || [];
    store.offers = store.offers || [];
  }

  async function saveStore() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
    if (localMode) return;
    try {
      const res = await fetch("/api/store", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(store),
      });
      if (res.ok) store = await res.json();
    } catch {
      /* keep local copy */
    }
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    document.querySelectorAll("[data-tab], #logout").forEach((el) => {
      el.hidden = false;
    });
    render();
  }

  function render() {
    document.getElementById("client-list").innerHTML = store.clients
      .map((c) => {
        const works = Array.isArray(c.works) ? c.works : [];
        const workLine = works.length
          ? works
              .map((w) => `<span class="status-pill status-pill--${esc(w.status || "new")}">${esc(statusLabel(w.status))}${w.title ? ` · ${esc(w.title)}` : ""}</span>`)
              .join("")
          : `<span class="status-pill status-pill--new">Aucun projet suivi</span>`;
        return `
      <article class="case">
        ${c.profileImage ? `<img class="admin-thumb" src="${esc(c.profileImage)}" alt="">` : ""}
        <p class="case-sector">Dossier privé</p>
        <h3>${esc(c.name) || "Sans nom"}</h3>
        <p>${esc(snippet(c.needClean || c.need) || "Besoin non renseigné")}</p>
        <div class="status-row">${workLine}</div>
        <div class="case-actions">
          <button class="ghost" data-edit-client="${esc(c.id)}">Éditer</button>
          <button class="danger" data-del-client="${esc(c.id)}">Suppr.</button>
        </div>
      </article>`;
      })
      .join("") || `<p class="lede">Aucun client. Les dossiers restent privés — ils n’apparaissent jamais sur le site.</p>`;

    document.getElementById("project-list").innerHTML = store.projects
      .map(
        (p) => `
      <article class="case">
        ${p.photos?.[0] ? `<img class="admin-thumb" src="${esc(p.photos[0])}" alt="">` : ""}
        <p class="case-sector">${esc(p.sector) || (p.published === false ? "Brouillon" : "Publié")}</p>
        <h3>${esc(p.title) || "Sans titre"}</h3>
        <p>${esc(snippet(p.description) || "Pas de description")}</p>
        <div class="case-actions">
          <button class="ghost" data-edit-project="${esc(p.id)}">Éditer</button>
          <button class="danger" data-del-project="${esc(p.id)}">Suppr.</button>
        </div>
      </article>`
      )
      .join("") || `<p class="lede">Aucun projet. Ajoutez un titre, une description et des photos.</p>`;

    document.getElementById("offer-list").innerHTML = store.offers
      .map(
        (o) => `
      <article class="case">
        <p class="case-sector">${o.published === false ? "Brouillon" : "Publié"}</p>
        <h3>${esc(o.title) || "Sans titre"}</h3>
        <p>${esc(snippet(o.description) || "Pas de description")}</p>
        <div class="case-actions">
          <button class="ghost" data-edit-offer="${esc(o.id)}">Éditer</button>
          <button class="danger" data-del-offer="${esc(o.id)}">Suppr.</button>
        </div>
      </article>`
      )
      .join("") || `<p class="lede">Aucune offre. Ajoutez un titre, une description et le détail.</p>`;
  }

  function closeEditor() {
    editor.close();
    editorForm.innerHTML = "";
    mode = null;
    currentId = null;
  }

  function openClient(client) {
    mode = "client";
    currentId = client.id;
    editorForm.innerHTML = `
      <h3>${client.name ? "Éditer le client" : "Nouveau client"}</h3>
      <label>Nom du client / société
        <input name="name" required value="${esc(client.name)}" />
      </label>
      <label>Photo de profil
        <input type="file" accept="image/*" name="profile" />
      </label>
      <div>${client.profileImage ? `<img class="profile-preview" src="${esc(client.profileImage)}" alt="">` : ""}</div>
      <label>Description complète du besoin
        <textarea name="need" rows="7">${esc(client.need)}</textarea>
      </label>
      <p class="hint">Collez le besoin tel quel, ou importez un PDF de spécifications. L’IA le reformule ensuite.</p>
      <label>Importer un PDF
        <input type="file" accept="application/pdf" name="pdf" />
      </label>
      <p class="hint" id="pdf-name">${client.pdfName ? `Fichier : ${esc(client.pdfName)}` : ""}</p>
      <label>Besoin reformulé
        <textarea name="needClean" rows="7">${esc(client.needClean)}</textarea>
      </label>
      <div class="actions">
        <button type="button" class="ghost-btn" id="ai-btn">Reformuler avec l’IA</button>
      </div>
      <p class="hint">Projets de ce client — suivi interne, jamais publié.</p>
      <div id="client-works">${(client.works || []).map(workRowHtml).join("") || workRowHtml({ id: uid(), title: "", status: "new", note: "" })}</div>
      <div class="actions">
        <button type="button" class="ghost-btn" id="add-work">+ Ajouter un projet</button>
      </div>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editorForm.dataset.profile = client.profileImage || "";
    editorForm.dataset.pdfName = client.pdfName || "";
    editorForm.dataset.pdfData = client.pdfData || "";
    editor.showModal();
  }

  function openProject(project) {
    mode = "project";
    currentId = project.id;
    const photos = project.photos || [];
    editorForm.innerHTML = `
      <h3>${project.title ? "Éditer le projet" : "Nouveau projet"}</h3>
      <label>Titre
        <input name="title" required value="${esc(project.title)}" />
      </label>
      <label>Titre (EN)
        <input name="titleEn" value="${esc(project.titleEn)}" />
      </label>
      <label>Description
        <textarea name="description" rows="5" required>${esc(project.description)}</textarea>
      </label>
      <label>Description (EN)
        <textarea name="descriptionEn" rows="4">${esc(project.descriptionEn)}</textarea>
      </label>
      <div class="row2">
        <label>Statut
          <input name="status" value="${esc(project.status)}" />
        </label>
        <label>Secteur
          <input name="sector" value="${esc(project.sector)}" />
        </label>
      </div>
      <label>Tags (séparés par une virgule)
        <input name="tags" value="${esc((project.tags || []).join(", "))}" />
      </label>
      <label>Photos du projet
        <input type="file" accept="image/*" name="photos" multiple />
      </label>
      <div class="thumbs" id="photo-thumbs">${photos
        .map(
          (src, i) =>
            `<div class="shot"><img src="${esc(src)}" alt=""><button type="button" data-remove-photo="${i}">Retirer</button></div>`
        )
        .join("")}</div>
      <label class="check"><input type="checkbox" name="featured" ${project.featured ? "checked" : ""} /> Mettre en avant</label>
      <label class="check"><input type="checkbox" name="published" ${project.published !== false ? "checked" : ""} /> Afficher sur le site</label>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editorForm.dataset.photos = JSON.stringify(photos);
    editor.showModal();
  }

  function openOffer(offer) {
    mode = "offer";
    currentId = offer.id;
    editorForm.innerHTML = `
      <h3>${offer.title ? "Éditer l’offre" : "Nouvelle offre"}</h3>
      <label>Titre
        <input name="title" required value="${esc(offer.title)}" />
      </label>
      <label>Titre (EN)
        <input name="titleEn" value="${esc(offer.titleEn)}" />
      </label>
      <label>Description
        <textarea name="description" rows="5" required>${esc(offer.description)}</textarea>
      </label>
      <label>Description (EN)
        <textarea name="descriptionEn" rows="4">${esc(offer.descriptionEn)}</textarea>
      </label>
      <label>Détail (optionnel)
        <textarea name="details" rows="4">${esc(offer.details)}</textarea>
      </label>
      <label>Détail (EN)
        <textarea name="detailsEn" rows="3">${esc(offer.detailsEn)}</textarea>
      </label>
      <label class="check"><input type="checkbox" name="published" ${offer.published !== false ? "checked" : ""} /> Afficher sur le site</label>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editor.showModal();
  }

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const err = document.getElementById("login-err");
    const btn = document.getElementById("login-btn");
    err.hidden = true;
    const password = document.getElementById("login-pass").value;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Entrée…";
    }

    const enter = async (nextToken, local) => {
      token = nextToken;
      localMode = local;
      sessionStorage.setItem(TOKEN_KEY, nextToken);
      await loadStore();
      showApp();
    };

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        await enter(data.token, false);
        return;
      }
      if (password === LOCAL_PASS) {
        await enter("local", true);
        return;
      }
      err.hidden = false;
    } catch {
      if (password === LOCAL_PASS) {
        await enter("local", true);
      } else {
        err.hidden = false;
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Entrer";
      }
    }
  });

  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);
    token = "";
    location.reload();
  });

  document.querySelectorAll(".nav-tab[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab[data-tab]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const tab = btn.getAttribute("data-tab");
      document.getElementById("tab-clients").hidden = tab !== "clients";
      document.getElementById("tab-projects").hidden = tab !== "projects";
      document.getElementById("tab-offers").hidden = tab !== "offers";
    });
  });

  document.getElementById("new-client").addEventListener("click", () => {
    openClient({ id: uid(), name: "", need: "", needClean: "", works: [] });
  });
  document.getElementById("new-project").addEventListener("click", () => {
    openProject({
      id: uid(),
      title: "",
      description: "",
      photos: [],
      tags: [],
      published: true,
      featured: false,
    });
  });
  document.getElementById("new-offer").addEventListener("click", () => {
    openOffer({
      id: uid(),
      title: "",
      titleEn: "",
      description: "",
      descriptionEn: "",
      details: "",
      detailsEn: "",
      published: true,
    });
  });

  document.getElementById("client-list").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit-client]");
    const del = e.target.closest("[data-del-client]");
    if (edit) {
      const item = store.clients.find((c) => c.id === edit.getAttribute("data-edit-client"));
      if (item) openClient(item);
    }
    if (del && confirm("Supprimer ce client ?")) {
      store.clients = store.clients.filter((c) => c.id !== del.getAttribute("data-del-client"));
      await saveStore();
      render();
    }
  });

  document.getElementById("offer-list").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit-offer]");
    const del = e.target.closest("[data-del-offer]");
    if (edit) {
      const item = store.offers.find((o) => o.id === edit.getAttribute("data-edit-offer"));
      if (item) openOffer(item);
    }
    if (del && confirm("Supprimer cette offre ?")) {
      store.offers = store.offers.filter((o) => o.id !== del.getAttribute("data-del-offer"));
      await saveStore();
      render();
    }
  });

  document.getElementById("project-list").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit-project]");
    const del = e.target.closest("[data-del-project]");
    if (edit) {
      const item = store.projects.find((p) => p.id === edit.getAttribute("data-edit-project"));
      if (item) openProject(item);
    }
    if (del && confirm("Supprimer ce projet ?")) {
      store.projects = store.projects.filter((p) => p.id !== del.getAttribute("data-del-project"));
      await saveStore();
      render();
    }
  });

  editor.addEventListener("click", (e) => {
    if (e.target === editor) closeEditor();
  });

  editorForm.addEventListener("click", async (e) => {
    if (e.target.id === "cancel") {
      e.preventDefault();
      closeEditor();
      return;
    }
    if (e.target.id === "add-work") {
      e.preventDefault();
      const wrap = document.getElementById("client-works");
      if (wrap) wrap.insertAdjacentHTML("beforeend", workRowHtml({ id: uid(), title: "", status: "new", note: "" }));
      return;
    }
    const dropWork = e.target.closest("[data-remove-work]");
    if (dropWork) {
      e.preventDefault();
      dropWork.closest("[data-work-row]")?.remove();
      return;
    }
    const remove = e.target.closest("[data-remove-photo]");
    if (remove) {
      const photos = JSON.parse(editorForm.dataset.photos || "[]");
      photos.splice(Number(remove.getAttribute("data-remove-photo")), 1);
      editorForm.dataset.photos = JSON.stringify(photos);
      openProject({
        id: currentId,
        title: editorForm.title.value,
        titleEn: editorForm.titleEn.value,
        description: editorForm.description.value,
        descriptionEn: editorForm.descriptionEn.value,
        status: editorForm.status.value,
        sector: editorForm.sector.value,
        tags: editorForm.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
        photos,
        featured: editorForm.featured.checked,
        published: editorForm.published.checked,
      });
    }
    if (e.target.id === "ai-btn") {
      e.preventDefault();
      const need = editorForm.need.value.trim();
      if (!need) {
        alert("Ajoutez d’abord le besoin (texte ou PDF).");
        return;
      }
      e.target.disabled = true;
      e.target.textContent = "Reformulation…";
      try {
        const res = await fetch("/api/rewrite", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ text: need }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.text) throw new Error("rewrite");
        editorForm.needClean.value = data.text;
      } catch {
        editorForm.needClean.value = localReformulate(need);
      } finally {
        e.target.disabled = false;
        e.target.textContent = "Reformuler avec l’IA";
      }
    }
  });

  editorForm.addEventListener("change", async (e) => {
    const input = e.target;
    if (input.name === "profile" && input.files?.[0]) {
      editorForm.dataset.profile = await readImage(input.files[0]);
      const preview = editorForm.querySelector(".profile-preview");
      if (preview) preview.src = editorForm.dataset.profile;
      else {
        const wrap = document.createElement("div");
        wrap.innerHTML = `<img class="profile-preview" src="${editorForm.dataset.profile}" alt="">`;
        input.parentElement.after(wrap);
      }
    }
    if (input.name === "photos" && input.files?.length) {
      const photos = JSON.parse(editorForm.dataset.photos || "[]");
      for (const file of Array.from(input.files)) {
        photos.push(await readImage(file));
      }
      editorForm.dataset.photos = JSON.stringify(photos);
      const item = store.projects.find((p) => p.id === currentId) || {};
      openProject({
        ...item,
        id: currentId,
        title: editorForm.title.value,
        titleEn: editorForm.titleEn.value,
        description: editorForm.description.value,
        descriptionEn: editorForm.descriptionEn.value,
        status: editorForm.status.value,
        sector: editorForm.sector.value,
        tags: editorForm.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
        photos,
        featured: editorForm.featured.checked,
        published: editorForm.published.checked,
      });
    }
    if (input.name === "pdf" && input.files?.[0]) {
      const file = input.files[0];
      document.getElementById("pdf-name").textContent = `Lecture de ${file.name}…`;
      try {
        const extracted = await extractPdf(file);
        if (extracted) {
          editorForm.need.value = [editorForm.need.value.trim(), extracted].filter(Boolean).join("\n\n");
        }
        editorForm.dataset.pdfName = file.name;
        if (file.size < 1.8 * 1024 * 1024) {
          editorForm.dataset.pdfData = await fileToDataUrl(file);
        }
        document.getElementById("pdf-name").textContent = `Fichier : ${file.name}`;
      } catch {
        document.getElementById("pdf-name").textContent = "Impossible de lire ce PDF.";
      }
    }
  });

  editorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mode === "client") {
      const next = {
        id: currentId,
        name: editorForm.name.value.trim(),
        profileImage: editorForm.dataset.profile || "",
        need: editorForm.need.value.trim(),
        needClean: editorForm.needClean.value.trim(),
        pdfName: editorForm.dataset.pdfName || "",
        pdfData: editorForm.dataset.pdfData || "",
        works: collectWorks(),
      };
      const idx = store.clients.findIndex((c) => c.id === currentId);
      if (idx >= 0) store.clients[idx] = next;
      else store.clients.unshift(next);
    }
    if (mode === "project") {
      const next = {
        id: currentId,
        title: editorForm.title.value.trim(),
        titleEn: editorForm.titleEn.value.trim(),
        description: editorForm.description.value.trim(),
        descriptionEn: editorForm.descriptionEn.value.trim(),
        status: editorForm.status.value.trim(),
        sector: editorForm.sector.value.trim(),
        tags: editorForm.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
        photos: JSON.parse(editorForm.dataset.photos || "[]"),
        featured: editorForm.featured.checked,
        published: editorForm.published.checked,
      };
      const idx = store.projects.findIndex((p) => p.id === currentId);
      if (idx >= 0) store.projects[idx] = { ...store.projects[idx], ...next };
      else store.projects.unshift(next);
    }
    if (mode === "offer") {
      const next = {
        id: currentId,
        title: editorForm.title.value.trim(),
        titleEn: editorForm.titleEn.value.trim(),
        description: editorForm.description.value.trim(),
        descriptionEn: editorForm.descriptionEn.value.trim(),
        details: editorForm.details.value.trim(),
        detailsEn: editorForm.detailsEn.value.trim(),
        published: editorForm.published.checked,
      };
      const idx = store.offers.findIndex((o) => o.id === currentId);
      if (idx >= 0) store.offers[idx] = { ...store.offers[idx], ...next };
      else store.offers.unshift(next);
    }
    await saveStore();
    closeEditor();
    render();
  });

  if (token) {
    localMode = token === "local";
    loadStore()
      .then(showApp)
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        token = "";
      });
  }
})();
