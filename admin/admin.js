(() => {
  // Change this password after first login if needed
  const ADMIN_PASSWORD = "cxadmin2024";
  const SK_AUTH = "cx_admin_auth";
  const SK_PROJECTS = "cx_admin_projects";
  const SK_CLIENTS = "cx_admin_clients";

  const loginView = document.getElementById("login-view");
  const app = document.getElementById("app");
  const loginForm = document.getElementById("login-form");
  const loginErr = document.getElementById("login-err");

  const projectDialog = document.getElementById("project-dialog");
  const clientDialog = document.getElementById("client-dialog");

  let projects = [];
  let clients = [];
  let pImageData = "";
  let cProfileData = "";
  let cPdfData = "";
  let cPdfName = "";

  const uid = () =>
    crypto.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const loadJSON = async (url, fallback) => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch");
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const saveLocal = () => {
    localStorage.setItem(SK_PROJECTS, JSON.stringify(projects));
    localStorage.setItem(SK_CLIENTS, JSON.stringify(clients));
  };

  const statusLabel = (s) =>
    ({
      live: "Live",
      prod: "Prod",
      delivered: "Livré",
      mission: "Mission",
      wip: "En cours",
    }[s] || s);

  const ensureAuth = () => sessionStorage.getItem(SK_AUTH) === "1";

  const showApp = async () => {
    loginView.hidden = true;
    app.hidden = false;

    const localP = localStorage.getItem(SK_PROJECTS);
    const localC = localStorage.getItem(SK_CLIENTS);

    if (localP) {
      projects = JSON.parse(localP);
    } else {
      projects = await loadJSON("../data/projects.json", []);
      saveLocal();
    }

    if (localC) {
      clients = JSON.parse(localC);
    } else {
      clients = await loadJSON("../data/clients.json", []);
      saveLocal();
    }

    renderProjects();
    renderClients();
    fillClientSelect();
  };

  const showLogin = () => {
    sessionStorage.removeItem(SK_AUTH);
    app.hidden = true;
    loginView.hidden = false;
  };

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pass = document.getElementById("login-pass").value;
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem(SK_AUTH, "1");
      loginErr.hidden = true;
      showApp();
    } else {
      loginErr.hidden = false;
    }
  });

  document.getElementById("logout-btn")?.addEventListener("click", showLogin);

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add("is-active");
    });
  });

  const renderProjects = () => {
    const body = document.getElementById("projects-body");
    if (!body) return;
    const sorted = [...projects].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    body.innerHTML = sorted
      .map(
        (p) => `
      <tr>
        <td><strong>${escapeHtml(p.title || "")}</strong></td>
        <td><span class="pill pill-${escapeHtml(p.status || "mission")}">${statusLabel(p.status)}</span></td>
        <td>${escapeHtml(p.year || "")}</td>
        <td class="actions">
          <button type="button" data-edit-p="${p.id}">Éditer</button>
          <button type="button" class="danger" data-del-p="${p.id}">Suppr.</button>
        </td>
      </tr>`
      )
      .join("");

    body.querySelectorAll("[data-edit-p]").forEach((btn) => {
      btn.addEventListener("click", () => openProject(btn.getAttribute("data-edit-p")));
    });
    body.querySelectorAll("[data-del-p]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Supprimer ce projet ?")) return;
        projects = projects.filter((p) => p.id !== btn.getAttribute("data-del-p"));
        saveLocal();
        renderProjects();
      });
    });
  };

  const renderClients = () => {
    const body = document.getElementById("clients-body");
    if (!body) return;
    body.innerHTML = clients
      .map(
        (c) => `
      <tr>
        <td><strong>${escapeHtml(c.name || "")}</strong></td>
        <td>${escapeHtml(c.sector || "—")}</td>
        <td>${c.specsPdf ? "Oui" : "—"}</td>
        <td class="actions">
          <button type="button" data-edit-c="${c.id}">Éditer</button>
          <button type="button" class="danger" data-del-c="${c.id}">Suppr.</button>
        </td>
      </tr>`
      )
      .join("");

    body.querySelectorAll("[data-edit-c]").forEach((btn) => {
      btn.addEventListener("click", () => openClient(btn.getAttribute("data-edit-c")));
    });
    body.querySelectorAll("[data-del-c]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Supprimer ce client ?")) return;
        clients = clients.filter((c) => c.id !== btn.getAttribute("data-del-c"));
        saveLocal();
        renderClients();
        fillClientSelect();
      });
    });
  };

  const fillClientSelect = () => {
    const sel = document.getElementById("p-client");
    if (!sel) return;
    sel.innerHTML =
      `<option value="">— Aucun —</option>` +
      clients
        .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
        .join("");
  };

  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const openProject = (id) => {
    const p = id ? projects.find((x) => x.id === id) : null;
    document.getElementById("project-dialog-title").textContent = p ? "Éditer projet" : "Nouveau projet";
    document.getElementById("p-id").value = p?.id || "";
    document.getElementById("p-title").value = p?.title || "";
    document.getElementById("p-year").value = p?.year || "";
    document.getElementById("p-status").value = p?.status || "mission";
    document.getElementById("p-sector").value = p?.sector || "";
    document.getElementById("p-summary").value = p?.summary || "";
    document.getElementById("p-stack").value = p?.stack || "";
    document.getElementById("p-problem").value = p?.problem || "";
    document.getElementById("p-solution").value = p?.solution || "";
    document.getElementById("p-result").value = p?.result || "";
    document.getElementById("p-featured").checked = !!p?.featured;
    fillClientSelect();
    document.getElementById("p-client").value = p?.clientId || "";
    pImageData = p?.image || "";
    const prev = document.getElementById("p-image-preview");
    prev.innerHTML = pImageData ? `<img src="${pImageData}" alt="" />` : "";
    document.getElementById("p-image").value = "";
    projectDialog.showModal();
  };

  const openClient = (id) => {
    const c = id ? clients.find((x) => x.id === id) : null;
    document.getElementById("client-dialog-title").textContent = c ? "Éditer client" : "Nouveau client";
    document.getElementById("c-id").value = c?.id || "";
    document.getElementById("c-name").value = c?.name || "";
    document.getElementById("c-sector").value = c?.sector || "";
    document.getElementById("c-project-desc").value = c?.projectDescription || "";
    document.getElementById("c-notes").value = c?.notes || "";
    cProfileData = c?.profileImage || "";
    cPdfData = c?.specsPdf || "";
    cPdfName = c?.specsPdfName || "";
    document.getElementById("c-profile-preview").innerHTML = cProfileData
      ? `<img src="${cProfileData}" alt="" />`
      : "";
    document.getElementById("c-pdf-name").textContent = cPdfName || (cPdfData ? "PDF enregistré" : "");
    document.getElementById("c-profile").value = "";
    document.getElementById("c-pdf").value = "";
    clientDialog.showModal();
  };

  document.getElementById("add-project")?.addEventListener("click", () => openProject(null));
  document.getElementById("add-client")?.addEventListener("click", () => openClient(null));
  document.getElementById("p-cancel")?.addEventListener("click", () => projectDialog.close());
  document.getElementById("c-cancel")?.addEventListener("click", () => clientDialog.close());

  document.getElementById("p-image")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pImageData = await readFileAsDataURL(file);
    document.getElementById("p-image-preview").innerHTML = `<img src="${pImageData}" alt="" />`;
  });

  document.getElementById("c-profile")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cProfileData = await readFileAsDataURL(file);
    document.getElementById("c-profile-preview").innerHTML = `<img src="${cProfileData}" alt="" />`;
  });

  document.getElementById("c-pdf")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cPdfData = await readFileAsDataURL(file);
    cPdfName = file.name;
    document.getElementById("c-pdf-name").textContent = cPdfName;
  });

  document.getElementById("project-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("p-id").value || uid();
    const payload = {
      id,
      title: document.getElementById("p-title").value.trim(),
      year: document.getElementById("p-year").value.trim(),
      status: document.getElementById("p-status").value,
      sector: document.getElementById("p-sector").value.trim(),
      sectorEn: document.getElementById("p-sector").value.trim(),
      summary: document.getElementById("p-summary").value.trim(),
      summaryEn: document.getElementById("p-summary").value.trim(),
      stack: document.getElementById("p-stack").value.trim(),
      problem: document.getElementById("p-problem").value.trim(),
      problemEn: document.getElementById("p-problem").value.trim(),
      solution: document.getElementById("p-solution").value.trim(),
      solutionEn: document.getElementById("p-solution").value.trim(),
      result: document.getElementById("p-result").value.trim(),
      resultEn: document.getElementById("p-result").value.trim(),
      clientId: document.getElementById("p-client").value || null,
      image: pImageData,
      featured: document.getElementById("p-featured").checked,
      sortOrder: projects.find((p) => p.id === id)?.sortOrder ?? projects.length + 1,
    };
    const idx = projects.findIndex((p) => p.id === id);
    if (idx >= 0) projects[idx] = payload;
    else projects.push(payload);
    saveLocal();
    renderProjects();
    projectDialog.close();
  });

  document.getElementById("client-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("c-id").value || uid();
    const payload = {
      id,
      name: document.getElementById("c-name").value.trim(),
      sector: document.getElementById("c-sector").value.trim(),
      profileImage: cProfileData,
      specsPdf: cPdfData,
      specsPdfName: cPdfName,
      projectDescription: document.getElementById("c-project-desc").value.trim(),
      notes: document.getElementById("c-notes").value.trim(),
    };
    const idx = clients.findIndex((c) => c.id === id);
    if (idx >= 0) clients[idx] = payload;
    else clients.push(payload);
    saveLocal();
    renderClients();
    fillClientSelect();
    clientDialog.close();
  });

  const download = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("export-projects")?.addEventListener("click", () => {
    download("projects.json", projects);
    const msg = document.getElementById("publish-msg");
    msg.hidden = false;
    msg.textContent = "Exporté. Remplace data/projects.json puis push GitHub.";
  });

  document.getElementById("export-clients")?.addEventListener("click", () => {
    download("clients.json", clients);
    const msg = document.getElementById("publish-msg");
    msg.hidden = false;
    msg.textContent = "clients.json exporté (privé — ne pas exposer sur le site).";
  });

  document.getElementById("import-json")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("format");
      if (file.name.includes("client")) {
        clients = data;
      } else {
        projects = data;
      }
      saveLocal();
      renderProjects();
      renderClients();
      fillClientSelect();
      const msg = document.getElementById("publish-msg");
      msg.hidden = false;
      msg.textContent = "Import réussi.";
    } catch {
      alert("Fichier JSON invalide");
    }
    e.target.value = "";
  });

  if (ensureAuth()) showApp();
})();
