import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const clients = await prisma.client.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  const client = await prisma.client.create({
    data: {
      name,
      sector: body.sector || "",
      profileImage: body.profileImage || "",
      specsPdf: body.specsPdf || "",
      specsPdfName: body.specsPdfName || "",
      projectDescription: body.projectDescription || "",
      notes: body.notes || "",
    },
  });
  return NextResponse.json(client);
}
