import { prisma } from "@/lib/prisma";
import type { PostReactions } from "@/lib/post-reactions";

export type PostCommentItem = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    nickname: string;
  };
  reactions: PostReactions;
};

function buildReactions(
  votes: Array<{ value: "LIKE" | "DISLIKE"; userId: string }>,
  viewerUserId: string | null,
): PostReactions {
  let likes = 0;
  let dislikes = 0;
  let userVote: PostReactions["userVote"] = null;

  for (const vote of votes) {
    if (vote.value === "LIKE") likes += 1;
    else dislikes += 1;

    if (viewerUserId && vote.userId === viewerUserId) {
      userVote = vote.value;
    }
  }

  return { likes, dislikes, userVote };
}

export async function getPostComments(
  postId: string,
  viewerUserId: string | null,
): Promise<PostCommentItem[]> {
  const comments = await prisma.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          nickname: true,
        },
      },
      votes: {
        select: {
          value: true,
          userId: true,
        },
      },
    },
  });

  return comments.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    author: comment.author,
    reactions: buildReactions(comment.votes, viewerUserId),
  }));
}
