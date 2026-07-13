import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getRarityTier(percent: number, owners: number) {
  if (owners === 0) return "unknown";
  if (owners === 1) return "single";
  if (percent < 1) return "purple";
  if (percent < 5) return "gold";
  if (percent < 15) return "silver";
  return "bronze";
}

export async function GET(_request: Request, context: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await context.params;

  const [totalUsers, owners] = await Promise.all([
    prisma.user.count(),
    prisma.userAchievement.count({ where: { achievementTemplateId: templateId } }),
  ]);

  const percent = totalUsers > 0 ? (owners / totalUsers) * 100 : 0;

  return NextResponse.json({
    templateId,
    totalUsers,
    owners,
    percent,
    tier: getRarityTier(percent, owners),
  });
}

