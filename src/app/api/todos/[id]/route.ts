import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    // Check ownership and assignment
    const checkStmt = db.prepare('SELECT user_email, assigned_to FROM todos WHERE id = ?');
    const todo = checkStmt.get(id) as { user_email: string, assigned_to: string | null } | undefined;

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const isOwner = todo.user_email === session.user.email;
    const isAssignee = todo.assigned_to === session.user.email;

    if (!isOwner && !isAssignee) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates = [];
    const values = [];

    if (isOwner) {
      // Owner can update everything
      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (target_date !== undefined) {
        updates.push('target_date = ?');
        values.push(target_date);
      }
    } else {
      // Connection can ONLY update status
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      // If they try to update title or target_date, we just ignore or could error. 
      // The plan said: "I will only enable the toggle to prevent accidental data loss."
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update or unauthorized for these fields' }, { status: 400 });
    }

    const todoId = Number(id);
    values.push(todoId);
    const stmt = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const updatedTodo = db.prepare('SELECT * FROM todos WHERE id = ?').get(todoId);
    return NextResponse.json(updatedTodo);
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

    // Fetch todo to check ownership
    const checkStmt = db.prepare('SELECT user_email FROM todos WHERE id = ?');
    const todo = checkStmt.get(todoId) as { user_email: string } | undefined;

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (todo.user_email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized to delete this todo' }, { status: 403 });
    }

    // Perform actual delete
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    const info = stmt.run(todoId);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/todos/[id] error:", error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await props.params;
  try {
    const { id } = params;
    
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    const todo = stmt.get(id) as any;

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (todo.user_email === session.user.email || todo.assigned_to === session.user.email) {
      return NextResponse.json(todo);
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error("GET /api/todos/[id] error:", error);
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}
