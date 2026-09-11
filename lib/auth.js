const crypto = require("crypto");

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "cxadmin2024";
}

function adminSecret() {
  return process.env.ADMIN_SECRET || process.env.NEXTAUTH_SECRET || "cx-systems-atelier-auth";
}

function expectedToken() {
  return crypto.createHmac("sha256", adminSecret()).update(adminPassword()).digest("hex");
}

function passwordMatches(input) {
  const expected = adminPassword();
  if (!input || input.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

function readToken(req) {
  const header = req.headers.authorization || "";
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  if (bearer) return bearer;
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("cx_admin="));
  return cookie ? decodeURIComponent(cookie.slice("cx_admin=".length)) : "";
}

function checkAuth(req) {
  const token = readToken(req);
  return Boolean(token) && token === expectedToken();
}

module.exports = { adminPassword, expectedToken, passwordMatches, checkAuth };
