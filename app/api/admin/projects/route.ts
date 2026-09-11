import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || `projet-${Date.now()}`
  );
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const projects = await prisma.project.findMany({
    include: { client: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const max = await prisma.project.aggregate({ _max: { sortOrder: true } });
  const project = await prisma.project.create({
    data: {
      slug: body.slug || slugify(title),
      title,
      year: body.year || "",
      status: body.status || "mission",
      sector: body.sector || "",
      sectorEn: body.sectorEn || body.sector || "",
      summary: body.summary || "",
      summaryEn: body.summaryEn || body.summary || "",
      stack: body.stack || "",
      image: body.image || "",
      problem: body.problem || "",
      problemEn: body.problemEn || body.problem || "",
      solution: body.solution || "",
      solutionEn: body.solutionEn || body.solution || "",
      result: body.result || "",
      resultEn: body.resultEn || body.result || "",
      featured: !!body.featured,
      published: body.published !== false,
      sortOrder: body.sortOrder ?? (max._max.sortOrder || 0) + 1,
      notes: body.notes || "",
      clientId: body.clientId || null,
    },
  });
  return NextResponse.json(project);
}
