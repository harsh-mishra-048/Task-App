import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const params = await props.params;
  try {
    const { id } = params;
    const body = await request.json();
    const { title, status, target_date } = body;

    const updates = [];
    const values = [];

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

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    values.push(session.user.email);
    const stmt = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_email = ?`);
    const info = stmt.run(...values);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 });
    }

    const getStmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_email = ?');
    const updatedTodo = getStmt.get(id, session.user.email);

    return NextResponse.json(updatedTodo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const params = await props.params;
  try {
    const { id } = params;
    const stmt = db.prepare('DELETE FROM todos WHERE id = ? AND user_email = ?');
    const info = stmt.run(id, session.user.email);

    if (info.changes === 0) {
      return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const params = await props.params;
  try {
    const { id } = params;
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ? AND user_email = ?');
    const todo = stmt.get(id, session.user.email);

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}
