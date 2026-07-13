import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadNotificationCount, getUserNotifications } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.user.id),
    getUnreadNotificationCount(session.user.id),
  ]);

  const friendRequestIds = notifications
    .filter((notification) => notification.type === "FRIEND_REQUEST" && notification.entityId)
    .map((notification) => notification.entityId as string);

  const pendingRequests =
    friendRequestIds.length > 0
      ? await prisma.friendRequest.findMany({
          where: {
            id: { in: friendRequestIds },
            status: "PENDING",
          },
          select: { id: true },
        })
      : [];

  const pendingIds = new Set(pendingRequests.map((request) => request.id));

  const enrichedNotifications = notifications
    .filter((notification) => {
      if (notification.type !== "FRIEND_REQUEST" || !notification.entityId) return true;
      return pendingIds.has(notification.entityId);
    })
    .map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
    }));

  return NextResponse.json({
    notifications: enrichedNotifications,
    unreadCount,
  });
}
