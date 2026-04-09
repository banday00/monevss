import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Dashboard Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Gunakan .trim() untuk membuang spasi kosong atau karakter \r (carriage return)
        // yang sering terbawa saat file .env.local disalin dari komputer Windows ke server Linux
        const envUsername = (process.env.DASHBOARD_USERNAME || '').trim();
        const envPassword = (process.env.DASHBOARD_PASSWORD || '').trim();

        const inputUsername = (credentials?.username as string || '').trim();
        const inputPassword = (credentials?.password as string || '').trim();

        if (
          inputUsername && 
          inputPassword &&
          inputUsername === envUsername &&
          inputPassword === envPassword
        ) {
          return {
            id: '1',
            name: 'Administrator',
            email: 'admin@satudata.bogor.go.id',
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
