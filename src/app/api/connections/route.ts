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
    const sentStmt = db.prepare('SELECT id, invited_email as email, status FROM connections WHERE invitor_email = ? ORDER BY created_at DESC');
    const sent = sentStmt.all(session.user.email);

    const receivedStmt = db.prepare('SELECT id, invitor_email as email, status FROM connections WHERE invited_email = ? ORDER BY created_at DESC');
    const received = receivedStmt.all(session.user.email);

    return NextResponse.json({ sent, received });
  } catch (error) {
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

    const checkStmt = db.prepare('SELECT id FROM connections WHERE invitor_email = ? AND invited_email = ?');
    const existing = checkStmt.get(session.user.email, invited_email);
    if (existing) {
      return NextResponse.json({ error: 'Invitation already sent to this user' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const stmt = db.prepare('INSERT INTO connections (invitor_email, invited_email, token, status) VALUES (?, ?, ?, ?)');
    stmt.run(session.user.email, invited_email, token, 'pending');

    try {
      if (process.env.SMTP_USER) {
        await sendInviteEmail(invited_email, session.user.email, token);
      } else {
        console.warn("SMTP_USER not provided. Skipping email send. The DB token is generated.");
      }
    } catch (mailError) {
      console.error("Failed to send email:", mailError);
    }

    return NextResponse.json({ success: true, invited_email, status: 'pending' });
  } catch (error) {
    console.error("Connection creation error:", error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
