import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type GoalDb = Pick<Prisma.TransactionClient, "userCurrentGoal" | "userAchievement">;

export async function removeCurrentGoalForAchievement(
  userId: string,
  achievementTemplateId: string,
  db: GoalDb = prisma,
) {
  await db.userCurrentGoal.deleteMany({
    where: { userId, achievementTemplateId },
  });
}

/** Удаляет цели по уже открытым достижениям. */
export async function clearStaleCurrentGoals(userId: string, db: GoalDb = prisma) {
  const unlocked = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementTemplateId: true },
  });

  if (unlocked.length === 0) return;

  await db.userCurrentGoal.deleteMany({
    where: {
      userId,
      achievementTemplateId: {
        in: unlocked.map((item) => item.achievementTemplateId),
      },
    },
  });
}
