const fs = require("fs");
const path = require("path");

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

function seedOffers(store) {
  if (Array.isArray(store.offers) && store.offers.length) return store;
  const bundledData = loadJson(bundled);
  if (bundledData?.offers?.length) store.offers = bundledData.offers;
  else store.offers = store.offers || [];
  return store;
}

function readStore() {
  const fromWritable = loadJson(writable);
  if (fromWritable) return seedOffers(fromWritable);
  const fromBundled = loadJson(bundled);
  if (fromBundled) return seedOffers(fromBundled);
  return emptyStore();
}

function writeStore(data) {
  const current = readStore();
  const payload = {
    clients: Array.isArray(data.clients) ? data.clients : current.clients || [],
    projects: Array.isArray(data.projects) ? data.projects : current.projects || [],
    offers: Array.isArray(data.offers) ? data.offers : current.offers || [],
  };
  const json = JSON.stringify(payload, null, 2);
  fs.writeFileSync(writable, json);
  if (writable !== bundled) {
    try {
      fs.writeFileSync(bundled, json);
    } catch {
      /* read-only bundle on Vercel */
    }
  }
  return payload;
}

function publicStore() {
  const store = readStore();
  return {
    projects: (store.projects || []).filter((item) => item.published !== false),
    offers: (store.offers || []).filter((item) => item.published !== false),
  };
}

module.exports = { readStore, writeStore, publicStore };
