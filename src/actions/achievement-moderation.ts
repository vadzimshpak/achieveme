"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/level";
import { removeCurrentGoalForAchievement } from "@/lib/goals";

export type ActionState = { error?: string; success?: string };

async function getAdminUser() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function approveAchievementRequestAction(postId: string): Promise<ActionState> {
  try {
    const admin = await getAdminUser();

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        type: "APPROVAL_REQUEST",
        moderationStatus: "PENDING",
      },
      include: {
        achievementTemplate: true,
        author: { select: { nickname: true } },
      },
    });

    if (!post || !post.achievementTemplateId || !post.achievementTemplate) {
      return { error: "Заявка не найдена или уже обработана" };
    }

    const achievementTemplate = post.achievementTemplate;
    const achievementTemplateId = achievementTemplate.id;

    await prisma.$transaction(async (tx) => {
      const existingAchievement = await tx.userAchievement.findUnique({
        where: {
          userId_achievementTemplateId: {
            userId: post.authorId,
            achievementTemplateId,
          },
        },
      });

      if (!existingAchievement) {
        await tx.userAchievement.create({
          data: {
            userId: post.authorId,
            achievementTemplateId,
          },
        });

        await removeCurrentGoalForAchievement(post.authorId, achievementTemplateId, tx);

        const author = await tx.user.findUnique({ where: { id: post.authorId } });
        if (author) {
          const newXp = author.xp + achievementTemplate.xpReward;
          await tx.user.update({
            where: { id: post.authorId },
            data: { xp: newXp, level: calculateLevel(newXp) },
          });
        }
      }

      await tx.post.update({
        where: { id: postId },
        data: {
          moderationStatus: "APPROVED",
          moderationNote: null,
          moderatedAt: new Date(),
          moderatedById: admin.id,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/admin/achievement-moderation");
    revalidatePath("/achievements");
    revalidatePath(`/id/${post.author.nickname}`);

    return { success: "Достижение выдано пользователю" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось одобрить заявку" };
  }
}

const rejectSchema = z.object({
  postId: z.string().min(1),
  note: z.string().trim().min(1, "Укажите причину отклонения").max(500),
});

export async function rejectAchievementRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const admin = await getAdminUser();
    const parsed = rejectSchema.safeParse({
      postId: formData.get("postId"),
      note: formData.get("note"),
    });

    if (!parsed.success) return { error: "Укажите причину отклонения" };

    const { postId, note } = parsed.data;

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        type: "APPROVAL_REQUEST",
        moderationStatus: "PENDING",
      },
    });

    if (!post) return { error: "Заявка не найдена или уже обработана" };

    await prisma.post.update({
      where: { id: postId },
      data: {
        moderationStatus: "REJECTED",
        moderationNote: note,
        moderatedAt: new Date(),
        moderatedById: admin.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/achievement-moderation");

    return { success: "Заявка отклонена" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось отклонить заявку" };
  }
}

export async function submitAchievementForModerationAction(postId: string): Promise<ActionState> {
  try {
    await getAdminUser();

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        type: "APPROVAL_REQUEST",
        moderationStatus: "NONE",
      },
    });

    if (!post) return { error: "Заявка не найдена или уже отправлена на рассмотрение" };

    await prisma.post.update({
      where: { id: postId },
      data: { moderationStatus: "PENDING" },
    });

    revalidatePath("/");
    revalidatePath("/admin/achievement-moderation");

    return { success: "Заявка отправлена на рассмотрение" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось отправить заявку на рассмотрение" };
  }
}

export async function approveAchievementRequestFormAction(formData: FormData): Promise<void> {
  const postId = formData.get("postId") as string;
  await approveAchievementRequestAction(postId);
}

export async function rejectAchievementRequestFormAction(formData: FormData): Promise<void> {
  await rejectAchievementRequestAction({}, formData);
}
