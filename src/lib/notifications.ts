import { prisma } from "@/lib/prisma";

export type NotificationItem = {
  id: string;
  type: "FRIEND_REQUEST";
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
  actor: {
    id: string;
    nickname: string;
  } | null;
};

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      entityId: true,
      readAt: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          nickname: true,
        },
      },
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    entityId: notification.entityId,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    actor: notification.actor,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function createFriendRequestNotification(
  recipientId: string,
  actorId: string,
  friendRequestId: string,
) {
  await prisma.notification.deleteMany({
    where: {
      userId: recipientId,
      type: "FRIEND_REQUEST",
      entityId: friendRequestId,
    },
  });

  await prisma.notification.create({
    data: {
      userId: recipientId,
      actorId,
      type: "FRIEND_REQUEST",
      entityId: friendRequestId,
    },
  });
}
