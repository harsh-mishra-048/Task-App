import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  try {
    const { id } = params;
    
    const todo = await db.todo.findUnique({
      where: { id: Number(id) },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (todo.userEmail === session.user.email || todo.assignedTo === session.user.email) {
      return NextResponse.json({
        id: todo.id,
        title: todo.title,
        status: todo.status,
        target_date: todo.targetDate,
        user_email: todo.userEmail,
        assigned_to: todo.assignedTo,
        created_at: todo.createdAt,
      });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error("GET /api/todos/[id] error:", error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  try {
    const { id } = params;
    const body = await request.json();
    const { title, status, target_date } = body;

    const todoId = Number(id);

    // Check ownership and assignment
    const todo = await db.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const isOwner = todo.userEmail === session.user.email;
    const isAssignee = todo.assignedTo === session.user.email;

    if (!isOwner && !isAssignee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {};
    if (isOwner) {
      if (title !== undefined) updateData.title = title;
      if (status !== undefined) updateData.status = status;
      if (target_date !== undefined) updateData.targetDate = target_date;
    } else {
      // Assignee can only update status
      if (status !== undefined) updateData.status = status;
    }

    const updatedTodo = await db.todo.update({
      where: { id: todoId },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedTodo.id,
      title: updatedTodo.title,
      status: updatedTodo.status,
      target_date: updatedTodo.targetDate,
      user_email: updatedTodo.userEmail,
      assigned_to: updatedTodo.assignedTo,
      created_at: updatedTodo.createdAt,
    });
  } catch (error) {
    console.error("PUT /api/todos/[id] error:", error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  try {
    const { id } = params;
    const todoId = Number(id);

    const todo = await db.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (todo.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized to delete this todo' }, { status: 403 });
    }

    await db.todo.delete({
      where: { id: todoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/todos/[id] error:", error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
