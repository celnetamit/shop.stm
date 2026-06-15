export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { requireAdmin } from "@/lib/auth/guards";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Uploaded file must be an image" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a random name to avoid filename collisions and keep URLs clean
    const fileExt = path.extname(file.name) || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fileExt.toLowerCase()) ? fileExt : ".jpg";
    const randomName = `${crypto.randomBytes(12).toString("hex")}${safeExt}`;
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", "journals");
    
    // Recursively create folders if they don't exist
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, randomName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/journals/${randomName}`;

    return NextResponse.json({ 
      ok: true, 
      url: publicUrl 
    });
  } catch (error) {
    console.error("[ADMIN_IMAGE_UPLOAD]", error);
    return NextResponse.json({ ok: false, error: "Failed to process image upload" }, { status: 500 });
  }
}
