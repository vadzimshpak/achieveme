import { prisma } from "@/lib/prisma";
import { meetsModerationThreshold } from "@/lib/post-reactions";
import type { ApprovalModerationStatus } from "@/generated/prisma/client";

export async function tryQueuePostForModeration(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      type: true,
      moderationStatus: true,
      votes: { select: { value: true } },
    },
  });

  if (!post || post.type !== "APPROVAL_REQUEST") return;
  if (post.moderationStatus !== "NONE") return;

  let likes = 0;
  let dislikes = 0;
  for (const vote of post.votes) {
    if (vote.value === "LIKE") likes += 1;
    else dislikes += 1;
  }

  if (!meetsModerationThreshold(likes, dislikes)) return;

  await prisma.post.update({
    where: { id: postId },
    data: { moderationStatus: "PENDING" },
  });
}

export type ModerationQueueItem = {
  id: string;
  title: string;
  body: unknown;
  createdAt: Date;
  likes: number;
  dislikes: number;
  score: number;
  author: { id: string; nickname: string };
  achievement: {
    id: string;
    title: string;
    description: string | null;
    xpReward: number;
    sphereName: string;
  };
};

export async function getPendingAchievementModeration(): Promise<ModerationQueueItem[]> {
  const posts = await prisma.post.findMany({
    where: {
      type: "APPROVAL_REQUEST",
      moderationStatus: "PENDING",
      achievementTemplateId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, nickname: true } },
      achievementTemplate: {
        include: { sphere: { select: { name: true } } },
      },
      votes: { select: { value: true } },
    },
  });

  return posts.map((post) => {
    let likes = 0;
    let dislikes = 0;
    for (const vote of post.votes) {
      if (vote.value === "LIKE") likes += 1;
      else dislikes += 1;
    }
    const total = likes + dislikes;
    const score = total === 0 ? 0 : Math.round(((likes - dislikes) / total) * 100);

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      likes,
      dislikes,
      score,
      author: post.author,
      achievement: {
        id: post.achievementTemplate!.id,
        title: post.achievementTemplate!.title,
        description: post.achievementTemplate!.description,
        xpReward: post.achievementTemplate!.xpReward,
        sphereName: post.achievementTemplate!.sphere.name,
      },
    };
  });
}

export function canVoteOnApprovalRequest({
  isAdmin,
  hasAchievement,
  moderationStatus,
}: {
  isAdmin: boolean;
  hasAchievement: boolean;
  moderationStatus: ApprovalModerationStatus;
}): { allowed: boolean; reason: string | null } {
  if (moderationStatus === "APPROVED") {
    return { allowed: false, reason: "Заявка уже одобрена" };
  }
  if (moderationStatus === "REJECTED") {
    return { allowed: false, reason: "Заявка отклонена" };
  }
  if (isAdmin || hasAchievement) {
    return { allowed: true, reason: null };
  }
  return {
    allowed: false,
    reason: "Голосовать могут только обладатели этого достижения или администраторы",
  };
}
