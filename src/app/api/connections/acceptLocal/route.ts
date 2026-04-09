import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    const connection = await db.connection.findUnique({
      where: { id: Number(id) },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (connection.invitedEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized to accept this invitation' }, { status: 403 });
    }

    if (connection.status === 'accepted') {
      return NextResponse.json({ success: true, message: 'Already accepted' });
    }

    await db.connection.update({
      where: { id: connection.id },
      data: { status: 'accepted' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Connection accept POST error:", error);
    return NextResponse.json({ error: 'Failed to accept invitation locally' }, { status: 500 });
  }
}
