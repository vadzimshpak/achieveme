import { prisma } from "@/lib/prisma";
import { getLevelProgress } from "@/lib/level";
import { clearStaleCurrentGoals } from "@/lib/goals";

export async function getProfileByNickname(nickname: string) {
  const user = await prisma.user.findUnique({
    where: { nickname },
    include: {
      userAchievements: {
        include: {
          achievementTemplate: { include: { sphere: true } },
        },
        orderBy: { unlockedAt: "desc" },
      },
      currentGoals: {
        include: {
          sphere: true,
          achievementTemplate: true,
        },
      },
      commentsOnProfile: {
        include: {
          author: {
            select: { id: true, nickname: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  await clearStaleCurrentGoals(user.id);

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentAchievementsCount = user.userAchievements.filter(
    (a) => a.unlockedAt >= twoWeeksAgo,
  ).length;

  const levelProgress = getLevelProgress(user.xp, user.level);

  const recentActivity = user.userAchievements.slice(0, 5).map((a) => ({
    id: a.achievementTemplate.id,
    title: a.achievementTemplate.title,
    description: a.achievementTemplate.description,
    xpReward: a.achievementTemplate.xpReward,
    unlockedAt: a.unlockedAt,
    sphereId: a.achievementTemplate.sphereId,
    sphereName: a.achievementTemplate.sphere.name,
  }));

  const currentGoals = user.currentGoals
    .filter(
      (goal) =>
        !user.userAchievements.some(
          (achievement) => achievement.achievementTemplateId === goal.achievementTemplateId,
        ),
    )
    .map((goal) => ({
    achievementTemplateId: goal.achievementTemplateId,
    title: goal.achievementTemplate.title,
    description: goal.achievementTemplate.description,
    xpReward: goal.achievementTemplate.xpReward,
    sphereId: goal.sphereId,
    sphereName: goal.sphere.name,
  }));

  return {
    user,
    levelProgress,
    recentAchievementsCount,
    recentActivity,
    currentGoals,
    stats: {
      achievements: user.userAchievements.length,
      comments: user.commentsOnProfile.length,
    },
  };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, nickname: true, role: true },
  });
}
