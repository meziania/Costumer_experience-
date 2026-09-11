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
    "gallery",
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
    if (key in body) {
      if (key === "clientId") data[key] = body[key] === "" ? null : body[key];
      else if (key === "gallery" && Array.isArray(body[key])) data[key] = JSON.stringify(body[key]);
      else data[key] = body[key];
    }
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
