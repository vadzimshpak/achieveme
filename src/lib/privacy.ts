import type { PrivacyLevel } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { areFriends } from "@/lib/friendship";
import { PRIVACY_LABELS } from "@/lib/privacy-labels";

export { PRIVACY_LABELS };

export type PrivacySettings = {
  whoCanMessage: PrivacyLevel;
  whoCanComment: PrivacyLevel;
  whoCanViewProfile: PrivacyLevel;
};

const DEFAULT_PRIVACY: PrivacySettings = {
  whoCanMessage: "EVERYONE",
  whoCanComment: "EVERYONE",
  whoCanViewProfile: "EVERYONE",
};

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const settings = await prisma.userPrivacySettings.findUnique({
    where: { userId },
  });

  return settings ?? DEFAULT_PRIVACY;
}

export async function ensurePrivacySettings(userId: string): Promise<PrivacySettings> {
  const settings = await prisma.userPrivacySettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return settings;
}

async function checkPrivacyLevel(
  level: PrivacyLevel,
  ownerId: string,
  viewerId: string | null | undefined,
): Promise<boolean> {
  if (level === "EVERYONE") return true;
  if (!viewerId) return false;
  if (viewerId === ownerId) return true;
  if (level === "NOBODY") return false;
  return areFriends(ownerId, viewerId);
}

export async function canViewProfile(
  profileUserId: string,
  viewerUserId: string | null | undefined,
): Promise<boolean> {
  if (!viewerUserId || viewerUserId === profileUserId) return true;
  const settings = await getPrivacySettings(profileUserId);
  return checkPrivacyLevel(settings.whoCanViewProfile, profileUserId, viewerUserId);
}

export async function canCommentOnProfile(
  profileUserId: string,
  viewerUserId: string | null | undefined,
): Promise<boolean> {
  if (!viewerUserId) return false;
  if (viewerUserId === profileUserId) return true;
  const settings = await getPrivacySettings(profileUserId);
  return checkPrivacyLevel(settings.whoCanComment, profileUserId, viewerUserId);
}

export async function canSendDirectMessage(
  targetUserId: string,
  senderUserId: string,
): Promise<boolean> {
  if (targetUserId === senderUserId) return false;
  const settings = await getPrivacySettings(targetUserId);
  return checkPrivacyLevel(settings.whoCanMessage, targetUserId, senderUserId);
}
