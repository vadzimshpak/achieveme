import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export async function readDefaultAsset(filename: string) {
  const filePath = path.join(process.cwd(), "public", filename);
  const data = await readFile(filePath);
  const mimeType = filename.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
  return { data, mimeType };
}

export async function createStoredImageFromFile(
  file: FormDataEntryValue | null,
): Promise<{ id: string } | null | undefined> {
  if (file === null) return undefined;

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Неподдерживаемый формат изображения");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Изображение не должно превышать 2 МБ");
  }

  const data = Buffer.from(await file.arrayBuffer());

  const image = await prisma.storedImage.create({
    data: {
      data: new Uint8Array(data),
      mimeType: file.type,
    },
  });

  return { id: image.id };
}

export async function deleteStoredImage(imageId: string | null | undefined) {
  if (!imageId) return;

  await prisma.storedImage.delete({ where: { id: imageId } }).catch(() => undefined);
}

export async function createStoredImageFromBuffer(data: Buffer, mimeType: string) {
  const image = await prisma.storedImage.create({
    data: { data: new Uint8Array(data), mimeType },
  });
  return image.id;
}
