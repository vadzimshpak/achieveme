import { prisma } from "@/lib/prisma";
import { normalizeFriendshipIds } from "@/lib/friendship";

export type AchievementChatRoom = {
  roomId: string;
  achievementId: string;
  title: string;
  description: string | null;
};

export type DirectChatRoom = {
  roomId: string;
  userId: string;
  nickname: string;
  lastMessage: string | null;
  lastMessageAt: Date | null;
};

export type ChatMessageItem = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    nickname: string;
  };
  isOwn: boolean;
};

async function getOrCreateAchievementRoom(achievementTemplateId: string) {
  return prisma.chatRoom.upsert({
    where: {
      type_achievementTemplateId: {
        type: "ACHIEVEMENT",
        achievementTemplateId,
      },
    },
    create: {
      type: "ACHIEVEMENT",
      achievementTemplateId,
    },
    update: {},
    select: { id: true },
  });
}

export async function getAchievementChatRooms(userId: string): Promise<AchievementChatRoom[]> {
  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: {
      achievementTemplate: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
    },
    orderBy: { unlockedAt: "desc" },
  });

  const rooms: AchievementChatRoom[] = [];

  for (const achievement of achievements) {
    const room = await getOrCreateAchievementRoom(achievement.achievementTemplate.id);
    rooms.push({
      roomId: room.id,
      achievementId: achievement.achievementTemplate.id,
      title: achievement.achievementTemplate.title,
      description: achievement.achievementTemplate.description,
    });
  }

  return rooms;
}

export async function getDirectChatRooms(userId: string): Promise<DirectChatRoom[]> {
  const conversations = await prisma.directConversation.findMany({
    where: {
      OR: [{ userLowId: userId }, { userHighId: userId }],
    },
    select: {
      roomId: true,
      userLow: { select: { id: true, nickname: true } },
      userHigh: { select: { id: true, nickname: true } },
      room: {
        select: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return conversations
    .map((conversation) => {
      const otherUser =
        conversation.userLow.id === userId ? conversation.userHigh : conversation.userLow;
      const lastMessage = conversation.room.messages[0] ?? null;

      return {
        roomId: conversation.roomId,
        userId: otherUser.id,
        nickname: otherUser.nickname,
        lastMessage: lastMessage?.text ?? null,
        lastMessageAt: lastMessage?.createdAt ?? null,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() ?? 0;
      const bTime = b.lastMessageAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export async function getOrCreateDirectRoom(userId: string, targetUserId: string) {
  const [userLowId, userHighId] = normalizeFriendshipIds(userId, targetUserId);

  const existing = await prisma.directConversation.findUnique({
    where: { userLowId_userHighId: { userLowId, userHighId } },
    select: { roomId: true },
  });

  if (existing) return existing.roomId;

  const room = await prisma.chatRoom.create({
    data: {
      type: "DIRECT",
      directConversation: {
        create: {
          userLowId,
          userHighId,
        },
      },
    },
    select: { id: true },
  });

  return room.id;
}

export async function canAccessChatRoom(roomId: string, userId: string): Promise<boolean> {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      type: true,
      achievementTemplateId: true,
      directConversation: {
        select: {
          userLowId: true,
          userHighId: true,
        },
      },
    },
  });

  if (!room) return false;

  if (room.type === "DIRECT" && room.directConversation) {
    return (
      room.directConversation.userLowId === userId ||
      room.directConversation.userHighId === userId
    );
  }

  if (room.type === "ACHIEVEMENT" && room.achievementTemplateId) {
    const unlocked = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementTemplateId: {
          userId,
          achievementTemplateId: room.achievementTemplateId,
        },
      },
      select: { id: true },
    });
    return !!unlocked;
  }

  return false;
}

export async function getChatMessages(
  roomId: string,
  userId: string,
  limit = 50,
): Promise<ChatMessageItem[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: limit,
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

  return messages.map((message) => ({
    id: message.id,
    text: message.text,
    createdAt: message.createdAt,
    author: message.author,
    isOwn: message.author.id === userId,
  }));
}
