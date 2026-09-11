const { checkAuth } = require("../lib/auth");
const { reformulate } = require("../lib/reformulate");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  if (!checkAuth(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let body = {};
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "JSON invalide" }));
    return;
  }

  const text = await reformulate(body.text || "");
  res.statusCode = 200;
  res.end(JSON.stringify({ text }));
};
