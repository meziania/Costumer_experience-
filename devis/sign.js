(() => {
  const params = new URLSearchParams(location.search);
  const token = params.get("t") || params.get("token") || "";
  const status = document.getElementById("sign-status");
  const sheet = document.getElementById("sign-sheet");
  const form = document.getElementById("sign-form");
  const err = document.getElementById("sign-err");
  const canvas = document.getElementById("sign-pad");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  const renderQuote = (quote) => {
    sheet.innerHTML = window.CXDevis.renderDocument({
      kind: "quote",
      client: quote.client || {},
      doc: quote,
    });
    sheet.hidden = false;
  };

  const pos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: ((src.clientX - rect.left) / rect.width) * canvas.width,
      y: ((src.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  ctx.strokeStyle = "#0c1218";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";

  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  const stop = () => {
    drawing = false;
  };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointerleave", stop);

  document.getElementById("sign-clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      err.textContent = "Dessinez votre signature.";
      err.hidden = false;
      return;
    }
    const btn = document.getElementById("sign-submit");
    btn.disabled = true;
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signerName: document.getElementById("signer-name").value.trim(),
          signature: canvas.toDataURL("image/png"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "signature");
      renderQuote(data.quote);
      form.hidden = true;
      status.textContent = "Devis accepté et signé. Merci.";
    } catch (error) {
      err.textContent = error.message === "signature" ? "Signature impossible pour le moment." : String(error.message);
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  (async () => {
    if (!token) {
      status.textContent = "Lien de devis invalide.";
      return;
    }
    try {
      const res = await fetch(`/api/quote?t=${encodeURIComponent(token)}`);
      const quote = await res.json();
      if (!res.ok) throw new Error("missing");
      renderQuote(quote);
      if (quote.signedAt) {
        status.textContent = `Déjà signé par ${quote.signerName}.`;
      } else {
        status.textContent = "Relisez le devis, puis signez pour accepter.";
        form.hidden = false;
      }
    } catch {
      status.textContent = "Ce devis est introuvable ou n’est plus disponible.";
    }
  })();
})();
