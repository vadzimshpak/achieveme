import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readDefaultAsset } from "@/lib/images";

type RouteParams = { params: Promise<{ sphereId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { sphereId } = await params;

  const sphere = await prisma.lifeSphere.findUnique({
    where: { id: sphereId },
    select: {
      iconImage: { select: { data: true, mimeType: true } },
    },
  });

  if (!sphere) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (sphere.iconImage?.data && sphere.iconImage.mimeType) {
    return new NextResponse(new Uint8Array(sphere.iconImage.data), {
      headers: {
        "Content-Type": sphere.iconImage.mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const fallback = await readDefaultAsset("default-sphere-icon.svg");
  return new NextResponse(new Uint8Array(fallback.data), {
    headers: {
      "Content-Type": fallback.mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
