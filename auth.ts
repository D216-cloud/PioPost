import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const providers: Array<ReturnType<typeof Credentials> | ReturnType<typeof Google>> = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim();
      const password = String(credentials?.password ?? "").trim();

      if (!email || !password || password.length < 6) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        email,
        name: email.split("@")[0],
      };
    },
  }),
];

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  providers.unshift(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user.email) {
        try {
          const { supabaseAdmin } = await import("@/lib/supabase-admin");
          
          const { error } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: user.id,
              display_name: user.name || user.email.split('@')[0],
              avatar_url: user.image || '',
              // Generate handle if not exists
              handle: user.name 
                ? user.name.toLowerCase().replace(/\s+/g, '_') + '_' + user.id.substring(0, 4)
                : user.email.split('@')[0] + '_' + user.id.substring(0, 4)
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error("Error syncing profile:", error);
          }
        } catch (err) {
          console.error("Failed to import supabaseAdmin:", err);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
