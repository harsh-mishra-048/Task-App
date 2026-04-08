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
    const todos = await db.todo.findMany({
      where: {
        userEmail: session.user.email,
        ...(date ? { targetDate: date } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Map to frontend snake_case
    const mappedTodos = todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      status: todo.status,
      target_date: todo.targetDate,
      user_email: todo.userEmail,
      assigned_to: todo.assignedTo,
      created_at: todo.createdAt,
    }));

    return NextResponse.json(mappedTodos);
  } catch (error) {
    console.error("GET /api/todos error:", error);
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
    const { title, target_date, assigned_to } = body;

    if (!title || !target_date) {
      return NextResponse.json({ error: 'Title and target_date are required' }, { status: 400 });
    }

    const todo = await db.todo.create({
      data: {
        title,
        targetDate: target_date,
        status: 'pending',
        userEmail: session.user.email,
        assignedTo: assigned_to || null,
      },
    });

    return NextResponse.json({
      id: todo.id,
      title: todo.title,
      status: todo.status,
      target_date: todo.targetDate,
      user_email: todo.userEmail,
      assigned_to: todo.assignedTo,
      created_at: todo.createdAt,
    });
  } catch (error) {
    console.error("POST /api/todos error:", error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

