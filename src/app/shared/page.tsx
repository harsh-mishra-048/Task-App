"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Calendar, ArrowLeft, Network, User, ChevronRight } from "lucide-react";

type Todo = {
  id: number;
  title: string;
  status: "pending" | "completed";
  target_date: string;
  created_at: string;
  user_email: string;
};

export default function SharedTasks() {
  const { status } = useSession();
  const [groupedTodos, setGroupedTodos] = useState<Record<string, Todo[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSharedTodos();
    }
  }, [status]);

  const fetchSharedTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/task_app/api/todos/shared");
      if (res.ok) {
        const data = await res.json();
        setGroupedTodos(data);
      }
    } catch (error) {
      console.error("Failed to fetch shared tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSharedTaskStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
      const res = await fetch(`/task_app/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Optimistic update or refresh
        fetchSharedTodos();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </main>
    );
  }

  const emails = Object.keys(groupedTodos);

  return (
    <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="ghost" className="hover:bg-muted/50 rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          {selectedUser && (
            <Button
              variant="ghost"
              onClick={() => setSelectedUser(null)}
              className="hover:bg-muted/50 rounded-full"
            >
              All Connections
            </Button>
          )}
        </div>

        <header>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 flex items-center gap-3">
            <Network className="h-10 w-10 text-primary" />
            {selectedUser ? `Assigned by: ${selectedUser}` : "Tasks Assigned to Me"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {selectedUser
              ? `Tasks delegated to you by ${selectedUser}`
              : "Review and manage tasks that have been specifically assigned to you by your network."}
          </p>
        </header>

        {emails.length === 0 ? (
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl">
            <CardContent className="p-12 text-center text-muted-foreground">
              <p className="text-lg">No assigned tasks found.</p>
              <p className="text-sm mt-2">When someone assigns a task to you, it will appear here.</p>
              <Link href="/connections" passHref>
                <Button className="mt-6 rounded-full" variant="outline">Invite Someone</Button>
              </Link>
            </CardContent>
          </Card>
        ) : !selectedUser ? (
          /* List of Connections */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emails.map((email) => (
              <Card
                key={email}
                className="border-none shadow-lg bg-card/60 backdrop-blur-xl hover:bg-muted/10 transition-all cursor-pointer group"
                onClick={() => setSelectedUser(email)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{email}</CardTitle>
                      <CardDescription>{groupedTodos[email].length} assigned tasks</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          /* Specific User's Tasks */
          <div className="space-y-6">
            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Assigned by {selectedUser}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Select Another
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {groupedTodos[selectedUser].map((todo) => (
                    <li
                      key={todo.id}
                      className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${todo.status === "completed"
                          ? "bg-muted/30 border-transparent opacity-75"
                          : "bg-background border-border shadow-sm hover:shadow-md"
                        }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleSharedTaskStatus(todo.id, todo.status)}
                          className="text-primary hover:scale-110 transition-transform"
                          title="Toggle Status"
                        >
                          {todo.status === "completed" ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-medium text-lg transition-colors ${todo.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {todo.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(todo.target_date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
