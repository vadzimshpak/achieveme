"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PostCommentItem } from "@/lib/post-comments";
import type { PostVoteResult } from "@/actions/post";

export type ActionState = { error?: string; success?: string };

const addCommentSchema = z.object({
  postId: z.string().min(1),
  text: z.string().trim().min(1, "Комментарий не может быть пустым").max(500),
});

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export type AddPostCommentResult = {
  error?: string;
  comment?: PostCommentItem;
};

export async function addPostCommentAction(
  _prev: AddPostCommentResult,
  formData: FormData,
): Promise<AddPostCommentResult> {
  try {
    const user = await getSessionUser();
    const parsed = addCommentSchema.safeParse({
      postId: formData.get("postId"),
      text: formData.get("text"),
    });

    if (!parsed.success) return { error: "Комментарий не может быть пустым" };

    const { postId, text } = parsed.data;

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return { error: "Пост не найден" };

    const comment = await prisma.postComment.create({
      data: {
        postId,
        authorId: user.id,
        text,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    revalidatePath("/");

    return {
      comment: {
        ...comment,
        reactions: { likes: 0, dislikes: 0, userVote: null },
      },
    };
  } catch {
    return { error: "Не удалось добавить комментарий" };
  }
}

export async function votePostCommentReactionAction(
  commentId: string,
  vote: "LIKE" | "DISLIKE",
): Promise<PostVoteResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Необходимо войти в аккаунт", likes: 0, dislikes: 0, userVote: null };
    }

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return { error: "Комментарий не найден", likes: 0, dislikes: 0, userVote: null };
    }

    const existingVote = await prisma.postCommentVote.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    if (existingVote?.value === vote) {
      await prisma.postCommentVote.delete({ where: { id: existingVote.id } });
    } else if (existingVote) {
      await prisma.postCommentVote.update({
        where: { id: existingVote.id },
        data: { value: vote },
      });
    } else {
      await prisma.postCommentVote.create({
        data: { userId: session.user.id, commentId, value: vote },
      });
    }

    const [likes, dislikes, userVoteRecord] = await Promise.all([
      prisma.postCommentVote.count({ where: { commentId, value: "LIKE" } }),
      prisma.postCommentVote.count({ where: { commentId, value: "DISLIKE" } }),
      prisma.postCommentVote.findUnique({
        where: { userId_commentId: { userId: session.user.id, commentId } },
        select: { value: true },
      }),
    ]);

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

export async function deletePostCommentAction(commentId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        post: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!comment) return { error: "Комментарий не найден" };

    const canDelete =
      comment.authorId === user.id ||
      comment.post.authorId === user.id ||
      user.role === "ADMIN";

    if (!canDelete) return { error: "Нет прав на удаление" };

    await prisma.postComment.delete({ where: { id: commentId } });

    revalidatePath("/");

    return { success: "Комментарий удалён" };
  } catch {
    return { error: "Не удалось удалить комментарий" };
  }
}
