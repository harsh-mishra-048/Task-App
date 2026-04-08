import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendInviteEmail } from '@/lib/mailer';
import crypto from 'crypto';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sent = await db.connection.findMany({
      where: { invitorEmail: session.user.email },
      orderBy: { createdAt: 'desc' },
    });

    const received = await db.connection.findMany({
      where: { invitedEmail: session.user.email },
      orderBy: { createdAt: 'desc' },
    });

    // Map to frontend snake_case
    const mappedSent = sent.map(c => ({
      id: c.id,
      email: c.invitedEmail,
      status: c.status,
    }));

    const mappedReceived = received.map(c => ({
      id: c.id,
      email: c.invitorEmail,
      status: c.status,
    }));

    return NextResponse.json({ sent: mappedSent, received: mappedReceived });
  } catch (error) {
    console.error("GET /api/connections error:", error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invited_email } = body;

    if (!invited_email) {
      return NextResponse.json({ error: 'Invited email is required' }, { status: 400 });
    }

    if (invited_email.toLowerCase() === session.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    const existing = await db.connection.findFirst({
      where: {
        invitorEmail: session.user.email,
        invitedEmail: invited_email,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Invitation already sent to this user' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await db.connection.create({
      data: {
        invitorEmail: session.user.email,
        invitedEmail: invited_email,
        token: token,
        status: 'pending',
      },
    });

    try {
      if (process.env.SMTP_USER) {
        await sendInviteEmail(invited_email, session.user.email, token);
      } else {
        console.warn("SMTP_USER not provided. Skipping email send.");
      }
    } catch (mailError) {
      console.error("Failed to send email:", mailError);
    }

    return NextResponse.json({ success: true, invited_email, status: 'pending' });
  } catch (error) {
    console.error("POST /api/connections error:", error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
