"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStoredImageFromFile, deleteStoredImage } from "@/lib/images";

const profileSchema = z.object({
  nickname: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(500).optional(),
  bannerPresetId: z.string().min(1),
});

export type ActionState = { error?: string; success?: string };

async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

async function replaceUserAvatar(userId: string, file: FormDataEntryValue | null) {
  const upload = await createStoredImageFromFile(file);
  if (upload === undefined) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarImageId: true },
  });

  if (!user) return;

  const oldImageId = user.avatarImageId;

  await prisma.user.update({
    where: { id: userId },
    data: {
      avatarImageId: upload?.id ?? null,
    },
  });

  if (oldImageId && oldImageId !== upload?.id) {
    await deleteStoredImage(oldImageId);
  }
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const parsed = profileSchema.safeParse({
      nickname: formData.get("nickname"),
      bio: formData.get("bio") || undefined,
      bannerPresetId: formData.get("bannerPresetId"),
    });

    if (!parsed.success) {
      return { error: "Проверьте корректность данных" };
    }

    const { nickname, bio, bannerPresetId } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { nickname, NOT: { id: user.id } },
    });

    if (existing) {
      return { error: "Этот никнейм уже занят" };
    }

    const preset = await prisma.bannerPreset.findUnique({
      where: { id: bannerPresetId },
    });

    if (!preset) {
      return { error: "Выберите баннер из списка" };
    }

    const oldUser = await prisma.user.findUnique({ where: { id: user.id } });

    await replaceUserAvatar(user.id, formData.get("avatar"));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        nickname,
        bio: bio || null,
        bannerPresetId,
      },
    });

    revalidatePath(`/id/${oldUser?.nickname}`);
    revalidatePath(`/id/${nickname}`);
    revalidatePath("/settings");

    return { success: "Профиль обновлён" };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Не удалось обновить профиль" };
  }
}
