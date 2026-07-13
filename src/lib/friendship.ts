import { prisma } from "@/lib/prisma";

export function normalizeFriendshipIds(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true;

  const [userAId, userBId] = normalizeFriendshipIds(userIdA, userIdB);
  const friendship = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true },
  });

  return !!friendship;
}

export type FriendListItem = {
  id: string;
  nickname: string;
  level: number;
};

export async function getFriendsList(userId: string): Promise<FriendListItem[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: {
      userAId: true,
      userBId: true,
      userA: { select: { id: true, nickname: true, level: true } },
      userB: { select: { id: true, nickname: true, level: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return friendships.map((friendship) => {
    const friend = friendship.userAId === userId ? friendship.userB : friendship.userA;
    return { id: friend.id, nickname: friend.nickname, level: friend.level };
  });
}

export type FriendRelationStatus =
  | "self"
  | "friends"
  | "pending_outgoing"
  | "pending_incoming"
  | "none";

export async function getFriendRelationStatus(
  viewerId: string,
  profileUserId: string,
): Promise<FriendRelationStatus> {
  if (viewerId === profileUserId) return "self";

  const [userAId, userBId] = normalizeFriendshipIds(viewerId, profileUserId);
  const friendship = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
    select: { id: true },
  });

  if (friendship) return "friends";

  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { fromUserId: viewerId, toUserId: profileUserId },
        { fromUserId: profileUserId, toUserId: viewerId },
      ],
    },
    select: { fromUserId: true },
  });

  if (!pendingRequest) return "none";
  return pendingRequest.fromUserId === viewerId ? "pending_outgoing" : "pending_incoming";
}
