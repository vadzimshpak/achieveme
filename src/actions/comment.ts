"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCommentOnProfile } from "@/lib/privacy";
import { verifyHCaptchaFromFormData } from "@/lib/hcaptcha";

const commentSchema = z.object({
  profileUserId: z.string(),
  text: z.string().min(1).max(500),
});

export type ActionState = { error?: string; success?: string };

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function addCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await getSessionUser();

    const captcha = await verifyHCaptchaFromFormData(formData);
    if (!captcha.ok) return { error: captcha.error };

    const parsed = commentSchema.safeParse({
      profileUserId: formData.get("profileUserId"),
      text: formData.get("text"),
    });

    if (!parsed.success) return { error: "Комментарий не может быть пустым" };

    const { profileUserId, text } = parsed.data;

    const profileUser = await prisma.user.findUnique({ where: { id: profileUserId } });
    if (!profileUser) return { error: "Профиль не найден" };

    const canComment = await canCommentOnProfile(profileUserId, user.id);
    if (!canComment) return { error: "Комментарии к этому профилю ограничены" };

    await prisma.profileComment.create({
      data: { profileUserId, authorId: user.id, text },
    });

    revalidatePath(`/id/${profileUser.nickname}`);

    return { success: "Комментарий добавлен" };
  } catch {
    return { error: "Не удалось добавить комментарий" };
  }
}

export async function deleteCommentAction(commentId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();

    const comment = await prisma.profileComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) return { error: "Комментарий не найден" };

    if (comment.authorId !== user.id && comment.profileUserId !== user.id) {
      return { error: "Нет прав на удаление" };
    }

    const profileUser = await prisma.user.findUnique({
      where: { id: comment.profileUserId },
    });

    await prisma.profileComment.delete({ where: { id: commentId } });

    if (profileUser) {
      revalidatePath(`/id/${profileUser.nickname}`);
    }

    return { success: "Комментарий удалён" };
  } catch {
    return { error: "Не удалось удалить комментарий" };
  }
}

export async function deleteCommentFormAction(formData: FormData): Promise<void> {
  const commentId = formData.get("commentId") as string;
  await deleteCommentAction(commentId);
}
