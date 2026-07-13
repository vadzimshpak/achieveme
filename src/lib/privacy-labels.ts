import type { PrivacyLevel } from "@/generated/prisma/client";

export const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  EVERYONE: "Все",
  FRIENDS: "Друзья",
  NOBODY: "Никто",
};
