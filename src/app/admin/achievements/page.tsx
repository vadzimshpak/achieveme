import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminAchievementsClient } from "./AdminAchievementsClient";

export default async function AdminAchievementsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const [spheres, achievementTemplates] = await Promise.all([
    prisma.lifeSphere.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.achievementTemplate.findMany({
      include: { sphere: { select: { name: true } } },
      orderBy: [{ sphere: { sortOrder: "asc" } }, { title: "asc" }],
    }),
  ]);

  return (
    <AdminAchievementsClient spheres={spheres} achievementTemplates={achievementTemplates} />
  );
}
