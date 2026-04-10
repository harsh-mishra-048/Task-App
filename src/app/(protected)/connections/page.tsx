"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus, Mail, Users, CheckCircle2, Clock } from "lucide-react";

type Connection = {
  id: number;
  email: string;
  status: "pending" | "accepted";
};

export default function Connections() {
  const { status, data: session } = useSession();
  const router = useRouter();

  const [invitedEmail, setInvitedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sentConnections, setSentConnections] = useState<Connection[]>([]);
  const [receivedConnections, setReceivedConnections] = useState<Connection[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/task_app/api/connections");
      if (res.ok) {
        const data = await res.json();
        setSentConnections(data.sent || []);
        setReceivedConnections(data.received || []);
      }
    } catch (err) {
      console.error("Failed to fetch connections", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchConnections();
    }
  }, [status]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitedEmail) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/task_app/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invited_email: invitedEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Invitation sent to ${invitedEmail}!`);
        setInvitedEmail("");
        fetchConnections();
      } else {
        setError(data.error || "Failed to send invitation");
      }
    } catch (err) {
      setError("Network error sending invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptLocal = async (id: number) => {
    try {
      const res = await fetch("/task_app/api/connections/acceptLocal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchConnections();
      } else {
        const data = await res.json();
        console.error(data.error);
      }
    } catch (err) {
      console.error("Network error accepting invitation", err);
    }
  };

  return (
    <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" passHref>
          <Button variant="ghost" className="mb-4 hover:bg-muted/50 rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
          </Button>
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" /> Connections
          </h1>
          <p className="text-muted-foreground mt-2">Manage who can see your tasks and whose tasks you can see.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Invite Form */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl h-fit">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Invite Someone
                </CardTitle>
                <CardDescription>
                  Give someone permission to view your tasks by sending them an invite.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleInvite}>
                <CardContent className="space-y-4 pt-6">
                  {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
                  {success && <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md text-sm">{success}</div>}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={invitedEmail}
                        onChange={(e) => setInvitedEmail(e.target.value)}
                        className="pl-9 bg-background/50"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/50 pt-6">
                  <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>Sending...</span>
                    ) : "Send Invitation"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Connection List */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl">
              <CardHeader className="border-b border-border/50 py-4 bg-muted/20">
                <CardTitle className="text-lg">Access Given (Sent Invites)</CardTitle>
                <CardDescription className="text-xs">People who you've invited to see your tasks.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {sentConnections.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">You haven't given access to anyone yet.</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {sentConnections.map(conn => (
                      <li key={conn.id} className="p-4 flex items-center justify-between">
                        <span className="font-medium text-sm">{conn.email}</span>
                        {conn.status === 'accepted' ? (
                          <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Can View</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full"><Clock className="h-3 w-3" /> Pending</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl">
              <CardHeader className="border-b border-border/50 py-4 bg-muted/20">
                <CardTitle className="text-lg">Access Received</CardTitle>
                <CardDescription className="text-xs">People who have invited you to see their tasks.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {receivedConnections.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground text-center">No one has invited you yet.</p>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {receivedConnections.map(conn => (
                      <li key={conn.id} className="p-4 flex items-center justify-between">
                        <span className="font-medium text-sm">{conn.email}</span>
                        {conn.status === 'accepted' ? (
                          <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full"><Users className="h-3 w-3" /> Connection Active</span>
                        ) : (
                          <Button
                            onClick={() => handleAcceptLocal(conn.id)}
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                          >
                            Accept Invite
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
