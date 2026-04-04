import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const checkStmt = db.prepare('SELECT id, status FROM connections WHERE token = ?');
    const connection = checkStmt.get(token) as { id: number; status: string } | undefined;

    if (!connection) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    if (connection.status === 'accepted') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const updateStmt = db.prepare('UPDATE connections SET status = ? WHERE id = ?');
    updateStmt.run('accepted', connection.id);

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error("Connection accept error:", error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
