import "next-auth";
import { UserType } from "@/app/lib/types";

declare module "next-auth" {
  interface User {
    id: string;
    tipo: UserType;
    token?: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tipo: UserType;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tipo: UserType;
    id?: string;
    accessToken?: string;
  }
} 