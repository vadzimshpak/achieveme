"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canVoteOnApprovalRequest, tryQueuePostForModeration } from "@/lib/achievement-moderation";
import { verifyHCaptchaFromFormData } from "@/lib/hcaptcha";

export type ActionState = { error?: string; success?: string };

const createPostSchema = z.discriminatedUnion("type", [
  z.object({
    title: z.string().trim().min(1, "Укажите заголовок").max(200),
    type: z.literal("PROGRESS"),
    achievementTemplateId: z.string().min(1),
    body: z.string().min(2),
  }),
  z.object({
    title: z.string().trim().min(1, "Укажите заголовок").max(200),
    type: z.literal("APPROVAL_REQUEST"),
    achievementTemplateId: z.string().min(1),
    body: z.string().min(2),
  }),
  z.object({
    title: z.string().trim().min(1, "Укажите заголовок").max(200),
    type: z.literal("ACHIEVEMENT_PROPOSAL"),
    body: z.string().min(2),
  }),
]);

function hasBodyContent(body: unknown): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((block) => {
    if (!block || typeof block !== "object") return false;
    const content = (block as { content?: unknown[] }).content;
    if (!Array.isArray(content)) return false;
    return content.some((item) => {
      if (!item || typeof item !== "object") return false;
      const text = (item as { text?: string }).text;
      return typeof text === "string" && text.trim().length > 0;
    });
  });
}

export async function createPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Необходимо войти в аккаунт" };

    const captcha = await verifyHCaptchaFromFormData(formData);
    if (!captcha.ok) return { error: captcha.error };

    const parsed = createPostSchema.safeParse({
      title: formData.get("title"),
      type: formData.get("type"),
      achievementTemplateId: formData.get("achievementTemplateId") || undefined,
      body: formData.get("body"),
    });

    if (!parsed.success) return { error: "Проверьте данные поста" };

    const { title, type, body } = parsed.data;
    const achievementTemplateId =
      parsed.data.type === "ACHIEVEMENT_PROPOSAL" ? null : parsed.data.achievementTemplateId;

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return { error: "Некорректное содержимое поста" };
    }

    if (!hasBodyContent(parsedBody)) {
      return { error: "Добавьте текст в тело поста" };
    }

    if (achievementTemplateId) {
      const template = await prisma.achievementTemplate.findFirst({
        where: { id: achievementTemplateId, isActive: true },
      });

      if (!template) return { error: "Достижение не найдено" };

      if (type === "APPROVAL_REQUEST") {
        const unlocked = await prisma.userAchievement.findUnique({
          where: {
            userId_achievementTemplateId: {
              userId: session.user.id,
              achievementTemplateId,
            },
          },
        });

        if (unlocked) {
          return { error: "Это достижение уже открыто" };
        }
      }
    }

    await prisma.post.create({
      data: {
        authorId: session.user.id,
        achievementTemplateId,
        title,
        type,
        body: parsedBody as object,
      },
    });

    revalidatePath("/");

    return { success: "Пост опубликован" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось опубликовать пост" };
  }
}

export type PostVoteResult = {
  error?: string;
  likes: number;
  dislikes: number;
  userVote: "LIKE" | "DISLIKE" | null;
};

export async function votePostReactionAction(
  postId: string,
  vote: "LIKE" | "DISLIKE",
): Promise<PostVoteResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Необходимо войти в аккаунт", likes: 0, dislikes: 0, userVote: null };
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        type: true,
        achievementTemplateId: true,
        moderationStatus: true,
      },
    });

    if (!post) {
      return { error: "Пост не найден", likes: 0, dislikes: 0, userVote: null };
    }

    if (post.type === "APPROVAL_REQUEST" && post.achievementTemplateId) {
      const isAdmin = session.user.role === "ADMIN";
      let hasAchievement = false;

      if (!isAdmin) {
        const unlocked = await prisma.userAchievement.findUnique({
          where: {
            userId_achievementTemplateId: {
              userId: session.user.id,
              achievementTemplateId: post.achievementTemplateId,
            },
          },
        });
        hasAchievement = !!unlocked;
      }

      const voteAccess = canVoteOnApprovalRequest({
        isAdmin,
        hasAchievement,
        moderationStatus: post.moderationStatus,
      });

      if (!voteAccess.allowed) {
        return {
          error: voteAccess.reason ?? "Нельзя голосовать за эту заявку",
          likes: 0,
          dislikes: 0,
          userVote: null,
        };
      }
    }

    const existingVote = await prisma.postVote.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    });

    if (existingVote?.value === vote) {
      await prisma.postVote.delete({ where: { id: existingVote.id } });
    } else if (existingVote) {
      await prisma.postVote.update({
        where: { id: existingVote.id },
        data: { value: vote },
      });
    } else {
      await prisma.postVote.create({
        data: { userId: session.user.id, postId, value: vote },
      });
    }

    const [likes, dislikes, userVoteRecord] = await Promise.all([
      prisma.postVote.count({ where: { postId, value: "LIKE" } }),
      prisma.postVote.count({ where: { postId, value: "DISLIKE" } }),
      prisma.postVote.findUnique({
        where: { userId_postId: { userId: session.user.id, postId } },
        select: { value: true },
      }),
    ]);

    if (post.type === "APPROVAL_REQUEST") {
      await tryQueuePostForModeration(postId);
      revalidatePath("/admin/achievement-moderation");
    }

    revalidatePath("/");

    return {
      likes,
      dislikes,
      userVote: userVoteRecord?.value ?? null,
    };
  } catch {
    return { error: "Не удалось обновить оценку", likes: 0, dislikes: 0, userVote: null };
  }
}

export async function deletePostAction(postId: string): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Недостаточно прав" };
    }

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return { error: "Пост не найден" };

    await prisma.post.delete({ where: { id: postId } });

    revalidatePath("/");
    revalidatePath("/admin/achievement-moderation");

    return { success: "Пост удалён" };
  } catch {
    return { error: "Не удалось удалить пост" };
  }
}
