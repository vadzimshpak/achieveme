import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readDefaultAsset } from "@/lib/images";

type RouteParams = { params: Promise<{ templateId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { templateId } = await params;

  const template = await prisma.achievementTemplate.findUnique({
    where: { id: templateId },
    select: {
      iconImage: { select: { data: true, mimeType: true } },
    },
  });

  if (!template) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (template.iconImage?.data && template.iconImage.mimeType) {
    return new NextResponse(new Uint8Array(template.iconImage.data), {
      headers: {
        "Content-Type": template.iconImage.mimeType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const fallback = await readDefaultAsset("default-achievement-icon.svg");
  return new NextResponse(new Uint8Array(fallback.data), {
    headers: {
      "Content-Type": fallback.mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
