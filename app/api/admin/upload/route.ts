import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop lourd (8 Mo max)" }, { status: 400 });
  }

  const ext = path.extname(file.name || "").toLowerCase() || ".bin";
  const allowed = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf", ".svg"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Type non autorisé" }, { status: 400 });
  }

  const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), bytes);
  return NextResponse.json({ url: `/uploads/${name}`, name: file.name });
}
