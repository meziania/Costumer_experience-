import { prisma } from "@/lib/prisma";
import HomeView, { type PublicProject } from "@/components/public/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await prisma.project.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });

  const projects: PublicProject[] = rows.map((p) => ({
    id: p.id,
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

  return <HomeView projects={projects} />;
}
