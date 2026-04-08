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
    const todos = await db.todo.findMany({
      where: {
        assignedTo: session.user.email,
      },
      orderBy: [
        { userEmail: 'asc' },
        { targetDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Group by userEmail (mapped to user_email in response)
    const grouped: Record<string, any[]> = {};
    for (const todo of todos) {
      if (!grouped[todo.userEmail]) {
        grouped[todo.userEmail] = [];
      }
      grouped[todo.userEmail].push({
        id: todo.id,
        title: todo.title,
        status: todo.status,
        target_date: todo.targetDate,
        user_email: todo.userEmail,
        assigned_to: todo.assignedTo,
        created_at: todo.createdAt,
      });
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("GET /api/todos/shared error:", error);
    return NextResponse.json({ error: 'Failed to fetch shared todos' }, { status: 500 });
  }
}
