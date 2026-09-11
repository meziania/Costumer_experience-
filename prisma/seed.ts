import { PrismaClient } from "@prisma/client";
import { defaultProjects } from "../lib/default-projects";

const prisma = new PrismaClient();

async function main() {
  for (const p of defaultProjects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
