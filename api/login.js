const { passwordMatches, expectedToken } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let body = {};
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    body = {};
  }

  if (!passwordMatches(String(body.password || ""))) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Mot de passe incorrect" }));
    return;
  }

  const token = expectedToken();
  const secure = process.env.VERCEL ? "; Secure" : "";
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Set-Cookie",
    `cx_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200${secure}`
  );
  res.end(JSON.stringify({ ok: true, token }));
};
