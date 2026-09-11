import { defaultProjects } from "@/lib/default-projects";
import HomeView, { type PublicProject } from "@/components/public/HomeView";

export const dynamic = "force-dynamic";

function toPublic(
  rows: Array<{
    id?: string;
    slug: string;
    title: string;
    year: string;
    status: string;
    sector: string;
    sectorEn: string;
    summary: string;
    summaryEn: string;
    stack: string;
    image: string;
    problem: string;
    problemEn: string;
    solution: string;
    solutionEn: string;
    result: string;
    resultEn: string;
    featured: boolean;
  }>
): PublicProject[] {
  return rows.map((p) => ({
    id: p.id || p.slug,
    slug: p.slug,
    title: p.title,
    year: p.year,
    status: p.status,
    sector: p.sector,
    sectorEn: p.sectorEn,
    summary: p.summary,
    summaryEn: p.summaryEn,
    stack: p.stack,
    image: p.image,
    problem: p.problem,
    problemEn: p.problemEn,
    solution: p.solution,
    solutionEn: p.solutionEn,
    result: p.result,
    resultEn: p.resultEn,
    featured: p.featured,
  }));
}

export default async function HomePage() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.project.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length) return <HomeView projects={toPublic(rows)} />;
  } catch {
    // Vercel serverless cannot keep SQLite; still show the atelier work.
  }

  return <HomeView projects={toPublic(defaultProjects)} />;
}
