"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      if (pathname !== "/") {
        router.push("/");
      }
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <main className="flex-1 bg-gradient-to-br from-background to-secondary/20 p-8 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </main>
    );
  }

  if (status === "unauthenticated" && pathname !== "/") {
    return null;
  }

  return <>{children}</>;
}
