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
          
          // 1. Fetch existing users by email
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          let supabaseUser = users?.find((u) => u.email === user.email);
          
          // 2. If user doesn't exist in Supabase auth, create them
          if (!supabaseUser) {
            const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: user.email,
              email_confirm: true,
              user_metadata: {
                full_name: user.name,
                avatar_url: user.image
              }
            });
            
            if (createError) {
              console.error("Failed to create Supabase user:", createError);
              return true; // still allow NextAuth login
            }
            supabaseUser = data.user;
          }

          // 3. Override NextAuth user.id with the valid Supabase UUID
          if (supabaseUser) {
            user.id = supabaseUser.id;
            
            // 4. Sync profile data manually in case trigger missed it or needs update
            const { error: upsertError } = await supabaseAdmin
              .from('profiles')
              .upsert({
                id: supabaseUser.id,
                display_name: user.name || user.email.split('@')[0],
                avatar_url: user.image || '',
                updated_at: new Date().toISOString()
              }, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (upsertError) {
              console.error("Error syncing profile:", upsertError);
            }
          }
        } catch (err) {
          console.error("Failed to sync user with Supabase:", err);
        }
      }
      return true;
      return true;
    },
    async jwt({ token, user }) {
      // 1. Initial sign in - 'user' is available
      if (user) {
        token.sub = user.id; // This might be a Google ID initially
      }
      
      // 2. Ensure token.sub is a UUID (Supabase ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (token.sub && !uuidRegex.test(token.sub) && token.email) {
        try {
          const { supabaseAdmin } = await import("@/lib/supabase-admin");
          const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
          const supabaseUser = users?.find(u => u.email === token.email);
          if (supabaseUser) {
            token.sub = supabaseUser.id;
          }
        } catch (err) {
          console.error("Failed to resolve Supabase ID in JWT callback:", err);
        }
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
