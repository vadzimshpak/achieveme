import type { PostVoteValue } from "@/generated/prisma/client";

export type PostReactions = {
  likes: number;
  dislikes: number;
  userVote: PostVoteValue | null;
};

/** От -100 (все дизлайки) до +100 (все лайки). */
export function getReactionScore(likes: number, dislikes: number): number {
  const total = likes + dislikes;
  if (total === 0) return 0;
  return Math.round(((likes - dislikes) / total) * 100);
}

export const MODERATION_MIN_LIKES = 10;
export const MODERATION_MIN_SCORE = 70;

export function meetsModerationThreshold(likes: number, dislikes: number): boolean {
  return likes > MODERATION_MIN_LIKES && getReactionScore(likes, dislikes) > MODERATION_MIN_SCORE;
}

export function formatReactionScore(score: number): string {
  if (score > 0) return `+${score}%`;
  return `${score}%`;
}

export function getReactionBarFill(score: number): {
  likeWidth: number;
  likeLeft: number;
  dislikeWidth: number;
  dislikeLeft: number;
} {
  if (score >= 0) {
    const likeWidth = (score / 100) * 50;
    return {
      likeWidth,
      likeLeft: 50 - likeWidth,
      dislikeWidth: 0,
      dislikeLeft: 50,
    };
  }

  const dislikeWidth = (-score / 100) * 50;
  return {
    likeWidth: 0,
    likeLeft: 50,
    dislikeWidth,
    dislikeLeft: 50,
  };
}
