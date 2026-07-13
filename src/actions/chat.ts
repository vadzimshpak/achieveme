"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessChatRoom,
  getOrCreateDirectRoom,
} from "@/lib/chat";
import { canSendDirectMessage } from "@/lib/privacy";

export type ActionState = { error?: string; success?: string };

const sendMessageSchema = z.object({
  roomId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
});

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export type SendMessageResult = {
  error?: string;
  message?: {
    id: string;
    text: string;
    createdAt: Date;
    author: { id: string; nickname: string };
    isOwn: boolean;
  };
};

export async function sendChatMessageAction(
  roomId: string,
  text: string,
): Promise<SendMessageResult> {
  try {
    const user = await getSessionUser();
    const parsed = sendMessageSchema.safeParse({ roomId, text });
    if (!parsed.success) return { error: "Сообщение не может быть пустым" };

    const hasAccess = await canAccessChatRoom(roomId, user.id);
    if (!hasAccess) return { error: "Нет доступа к чату" };

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: {
        type: true,
        directConversation: {
          select: {
            userLowId: true,
            userHighId: true,
          },
        },
      },
    });

    if (room?.type === "DIRECT" && room.directConversation) {
      const targetUserId =
        room.directConversation.userLowId === user.id
          ? room.directConversation.userHighId
          : room.directConversation.userLowId;

      const allowed = await canSendDirectMessage(targetUserId, user.id);
      if (!allowed) {
        return { error: "Пользователь ограничил личные сообщения" };
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        authorId: user.id,
        text: parsed.data.text,
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

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    revalidatePath("/chat");

    return {
      message: {
        ...message,
        isOwn: true,
      },
    };
  } catch {
    return { error: "Не удалось отправить сообщение" };
  }
}

export async function startDirectChatAction(targetUserId: string): Promise<{
  error?: string;
  roomId?: string;
}> {
  try {
    const user = await getSessionUser();
    if (user.id === targetUserId) return { error: "Нельзя написать себе" };

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) return { error: "Пользователь не найден" };

    const allowed = await canSendDirectMessage(targetUserId, user.id);
    if (!allowed) return { error: "Пользователь ограничил личные сообщения" };

    const roomId = await getOrCreateDirectRoom(user.id, targetUserId);
    return { roomId };
  } catch {
    return { error: "Не удалось открыть чат" };
  }
}
