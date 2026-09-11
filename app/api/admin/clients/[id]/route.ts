import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: body.name,
      sector: body.sector,
      profileImage: body.profileImage,
      specsPdf: body.specsPdf,
      specsPdfName: body.specsPdfName,
      projectDescription: body.projectDescription,
      notes: body.notes,
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
