"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
  type ActionState,
} from "@/actions/friend";

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function acceptFriendRequestFormAction(formData: FormData): Promise<ActionState> {
  const friendRequestId = formData.get("friendRequestId") as string;
  const result = await acceptFriendRequestAction(friendRequestId);
  revalidatePath("/");
  return result;
}

export async function declineFriendRequestFormAction(formData: FormData): Promise<ActionState> {
  const friendRequestId = formData.get("friendRequestId") as string;
  const result = await declineFriendRequestAction(friendRequestId);
  revalidatePath("/");
  return result;
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await getSessionUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
