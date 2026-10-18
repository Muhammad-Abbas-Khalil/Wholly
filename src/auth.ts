import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      phone: string;
      role: 'BUYER' | 'ADMIN';
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    phone?: string;
    role?: 'BUYER' | 'ADMIN';
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        phone: { label: 'Phone Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        let phone = String(credentials.phone).replace(/[\s\-\(\)]/g, '').trim();
        if (phone.startsWith('+92')) {
          phone = '0' + phone.slice(3);
        } else if (phone.startsWith('92') && phone.length === 12) {
          phone = '0' + phone.slice(2);
        }

        const user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        session.user.role = token.role as 'BUYER' | 'ADMIN';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
});
