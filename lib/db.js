function supabaseConfig() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function readRemote() {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/rest/v1/cx_store?id=eq.1&select=data`, {
    headers: headers(cfg.key),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  const data = rows?.[0]?.data;
  if (!data || typeof data !== "object") return null;
  return data;
}

async function writeRemote(payload) {
  const cfg = supabaseConfig();
  if (!cfg) return false;
  const body = JSON.stringify({
    id: 1,
    data: payload,
    updated_at: new Date().toISOString(),
  });
  const patch = await fetch(`${cfg.url}/rest/v1/cx_store?id=eq.1`, {
    method: "PATCH",
    headers: headers(cfg.key),
    body,
  });
  if (patch.ok) {
    const rows = await patch.json().catch(() => []);
    if (Array.isArray(rows) && rows.length) return true;
  }
  const insert = await fetch(`${cfg.url}/rest/v1/cx_store`, {
    method: "POST",
    headers: headers(cfg.key),
    body,
  });
  return insert.ok;
}

module.exports = { supabaseConfig, readRemote, writeRemote };
