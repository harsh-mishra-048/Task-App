"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, PenSquare, Trash2, Calendar, Plus, LogOut } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

type Todo = {
  id: number;
  title: string;
  status: "pending" | "completed";
  target_date: string;
  created_at: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>("all");

  useEffect(() => {
    if (status === "authenticated") {
      fetchTodos(filterDate);
    }
  }, [filterDate, status]);

  const fetchTodos = async (date?: string) => {
    setLoading(true);
    let url = "/api/todos";
    if (date && date !== "all") {
      url += `?date=${date}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setTodos(data);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    const res = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchTodos(filterDate);
  };

  const deleteTodo = async (id: number) => {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (res.ok) fetchTodos(filterDate);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  if (status === "loading") {
    return (
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full border-none shadow-2xl bg-card/60 backdrop-blur-xl text-center pb-8 border-b border-border/50">
          <CardHeader>
            <CardTitle className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-4">
              Todo App
            </CardTitle>
            <p className="text-muted-foreground pb-6">Log in to manage your daily goals.</p>
            <Button onClick={() => signIn("google")} className="w-full rounded-full shadow-lg h-12 text-lg hover:shadow-xl transition-all duration-300">
              Continue with Google
            </Button>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              My Tasks
            </h1>
            <p className="text-muted-foreground mt-2">Welcome, {session?.user?.name || session?.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/create" passHref>
              <Button className="rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </Link>
            <Button onClick={() => signOut()} variant="outline" className="rounded-full px-6 shadow-sm hover:shadow-md transition-all duration-300 border-destructive/30 text-destructive hover:bg-destructive hover:text-white">
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </div>
        </header>

        <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={filterDate === "all" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setFilterDate("all")}
                  className="rounded-full"
                >
                  All
                </Button>
                <Button 
                  variant={filterDate === todayStr ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setFilterDate(todayStr)}
                  className="rounded-full"
                >
                  Today
                </Button>
                <input 
                  type="date" 
                  className="bg-transparent text-sm border-b border-border outline-none focus:border-primary transition-colors text-foreground"
                  onChange={(e) => setFilterDate(e.target.value)}
                  value={filterDate !== "all" && filterDate !== todayStr ? filterDate : ""}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                <p className="text-lg">No tasks found for this period.</p>
                <p className="text-sm mt-2">Time to relax or create a new one!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todos.map((todo) => (
                  <li 
                    key={todo.id} 
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      todo.status === "completed" 
                        ? "bg-muted/30 border-transparent opacity-75" 
                        : "bg-background border-border shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => toggleStatus(todo.id, todo.status)}
                        className="text-primary hover:scale-110 transition-transform"
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
                          <Calendar className="h-3 w-3" /> {new Date(todo.target_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip title="Edit">
                        <Link href={`/edit/${todo.id}`} passHref>
                          <IconButton color="primary" size="small" className="text-primary hover:bg-primary/10 mr-1">
                            <PenSquare className="h-4 w-4" />
                          </IconButton>
                        </Link>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => deleteTodo(todo.id)} color="error" size="small" className="!text-destructive hover:!bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
