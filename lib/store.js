const fs = require("fs");
const path = require("path");
const { supabaseConfig, readRemote, writeRemote } = require("./db");

const bundled = path.join(process.cwd(), "data", "store.json");
const writable = process.env.VERCEL ? "/tmp/cx-store.json" : bundled;

function loadJson(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch {
    /* fall through */
  }
  return null;
}

function emptyStore() {
  return { clients: [], projects: [], offers: [] };
}

function normalizePayload(data, current) {
  return {
    clients: Array.isArray(data.clients) ? data.clients : current.clients || [],
    projects: Array.isArray(data.projects) ? data.projects : current.projects || [],
    offers: Array.isArray(data.offers) ? data.offers : current.offers || [],
  };
}

function seedOffers(store) {
  if (Array.isArray(store.offers) && store.offers.length) return store;
  const bundledData = loadJson(bundled);
  if (bundledData?.offers?.length) store.offers = bundledData.offers;
  else store.offers = store.offers || [];
  return store;
}

function writeLocal(payload) {
  const json = JSON.stringify(payload, null, 2);
  try {
    fs.writeFileSync(writable, json);
  } catch {
    /* ignore */
  }
  if (writable !== bundled) {
    try {
      fs.writeFileSync(bundled, json);
    } catch {
      /* read-only bundle on Vercel */
    }
  }
}

async function readStore() {
  if (supabaseConfig()) {
    const remote = await readRemote();
    if (remote) {
      const seeded = seedOffers(remote);
      writeLocal(seeded);
      return seeded;
    }
  }
  const fromWritable = loadJson(writable);
  if (fromWritable) return seedOffers(fromWritable);
  const fromBundled = loadJson(bundled);
  if (fromBundled) return seedOffers(fromBundled);
  return emptyStore();
}

async function writeStore(data) {
  const current = await readStore();
  const payload = normalizePayload(data, current);
  if (supabaseConfig()) {
    const ok = await writeRemote(payload);
    if (!ok) {
      writeLocal(payload);
      return payload;
    }
  }
  writeLocal(payload);
  return payload;
}

async function publicStore() {
  const store = await readStore();
  return {
    projects: (store.projects || []).filter((item) => item.published === true),
    offers: (store.offers || []).filter((item) => item.published === true),
    persistence: supabaseConfig() ? "supabase" : "json",
  };
}

async function findQuoteByToken(token) {
  if (!token) return null;
  const store = await readStore();
  for (const client of store.clients || []) {
    for (const quote of client.quotes || []) {
      if (quote.shareToken && quote.shareToken === token) {
        return { store, client, quote, kind: "quote" };
      }
    }
    for (const invoice of client.invoices || []) {
      if (invoice.shareToken && invoice.shareToken === token) {
        return { store, client, invoice, kind: "invoice" };
      }
    }
  }
  return null;
}

function publicQuoteView(client, quote) {
  return {
    kind: "quote",
    number: quote.number || "",
    title: quote.title || "",
    date: quote.date || "",
    validUntil: quote.validUntil || "",
    status: quote.status || "draft",
    currency: quote.currency || "MAD",
    taxRate: quote.taxRate ?? 20,
    notes: quote.notes || "",
    terms: quote.terms || "",
    depositPercent: quote.depositPercent,
    lines: Array.isArray(quote.lines) ? quote.lines : [],
    signedAt: quote.signedAt || "",
    signerName: quote.signerName || "",
    signatureData: quote.signatureData || "",
    client: {
      name: client.name || "",
      company: client.company || "",
      city: client.city || "",
      address: client.address || "",
      email: client.email || "",
      phone: client.phone || "",
      ice: client.ice || "",
    },
  };
}

async function signQuoteByToken(token, { signerName, signature }) {
  const found = await findQuoteByToken(token);
  if (!found || found.kind !== "quote") return { error: "not_found" };
  if (found.quote.signedAt) {
    return { error: "already_signed", quote: publicQuoteView(found.client, found.quote) };
  }
  const name = String(signerName || "").trim();
  const sig = String(signature || "").trim();
  if (!name || !sig.startsWith("data:image")) return { error: "invalid" };
  found.quote.signedAt = new Date().toISOString();
  found.quote.signerName = name;
  found.quote.signatureData = sig;
  found.quote.status = "accepted";
  found.client.history = Array.isArray(found.client.history) ? found.client.history : [];
  found.client.history.unshift({
    id: `${Date.now().toString(16)}-sign`,
    at: new Date().toISOString(),
    action: "signature",
    detail: `Devis ${found.quote.number} signé par ${name}`,
  });
  await writeStore(found.store);
  return { ok: true, quote: publicQuoteView(found.client, found.quote) };
}

function invoiceBalance(invoice) {
  const ht = (invoice.lines || []).reduce(
    (sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0),
    0
  );
  const rate = Number.isFinite(Number(invoice.taxRate)) ? Number(invoice.taxRate) : 20;
  const ttc = ht + (ht * rate) / 100;
  const paid = (invoice.payments || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return Math.max(0, ttc - paid);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function collectReminders() {
  const store = await readStore();
  const due = [];
  for (const client of store.clients || []) {
    for (const invoice of client.invoices || []) {
      const balance = invoiceBalance(invoice);
      const overdue = invoice.dueDate && invoice.dueDate < todayISO() && balance > 0.05;
      if (!overdue) continue;
      const already = (invoice.reminders || []).some((item) => (item.at || "").slice(0, 10) === todayISO());
      due.push({
        clientId: client.id,
        clientName: client.name,
        email: client.email || "",
        phone: client.phone || "",
        number: invoice.number,
        title: invoice.title,
        dueDate: invoice.dueDate,
        balance,
        remindedToday: already,
      });
    }
    for (const quote of client.quotes || []) {
      if (quote.status !== "sent" || quote.signedAt) continue;
      if (quote.validUntil && quote.validUntil < todayISO()) {
        due.push({
          clientId: client.id,
          clientName: client.name,
          email: client.email || "",
          phone: client.phone || "",
          number: quote.number,
          title: quote.title,
          dueDate: quote.validUntil,
          kind: "quote-expired",
          remindedToday: false,
        });
      }
    }
  }
  return { persistence: supabaseConfig() ? "supabase" : "json", due };
}

module.exports = {
  readStore,
  writeStore,
  publicStore,
  findQuoteByToken,
  publicQuoteView,
  signQuoteByToken,
  collectReminders,
};
