import { NextResponse } from "next/server";
import { readDefaultAsset } from "@/lib/images";

export async function GET() {
  const fallback = await readDefaultAsset("default-achievement-icon.svg");
  return new NextResponse(new Uint8Array(fallback.data), {
    headers: {
      "Content-Type": fallback.mimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
