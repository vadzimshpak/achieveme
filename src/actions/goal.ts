"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string; success?: string };

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function toggleCurrentGoalAction(
  achievementTemplateId: string,
): Promise<ActionState> {
  try {
    const user = await getSessionUser();

    const template = await prisma.achievementTemplate.findFirst({
      where: { id: achievementTemplateId, isActive: true },
    });

    if (!template) return { error: "Достижение не найдено" };

    const unlocked = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementTemplateId: {
          userId: user.id,
          achievementTemplateId,
        },
      },
    });

    if (unlocked) return { error: "Открытое достижение нельзя выбрать целью" };

    const existing = await prisma.userCurrentGoal.findUnique({
      where: {
        userId_sphereId: { userId: user.id, sphereId: template.sphereId },
      },
    });

    if (existing?.achievementTemplateId === achievementTemplateId) {
      await prisma.userCurrentGoal.delete({
        where: {
          userId_sphereId: { userId: user.id, sphereId: template.sphereId },
        },
      });
    } else {
      await prisma.userCurrentGoal.upsert({
        where: {
          userId_sphereId: { userId: user.id, sphereId: template.sphereId },
        },
        update: { achievementTemplateId },
        create: {
          userId: user.id,
          sphereId: template.sphereId,
          achievementTemplateId,
        },
      });
    }

    revalidatePath(`/id/${user.nickname}`);
    revalidatePath("/achievements");

    return { success: "Цель обновлена" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось обновить цель" };
  }
}

export async function toggleCurrentGoalFormAction(formData: FormData): Promise<void> {
  const achievementTemplateId = formData.get("achievementTemplateId") as string;
  if (!achievementTemplateId) return;
  await toggleCurrentGoalAction(achievementTemplateId);
}
