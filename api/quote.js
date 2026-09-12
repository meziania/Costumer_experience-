const { findQuoteByToken, publicQuoteView, signQuoteByToken } = require("../lib/store");

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("json"));
      }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.end();
  }

  const url = new URL(req.url, "http://localhost");
  const token = url.searchParams.get("t") || url.searchParams.get("token") || "";

  if (req.method === "GET") {
    const found = await findQuoteByToken(token);
    if (!found || found.kind !== "quote") return send(res, 404, { error: "Devis introuvable" });
    return send(res, 200, publicQuoteView(found.client, found.quote));
  }

  if (req.method === "POST") {
    let body = {};
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: "JSON invalide" });
    }
    const result = await signQuoteByToken(body.token || token, {
      signerName: body.signerName,
      signature: body.signature,
    });
    if (result.error === "not_found") return send(res, 404, { error: "Devis introuvable" });
    if (result.error === "already_signed") return send(res, 409, result);
    if (result.error === "invalid") return send(res, 400, { error: "Nom et signature requis" });
    return send(res, 200, result);
  }

  send(res, 405, { error: "Method not allowed" });
};
