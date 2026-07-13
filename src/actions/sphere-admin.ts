"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStoredImageFromFile } from "@/lib/images";

export type ActionState = { error?: string; success?: string };

async function getAdminUser() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

const sphereSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(300).optional(),
  sortOrder: z.coerce.number().default(0),
});

export async function createSphereAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await getAdminUser();
    const parsed = sphereSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      sortOrder: formData.get("sortOrder") || 0,
    });

    if (!parsed.success) return { error: "Проверьте данные сферы" };

    const { name, description, sortOrder } = parsed.data;
    const iconUpload = await createStoredImageFromFile(formData.get("icon"));

    await prisma.lifeSphere.create({
      data: {
        name,
        description,
        sortOrder,
        iconImageId: iconUpload?.id ?? null,
      },
    });

    revalidatePath("/admin/spheres");
    revalidatePath("/achievements");

    return { success: "Сфера создана" };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Не удалось создать сферу" };
  }
}

export async function toggleSphereAction(sphereId: string, isActive: boolean): Promise<ActionState> {
  try {
    await getAdminUser();

    await prisma.lifeSphere.update({
      where: { id: sphereId },
      data: { isActive },
    });

    revalidatePath("/admin/spheres");
    revalidatePath("/achievements");

    return { success: isActive ? "Сфера активирована" : "Сфера деактивирована" };
  } catch {
    return { error: "Не удалось обновить сферу" };
  }
}

export async function toggleSphereFormAction(formData: FormData): Promise<void> {
  const sphereId = formData.get("sphereId") as string;
  const isActive = formData.get("isActive") === "true";
  await toggleSphereAction(sphereId, isActive);
}
