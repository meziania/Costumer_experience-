const fs = require("fs");
const path = require("path");

const bundled = path.join(process.cwd(), "data", "store.json");
const writable = process.env.VERCEL ? "/tmp/cx-store.json" : bundled;

function readStore() {
  try {
    if (fs.existsSync(writable)) {
      return JSON.parse(fs.readFileSync(writable, "utf8"));
    }
  } catch {
    /* fall through */
  }
  try {
    if (fs.existsSync(bundled)) {
      return JSON.parse(fs.readFileSync(bundled, "utf8"));
    }
  } catch {
    /* empty */
  }
  return { clients: [], projects: [] };
}

function writeStore(data) {
  const payload = {
    clients: Array.isArray(data.clients) ? data.clients : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
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
    clients: (store.clients || [])
      .filter((item) => item.published !== false)
      .map(({ pdfData, ...rest }) => rest),
    projects: (store.projects || []).filter((item) => item.published !== false),
  };
}

module.exports = { readStore, writeStore, publicStore };
