import { NextResponse } from "next/server";
import { getAchievementRarityStats } from "@/lib/achievement-rarity";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await context.params;
  const stats = await getAchievementRarityStats(templateId);

  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
