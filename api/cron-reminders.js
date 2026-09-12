const { collectReminders } = require("../lib/store");

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function authorized(req) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return process.env.VERCEL !== "1";
  const header = req.headers.authorization || "";
  return header === `Bearer ${secret}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed" });
  }
  if (!authorized(req)) return send(res, 401, { error: "Unauthorized" });

  const report = await collectReminders();
  const actionable = report.due.filter((item) => !item.remindedToday);
  return send(res, 200, {
    ok: true,
    persistence: report.persistence,
    overdue: report.due.length,
    toRemind: actionable.length,
    items: actionable,
  });
};
