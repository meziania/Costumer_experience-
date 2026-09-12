(() => {
  const issuer = {
    brand: "CX Systems",
    tagline: "Engineering Digital Systems",
    city: "Casablanca, Maroc",
    email: "a.meziani.dev@gmail.com",
    phone: "+212 699 254 247",
    whatsapp: "212699254247",
    logo: "/assets/logo-mark.svg",
  };

  const STATUS_LABELS = {
    draft: "Brouillon",
    sent: "Envoyé",
    accepted: "Accepté",
    rejected: "Refusé",
    paid: "Payé",
    expired: "Expiré",
    partial: "Acompte reçu",
    overdue: "En retard",
  };

  const esc = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

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

  const totals = (doc) => {
    const lines = Array.isArray(doc?.lines) ? doc.lines : [];
    const ht = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0), 0);
    const taxRate = Number(doc?.taxRate);
    const rate = Number.isFinite(taxRate) ? taxRate : 20;
    const tva = (ht * rate) / 100;
    return { ht, tva, ttc: ht + tva, rate };
  };

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const liveQuoteStatus = (quote) => {
    const status = quote?.status || "draft";
    if ((status === "draft" || status === "sent") && quote?.validUntil && quote.validUntil < todayISO()) {
      return "expired";
    }
    return status;
  };

  const statusLabel = (id) => STATUS_LABELS[id] || "Brouillon";

  const paid = (invoice) =>
    (invoice?.payments || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const balance = (invoice) => Math.max(0, totals(invoice).ttc - paid(invoice));

  const paymentText = (doc) => {
    const deposit = Number(doc?.depositPercent);
    const percent = Number.isFinite(deposit) && deposit > 0 ? deposit : 0;
    if (percent) {
      const rest = Math.max(0, 100 - percent);
      return `Paiement : ${percent} % à la commande, ${rest} % à la livraison.`;
    }
    return "";
  };

  const clientLines = (client = {}) =>
    [
      client.name && `<strong>${esc(client.name)}</strong>`,
      client.company,
      [client.address, client.city].filter(Boolean).join(", "),
      client.ice && `ICE ${client.ice}`,
      client.email,
      client.phone,
    ]
      .filter(Boolean)
      .map((line) => (String(line).startsWith("<") ? line : esc(line)))
      .join("<br>");

  const renderDocument = ({ kind = "quote", client = {}, doc = {} } = {}) => {
    const tot = totals(doc);
    const currency = doc.currency || "MAD";
    const isInvoice = kind === "invoice";
    const status = isInvoice ? doc.status || "draft" : liveQuoteStatus(doc);
    const pay = paymentText(doc);
    const notes = [pay, doc.notes, doc.terms].filter(Boolean).join("\n\n");

    const rows = (doc.lines || [])
      .map((line) => {
        const lineTotal = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
        return `<tr>
          <td>${esc(line.description)}</td>
          <td class="num">${esc(line.qty)}</td>
          <td class="num">${money(line.unitPrice, currency)}</td>
          <td class="num">${money(lineTotal, currency)}</td>
        </tr>`;
      })
      .join("");

    const extraTotals = isInvoice
      ? `<div><span>Total TTC</span><b>${money(tot.ttc, currency)}</b></div>
         <div><span>Acomptes reçus</span><b>${money(paid(doc), currency)}</b></div>
         <div class="cx-doc__ttc"><span>Reste dû</span><b>${money(balance(doc), currency)}</b></div>`
      : `<div class="cx-doc__ttc"><span>Total TTC</span><b>${money(tot.ttc, currency)}</b></div>`;

    const agreement = doc.signedAt
      ? `<div class="cx-doc__sign is-done">
          <strong>Bon pour accord — signé électroniquement</strong>
          <p>${esc(doc.signerName)} · ${esc(String(doc.signedAt).slice(0, 10))}</p>
          ${doc.signatureData ? `<img class="cx-doc__autograph" src="${esc(doc.signatureData)}" alt="Signature">` : ""}
        </div>`
      : `<div class="cx-doc__sign">
          <strong>Bon pour accord</strong>
          <p>${isInvoice ? "Facture émise par CX Systems." : "À signer pour accepter ce devis."}</p>
          <div class="cx-doc__sign-line">Signature / cachet</div>
        </div>`;

    return `
      <article class="cx-doc">
        <header class="cx-doc__head">
          <div class="cx-doc__brand">
            <img src="${esc(issuer.logo)}" alt="${esc(issuer.brand)}" width="56" height="56" />
            <div>
              <strong>${esc(issuer.brand)}</strong>
              <em>${esc(issuer.tagline)}</em>
            </div>
          </div>
          <div class="cx-doc__meta">
            <span class="cx-doc__kind">${isInvoice ? "Facture" : "Devis"}</span>
            <b>${esc(doc.number)}</b>
            <small>Date : ${esc(doc.date || "—")}</small>
            <small>${isInvoice ? `Échéance : ${esc(doc.dueDate || "—")}` : `Valable jusqu’au : ${esc(doc.validUntil || "—")}`}</small>
            <small>Statut : ${esc(statusLabel(status))}</small>
          </div>
        </header>

        <section class="cx-doc__parties">
          <div>
            <h4>Émetteur</h4>
            <p>
              <strong>${esc(issuer.brand)}</strong><br>
              ${esc(issuer.city)}<br>
              ${esc(issuer.email)}<br>
              WhatsApp ${esc(issuer.phone)}
            </p>
          </div>
          <div>
            <h4>Client</h4>
            <p>${clientLines(client) || "—"}</p>
          </div>
        </section>

        <h2 class="cx-doc__title">${esc(doc.title) || (isInvoice ? "Facture" : "Devis")}</h2>

        <table class="cx-doc__table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="num">Qté</th>
              <th class="num">P.U. HT</th>
              <th class="num">Total HT</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="4">Aucune ligne</td></tr>`}</tbody>
        </table>

        <aside class="cx-doc__totals">
          <div><span>Total HT</span><b>${money(tot.ht, currency)}</b></div>
          <div><span>TVA (${tot.rate} %)</span><b>${money(tot.tva, currency)}</b></div>
          ${extraTotals}
        </aside>

        ${notes ? `<section class="cx-doc__notes"><h4>Conditions</h4><p>${esc(notes)}</p></section>` : ""}
        ${agreement}
        <p class="cx-doc__footer">${esc(issuer.brand)} · ${esc(issuer.tagline)} · ${esc(issuer.city)}</p>
      </article>`;
  };

  window.CXDevis = {
    issuer,
    esc,
    money,
    totals,
    todayISO,
    liveQuoteStatus,
    statusLabel,
    paid,
    balance,
    paymentText,
    renderDocument,
  };
})();
