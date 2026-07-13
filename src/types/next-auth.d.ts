import { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickname: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    nickname: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nickname: string;
    role: Role;
  }
}
