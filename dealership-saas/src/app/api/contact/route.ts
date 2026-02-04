import { NextResponse } from "next/server";
import { Resend } from "resend";

const TO_EMAIL = "saimsultan380@gmail.com";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const name = (body?.name ?? "").toString().trim();
    const business = (body?.business ?? "").toString().trim();
    const phoneOrEmail = (body?.phoneOrEmail ?? "").toString().trim();
    const notes = (body?.notes ?? "").toString().trim();

    if (!name || !phoneOrEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject = `New Dealer 360 enquiry from ${name}`;

    const lines = [
      `Name: ${name}`,
      business && `Business / Showroom: ${business}`,
      `Phone / Email: ${phoneOrEmail}`,
      notes && "",
      notes && "Notes:",
      notes && notes,
    ].filter(Boolean) as string[];

    await resend.emails.send({
      from: "Dealer 360 <onboarding@resend.dev>",
      to: TO_EMAIL,
      subject,
      text: lines.join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error submitting contact form", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
