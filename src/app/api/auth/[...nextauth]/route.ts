import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // pages: {
  //   signIn: "/task_app/signin",
  //   error: "/task_app/signin",
  // },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        path: "/task_app",
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
