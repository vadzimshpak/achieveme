import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearStaleCurrentGoals } from "@/lib/goals";
import { SpheresManager } from "./SpheresManager";
import styles from "../settings/settings.module.css";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, allSpheres, userAchievements, currentGoals] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.lifeSphere.findMany({
      where: { isActive: true },
      include: {
        achievementTemplates: {
          where: { isActive: true },
          orderBy: { title: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievementTemplate: { include: { sphere: true } },
      },
      orderBy: { unlockedAt: "desc" },
    }),
    prisma.userCurrentGoal.findMany({
      where: { userId },
      select: { sphereId: true, achievementTemplateId: true },
    }),
  ]);

  if (!user) redirect("/login");

  await clearStaleCurrentGoals(userId);

  const unlockedIds = new Set(userAchievements.map((a) => a.achievementTemplateId));
  const currentGoalBySphere = new Map(
    currentGoals.map((g) => [g.sphereId, g.achievementTemplateId]),
  );

  const achievements = userAchievements.map((a) => ({
    id: a.achievementTemplate.id,
    title: a.achievementTemplate.title,
    description: a.achievementTemplate.description,
    xpReward: a.achievementTemplate.xpReward,
    sphere: { name: a.achievementTemplate.sphere.name },
  }));

  const spheres = allSpheres
    .map((sphere) => {
      const sphereAchievements = sphere.achievementTemplates.map((template) => ({
        id: template.id,
        title: template.title,
        description: template.description,
        xpReward: template.xpReward,
        isUnlocked: unlockedIds.has(template.id),
        isCurrentGoal: currentGoalBySphere.get(sphere.id) === template.id,
      }));

      return {
        id: sphere.id,
        name: sphere.name,
        description: sphere.description,
        totalAchievements: sphereAchievements.length,
        unlockedAchievements: sphereAchievements.filter((a) => a.isUnlocked).length,
        achievements: sphereAchievements,
      };
    })
    .filter((sphere) => sphere.achievements.length > 0);

  return (
    <main className={styles["page"]}>
      <h1 className={styles["page__title"]}>Достижения</h1>
      <SpheresManager achievements={achievements} spheres={spheres} />
    </main>
  );
}
