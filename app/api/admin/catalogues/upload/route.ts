export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "MANAGER")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate extension
    const fileExt = path.extname(file.name).toLowerCase() || ".pdf";
    const allowedExtensions = [".pdf", ".xlsx", ".xls", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
    if (!allowedExtensions.includes(fileExt)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Invalid file extension. Allowed extensions are: ${allowedExtensions.join(", ")}` 
      }, { status: 400 });
    }

    // Generate random safe filename
    const randomName = `${crypto.randomBytes(16).toString("hex")}${fileExt}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "catalogues");

    // Recursively create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, randomName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/catalogues/${randomName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl
    });
  } catch (error) {
    console.error("[CATALOGUE_FILE_UPLOAD]", error);
    return NextResponse.json({ ok: false, error: "Failed to process catalogue upload" }, { status: 500 });
  }
}
