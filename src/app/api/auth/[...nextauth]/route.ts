import NextAuth, { AuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { UserType } from "@/app/lib/types";

// Helper para guardar el token en localStorage (solo ejecuta en cliente)
const saveTokenToLocalStorage = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales incompletas');
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const loginUrl = `${apiUrl}/api/auth/login`;
          
          console.log('Intentando login en:', loginUrl);
          
          const formData = new URLSearchParams();
          formData.append('username', credentials.email);
          formData.append('password', credentials.password);
          
          const res = await fetch(loginUrl, {
            method: "POST",
            body: formData,
            headers: { 
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "application/json"
            }
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Error en respuesta de login:', {
              status: res.status,
              statusText: res.statusText,
              url: loginUrl,
              errorData
            });
            throw new Error(errorData.message || `Error en la autenticación: ${res.status} ${res.statusText}`);
          }
          
          const data = await res.json();
          
          if (!data.access_token) {
            console.error('Respuesta sin token:', data);
            throw new Error('Respuesta del servidor inválida: falta el token de acceso');
          }

          console.log('Login exitoso para:', credentials.email);

          return {
            id: credentials.email,
            name: credentials.email.split('@')[0],
            email: credentials.email,
            tipo: "mecánico" as UserType,
            token: data.access_token
          };
        } catch (error) {
          console.error("Error de autenticación:", error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.tipo = user.tipo;
        token.id = user.id;
        token.accessToken = user.token;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id || token.sub || "";
        session.user.tipo = token.tipo;
        session.user.name = token.name || "";
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 