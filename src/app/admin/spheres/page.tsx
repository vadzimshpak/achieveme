import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSpheresClient } from "./AdminSpheresClient";

export default async function AdminSpheresPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const spheres = await prisma.lifeSphere.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return <AdminSpheresClient spheres={spheres} />;
}
