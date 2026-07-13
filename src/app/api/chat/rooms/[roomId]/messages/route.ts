import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessChatRoom, getChatMessages } from "@/lib/chat";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ roomId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await context.params;
  const hasAccess = await canAccessChatRoom(roomId, session.user.id);

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      type: true,
      achievementTemplate: {
        select: { title: true },
      },
      directConversation: {
        select: {
          userLow: { select: { id: true, nickname: true } },
          userHigh: { select: { id: true, nickname: true } },
        },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await getChatMessages(roomId, session.user.id);

  let title = "Чат";
  if (room.type === "ACHIEVEMENT") {
    title = room.achievementTemplate?.title ?? "Чат ачивки";
  } else if (room.directConversation) {
    const otherUser =
      room.directConversation.userLow.id === session.user.id
        ? room.directConversation.userHigh
        : room.directConversation.userLow;
    title = otherUser.nickname;
  }

  return NextResponse.json({
    room: {
      id: room.id,
      type: room.type,
      title,
    },
    messages,
  });
}
