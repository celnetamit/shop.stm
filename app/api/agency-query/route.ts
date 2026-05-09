import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agencyName, contactPerson, email, phone, country, website, specialization, message } = body;

    if (!agencyName || !contactPerson || !email || !phone || !country || !specialization) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const query = await prisma.agencyQuery.create({
      data: {
        agencyName,
        contactPerson,
        email,
        phone,
        country,
        website: website || null,
        specialization,
        message: message || null
      }
    });

    return NextResponse.json({ success: true, data: query });
  } catch (error: any) {
    console.error("Agency submission error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit agency enquiry." }, { status: 500 });
  }
}
