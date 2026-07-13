import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readDefaultAsset } from "@/lib/images";

type RouteParams = { params: Promise<{ presetId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { presetId } = await params;

  const preset = await prisma.bannerPreset.findUnique({
    where: { id: presetId },
    select: {
      image: { select: { data: true, mimeType: true } },
    },
  });

  if (!preset?.image) {
    const fallback = await readDefaultAsset("banners/classic.svg");
    return new NextResponse(new Uint8Array(fallback.data), {
      headers: {
        "Content-Type": fallback.mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new NextResponse(new Uint8Array(preset.image.data), {
    headers: {
      "Content-Type": preset.image.mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
