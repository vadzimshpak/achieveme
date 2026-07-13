import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readDefaultAsset } from "@/lib/images";

type RouteParams = { params: Promise<{ userId: string }> };

async function serveImage(
  data: Buffer | Uint8Array | null | undefined,
  mimeType: string | null | undefined,
  fallbackFile: string,
) {
  if (data && mimeType) {
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const fallback = await readDefaultAsset(fallbackFile);
  return new NextResponse(new Uint8Array(fallback.data), {
    headers: {
      "Content-Type": fallback.mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      bannerPreset: {
        select: {
          image: { select: { data: true, mimeType: true } },
        },
      },
    },
  });

  if (!user) {
    return new NextResponse("Not found", { status: 404 });
  }

  const image = user.bannerPreset?.image;

  return serveImage(image?.data, image?.mimeType, "banners/classic.svg");
}
