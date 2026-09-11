function localReformulate(raw) {
  const text = String(raw || "").replace(/\r/g, "").trim();
  if (!text) return "";

  const cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[–—]/g, "-")
    .trim();

  const lines = cleaned
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const sentences = lines
    .join(". ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const body = part.charAt(0).toUpperCase() + part.slice(1);
      return /[.!?]$/.test(body) ? body : `${body}.`;
    });

  const joined = sentences.join(" ");
  return [
    "Besoin client (reformulé)",
    "",
    joined,
    "",
    "Objectif : livrer un système digital clair, utilisable au quotidien, aligné sur ce besoin.",
  ].join("\n");
}

async function reformulate(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";

  const key = process.env.OPENAI_API_KEY;
  if (!key) return localReformulate(input);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Tu es un chef de projet logiciel. Reformule le besoin client en français professionnel, clair et structuré (Contexte, Objectif, Contraintes, Livrable attendu). N'invente aucun fait. Pas de markdown excessif.",
        },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) return localReformulate(input);
  const payload = await res.json();
  return payload.choices?.[0]?.message?.content?.trim() || localReformulate(input);
}

module.exports = { reformulate, localReformulate };
