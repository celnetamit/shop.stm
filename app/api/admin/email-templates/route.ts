import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const list = await prisma.emailTemplate.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ ok: true, templates: list });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, subject, body: htmlBody } = body;

    if (!id) return NextResponse.json({ ok: false, error: "ID Required" }, { status: 400 });

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        subject: subject?.trim(),
        body: htmlBody?.trim()
      }
    });

    return NextResponse.json({ ok: true, template: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
