import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agencyName, contactPerson, email, phone, country, website, specialization, message } = body;

    if (!agencyName || !contactPerson || !email || !phone || !country || !specialization) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
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

    const { sendTemplatedEmail, sendAdminNotification } = await import("@/lib/email");
    const d = {
      agencyName: query.agencyName,
      name: query.contactPerson,
      email: query.email,
      specialization: query.specialization
    };
    await sendTemplatedEmail("AGENCY_RECEIVED", query.email, d);
    await sendAdminNotification("AGENCY_RECEIVED_ADMIN", d);

    return NextResponse.json({ success: true, data: query });
  } catch (error: any) {
    console.error("Agency submission error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit agency enquiry." }, { status: 500 });
  }
}
