"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Calendar } from "lucide-react";

export default function CreateTodo() {
  const { status } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, target_date: targetDate }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setTargetDate(today);
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full space-y-6">
        <Link href="/" passHref>
          <Button variant="ghost" className="mb-4 hover:bg-muted/50 rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
          </Button>
        </Link>
        
        <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-8 border-b border-border/50">
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Create New Task
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              What do you want to accomplish?
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-8">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base">Task Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Read a book for 30 minutes" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50 h-12 text-base transition-colors focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="targetDate" className="text-base">Target Date</Label>
                  <Button type="button" variant="link" size="sm" onClick={setToday} className="h-auto p-0 text-primary">
                    Set to Today
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input 
                    type="date"
                    id="targetDate" 
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-background/50 h-12 pl-10 text-base transition-colors focus-visible:ring-primary w-full"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border/50 pt-6 px-6 pb-6">
              <Button type="submit" className="w-full h-12 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-5 w-5" /> Save Task
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
