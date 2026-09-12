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

  const money = (amount, currency = "MAD") => {
    const n = Number(amount) || 0;
    try {
      return new Intl.NumberFormat("fr-MA", {
        style: "currency",
        currency: currency === "EUR" ? "EUR" : currency === "USD" ? "USD" : "MAD",
        maximumFractionDigits: 2,
      }).format(n);
    } catch {
      return `${n.toFixed(2)} ${currency}`;
    }
  };

  const totals = (quote) => {
    const ht = (quote.lines || []).reduce(
      (sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0),
      0
    );
    const rate = Number.isFinite(Number(quote.taxRate)) ? Number(quote.taxRate) : 20;
    return { ht, tva: (ht * rate) / 100, ttc: ht + (ht * rate) / 100, rate };
  };

  const renderQuote = (quote) => {
    const tot = totals(quote);
    const currency = quote.currency || "MAD";
    sheet.innerHTML = `
      <div class="q-brand">
        <div>
          <strong>CX Systems</strong>
          <em>Engineering Digital Systems · Casablanca</em>
        </div>
        <div class="q-meta">
          <div class="q-num">${quote.number || ""}</div>
          <div>Date : ${quote.date || ""}</div>
          <div>Valable jusqu’au : ${quote.validUntil || "—"}</div>
        </div>
      </div>
      <div class="q-parties">
        <div>
          <h4>Émetteur</h4>
          <p>CX Systems<br>Casablanca, Maroc</p>
        </div>
        <div>
          <h4>Client</h4>
          <p><strong>${quote.client?.name || ""}</strong><br>${quote.client?.company || ""}<br>${quote.client?.city || ""}</p>
        </div>
      </div>
      <h3 style="margin:0 0 1rem;font-family:var(--serif);font-weight:400">${quote.title || "Devis"}</h3>
      <table class="q-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qté</th>
            <th class="num">P.U. HT</th>
            <th class="num">Total HT</th>
          </tr>
        </thead>
        <tbody>
          ${(quote.lines || [])
            .map((line) => {
              const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
              return `<tr>
                <td>${line.description || ""}</td>
                <td class="num">${line.qty || 0}</td>
                <td class="num">${money(line.unitPrice, currency)}</td>
                <td class="num">${money(lineTotal, currency)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
      <div class="q-totals">
        <div><span>Total HT</span><span>${money(tot.ht, currency)}</span></div>
        <div><span>TVA (${tot.rate}%)</span><span>${money(tot.tva, currency)}</span></div>
        <div class="q-ttc"><span>Total TTC</span><span>${money(tot.ttc, currency)}</span></div>
      </div>
      ${quote.notes ? `<div class="q-notes">${quote.notes}</div>` : ""}
      ${
        quote.signedAt
          ? `<div class="q-notes"><strong>Signé le ${quote.signedAt.slice(0, 10)}</strong> par ${quote.signerName}.</div>`
          : ""
      }`;
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
