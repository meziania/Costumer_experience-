import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  const fields = [
    "title",
    "year",
    "status",
    "sector",
    "sectorEn",
    "summary",
    "summaryEn",
    "stack",
    "image",
    "problem",
    "problemEn",
    "solution",
    "solutionEn",
    "result",
    "resultEn",
    "featured",
    "published",
    "sortOrder",
    "notes",
    "clientId",
  ];
  for (const key of fields) {
    if (key in body) data[key] = body[key] === "" && key === "clientId" ? null : body[key];
  }
  const project = await prisma.project.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
