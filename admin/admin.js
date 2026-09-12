(() => {
  const TOKEN_KEY = "cx-admin-token";
  const loginView = document.getElementById("login-view");
  const appView = document.getElementById("app-view");
  const editor = document.getElementById("editor");
  const editorForm = document.getElementById("editor-form");
  const quoteSheet = document.getElementById("quote-sheet");
  const quoteSheetBody = document.getElementById("quote-sheet-body");

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
  let selectedClientId = null;
  let clientPane = "infos";
  let editingQuoteId = null;
  let editingWorkId = null;
  let editingInvoiceId = null;

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

  const QUOTE_STATUSES = [
    ["draft", "Brouillon"],
    ["sent", "Envoyé"],
    ["accepted", "Accepté"],
    ["rejected", "Refusé"],
    ["paid", "Payé"],
  ];

  const BILLING = [
    ["fixed", "Forfait"],
    ["monthly", "Mensuel"],
    ["hourly", "Horaire"],
  ];

  const statusLabel = (id) => WORK_STATUSES.find((item) => item[0] === id)?.[1] || "Nouveau";
  const quoteStatusLabel = (id) => QUOTE_STATUSES.find((item) => item[0] === id)?.[1] || "Brouillon";
  const billingLabel = (id) => BILLING.find((item) => item[0] === id)?.[1] || "Forfait";

  const statusOptions = (selected) =>
    WORK_STATUSES.map(
      ([id, label]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${label}</option>`
    ).join("");

  const quoteStatusOptions = (selected) =>
    QUOTE_STATUSES.map(
      ([id, label]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${label}</option>`
    ).join("");

  const billingOptions = (selected) =>
    BILLING.map(
      ([id, label]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${label}</option>`
    ).join("");

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

  const money = (amount, currency = "MAD") => {
    const n = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: currency === "EUR" ? "EUR" : currency === "USD" ? "USD" : "MAD",
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  };

  const initials = (name) =>
    String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "?";

  const stageBars = (step) => {
    const current = Math.min(4, Math.max(1, step));
    return `<div class="stage">${[1, 2, 3, 4]
      .map((i) => `<i class="${i < current ? "done" : i === current ? "now" : ""}"></i>`)
      .join("")}</div>`;
  };

  const workPill = (status) =>
    ({
      new: "grey",
      discovery: "amber",
      design: "blue",
      build: "violet",
      launch: "teal",
      live: "green",
      support: "teal",
      paused: "grey",
      done: "green",
    }[status] || "grey");

  const quotePill = (status) =>
    ({ draft: "grey", sent: "blue", accepted: "green", rejected: "red", paid: "teal" }[status] || "grey");

  const invoicePill = (status) =>
    ({ draft: "grey", sent: "blue", partial: "amber", paid: "green", overdue: "red" }[status] || "grey");

  const normalizeClient = (c = {}) => ({
    id: c.id || uid(),
    name: c.name || "",
    company: c.company || "",
    email: c.email || "",
    phone: c.phone || "",
    city: c.city || "",
    address: c.address || "",
    ice: c.ice || "",
    profileImage: c.profileImage || "",
    need: c.need || "",
    needClean: c.needClean || "",
    pdfName: c.pdfName || "",
    pdfData: c.pdfData || "",
    works: Array.isArray(c.works) ? c.works : [],
    quotes: Array.isArray(c.quotes) ? c.quotes : [],
    invoices: Array.isArray(c.invoices) ? c.invoices : [],
    history: Array.isArray(c.history) ? c.history : [],
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
  });

  const getClient = (id) => store.clients.find((c) => c.id === id);

  const quoteTotals = (quote) => {
    const lines = Array.isArray(quote?.lines) ? quote.lines : [];
    const ht = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0), 0);
    const taxRate = Number(quote?.taxRate);
    const rate = Number.isFinite(taxRate) ? taxRate : 20;
    const tva = (ht * rate) / 100;
    return { ht, tva, ttc: ht + tva, rate };
  };

  const clientBudget = (client) =>
    (client.works || []).reduce((sum, w) => sum + (Number(w.price) || 0), 0);

  const clientQuotesValue = (client) =>
    (client.quotes || []).reduce((sum, q) => {
      if (q.status === "rejected") return sum;
      return sum + quoteTotals(q).ttc;
    }, 0);

  function clientJourney(client) {
    const works = client.works || [];
    const quotes = client.quotes || [];
    const hasIdentity = Boolean(client.name && (client.email || client.phone || client.company));
    const hasNeed = Boolean(String(client.needClean || client.need || "").trim());
    const priced = works.find((w) => Number(w.price) > 0);
    const openQuote = quotes.find((q) => q.status === "draft" || q.status === "sent");
    const won = quotes.some((q) => q.status === "accepted" || q.status === "paid");

    if (!hasIdentity) {
      return {
        step: 1,
        label: "Fiche à compléter",
        next: "Renseignez le contact et la société — ils figureront sur le devis.",
        pane: "infos",
        cta: "Compléter la fiche",
        action: "edit-client",
      };
    }
    if (!hasNeed) {
      return {
        step: 2,
        label: "Besoin à cadrer",
        next: "Collez le brief, puis reformulez-le pour qu’il soit actionnable.",
        pane: "infos",
        cta: "Cadrer le besoin",
        action: "edit-client",
      };
    }
    if (!works.length) {
      return {
        step: 3,
        label: "Mission à ouvrir",
        next: "Créez le livrable : titre, statut d’avancement et prix HT.",
        pane: "works",
        cta: "Ouvrir une mission",
        action: "new-work",
      };
    }
    if (!priced) {
      return {
        step: 3,
        label: "Prix à fixer",
        next: "Ajoutez le tarif de la mission avant de rédiger le devis.",
        pane: "works",
        cta: "Fixer le prix",
        action: "edit-first-work",
      };
    }
    if (!quotes.length) {
      return {
        step: 4,
        label: "Devis à rédiger",
        next: "Générez le devis depuis la mission, puis exportez le PDF.",
        pane: "quotes",
        cta: "Créer le devis",
        action: "new-quote",
      };
    }
    if (openQuote?.status === "draft") {
      return {
        step: 4,
        label: "Devis brouillon",
        next: "Relisez les lignes, puis passez le statut à Envoyé.",
        pane: "quotes",
        cta: "Finaliser le devis",
        action: "quotes",
      };
    }
    if (openQuote?.status === "sent") {
      return {
        step: 4,
        label: "Devis envoyé",
        next: "Attente client : marquez Accepté, Refusé ou Payé.",
        pane: "quotes",
        cta: "Suivre le devis",
        action: "quotes",
      };
    }
    const invoices = client.invoices || [];
    const openInvoice = invoices.find((inv) => {
      const st = liveInvoiceStatus(inv);
      return st === "sent" || st === "partial" || st === "overdue" || st === "draft";
    });
    if (won && !invoices.length) {
      return {
        step: 5,
        label: "Facture à émettre",
        next: "Le devis est accepté. Créez la facture et planifiez les acomptes.",
        pane: "invoices",
        cta: "Émettre la facture",
        action: "new-invoice",
      };
    }
    if (openInvoice) {
      const st = liveInvoiceStatus(openInvoice);
      return {
        step: 5,
        label: st === "overdue" ? "Facture en retard" : st === "partial" ? "Acompte reçu" : "Facture ouverte",
        next:
          st === "overdue"
            ? "Relancez le client par WhatsApp ou e-mail."
            : "Enregistrez un acompte ou relancez l’échéance.",
        pane: "invoices",
        cta: st === "overdue" ? "Relancer" : "Suivre la facture",
        action: "invoices",
      };
    }
    if (won) {
      return {
        step: 5,
        label: "Mission en cours",
        next: "Devis validé. Avancez le statut de la mission, ou publiez-la sur le site.",
        pane: "works",
        cta: "Suivre la mission",
        action: "works",
      };
    }
    return {
      step: 4,
      label: "Suivi commercial",
      next: "Mettez à jour le statut du devis ou de la mission.",
      pane: "quotes",
      cta: "Voir les devis",
      action: "quotes",
    };
  }

  function journeyStepsHtml(currentStep) {
    const steps = [
      ["01", "Fiche"],
      ["02", "Besoin"],
      ["03", "Mission"],
      ["04", "Devis"],
    ];
    return `<ol class="crm-steps crm-steps--inline">
      ${steps
        .map(([n, label], i) => {
          const index = i + 1;
          const state = currentStep > index ? "is-done" : currentStep === index ? "is-current" : "";
          return `<li class="${state}"><span>${n}</span> ${label}</li>`;
        })
        .join("")}
    </ol>`;
  }

  const nextQuoteNumber = () => {
    const year = new Date().getFullYear();
    let max = 0;
    store.clients.forEach((c) => {
      (c.quotes || []).forEach((q) => {
        const m = String(q.number || "").match(/CX-DEV-(\d{4})-(\d+)/i);
        if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
      });
    });
    return `CX-DEV-${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const plusDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const INVOICE_STATUSES = [
    ["draft", "Brouillon"],
    ["sent", "Envoyée"],
    ["partial", "Acompte reçu"],
    ["paid", "Payée"],
    ["overdue", "En retard"],
  ];

  const invoiceStatusLabel = (id) => INVOICE_STATUSES.find((item) => item[0] === id)?.[1] || "Brouillon";

  function logHistory(client, action, detail) {
    if (!client) return;
    client.history = Array.isArray(client.history) ? client.history : [];
    client.history.unshift({
      id: uid(),
      at: new Date().toISOString(),
      action,
      detail,
    });
    client.history = client.history.slice(0, 80);
  }

  const invoicePaid = (invoice) =>
    (invoice.payments || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const invoiceBalance = (invoice) => Math.max(0, quoteTotals(invoice).ttc - invoicePaid(invoice));

  function liveInvoiceStatus(invoice) {
    const balance = invoiceBalance(invoice);
    if (balance <= 0.05) return "paid";
    if (invoicePaid(invoice) > 0) return "partial";
    if (invoice.dueDate && invoice.dueDate < todayISO() && balance > 0) return "overdue";
    return invoice.status || "draft";
  }

  const nextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    let max = 0;
    store.clients.forEach((c) => {
      (c.invoices || []).forEach((inv) => {
        const m = String(inv.number || "").match(/CX-FAC-(\d{4})-(\d+)/i);
        if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
      });
    });
    return `CX-FAC-${year}-${String(max + 1).padStart(3, "0")}`;
  };

  function waDigits(phone) {
    let digits = String(phone || "").replace(/\D/g, "");
    if (digits.startsWith("0")) digits = `212${digits.slice(1)}`;
    return digits;
  }

  function shareUrl(token) {
    return `${location.origin}/devis?t=${encodeURIComponent(token)}`;
  }

  function ensureToken(doc) {
    if (!doc.shareToken) doc.shareToken = uid();
    return doc.shareToken;
  }

  function quoteMessage(client, quote) {
    const tot = quoteTotals(quote);
    const url = shareUrl(ensureToken(quote));
    return `Bonjour ${client.name || ""},\n\nVoici le devis ${quote.number} — ${quote.title}.\nMontant : ${money(tot.ttc, quote.currency)} TTC.\nValable jusqu’au ${quote.validUntil || "—"}.\n\nConsulter et signer : ${url}\n\nCX Systems`;
  }

  function invoiceMessage(client, invoice, kind) {
    const tot = quoteTotals(invoice);
    const head = kind === "reminder" ? "Relance — facture" : "Facture";
    return `Bonjour ${client.name || ""},\n\n${head} ${invoice.number} — ${invoice.title}.\nTotal : ${money(tot.ttc, invoice.currency)} TTC.\nReste dû : ${money(invoiceBalance(invoice), invoice.currency)}.\nÉchéance : ${invoice.dueDate || "—"}.\n\nCX Systems · WhatsApp +212 699 254 247`;
  }

  async function markQuoteSent(client, quote, via) {
    ensureToken(quote);
    quote.sentAt = new Date().toISOString();
    quote.sentVia = via;
    if (quote.status === "draft") quote.status = "sent";
    logHistory(client, "envoi", `Devis ${quote.number} envoyé par ${via}`);
    await saveStore();
    render();
  }

  async function sendQuoteEmail(client, quote) {
    if (!client.email) {
      alert("Ajoutez l’e-mail du client dans la fiche.");
      return;
    }
    const href = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(`Devis ${quote.number} — CX Systems`)}&body=${encodeURIComponent(quoteMessage(client, quote))}`;
    await markQuoteSent(client, quote, "email");
    window.location.href = href;
  }

  async function sendQuoteWhatsApp(client, quote) {
    const digits = waDigits(client.phone);
    if (!digits) {
      alert("Ajoutez le téléphone WhatsApp du client dans la fiche.");
      return;
    }
    await markQuoteSent(client, quote, "whatsapp");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(quoteMessage(client, quote))}`, "_blank", "noopener");
  }

  async function sendInvoiceChannel(client, invoice, via, kind) {
    const subject = kind === "reminder" ? `Relance ${invoice.number}` : `Facture ${invoice.number}`;
    const body = invoiceMessage(client, invoice, kind);
    if (via === "email") {
      if (!client.email) {
        alert("Ajoutez l’e-mail du client dans la fiche.");
        return;
      }
      window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(`${subject} — CX Systems`)}&body=${encodeURIComponent(body)}`;
    } else {
      const digits = waDigits(client.phone);
      if (!digits) {
        alert("Ajoutez le téléphone WhatsApp du client dans la fiche.");
        return;
      }
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
    }
    invoice.sentAt = new Date().toISOString();
    invoice.sentVia = via;
    if (invoice.status === "draft") invoice.status = "sent";
    if (kind === "reminder") {
      invoice.reminders = invoice.reminders || [];
      invoice.reminders.unshift({ id: uid(), at: new Date().toISOString(), channel: via });
      logHistory(client, "relance", `Facture ${invoice.number} relancée par ${via}`);
    } else {
      logHistory(client, "envoi", `Facture ${invoice.number} envoyée par ${via}`);
    }
    await saveStore();
    render();
  }

  function publicProjectOptions(selected) {
    return store.projects
      .map(
        (p) =>
          `<option value="${esc(p.id)}" ${p.id === selected ? "selected" : ""}>${esc(p.title)}${p.published === true ? " · publié" : " · masqué"}</option>`
      )
      .join("");
  }

  function syncWorkProject(client, work) {
    store.projects.forEach((project) => {
      if (project.clientWorkId === work.id && project.id !== work.publicProjectId) {
        delete project.clientWorkId;
        delete project.clientId;
      }
    });
    if (!work.publicProjectId) return;
    const project = store.projects.find((item) => item.id === work.publicProjectId);
    if (!project) return;
    project.clientId = client.id;
    project.clientWorkId = work.id;
  }

  function publishWorkToSite(client, work) {
    let project = store.projects.find((item) => item.id === work.publicProjectId);
    if (!project) {
      project = {
        id: `mission-${work.id}`,
        title: work.title,
        titleEn: work.title,
        description: client.needClean || work.note || work.title,
        descriptionEn: client.needClean || work.note || work.title,
        status: work.status === "live" ? "En production" : "Livré",
        statusEn: work.status === "live" ? "In production" : "Delivered",
        sector: client.company || "Mission",
        sectorEn: client.company || "Mission",
        tags: [],
        photos: [],
        featured: false,
        published: true,
        clientId: client.id,
        clientWorkId: work.id,
      };
      store.projects.unshift(project);
      work.publicProjectId = project.id;
    } else {
      project.published = true;
      project.clientId = client.id;
      project.clientWorkId = work.id;
      if (!project.description && (client.needClean || work.note)) {
        project.description = client.needClean || work.note;
      }
    }
    logHistory(client, "site", `Mission « ${work.title} » liée au projet public ${project.title}`);
  }

  function invoiceFromQuote(quote) {
    return {
      id: uid(),
      number: nextInvoiceNumber(),
      title: quote.title,
      date: todayISO(),
      dueDate: plusDays(15),
      status: "draft",
      currency: quote.currency || "MAD",
      taxRate: quote.taxRate ?? 20,
      notes: quote.notes || "Acompte 40% à la commande, solde à la livraison.",
      quoteId: quote.id,
      workId: quote.workId || "",
      lines: (quote.lines || []).map((line) => ({ ...line, id: uid() })),
      payments: [],
      reminders: [],
      shareToken: uid(),
    };
  }

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
          store.clients = (store.clients || []).map(normalizeClient);
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
    store.clients = (store.clients || []).map(normalizeClient);
    store.projects = store.projects || [];
    store.offers = store.offers || [];
  }

  async function saveStore() {
    store.clients = (store.clients || []).map((c) => ({
      ...normalizeClient(c),
      updatedAt: new Date().toISOString(),
    }));
    localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
    if (localMode) return;
    try {
      const res = await fetch("/api/store", {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(store),
      });
      if (res.ok) {
        store = await res.json();
        store.clients = (store.clients || []).map(normalizeClient);
      }
    } catch {
      /* keep local copy */
    }
  }

  function upsertClient(next) {
    const client = normalizeClient({ ...next, updatedAt: new Date().toISOString() });
    const idx = store.clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) store.clients[idx] = { ...store.clients[idx], ...client };
    else store.clients.unshift(client);
    return client;
  }

  function showApp() {
    loginView.hidden = true;
    appView.hidden = false;
    const nav = document.getElementById("admin-nav");
    if (nav) nav.hidden = false;
    document.getElementById("logout").hidden = false;
    setDash("clients");
    render();
  }

  function setDash(tab) {
    const section = document.getElementById("cx-section");
    if (section) {
      section.textContent = tab === "projects" ? "02 Projets" : tab === "offers" ? "03 Offres" : "01 Clients";
    }
    const search = document.getElementById("client-search-wrap");
    if (search) search.hidden = tab !== "clients";
    const newClient = document.getElementById("new-client");
    const newProject = document.getElementById("new-project");
    const newOffer = document.getElementById("new-offer");
    if (newClient) newClient.hidden = tab !== "clients";
    if (newProject) newProject.hidden = tab !== "projects";
    if (newOffer) newOffer.hidden = tab !== "offers";
    const ribbon = document.getElementById("cx-ribbon");
    if (ribbon && tab !== "clients") ribbon.hidden = true;
  }

  function renderStats() {
    const stats = document.getElementById("admin-stats");
    if (!stats) return;
    const pubP = store.projects.filter((p) => p.published === true).length;
    const pubO = store.offers.filter((o) => o.published === true).length;
    const openQuotes = store.clients.reduce(
      (n, c) => n + (c.quotes || []).filter((q) => q.status === "sent" || q.status === "draft").length,
      0
    );
    const toFrame = store.clients.filter((c) => clientJourney(c).step <= 2).length;
    const activeTab = document.querySelector(".admin-tab.is-active")?.getAttribute("data-tab") || "clients";
    if (activeTab === "clients") {
      stats.innerHTML = `
        <div class="counter"><b>${store.clients.length}</b><span>Dossiers</span></div>
        <div class="counter"><b>${openQuotes}</b><span>Devis ouverts</span></div>
        <div class="counter"><b>${store.clients.reduce((n, c) => n + (c.works || []).length, 0)}</b><span>Missions</span></div>
        <div class="counter warn"><b>${toFrame}</b><span>À cadrer</span></div>`;
      return;
    }
    stats.innerHTML = `
      <div class="counter"><b>${store.clients.length}</b><span>Clients</span></div>
      <div class="counter"><b>${openQuotes}</b><span>Devis ouverts</span></div>
      <div class="counter"><b>${pubP}</b><span>Projets live</span></div>
      <div class="counter warn"><b>${pubO}</b><span>Offres live</span></div>`;
  }

  function renderClientRail() {
    const rail = document.getElementById("client-rail");
    if (!rail) return;
    const q = (document.getElementById("client-search")?.value || "").trim().toLowerCase();
    const list = store.clients.filter((c) => {
      if (!q) return true;
      const hay = [c.name, c.company, c.email, c.phone, c.city].join(" ").toLowerCase();
      return hay.includes(q);
    });

    const head = document.getElementById("client-rail-head");
    if (head) head.textContent = `${list.length} dossier${list.length > 1 ? "s" : ""}`;

    rail.innerHTML =
      list
        .map((c) => {
          const journey = clientJourney(c);
          const avatar = c.profileImage
            ? `<span class="avatar"><img src="${esc(c.profileImage)}" alt=""></span>`
            : `<span class="avatar">${esc(initials(c.name || c.company))}</span>`;
          return `<button type="button" class="client ${c.id === selectedClientId ? "active" : ""}" data-select-client="${esc(c.id)}">
            ${avatar}
            <span class="meta">
              <span class="name">${esc(c.name) || "Sans nom"}</span>
              <span class="sub">${esc(c.company || c.email || c.city || journey.label)}</span>
              <span class="foot">
                ${stageBars(journey.step)}
                ${journey.step <= 2 ? `<span class="badge tocadrer">${esc(journey.label)}</span>` : ""}
              </span>
            </span>
          </button>`;
        })
        .join("") || `<div class="admin-empty" style="margin:12px"><strong>Aucun dossier</strong>Ouvrez une fiche pour commencer.</div>`;
  }

  function renderClientDesk() {
    const empty = document.getElementById("client-desk-empty");
    const dossier = document.getElementById("client-dossier");
    if (!empty || !dossier) return;

    const ribbon = document.getElementById("cx-ribbon");
    const client = getClient(selectedClientId);
    if (!client) {
      empty.hidden = false;
      dossier.hidden = true;
      dossier.innerHTML = "";
      if (ribbon) ribbon.hidden = true;
      return;
    }

    empty.hidden = true;
    dossier.hidden = false;

    const works = client.works || [];
    const quotes = client.quotes || [];
    const budget = clientBudget(client);
    const quoteVal = clientQuotesValue(client);
    const currency = works[0]?.currency || quotes[0]?.currency || "MAD";
    const journey = clientJourney(client);

    const avatar = client.profileImage
      ? `<div class="fiche-avatar"><img src="${esc(client.profileImage)}" alt=""></div>`
      : `<div class="fiche-avatar">${esc(initials(client.name || client.company))}</div>`;

    if (ribbon) {
      ribbon.hidden = false;
      ribbon.innerHTML = `
        <div class="dot"></div>
        <span class="lbl">Prochaine action —</span>
        <b>${esc(client.name) || "Sans nom"}</b>
        <span class="lbl">${esc(journey.next)}</span>
        <button type="button" data-next-action="${esc(journey.action)}">${esc(journey.cta)} →</button>`;
    }

    let paneHtml = "";
    if (clientPane === "infos") {
      paneHtml = `
        <div class="grid2">
          <div class="field"><label>E-mail</label><div>${esc(client.email) || "—"}</div></div>
          <div class="field"><label>Téléphone</label><div>${esc(client.phone) || "—"}</div></div>
          <div class="field"><label>Ville</label><div>${esc(client.city) || "—"}</div></div>
          <div class="field"><label>Adresse</label><div>${esc(client.address) || "—"}</div></div>
        </div>
        <div class="panel">
          <h3>Brief brut ${client.pdfName ? `<span class="tag">PDF importé</span>` : ""}</h3>
          <p>${esc(client.need) || "Collez le besoin tel que le client l’a dit."}</p>
        </div>
        <div class="panel ia">
          <h3>Besoin reformulé <span class="tag">IA</span></h3>
          <p>${esc(client.needClean) || "Reformulez le brief pour qu’il soit clair, mesurable, livrable."}</p>
          <div class="panel-foot">
            <button type="button" class="btn" data-edit-client="${esc(client.id)}">↻ Reformuler</button>
            <button type="button" class="btn primary" data-edit-client="${esc(client.id)}">Valider le besoin</button>
          </div>
        </div>`;
    } else if (clientPane === "works") {
      paneHtml = `
        <div class="panel">
          <div class="table-head-row">
            <h3>Missions</h3>
            <button type="button" class="btn primary add" data-new-work>+ Nouvelle mission</button>
          </div>
        ${
          works.length
            ? `<table>
                <tr><th>Titre</th><th>Statut</th><th>Mode</th><th class="num">Prix HT</th><th>Site</th><th></th></tr>
                  ${works
                    .map(
                      (w) => `<tr>
                        <td>${esc(w.title) || "Sans titre"}${w.note ? `<div class="sub">${esc(w.note)}</div>` : ""}</td>
                        <td><span class="pill ${workPill(w.status)}"><i></i>${esc(statusLabel(w.status))}</span></td>
                        <td>${esc(billingLabel(w.billing))}</td>
                        <td class="num">${money(w.price, w.currency || currency)}</td>
                        <td>${
                          w.publicProjectId
                            ? `<span class="badge live">${store.projects.find((p) => p.id === w.publicProjectId)?.published === true ? "Sur le site" : "Lié"}</span>`
                            : `<span class="sub">—</span>`
                        }</td>
                        <td class="row-actions">
                          <button type="button" class="icon-btn" data-edit-work="${esc(w.id)}">Éditer</button>
                          ${w.publicProjectId ? "" : `<button type="button" class="icon-btn" data-publish-work="${esc(w.id)}">Publier</button>`}
                          <button type="button" class="icon-btn danger" data-del-work="${esc(w.id)}">Suppr.</button>
                        </td>
                      </tr>`
                    )
                    .join("")}
              </table>
              <div class="summary-row">
                <div><span>Budget missions cumulé</span><b>${money(budget, currency)}</b></div>
                <div><span>Base du devis</span><b>${works.length} mission${works.length > 1 ? "s" : ""}</b></div>
              </div>`
            : `<div class="admin-empty"><strong>Aucune mission</strong>Ajoutez un livrable et son prix HT.</div>`
        }
        </div>`;
    } else if (clientPane === "quotes") {
      paneHtml = `
        <div class="panel">
          <div class="table-head-row">
            <h3>Devis</h3>
            <button type="button" class="btn primary add" data-new-quote>+ Nouveau devis</button>
          </div>
        ${
          quotes.length
            ? `<table>
                <tr><th>N°</th><th>Titre</th><th>Statut</th><th>Validité</th><th class="num">TTC</th><th></th></tr>
                ${quotes
                  .map((q) => {
                    const tot = quoteTotals(q);
                    return `<tr>
                      <td class="devis-id">${esc(q.number)}</td>
                      <td>${esc(q.title) || "Devis"}</td>
                      <td><span class="pill ${quotePill(q.status)}"><i></i>${esc(quoteStatusLabel(q.status))}${q.signedAt ? " · signé" : ""}</span></td>
                      <td>${esc(q.validUntil || "—")}</td>
                      <td class="num">${money(tot.ttc, q.currency || "MAD")}</td>
                      <td class="row-actions">
                        <button type="button" class="icon-btn" data-wa-quote="${esc(q.id)}">WA</button>
                        <button type="button" class="icon-btn" data-mail-quote="${esc(q.id)}">Mail</button>
                        <button type="button" class="icon-btn" data-print-quote="${esc(q.id)}">PDF</button>
                        ${q.status === "accepted" || q.signedAt ? `<button type="button" class="icon-btn" data-invoice-from-quote="${esc(q.id)}">Facturer</button>` : ""}
                        <button type="button" class="icon-btn" data-edit-quote="${esc(q.id)}">Éditer</button>
                        <button type="button" class="icon-btn danger" data-del-quote="${esc(q.id)}">Suppr.</button>
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </table>
              <div class="summary-row">
                <div><span>Volume TTC (hors refusés)</span><b>${money(quoteVal, currency)}</b></div>
              </div>`
            : `<div class="admin-empty"><strong>Aucun devis</strong>Rédigez, envoyez, puis faites signer.</div>`
        }
        </div>`;
    } else if (clientPane === "invoices") {
      const invoices = client.invoices || [];
      paneHtml = `
        <div class="panel">
          <div class="table-head-row">
            <h3>Factures</h3>
            <button type="button" class="btn primary add" data-new-invoice>+ Facture</button>
          </div>
        ${
          invoices.length
            ? `<table>
                <tr><th>N°</th><th>Titre</th><th>Statut</th><th class="num">TTC</th><th class="num">Reste</th><th></th></tr>
                ${invoices
                  .map((inv) => {
                    const tot = quoteTotals(inv);
                    const st = liveInvoiceStatus(inv);
                    return `<tr>
                      <td class="devis-id">${esc(inv.number)}</td>
                      <td>${esc(inv.title) || "Facture"}</td>
                      <td><span class="pill ${invoicePill(st)}"><i></i>${esc(invoiceStatusLabel(st))}</span></td>
                      <td class="num">${money(tot.ttc, inv.currency)}</td>
                      <td class="num">${money(invoiceBalance(inv), inv.currency)}</td>
                      <td class="row-actions">
                        <button type="button" class="icon-btn" data-pay-invoice="${esc(inv.id)}">Acompte</button>
                        <button type="button" class="icon-btn" data-remind-wa="${esc(inv.id)}">Relance</button>
                        <button type="button" class="icon-btn" data-print-invoice="${esc(inv.id)}">PDF</button>
                        <button type="button" class="icon-btn" data-edit-invoice="${esc(inv.id)}">Éditer</button>
                        <button type="button" class="icon-btn danger" data-del-invoice="${esc(inv.id)}">Suppr.</button>
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </table>`
            : `<div class="admin-empty"><strong>Aucune facture</strong>Depuis un devis accepté, cliquez Facturer.</div>`
        }
        </div>`;
    } else {
      const history = client.history || [];
      paneHtml = `
        <div class="panel">
          <h3>Journal</h3>
        ${
          history.length
            ? `<ol class="crm-journal">${history
                .map(
                  (h) => `<li>
                    <strong>${esc((h.at || "").slice(0, 16).replace("T", " "))}</strong>
                    <span class="badge tocadrer">${esc(h.action)}</span>
                    <p>${esc(h.detail)}</p>
                  </li>`
                )
                .join("")}</ol>`
            : `<div class="admin-empty"><strong>Aucun événement</strong>Les actions du dossier apparaîtront ici.</div>`
        }
        </div>`;
    }

    dossier.innerHTML = `
      <div class="fiche-head">
        ${avatar}
        <div>
          <h1>${esc(client.name) || "Sans nom"}</h1>
          <div class="company">${esc([client.company, client.city, client.ice ? `ICE ${client.ice}` : ""].filter(Boolean).join(" · ") || "Dossier privé")}</div>
        </div>
        <div class="actions">
          <button type="button" class="icon-btn" data-edit-client="${esc(client.id)}">Éditer</button>
          <button type="button" class="icon-btn" data-new-quote>Devis</button>
          <button type="button" class="icon-btn danger" data-del-client="${esc(client.id)}">Supprimer</button>
        </div>
      </div>
      <nav class="tabs" aria-label="Sections dossier">
        <button type="button" class="tab ${clientPane === "infos" ? "active" : ""}" data-client-pane="infos">Fiche &amp; besoin</button>
        <button type="button" class="tab ${clientPane === "works" ? "active" : ""}" data-client-pane="works">Missions &amp; prix</button>
        <button type="button" class="tab ${clientPane === "quotes" ? "active" : ""}" data-client-pane="quotes">Devis</button>
        <button type="button" class="tab ${clientPane === "invoices" ? "active" : ""}" data-client-pane="invoices">Factures</button>
        <button type="button" class="tab ${clientPane === "journal" ? "active" : ""}" data-client-pane="journal">Journal</button>
      </nav>
      ${paneHtml}`;
  }

  function render() {
    renderStats();
    renderClientRail();
    renderClientDesk();

    document.getElementById("project-list").innerHTML = store.projects
      .map((p) => {
        const live = p.published === true;
        return `
      <article class="admin-card">
        <div class="admin-card__media ${p.photos?.[0] ? "" : "admin-card__media--empty"}">
          ${p.photos?.[0] ? `<img src="${esc(p.photos[0])}" alt="">` : "Sans photo"}
        </div>
        <div class="admin-card__body">
          <div class="admin-card__meta">
            <span class="badge ${live ? "badge--live" : "badge--draft"}">${live ? "Sur le site" : "Masqué"}</span>
            ${p.featured ? `<span class="badge badge--feat">À la une</span>` : ""}
          </div>
          <p class="admin-card__sector">${esc(p.sector) || "Sans secteur"}</p>
          <h4>${esc(p.title) || "Sans titre"}</h4>
          <p class="admin-card__text">${esc(snippet(p.description) || "Pas de description")}</p>
          <div class="admin-card__actions">
            <button class="ghost" data-toggle-project="${esc(p.id)}">${live ? "Masquer" : "Publier"}</button>
          <button class="ghost" data-edit-project="${esc(p.id)}">Éditer</button>
          <button class="danger" data-del-project="${esc(p.id)}">Suppr.</button>
        </div>
        </div>
      </article>`;
      })
      .join("") || `<div class="admin-empty"><strong>Aucun projet</strong>Seuls ceux publiés apparaissent sur le site public.</div>`;

    document.getElementById("offer-list").innerHTML = store.offers
      .map((o, i) => {
        const live = o.published === true;
        return `
      <article class="admin-card">
        <div class="admin-card__body">
          <div class="admin-card__meta">
            <span class="badge ${live ? "badge--live" : "badge--draft"}">${live ? "Publié" : "Brouillon"}</span>
            <span class="admin-card__sector">0${i + 1}</span>
          </div>
          <h4>${esc(o.title) || "Sans titre"}</h4>
          <p class="admin-card__text">${esc(snippet(o.description) || "Pas de description")}</p>
          <div class="admin-card__actions">
            <button class="ghost" data-toggle-offer="${esc(o.id)}">${live ? "Masquer" : "Publier"}</button>
          <button class="ghost" data-edit-offer="${esc(o.id)}">Éditer</button>
          <button class="danger" data-del-offer="${esc(o.id)}">Suppr.</button>
        </div>
        </div>
      </article>`;
      })
      .join("") || `<div class="admin-empty"><strong>Aucune offre</strong>Ajoutez un titre, une description et le détail.</div>`;
  }

  function closeEditor() {
    editor.close();
    editorForm.innerHTML = "";
    mode = null;
    currentId = null;
    editingQuoteId = null;
    editingWorkId = null;
    editingInvoiceId = null;
  }

  const lineRowHtml = (line) => `
    <div class="line-row" data-line-row data-line-id="${esc(line.id || uid())}">
      <label>Description
        <input name="lineDesc" value="${esc(line.description)}" placeholder="Développement module caisse" />
      </label>
      <label>Qté
        <input name="lineQty" type="number" min="0" step="0.5" value="${esc(line.qty ?? 1)}" />
      </label>
      <label>P.U. HT
        <input name="linePrice" type="number" min="0" step="0.01" value="${esc(line.unitPrice ?? 0)}" />
      </label>
      <button type="button" class="danger" data-remove-line>Retirer</button>
    </div>`;

  const collectLines = () =>
    [...editorForm.querySelectorAll("[data-line-row]")]
      .map((row) => ({
        id: row.getAttribute("data-line-id") || uid(),
        description: row.querySelector("[name='lineDesc']")?.value.trim() || "",
        qty: Number(row.querySelector("[name='lineQty']")?.value) || 0,
        unitPrice: Number(row.querySelector("[name='linePrice']")?.value) || 0,
      }))
      .filter((item) => item.description || item.unitPrice);

  function openClient(client) {
    mode = "client";
    currentId = client.id;
    const c = normalizeClient(client);
    editorForm.innerHTML = `
      <h3>${c.name ? "Compléter la fiche" : "Ouvrir un dossier"}</h3>
      <p class="editor-lede">Étape 01–02. Identité pour le devis, puis brief du besoin. Rien n’est publié.</p>
      <fieldset class="field-block">
        <legend>Identité</legend>
        <label>Nom du contact
          <input name="name" required value="${esc(c.name)}" />
      </label>
        <label>Société
          <input name="company" value="${esc(c.company)}" />
        </label>
        <div class="row2">
          <label>E-mail
            <input name="email" type="email" value="${esc(c.email)}" />
          </label>
          <label>Téléphone
            <input name="phone" value="${esc(c.phone)}" />
          </label>
        </div>
        <div class="row2">
          <label>Ville
            <input name="city" value="${esc(c.city)}" />
          </label>
          <label>ICE
            <input name="ice" value="${esc(c.ice)}" />
          </label>
        </div>
        <label>Adresse
          <input name="address" value="${esc(c.address)}" />
        </label>
        <label>Photo
        <input type="file" accept="image/*" name="profile" />
      </label>
        <div>${c.profileImage ? `<img class="profile-preview" src="${esc(c.profileImage)}" alt="">` : ""}</div>
      </fieldset>
      <fieldset class="field-block">
        <legend>Besoin</legend>
        <label>Description complète
          <textarea name="need" rows="5">${esc(c.need)}</textarea>
      </label>
        <p class="hint">Collez le besoin ou importez un PDF. Reformulez ensuite.</p>
      <label>Importer un PDF
        <input type="file" accept="application/pdf" name="pdf" />
      </label>
        <p class="hint" id="pdf-name">${c.pdfName ? `Fichier : ${esc(c.pdfName)}` : ""}</p>
      <label>Besoin reformulé
          <textarea name="needClean" rows="5">${esc(c.needClean)}</textarea>
      </label>
      <div class="actions">
        <button type="button" class="ghost-btn" id="ai-btn">Reformuler avec l’IA</button>
      </div>
      </fieldset>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editorForm.dataset.profile = c.profileImage || "";
    editorForm.dataset.pdfName = c.pdfName || "";
    editorForm.dataset.pdfData = c.pdfData || "";
    editor.showModal();
  }

  function openWork(clientId, work) {
    mode = "work";
    currentId = clientId;
    editingWorkId = work.id || uid();
    editorForm.innerHTML = `
      <h3>${work.title ? "Mettre à jour la mission" : "Ouvrir une mission"}</h3>
      <p class="editor-lede">Étape 03. Un livrable, un statut, un prix HT — base du devis.</p>
      <fieldset class="field-block">
        <legend>Projet</legend>
        <label>Titre / livrable
          <input name="workTitle" required value="${esc(work.title)}" placeholder="Ex. Caisse 2R Parts" />
        </label>
        <label>Statut
          <select name="workStatus">${statusOptions(work.status || "new")}</select>
        </label>
        <label>Note interne
          <textarea name="workNote" rows="3">${esc(work.note)}</textarea>
        </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Tarification</legend>
        <div class="row2">
          <label>Prix HT
            <input name="workPrice" type="number" min="0" step="0.01" value="${esc(work.price ?? "")}" placeholder="25000" />
          </label>
          <label>Devise
            <select name="workCurrency">
              <option value="MAD" ${(work.currency || "MAD") === "MAD" ? "selected" : ""}>MAD</option>
              <option value="EUR" ${work.currency === "EUR" ? "selected" : ""}>EUR</option>
              <option value="USD" ${work.currency === "USD" ? "selected" : ""}>USD</option>
            </select>
          </label>
        </div>
        <label>Mode
          <select name="workBilling">${billingOptions(work.billing || "fixed")}</select>
        </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Lien site public</legend>
        <label>Projet publié associé
          <select name="workProject">
            <option value="">— Aucun —</option>
            ${publicProjectOptions(work.publicProjectId || "")}
          </select>
        </label>
        <label class="check"><input type="checkbox" name="workPublish" /> Créer / publier cette mission sur le site</label>
        <p class="hint">Le dossier client reste privé. Seule la fiche projet choisie (ou créée) apparaît dans Réalisations.</p>
      </fieldset>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editor.showModal();
  }

  function openQuote(clientId, quote) {
    mode = "quote";
    currentId = clientId;
    editingQuoteId = quote.id || uid();
    const q = {
      number: quote.number || nextQuoteNumber(),
      title: quote.title || "",
      date: quote.date || todayISO(),
      validUntil: quote.validUntil || plusDays(30),
      status: quote.status || "draft",
      currency: quote.currency || "MAD",
      taxRate: quote.taxRate ?? 20,
      notes: quote.notes || "Paiement : 40% à la commande, 60% à la livraison.\nDevis valable 30 jours.",
      terms: quote.terms || "",
      lines: quote.lines?.length ? quote.lines : [{ id: uid(), description: "", qty: 1, unitPrice: 0 }],
      workId: quote.workId || "",
      shareToken: quote.shareToken || uid(),
      signedAt: quote.signedAt || "",
      signerName: quote.signerName || "",
      signatureData: quote.signatureData || "",
      sentAt: quote.sentAt || "",
      sentVia: quote.sentVia || "",
    };
    const client = getClient(clientId);
    const workOpts = (client?.works || [])
      .map((w) => `<option value="${esc(w.id)}" ${q.workId === w.id ? "selected" : ""}>${esc(w.title)}</option>`)
      .join("");

    editorForm.innerHTML = `
      <h3>${quote.title || quote.number ? "Finaliser le devis" : "Rédiger un devis"}</h3>
      <p class="editor-lede">Étape 04. Lignes + TVA, puis PDF. Statut : brouillon → envoyé → accepté / payé.</p>
      <fieldset class="field-block">
        <legend>En-tête</legend>
        <div class="row2">
          <label>N° devis
            <input name="quoteNumber" required value="${esc(q.number)}" />
          </label>
          <label>Statut
            <select name="quoteStatus">${quoteStatusOptions(q.status)}</select>
          </label>
        </div>
        <label>Titre
          <input name="quoteTitle" required value="${esc(q.title)}" placeholder="Développement logiciel comptoir" />
        </label>
        <div class="row2">
          <label>Date
            <input name="quoteDate" type="date" value="${esc(q.date)}" />
          </label>
          <label>Valable jusqu’au
            <input name="quoteValid" type="date" value="${esc(q.validUntil)}" />
          </label>
        </div>
        <div class="row2">
          <label>Devise
            <select name="quoteCurrency">
              <option value="MAD" ${q.currency === "MAD" ? "selected" : ""}>MAD</option>
              <option value="EUR" ${q.currency === "EUR" ? "selected" : ""}>EUR</option>
              <option value="USD" ${q.currency === "USD" ? "selected" : ""}>USD</option>
            </select>
          </label>
          <label>TVA %
            <input name="quoteTax" type="number" min="0" step="0.1" value="${esc(q.taxRate)}" />
          </label>
        </div>
        <label>Lier à un projet (optionnel)
          <select name="quoteWork">
            <option value="">— Aucun —</option>
            ${workOpts}
          </select>
        </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Lignes</legend>
        <div id="quote-lines">${q.lines.map(lineRowHtml).join("")}</div>
        <div class="actions">
          <button type="button" class="ghost-btn" id="add-line">+ Ligne</button>
          <button type="button" class="ghost-btn" id="fill-from-work">Remplir depuis le projet lié</button>
        </div>
      </fieldset>
      <fieldset class="field-block">
        <legend>Notes</legend>
        <label>Conditions / notes
          <textarea name="quoteNotes" rows="4">${esc(q.notes)}</textarea>
        </label>
      </fieldset>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editorForm.dataset.shareToken = q.shareToken;
    editorForm.dataset.signedAt = q.signedAt;
    editorForm.dataset.signerName = q.signerName;
    editorForm.dataset.signatureData = q.signatureData;
    editorForm.dataset.sentAt = q.sentAt;
    editorForm.dataset.sentVia = q.sentVia;
    editor.showModal();
  }

  function openInvoice(clientId, invoice) {
    mode = "invoice";
    currentId = clientId;
    editingInvoiceId = invoice.id || uid();
    const inv = {
      number: invoice.number || nextInvoiceNumber(),
      title: invoice.title || "",
      date: invoice.date || todayISO(),
      dueDate: invoice.dueDate || plusDays(15),
      status: invoice.status || "draft",
      currency: invoice.currency || "MAD",
      taxRate: invoice.taxRate ?? 20,
      notes: invoice.notes || "Acompte 40% à la commande, solde à la livraison.",
      lines: invoice.lines?.length ? invoice.lines : [{ id: uid(), description: "", qty: 1, unitPrice: 0 }],
      quoteId: invoice.quoteId || "",
      workId: invoice.workId || "",
      payments: invoice.payments || [],
      reminders: invoice.reminders || [],
      shareToken: invoice.shareToken || uid(),
    };
    const client = getClient(clientId);
    const quoteOpts = (client?.quotes || [])
      .map((q) => `<option value="${esc(q.id)}" ${inv.quoteId === q.id ? "selected" : ""}>${esc(q.number)} · ${esc(q.title)}</option>`)
      .join("");
    editorForm.innerHTML = `
      <h3>${invoice.number ? "Éditer la facture" : "Nouvelle facture"}</h3>
      <p class="editor-lede">Acomptes et relances se gèrent ensuite depuis le dossier.</p>
      <fieldset class="field-block">
        <legend>En-tête</legend>
        <div class="row2">
          <label>N° facture
            <input name="invNumber" required value="${esc(inv.number)}" />
          </label>
          <label>Statut
            <select name="invStatus">${INVOICE_STATUSES.map(([id, label]) => `<option value="${id}" ${id === inv.status ? "selected" : ""}>${label}</option>`).join("")}</select>
          </label>
        </div>
        <label>Titre
          <input name="invTitle" required value="${esc(inv.title)}" />
        </label>
        <div class="row2">
          <label>Date
            <input name="invDate" type="date" value="${esc(inv.date)}" />
          </label>
          <label>Échéance
            <input name="invDue" type="date" value="${esc(inv.dueDate)}" />
          </label>
        </div>
        <div class="row2">
          <label>Devise
            <select name="invCurrency">
              <option value="MAD" ${inv.currency === "MAD" ? "selected" : ""}>MAD</option>
              <option value="EUR" ${inv.currency === "EUR" ? "selected" : ""}>EUR</option>
              <option value="USD" ${inv.currency === "USD" ? "selected" : ""}>USD</option>
            </select>
          </label>
          <label>TVA %
            <input name="invTax" type="number" min="0" step="0.1" value="${esc(inv.taxRate)}" />
          </label>
        </div>
        <label>Devis lié
          <select name="invQuote">
            <option value="">— Aucun —</option>
            ${quoteOpts}
          </select>
        </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Lignes</legend>
        <div id="quote-lines">${inv.lines.map(lineRowHtml).join("")}</div>
        <div class="actions">
          <button type="button" class="ghost-btn" id="add-line">+ Ligne</button>
        </div>
      </fieldset>
      <fieldset class="field-block">
        <legend>Notes</legend>
        <label>Conditions
          <textarea name="invNotes" rows="3">${esc(inv.notes)}</textarea>
        </label>
      </fieldset>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editorForm.dataset.shareToken = inv.shareToken;
    editorForm.dataset.payments = JSON.stringify(inv.payments);
    editorForm.dataset.reminders = JSON.stringify(inv.reminders);
    editorForm.dataset.workId = inv.workId;
    editor.showModal();
  }

  function openPayment(clientId, invoice) {
    mode = "payment";
    currentId = clientId;
    editingInvoiceId = invoice.id;
    const suggest = Math.round(quoteTotals(invoice).ttc * 0.4 * 100) / 100;
    editorForm.innerHTML = `
      <h3>Enregistrer un acompte</h3>
      <p class="editor-lede">Facture ${esc(invoice.number)} · reste ${money(invoiceBalance(invoice), invoice.currency)}.</p>
      <fieldset class="field-block">
        <legend>Paiement</legend>
        <label>Montant
          <input name="payAmount" type="number" min="0" step="0.01" required value="${esc(suggest)}" />
        </label>
        <div class="row2">
          <label>Date
            <input name="payDate" type="date" required value="${esc(todayISO())}" />
          </label>
          <label>Mode
            <select name="payMethod">
              <option value="virement">Virement</option>
              <option value="espèces">Espèces</option>
              <option value="chèque">Chèque</option>
              <option value="carte">Carte</option>
            </select>
          </label>
        </div>
        <label>Note
          <input name="payNote" placeholder="Acompte 40% commande" />
        </label>
      </fieldset>
      <div class="actions">
        <button type="submit" class="btn btn--solid btn--light">Enregistrer l’acompte</button>
        <button type="button" class="ghost-btn" id="cancel">Annuler</button>
      </div>
    `;
    editor.showModal();
  }

  function openQuotePrint(client, quote) {
    const tot = quoteTotals(quote);
    const currency = quote.currency || "MAD";
    quoteSheetBody.innerHTML = `
      <div class="q-brand">
        <div>
          <strong>CX Systems</strong>
          <em>Engineering Digital Systems · Casablanca</em>
          <em>WhatsApp +212 699 254 247</em>
        </div>
        <div class="q-meta">
          <div class="q-num">${esc(quote.number)}</div>
          <div>Date : ${esc(quote.date || "")}</div>
          <div>Valable jusqu’au : ${esc(quote.validUntil || "—")}</div>
          <div>Statut : ${esc(quoteStatusLabel(quote.status))}</div>
        </div>
      </div>
      <div class="q-parties">
        <div>
          <h4>Émetteur</h4>
          <p>CX Systems<br>Casablanca, Maroc<br>a.meziani.dev@gmail.com</p>
        </div>
        <div>
          <h4>Client</h4>
          <p>
            <strong>${esc(client.name)}</strong><br>
            ${esc(client.company) || ""}<br>
            ${esc(client.address) || ""} ${esc(client.city) || ""}<br>
            ${client.ice ? `ICE ${esc(client.ice)}<br>` : ""}
            ${esc(client.email) || ""} ${esc(client.phone) || ""}
          </p>
        </div>
      </div>
      <h3 style="margin:0 0 1rem;font-family:var(--serif);font-weight:400">${esc(quote.title)}</h3>
      <table class="q-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qté</th>
            <th class="num">P.U. HT</th>
            <th class="num">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${(quote.lines || [])
            .map((line) => {
              const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
              return `<tr>
                <td>${esc(line.description)}</td>
                <td class="num">${esc(line.qty)}</td>
                <td class="num">${money(line.unitPrice, currency)}</td>
                <td class="num">${money(lineTotal, currency)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
      <div class="q-totals">
        <div><span>Total HT</span><span>${money(tot.ht, currency)}</span></div>
        <div><span>TVA (${tot.rate}%)</span><span>${money(tot.tva, currency)}</span></div>
        <div class="q-ttc"><span>Total TTC</span><span>${money(tot.ttc, currency)}</span></div>
      </div>
      ${quote.notes ? `<div class="q-notes">${esc(quote.notes)}</div>` : ""}
      ${
        quote.signedAt
          ? `<div class="q-notes"><strong>Signé électroniquement le ${esc(quote.signedAt.slice(0, 10))}</strong> par ${esc(quote.signerName)}.${quote.signatureData ? `<br><img src="${esc(quote.signatureData)}" alt="Signature" style="max-width:220px;margin-top:0.6rem">` : ""}</div>`
          : ""
      }
      <div class="q-footer">Document généré depuis l’atelier CX Systems — devis non contractuel jusqu’à acceptation écrite ou signature.</div>
    `;
    quoteSheet.showModal();
  }

  function openInvoicePrint(client, invoice) {
    const tot = quoteTotals(invoice);
    const currency = invoice.currency || "MAD";
    quoteSheetBody.innerHTML = `
      <div class="q-brand">
        <div>
          <strong>CX Systems</strong>
          <em>Facture · Engineering Digital Systems</em>
          <em>WhatsApp +212 699 254 247</em>
        </div>
        <div class="q-meta">
          <div class="q-num">${esc(invoice.number)}</div>
          <div>Date : ${esc(invoice.date || "")}</div>
          <div>Échéance : ${esc(invoice.dueDate || "—")}</div>
          <div>Statut : ${esc(invoiceStatusLabel(liveInvoiceStatus(invoice)))}</div>
        </div>
      </div>
      <div class="q-parties">
        <div>
          <h4>Émetteur</h4>
          <p>CX Systems<br>Casablanca, Maroc<br>a.meziani.dev@gmail.com</p>
        </div>
        <div>
          <h4>Client</h4>
          <p>
            <strong>${esc(client.name)}</strong><br>
            ${esc(client.company) || ""}<br>
            ${esc(client.address) || ""} ${esc(client.city) || ""}<br>
            ${client.ice ? `ICE ${esc(client.ice)}<br>` : ""}
            ${esc(client.email) || ""} ${esc(client.phone) || ""}
          </p>
        </div>
      </div>
      <h3 style="margin:0 0 1rem;font-family:var(--serif);font-weight:400">${esc(invoice.title)}</h3>
      <table class="q-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qté</th>
            <th class="num">P.U. HT</th>
            <th class="num">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.lines || [])
            .map((line) => {
              const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
              return `<tr>
                <td>${esc(line.description)}</td>
                <td class="num">${esc(line.qty)}</td>
                <td class="num">${money(line.unitPrice, currency)}</td>
                <td class="num">${money(lineTotal, currency)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
      <div class="q-totals">
        <div><span>Total HT</span><span>${money(tot.ht, currency)}</span></div>
        <div><span>TVA (${tot.rate}%)</span><span>${money(tot.tva, currency)}</span></div>
        <div><span>Acomptes</span><span>${money(invoicePaid(invoice), currency)}</span></div>
        <div class="q-ttc"><span>Reste dû</span><span>${money(invoiceBalance(invoice), currency)}</span></div>
      </div>
      ${invoice.notes ? `<div class="q-notes">${esc(invoice.notes)}</div>` : ""}
      <div class="q-footer">Facture CX Systems — acomptes mentionnés ci-dessus.</div>
    `;
    quoteSheet.showModal();
  }

  function openProject(project) {
    mode = "project";
    currentId = project.id;
    const photos = project.photos || [];
    editorForm.innerHTML = `
      <h3>${project.title ? "Éditer le projet" : "Nouveau projet"}</h3>
      <p class="editor-lede">Réalisation affichée dans la section Travaux du site.</p>
      <fieldset class="field-block">
        <legend>Textes FR / EN</legend>
      <label>Titre
        <input name="title" required value="${esc(project.title)}" />
      </label>
      <label>Titre (EN)
        <input name="titleEn" value="${esc(project.titleEn)}" />
      </label>
      <label>Description
          <textarea name="description" rows="4" required>${esc(project.description)}</textarea>
      </label>
      <label>Description (EN)
        <textarea name="descriptionEn" rows="4">${esc(project.descriptionEn)}</textarea>
      </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Contexte</legend>
      <div class="row2">
        <label>Statut
            <input name="status" value="${esc(project.status)}" placeholder="En production" />
        </label>
        <label>Secteur
            <input name="sector" value="${esc(project.sector)}" placeholder="Commerce · Fidélité" />
        </label>
      </div>
      <label>Tags (séparés par une virgule)
        <input name="tags" value="${esc((project.tags || []).join(", "))}" />
      </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Visuels &amp; publication</legend>
      <label>Photos du projet
        <input type="file" accept="image/*" name="photos" multiple />
      </label>
      <div class="thumbs" id="photo-thumbs">${photos
        .map(
          (src, i) =>
            `<div class="shot"><img src="${esc(src)}" alt=""><button type="button" data-remove-photo="${i}">Retirer</button></div>`
        )
        .join("")}</div>
        <label class="check"><input type="checkbox" name="featured" ${project.featured ? "checked" : ""} /> Mettre en avant (priorité sur le site)</label>
        <label class="check"><input type="checkbox" name="published" ${project.published === true ? "checked" : ""} /> Afficher sur le site</label>
      </fieldset>
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
      <p class="editor-lede">Carte de la section « Notre offre » sur le site public.</p>
      <fieldset class="field-block">
        <legend>Titres</legend>
      <label>Titre
        <input name="title" required value="${esc(offer.title)}" />
      </label>
      <label>Titre (EN)
        <input name="titleEn" value="${esc(offer.titleEn)}" />
      </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Description</legend>
      <label>Description
          <textarea name="description" rows="4" required>${esc(offer.description)}</textarea>
      </label>
      <label>Description (EN)
        <textarea name="descriptionEn" rows="4">${esc(offer.descriptionEn)}</textarea>
      </label>
      </fieldset>
      <fieldset class="field-block">
        <legend>Détail (affiché sous la description)</legend>
      <label>Détail (optionnel)
          <textarea name="details" rows="3">${esc(offer.details)}</textarea>
      </label>
      <label>Détail (EN)
        <textarea name="detailsEn" rows="3">${esc(offer.detailsEn)}</textarea>
      </label>
      <label class="check"><input type="checkbox" name="published" ${offer.published !== false ? "checked" : ""} /> Afficher sur le site</label>
      </fieldset>
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
    const password = document.getElementById("login-pass").value.trim();
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

    const fail = (message) => {
      err.textContent = message || "Mot de passe incorrect";
      err.hidden = false;
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
      fail(data.error || "Mot de passe incorrect");
    } catch (error) {
      if (password === LOCAL_PASS) {
        try {
          await enter("local", true);
          return;
        } catch {
          fail("Connexion impossible. Rechargez la page.");
          return;
        }
      }
      fail(error && error.message ? "Connexion impossible. Rechargez la page." : "Mot de passe incorrect");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Entrer dans l’atelier";
      }
    }
  });

  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem(TOKEN_KEY);
    token = "";
    location.reload();
  });

  document.querySelectorAll(".admin-tab[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab[data-tab]").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const tab = btn.getAttribute("data-tab");
      document.getElementById("tab-clients").hidden = tab !== "clients";
      document.getElementById("tab-projects").hidden = tab !== "projects";
      document.getElementById("tab-offers").hidden = tab !== "offers";
      setDash(tab);
      renderStats();
    });
  });

  document.getElementById("client-search")?.addEventListener("input", () => {
    renderClientRail();
  });

  document.getElementById("cx-ribbon")?.addEventListener("click", (e) => {
    const next = e.target.closest("[data-next-action]");
    const desk = document.getElementById("client-dossier");
    if (!next || !desk || desk.hidden) return;
    const proxy = document.createElement("button");
    proxy.setAttribute("data-next-action", next.getAttribute("data-next-action"));
    proxy.hidden = true;
    desk.appendChild(proxy);
    proxy.click();
    proxy.remove();
  });

  document.getElementById("new-client").addEventListener("click", () => {
    openClient({ id: uid(), name: "", works: [], quotes: [] });
  });

  document.getElementById("new-project").addEventListener("click", () => {
    openProject({
      id: uid(),
      title: "",
      description: "",
      photos: [],
      tags: [],
      published: false,
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

  document.getElementById("client-rail")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-select-client]");
    if (!btn) return;
    selectedClientId = btn.getAttribute("data-select-client");
    clientPane = "infos";
    render();
  });

  document.getElementById("client-dossier")?.addEventListener("click", async (e) => {
    const pane = e.target.closest("[data-client-pane]");
    if (pane) {
      clientPane = pane.getAttribute("data-client-pane");
      renderClientDesk();
      return;
    }

    const next = e.target.closest("[data-next-action]");
    if (next) {
      const action = next.getAttribute("data-next-action");
      const client = getClient(selectedClientId);
      if (!client) return;
      if (action === "edit-client") {
        openClient(client);
        return;
      }
      if (action === "new-work") {
        clientPane = "works";
        openWork(selectedClientId, { id: uid(), title: "", status: "new", note: "", price: "", billing: "fixed", currency: "MAD" });
        return;
      }
      if (action === "edit-first-work") {
        const first = (client.works || [])[0];
        clientPane = "works";
        if (first) openWork(selectedClientId, first);
        return;
      }
      if (action === "new-quote") {
        clientPane = "quotes";
        openQuote(selectedClientId, { id: uid() });
        return;
      }
      if (action === "new-invoice") {
        clientPane = "invoices";
        const accepted = (client.quotes || []).find((q) => q.status === "accepted" || q.signedAt);
        openInvoice(selectedClientId, accepted ? invoiceFromQuote(accepted) : { id: uid() });
        return;
      }
      if (action === "quotes" || action === "works" || action === "invoices") {
        clientPane = action;
        renderClientDesk();
      }
      return;
    }

    const editClient = e.target.closest("[data-edit-client]");
    if (editClient) {
      const item = getClient(editClient.getAttribute("data-edit-client"));
      if (item) openClient(item);
      return;
    }

    const delClient = e.target.closest("[data-del-client]");
    if (delClient && confirm("Supprimer ce client, ses projets et ses devis ?")) {
      const id = delClient.getAttribute("data-del-client");
      store.clients = store.clients.filter((c) => c.id !== id);
      if (selectedClientId === id) selectedClientId = null;
      await saveStore();
      render();
      return;
    }

    if (e.target.closest("[data-new-work]")) {
      openWork(selectedClientId, { id: uid(), title: "", status: "new", note: "", price: "", billing: "fixed", currency: "MAD" });
      return;
    }

    const editWork = e.target.closest("[data-edit-work]");
    if (editWork) {
      const client = getClient(selectedClientId);
      const work = client?.works?.find((w) => w.id === editWork.getAttribute("data-edit-work"));
      if (work) openWork(selectedClientId, work);
      return;
    }

    const delWork = e.target.closest("[data-del-work]");
    if (delWork && confirm("Supprimer ce projet client ?")) {
      const client = getClient(selectedClientId);
      if (!client) return;
      client.works = (client.works || []).filter((w) => w.id !== delWork.getAttribute("data-del-work"));
      await saveStore();
      render();
      return;
    }

    if (e.target.closest("[data-new-quote]")) {
      clientPane = "quotes";
      openQuote(selectedClientId, { id: uid() });
      return;
    }

    const publishWork = e.target.closest("[data-publish-work]");
    if (publishWork) {
      const client = getClient(selectedClientId);
      const work = client?.works?.find((w) => w.id === publishWork.getAttribute("data-publish-work"));
      if (client && work) {
        publishWorkToSite(client, work);
        await saveStore();
        render();
      }
      return;
    }

    const waQuote = e.target.closest("[data-wa-quote]");
    if (waQuote) {
      const client = getClient(selectedClientId);
      const quote = client?.quotes?.find((q) => q.id === waQuote.getAttribute("data-wa-quote"));
      if (client && quote) sendQuoteWhatsApp(client, quote);
      return;
    }

    const mailQuote = e.target.closest("[data-mail-quote]");
    if (mailQuote) {
      const client = getClient(selectedClientId);
      const quote = client?.quotes?.find((q) => q.id === mailQuote.getAttribute("data-mail-quote"));
      if (client && quote) sendQuoteEmail(client, quote);
      return;
    }

    const invoiceFrom = e.target.closest("[data-invoice-from-quote]");
    if (invoiceFrom) {
      const client = getClient(selectedClientId);
      const quote = client?.quotes?.find((q) => q.id === invoiceFrom.getAttribute("data-invoice-from-quote"));
      if (client && quote) {
        clientPane = "invoices";
        openInvoice(selectedClientId, invoiceFromQuote(quote));
      }
      return;
    }

    if (e.target.closest("[data-new-invoice]")) {
      clientPane = "invoices";
      openInvoice(selectedClientId, { id: uid() });
      return;
    }

    const editInvoice = e.target.closest("[data-edit-invoice]");
    if (editInvoice) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === editInvoice.getAttribute("data-edit-invoice"));
      if (invoice) openInvoice(selectedClientId, invoice);
      return;
    }

    const payInvoice = e.target.closest("[data-pay-invoice]");
    if (payInvoice) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === payInvoice.getAttribute("data-pay-invoice"));
      if (invoice) openPayment(selectedClientId, invoice);
      return;
    }

    const printInvoice = e.target.closest("[data-print-invoice]");
    if (printInvoice) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === printInvoice.getAttribute("data-print-invoice"));
      if (client && invoice) openInvoicePrint(client, invoice);
      return;
    }

    const delInvoice = e.target.closest("[data-del-invoice]");
    if (delInvoice && confirm("Supprimer cette facture ?")) {
      const client = getClient(selectedClientId);
      if (!client) return;
      const id = delInvoice.getAttribute("data-del-invoice");
      const inv = (client.invoices || []).find((item) => item.id === id);
      client.invoices = (client.invoices || []).filter((item) => item.id !== id);
      logHistory(client, "suppression", `Facture ${inv?.number || ""} supprimée`);
      await saveStore();
      render();
      return;
    }

    const waInv = e.target.closest("[data-wa-invoice]");
    if (waInv) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === waInv.getAttribute("data-wa-invoice"));
      if (client && invoice) await sendInvoiceChannel(client, invoice, "whatsapp", "send");
      return;
    }

    const mailInv = e.target.closest("[data-mail-invoice]");
    if (mailInv) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === mailInv.getAttribute("data-mail-invoice"));
      if (client && invoice) await sendInvoiceChannel(client, invoice, "email", "send");
      return;
    }

    const remindWa = e.target.closest("[data-remind-wa]");
    if (remindWa) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === remindWa.getAttribute("data-remind-wa"));
      if (client && invoice) await sendInvoiceChannel(client, invoice, "whatsapp", "reminder");
      return;
    }

    const remindMail = e.target.closest("[data-remind-mail]");
    if (remindMail) {
      const client = getClient(selectedClientId);
      const invoice = client?.invoices?.find((inv) => inv.id === remindMail.getAttribute("data-remind-mail"));
      if (client && invoice) await sendInvoiceChannel(client, invoice, "email", "reminder");
      return;
    }

    const editQuote = e.target.closest("[data-edit-quote]");
    if (editQuote) {
      const client = getClient(selectedClientId);
      const quote = client?.quotes?.find((q) => q.id === editQuote.getAttribute("data-edit-quote"));
      if (quote) openQuote(selectedClientId, quote);
      return;
    }

    const printQuote = e.target.closest("[data-print-quote]");
    if (printQuote) {
      const client = getClient(selectedClientId);
      const quote = client?.quotes?.find((q) => q.id === printQuote.getAttribute("data-print-quote"));
      if (client && quote) openQuotePrint(client, quote);
      return;
    }

    const delQuote = e.target.closest("[data-del-quote]");
    if (delQuote && confirm("Supprimer ce devis ?")) {
      const client = getClient(selectedClientId);
      if (!client) return;
      client.quotes = (client.quotes || []).filter((q) => q.id !== delQuote.getAttribute("data-del-quote"));
      await saveStore();
      render();
    }
  });

  document.getElementById("offer-list").addEventListener("click", async (e) => {
    const edit = e.target.closest("[data-edit-offer]");
    const del = e.target.closest("[data-del-offer]");
    const toggle = e.target.closest("[data-toggle-offer]");
    if (edit) {
      const item = store.offers.find((o) => o.id === edit.getAttribute("data-edit-offer"));
      if (item) openOffer(item);
    }
    if (toggle) {
      const item = store.offers.find((o) => o.id === toggle.getAttribute("data-toggle-offer"));
      if (item) {
        item.published = item.published !== true;
        await saveStore();
        render();
      }
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
    const toggle = e.target.closest("[data-toggle-project]");
    if (edit) {
      const item = store.projects.find((p) => p.id === edit.getAttribute("data-edit-project"));
      if (item) openProject(item);
    }
    if (toggle) {
      const item = store.projects.find((p) => p.id === toggle.getAttribute("data-toggle-project"));
      if (item) {
        item.published = item.published !== true;
        await saveStore();
        render();
      }
    }
    if (del && confirm("Supprimer ce projet ? Il disparaîtra du site s’il était publié.")) {
      store.projects = store.projects.filter((p) => p.id !== del.getAttribute("data-del-project"));
      await saveStore();
      render();
    }
  });

  document.getElementById("quote-sheet-close")?.addEventListener("click", () => quoteSheet.close());
  document.getElementById("quote-print-btn")?.addEventListener("click", () => window.print());
  quoteSheet?.addEventListener("click", (e) => {
    if (e.target === quoteSheet) quoteSheet.close();
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
    if (e.target.id === "add-line") {
      e.preventDefault();
      document.getElementById("quote-lines")?.insertAdjacentHTML(
        "beforeend",
        lineRowHtml({ id: uid(), description: "", qty: 1, unitPrice: 0 })
      );
      return;
    }
    if (e.target.id === "fill-from-work") {
      e.preventDefault();
      const workId = editorForm.quoteWork?.value;
      const client = getClient(currentId);
      const work = client?.works?.find((w) => w.id === workId);
      if (!work) {
        alert("Choisissez d’abord un projet lié.");
        return;
      }
      const wrap = document.getElementById("quote-lines");
      if (!wrap) return;
      wrap.innerHTML = lineRowHtml({
        id: uid(),
        description: work.title,
        qty: 1,
        unitPrice: Number(work.price) || 0,
      });
      if (!editorForm.quoteTitle.value) editorForm.quoteTitle.value = work.title;
      if (work.currency) editorForm.quoteCurrency.value = work.currency;
      return;
    }
    const dropLine = e.target.closest("[data-remove-line]");
    if (dropLine) {
      e.preventDefault();
      dropLine.closest("[data-line-row]")?.remove();
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
      const prev = getClient(currentId) || {};
      const next = upsertClient({
        ...prev,
        id: currentId,
        name: editorForm.name.value.trim(),
        company: editorForm.company.value.trim(),
        email: editorForm.email.value.trim(),
        phone: editorForm.phone.value.trim(),
        city: editorForm.city.value.trim(),
        ice: editorForm.ice.value.trim(),
        address: editorForm.address.value.trim(),
        profileImage: editorForm.dataset.profile || "",
        need: editorForm.need.value.trim(),
        needClean: editorForm.needClean.value.trim(),
        pdfName: editorForm.dataset.pdfName || "",
        pdfData: editorForm.dataset.pdfData || "",
        works: prev.works || [],
        quotes: prev.quotes || [],
        invoices: prev.invoices || [],
        history: prev.history || [],
        createdAt: prev.createdAt || new Date().toISOString(),
      });
      logHistory(next, "fiche", prev.name ? "Fiche client mise à jour" : `Dossier ouvert : ${next.name}`);
      selectedClientId = next.id;
      clientPane = "infos";
    }

    if (mode === "work") {
      const client = getClient(currentId);
      if (!client) return;
      const prevWork = (client.works || []).find((w) => w.id === editingWorkId) || {};
      const nextWork = {
        id: editingWorkId,
        title: editorForm.workTitle.value.trim(),
        status: editorForm.workStatus.value,
        note: editorForm.workNote.value.trim(),
        price: Number(editorForm.workPrice.value) || 0,
        currency: editorForm.workCurrency.value || "MAD",
        billing: editorForm.workBilling.value || "fixed",
        publicProjectId: editorForm.workProject.value || prevWork.publicProjectId || "",
      };
      const idx = (client.works || []).findIndex((w) => w.id === editingWorkId);
      if (idx >= 0) client.works[idx] = nextWork;
      else client.works = [...(client.works || []), nextWork];
      syncWorkProject(client, nextWork);
      if (editorForm.workPublish?.checked) publishWorkToSite(client, nextWork);
      logHistory(client, "mission", `${prevWork.title ? "Mission mise à jour" : "Mission ouverte"} : ${nextWork.title} · ${money(nextWork.price, nextWork.currency)}`);
      clientPane = "works";
    }

    if (mode === "quote") {
      const client = getClient(currentId);
      if (!client) return;
      const prevQuote = (client.quotes || []).find((q) => q.id === editingQuoteId) || {};
      const nextQuote = {
        id: editingQuoteId,
        number: editorForm.quoteNumber.value.trim(),
        title: editorForm.quoteTitle.value.trim(),
        date: editorForm.quoteDate.value,
        validUntil: editorForm.quoteValid.value,
        status: editorForm.quoteStatus.value,
        currency: editorForm.quoteCurrency.value || "MAD",
        taxRate: Number(editorForm.quoteTax.value) || 0,
        notes: editorForm.quoteNotes.value.trim(),
        workId: editorForm.quoteWork.value || "",
        lines: collectLines(),
        shareToken: editorForm.dataset.shareToken || prevQuote.shareToken || uid(),
        signedAt: editorForm.dataset.signedAt || prevQuote.signedAt || "",
        signerName: editorForm.dataset.signerName || prevQuote.signerName || "",
        signatureData: editorForm.dataset.signatureData || prevQuote.signatureData || "",
        sentAt: editorForm.dataset.sentAt || prevQuote.sentAt || "",
        sentVia: editorForm.dataset.sentVia || prevQuote.sentVia || "",
      };
      const idx = (client.quotes || []).findIndex((q) => q.id === editingQuoteId);
      if (idx >= 0) client.quotes[idx] = { ...prevQuote, ...nextQuote };
      else client.quotes = [...(client.quotes || []), nextQuote];
      logHistory(client, "devis", `${prevQuote.number ? "Devis modifié" : "Devis créé"} : ${nextQuote.number}`);
      clientPane = "quotes";
    }

    if (mode === "invoice") {
      const client = getClient(currentId);
      if (!client) return;
      const prevInv = (client.invoices || []).find((inv) => inv.id === editingInvoiceId) || {};
      const nextInv = {
        id: editingInvoiceId,
        number: editorForm.invNumber.value.trim(),
        title: editorForm.invTitle.value.trim(),
        date: editorForm.invDate.value,
        dueDate: editorForm.invDue.value,
        status: editorForm.invStatus.value,
        currency: editorForm.invCurrency.value || "MAD",
        taxRate: Number(editorForm.invTax.value) || 0,
        notes: editorForm.invNotes.value.trim(),
        quoteId: editorForm.invQuote.value || "",
        workId: editorForm.dataset.workId || prevInv.workId || "",
        lines: collectLines(),
        payments: JSON.parse(editorForm.dataset.payments || JSON.stringify(prevInv.payments || [])),
        reminders: JSON.parse(editorForm.dataset.reminders || JSON.stringify(prevInv.reminders || [])),
        shareToken: editorForm.dataset.shareToken || prevInv.shareToken || uid(),
      };
      const idx = (client.invoices || []).findIndex((inv) => inv.id === editingInvoiceId);
      if (idx >= 0) client.invoices[idx] = { ...prevInv, ...nextInv };
      else client.invoices = [...(client.invoices || []), nextInv];
      logHistory(client, "facture", `${prevInv.number ? "Facture modifiée" : "Facture émise"} : ${nextInv.number}`);
      clientPane = "invoices";
    }

    if (mode === "payment") {
      const client = getClient(currentId);
      const invoice = client?.invoices?.find((inv) => inv.id === editingInvoiceId);
      if (!client || !invoice) return;
      invoice.payments = invoice.payments || [];
      invoice.payments.push({
        id: uid(),
        amount: Number(editorForm.payAmount.value) || 0,
        date: editorForm.payDate.value,
        method: editorForm.payMethod.value,
        note: editorForm.payNote.value.trim(),
      });
      invoice.status = liveInvoiceStatus(invoice);
      logHistory(
        client,
        "acompte",
        `Acompte ${money(editorForm.payAmount.value, invoice.currency)} sur ${invoice.number}`
      );
      clientPane = "invoices";
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
