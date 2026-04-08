import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const connection = await db.connection.findFirst({
      where: { token },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    if (connection.status === 'accepted') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    await db.connection.update({
      where: { id: connection.id },
      data: { status: 'accepted' },
    });

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error("Connection accept error:", error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
