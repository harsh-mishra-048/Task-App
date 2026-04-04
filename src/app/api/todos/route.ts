import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    let todos;
    if (date) {
      const stmt = db.prepare('SELECT * FROM todos WHERE target_date = ? AND user_email = ? ORDER BY created_at DESC');
      todos = stmt.all(date, session.user.email);
    } else {
      const stmt = db.prepare('SELECT * FROM todos WHERE user_email = ? ORDER BY created_at DESC');
      todos = stmt.all(session.user.email);
    }
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, target_date } = body;

    if (!title || !target_date) {
      return NextResponse.json({ error: 'Title and target_date are required' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO todos (title, target_date, status, user_email) VALUES (?, ?, ?, ?)');
    const info = stmt.run(title, target_date, 'pending', session.user.email);

    return NextResponse.json({ id: info.lastInsertRowid, title, target_date, status: 'pending', user_email: session.user.email });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

