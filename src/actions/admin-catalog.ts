"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStoredImageFromFile, deleteStoredImage } from "@/lib/images";

export type ActionState = { error?: string; success?: string };

async function getAdminUser() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

const achievementTemplateSchema = z.object({
  sphereId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  xpReward: z.coerce.number().int().min(1).default(10),
});

export async function createAchievementTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await getAdminUser();
    const parsed = achievementTemplateSchema.safeParse({
      sphereId: formData.get("sphereId"),
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      xpReward: formData.get("xpReward") || 10,
    });

    if (!parsed.success) return { error: "Проверьте данные достижения" };

    const { sphereId, title, description, xpReward } = parsed.data;
    const iconUpload = await createStoredImageFromFile(formData.get("icon"));

    await prisma.achievementTemplate.create({
      data: {
        sphereId,
        title,
        description,
        xpReward,
        iconImageId: iconUpload?.id ?? null,
      },
    });

    revalidatePath("/admin/achievements");
    revalidatePath("/achievements");

    return { success: "Достижение добавлено в каталог" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось создать достижение" };
  }
}

export async function toggleAchievementTemplateFormAction(formData: FormData): Promise<void> {
  const achievementTemplateId = formData.get("achievementTemplateId") as string;
  const isActive = formData.get("isActive") === "true";
  await toggleAchievementTemplateAction(achievementTemplateId, isActive);
}

export async function toggleAchievementTemplateAction(
  achievementTemplateId: string,
  isActive: boolean,
): Promise<ActionState> {
  try {
    await getAdminUser();

    await prisma.achievementTemplate.update({
      where: { id: achievementTemplateId },
      data: { isActive },
    });

    revalidatePath("/admin/achievements");
    revalidatePath("/achievements");

    return { success: isActive ? "Достижение активировано" : "Достижение деактивировано" };
  } catch {
    return { error: "Не удалось обновить достижение" };
  }
}

export async function deleteAchievementTemplateFormAction(formData: FormData): Promise<void> {
  const achievementTemplateId = formData.get("achievementTemplateId") as string;
  await deleteAchievementTemplateAction(achievementTemplateId);
}

export async function deleteAchievementTemplateAction(
  achievementTemplateId: string,
): Promise<ActionState> {
  try {
    await getAdminUser();

    const template = await prisma.achievementTemplate.findUnique({
      where: { id: achievementTemplateId },
    });

    if (!template) return { error: "Достижение не найдено" };

    const iconImageId = template.iconImageId;

    await prisma.achievementTemplate.delete({ where: { id: achievementTemplateId } });
    await deleteStoredImage(iconImageId);

    revalidatePath("/admin/achievements");
    revalidatePath("/achievements");

    return { success: "Достижение удалено" };
  } catch {
    return { error: "Не удалось удалить достижение" };
  }
}
