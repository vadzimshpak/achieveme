"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePrivacySettings } from "@/lib/privacy";

export type ActionState = { error?: string; success?: string };

const privacySchema = z.object({
  whoCanMessage: z.enum(["EVERYONE", "FRIENDS", "NOBODY"]),
  whoCanComment: z.enum(["EVERYONE", "FRIENDS", "NOBODY"]),
  whoCanViewProfile: z.enum(["EVERYONE", "FRIENDS", "NOBODY"]),
});

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function updatePrivacyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const parsed = privacySchema.safeParse({
      whoCanMessage: formData.get("whoCanMessage"),
      whoCanComment: formData.get("whoCanComment"),
      whoCanViewProfile: formData.get("whoCanViewProfile"),
    });

    if (!parsed.success) return { error: "Проверьте настройки конфиденциальности" };

    await prisma.userPrivacySettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...parsed.data,
      },
      update: parsed.data,
    });

    revalidatePath("/settings");
    revalidatePath(`/id/${user.nickname}`);

    return { success: "Настройки конфиденциальности сохранены" };
  } catch {
    return { error: "Не удалось сохранить настройки" };
  }
}

export async function getPrivacySettingsForUser(userId: string) {
  return ensurePrivacySettings(userId);
}
