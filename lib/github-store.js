function githubConfig() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_STORE_TOKEN || "";
  if (!token) return null;
  const owner = process.env.VERCEL_GIT_REPO_OWNER || "";
  const slug = process.env.VERCEL_GIT_REPO_SLUG || "";
  const repo = process.env.GITHUB_REPO || (owner && slug ? `${owner}/${slug}` : "meziania/Costumer_experience-");
  return {
    token,
    repo,
    branch: process.env.GITHUB_BRANCH || "main",
    path: process.env.GITHUB_STORE_PATH || "data/store.json",
  };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "cx-systems-store",
  };
}

async function readGithubFile(cfg) {
  const url = `https://api.github.com/repos/${cfg.repo}/contents/${cfg.path}?ref=${encodeURIComponent(cfg.branch)}`;
  const res = await fetch(url, { headers: headers(cfg.token) });
  if (!res.ok) return null;
  const file = await res.json();
  if (!file?.content) return null;
  const json = Buffer.from(String(file.content).replace(/\n/g, ""), "base64").toString("utf8");
  const data = JSON.parse(json);
  if (!data || typeof data !== "object") return null;
  return { data, sha: file.sha };
}

async function readGithub() {
  const cfg = githubConfig();
  if (!cfg) return null;
  try {
    const file = await readGithubFile(cfg);
    return file?.data || null;
  } catch {
    return null;
  }
}

async function writeGithub(payload) {
  const cfg = githubConfig();
  if (!cfg) return false;
  try {
    const current = await readGithubFile(cfg);
    const body = {
      message: "Save atelier store (projects, photos, offers).",
      content: Buffer.from(JSON.stringify(payload, null, 2), "utf8").toString("base64"),
      branch: cfg.branch,
    };
    if (current?.sha) body.sha = current.sha;
    const res = await fetch(`https://api.github.com/repos/${cfg.repo}/contents/${cfg.path}`, {
      method: "PUT",
      headers: { ...headers(cfg.token), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { githubConfig, readGithub, writeGithub };
