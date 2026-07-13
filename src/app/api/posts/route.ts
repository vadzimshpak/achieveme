import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFeedPosts, type FeedTypeFilter } from "@/lib/posts";

function parseTypeFilter(value: string | null): FeedTypeFilter {
  if (value === "progress" || value === "approval" || value === "proposal") return value;
  return "all";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") ?? 10);
  const type = parseTypeFilter(searchParams.get("type"));
  const achievementId = searchParams.get("achievementId");

  const session = await auth();

  const feed = await getFeedPosts({
    cursor,
    limit: Number.isFinite(limit) ? limit : 10,
    type,
    achievementId,
    viewerUserId: session?.user?.id ?? null,
  });

  return NextResponse.json(feed);
}
