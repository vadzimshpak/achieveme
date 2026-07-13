import { prisma } from "@/lib/prisma";

export type AchievementRarityTier =
  | "bronze"
  | "silver"
  | "gold"
  | "purple"
  | "single"
  | "unknown";

export type AchievementRarityStats = {
  templateId: string;
  totalUsers: number;
  owners: number;
  percent: number;
  tier: AchievementRarityTier;
};

export function getRarityTier(percent: number, owners: number): AchievementRarityTier {
  if (owners === 0) return "unknown";
  if (owners === 1) return "single";
  if (percent < 1) return "purple";
  if (percent < 5) return "gold";
  if (percent < 15) return "silver";
  return "bronze";
}

export async function getAchievementRarityStats(
  templateId: string,
): Promise<AchievementRarityStats> {
  const [totalUsers, owners] = await Promise.all([
    prisma.user.count(),
    prisma.userAchievement.count({ where: { achievementTemplateId: templateId } }),
  ]);

  const percent = totalUsers > 0 ? (owners / totalUsers) * 100 : 0;

  return {
    templateId,
    totalUsers,
    owners,
    percent,
    tier: getRarityTier(percent, owners),
  };
}
