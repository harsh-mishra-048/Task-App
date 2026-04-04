import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_email IN (
        SELECT invitor_email FROM connections 
        WHERE invited_email = ? AND status = 'accepted'
      )
      ORDER BY user_email ASC, target_date DESC, created_at DESC
    `);
    const todos = stmt.all(session.user.email) as { user_email: string, [key: string]: any }[];

    // Group by user_email
    const grouped: Record<string, any[]> = {};
    for (const todo of todos) {
      if (!grouped[todo.user_email]) {
        grouped[todo.user_email] = [];
      }
      grouped[todo.user_email].push(todo);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shared todos' }, { status: 500 });
  }
}
