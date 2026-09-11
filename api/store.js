const { checkAuth } = require("../lib/auth");
const { readStore, writeStore, publicStore } = require("../lib/store");

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    if (checkAuth(req)) return send(res, 200, readStore());
    return send(res, 200, publicStore());
  }

  if (req.method === "PUT" || req.method === "POST") {
    if (!checkAuth(req)) return send(res, 401, { error: "Unauthorized" });
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      return send(res, 400, { error: "JSON invalide" });
    }
    return send(res, 200, writeStore(body));
  }

  send(res, 405, { error: "Method not allowed" });
};
