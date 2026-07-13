"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  areFriends,
  getFriendRelationStatus,
  normalizeFriendshipIds,
} from "@/lib/friendship";
import { createFriendRequestNotification } from "@/lib/notifications";

export type ActionState = { error?: string; success?: string };

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function sendFriendRequestAction(targetUserId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (user.id === targetUserId) return { error: "Нельзя добавить себя в друзья" };

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, nickname: true },
    });

    if (!target) return { error: "Пользователь не найден" };

    const alreadyFriends = await areFriends(user.id, targetUserId);
    if (alreadyFriends) return { error: "Уже в друзьях" };

    const existingRequest = await prisma.friendRequest.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: user.id,
          toUserId: targetUserId,
        },
      },
    });

    if (existingRequest?.status === "PENDING") {
      return { error: "Заявка уже отправлена" };
    }

    if (existingRequest?.status === "ACCEPTED") {
      return { error: "Уже в друзьях" };
    }

    const request =
      existingRequest?.status === "DECLINED"
        ? await prisma.friendRequest.update({
            where: { id: existingRequest.id },
            data: { status: "PENDING", updatedAt: new Date() },
          })
        : await prisma.friendRequest.create({
            data: {
              fromUserId: user.id,
              toUserId: targetUserId,
            },
          });

    const reversePending = await prisma.friendRequest.findFirst({
      where: {
        fromUserId: targetUserId,
        toUserId: user.id,
        status: "PENDING",
      },
    });

    if (reversePending) {
      return { error: "У пользователя уже есть ваша заявка" };
    }

    await createFriendRequestNotification(targetUserId, user.id, request.id);

    revalidatePath(`/id/${target.nickname}`);
    revalidatePath(`/id/${user.nickname}`);

    return { success: "Заявка отправлена" };
  } catch {
    return { error: "Не удалось отправить заявку" };
  }
}

export async function acceptFriendRequestAction(friendRequestId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();

    const request = await prisma.friendRequest.findUnique({
      where: { id: friendRequestId },
      include: {
        fromUser: { select: { id: true, nickname: true } },
        toUser: { select: { id: true, nickname: true } },
      },
    });

    if (!request || request.toUserId !== user.id || request.status !== "PENDING") {
      return { error: "Заявка не найдена" };
    }

    const [userAId, userBId] = normalizeFriendshipIds(request.fromUserId, request.toUserId);

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: friendRequestId },
        data: { status: "ACCEPTED" },
      }),
      prisma.friendship.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {},
      }),
      prisma.notification.updateMany({
        where: {
          userId: user.id,
          type: "FRIEND_REQUEST",
          entityId: friendRequestId,
        },
        data: { readAt: new Date() },
      }),
    ]);

    revalidatePath(`/id/${request.fromUser.nickname}`);
    revalidatePath(`/id/${request.toUser.nickname}`);

    return { success: "Заявка принята" };
  } catch {
    return { error: "Не удалось принять заявку" };
  }
}

export async function declineFriendRequestAction(friendRequestId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();

    const request = await prisma.friendRequest.findUnique({
      where: { id: friendRequestId },
      select: { id: true, toUserId: true, status: true },
    });

    if (!request || request.toUserId !== user.id || request.status !== "PENDING") {
      return { error: "Заявка не найдена" };
    }

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: friendRequestId },
        data: { status: "DECLINED" },
      }),
      prisma.notification.updateMany({
        where: {
          userId: user.id,
          type: "FRIEND_REQUEST",
          entityId: friendRequestId,
        },
        data: { readAt: new Date() },
      }),
    ]);

    return { success: "Заявка отклонена" };
  } catch {
    return { error: "Не удалось отклонить заявку" };
  }
}

export async function removeFriendAction(targetUserId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    if (user.id === targetUserId) return { error: "Некорректный запрос" };

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { nickname: true },
    });

    if (!target) return { error: "Пользователь не найден" };

    const [userAId, userBId] = normalizeFriendshipIds(user.id, targetUserId);

    await prisma.friendship.deleteMany({
      where: { userAId, userBId },
    });

    revalidatePath(`/id/${target.nickname}`);
    revalidatePath(`/id/${user.nickname}`);

    return { success: "Удалён из друзей" };
  } catch {
    return { error: "Не удалось удалить из друзей" };
  }
}

const targetUserSchema = z.object({
  targetUserId: z.string().min(1),
});

export async function sendFriendRequestFormAction(formData: FormData): Promise<void> {
  const parsed = targetUserSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
  });
  if (parsed.success) {
    await sendFriendRequestAction(parsed.data.targetUserId);
  }
}

export async function removeFriendFormAction(formData: FormData): Promise<void> {
  const parsed = targetUserSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
  });
  if (parsed.success) {
    await removeFriendAction(parsed.data.targetUserId);
  }
}

export async function getFriendRelationStatusAction(
  profileUserId: string,
): Promise<Awaited<ReturnType<typeof getFriendRelationStatus>>> {
  const session = await auth();
  if (!session?.user?.id) return "none";
  return getFriendRelationStatus(session.user.id, profileUserId);
}
