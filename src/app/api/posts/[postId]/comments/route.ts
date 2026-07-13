import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPostComments } from "@/lib/post-comments";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { postId } = await context.params;
  const session = await auth();

  const comments = await getPostComments(postId, session?.user?.id ?? null);

  return NextResponse.json({ comments });
}
