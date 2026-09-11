import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const message = String(body.message || "").trim();
  const honey = String(body._honey || "");

  if (honey) return NextResponse.json({ ok: true });
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs requis" }, { status: 400 });
  }

  await prisma.lead.create({
    data: { name, email, phone, message, source: "form" },
  });

  const inbox = process.env.CONTACT_INBOX;
  if (inbox) {
    try {
      await fetch(`https://formsubmit.co/ajax/${inbox}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          _subject: "Nouveau message — CX Systems",
          _template: "table",
          _captcha: "false",
        }),
      });
    } catch {
      // Lead is stored even if mail relay fails
    }
  }

  return NextResponse.json({ ok: true });
}
