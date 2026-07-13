import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAchievementChatRooms, getDirectChatRooms } from "@/lib/chat";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [achievementRooms, directRooms] = await Promise.all([
    getAchievementChatRooms(session.user.id),
    getDirectChatRooms(session.user.id),
  ]);

  return NextResponse.json({ achievementRooms, directRooms });
}
