import { prisma } from "@/lib/prisma";
import type { ApprovalModerationStatus, PostType, PostVoteValue } from "@/generated/prisma/client";
import { canVoteOnApprovalRequest } from "@/lib/achievement-moderation";
import { clearStaleCurrentGoals } from "@/lib/goals";
import type { PostReactions } from "@/lib/post-reactions";

export type FeedTypeFilter = "all" | "progress" | "approval" | "proposal";

export type FeedPostItem = {
  id: string;
  title: string;
  body: unknown;
  type: PostType;
  createdAt: Date;
  author: { id: string; nickname: string };
  achievement: {
    id: string;
    title: string;
    sphereId: string;
    sphereName: string;
  } | null;
  reactions: PostReactions;
  canVote: boolean;
  voteDisabledReason: string | null;
  moderationStatus: ApprovalModerationStatus;
  moderationNote: string | null;
};

export type FeedFilterSphere = {
  id: string;
  name: string;
  achievements: { id: string; title: string }[];
};

function buildTypeFilter(type: FeedTypeFilter) {
  if (type === "progress") return { type: "PROGRESS" as PostType };
  if (type === "approval") return { type: "APPROVAL_REQUEST" as PostType };
  if (type === "proposal") return { type: "ACHIEVEMENT_PROPOSAL" as PostType };
  return {};
}

export async function getFeedPosts({
  limit = 10,
  cursor,
  type = "all",
  achievementId,
  viewerUserId,
}: {
  limit?: number;
  cursor?: string | null;
  type?: FeedTypeFilter;
  achievementId?: string | null;
  viewerUserId?: string | null;
}) {
  const take = Math.min(Math.max(limit, 1), 20);

  let viewerIsAdmin = false;
  let viewerUnlockedAchievementIds = new Set<string>();

  if (viewerUserId) {
    const viewer = await prisma.user.findUnique({
      where: { id: viewerUserId },
      select: {
        role: true,
        userAchievements: { select: { achievementTemplateId: true } },
      },
    });

    viewerIsAdmin = viewer?.role === "ADMIN";
    viewerUnlockedAchievementIds = new Set(
      viewer?.userAchievements.map((item) => item.achievementTemplateId) ?? [],
    );
  }

  const posts = await prisma.post.findMany({
    where: {
      ...buildTypeFilter(type),
      ...(achievementId ? { achievementTemplateId: achievementId } : {}),
    },
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      author: { select: { id: true, nickname: true } },
      achievementTemplate: {
        include: { sphere: { select: { id: true, name: true } } },
      },
      votes: { select: { value: true, userId: true } },
    },
  });

  const hasMore = posts.length > take;
  const slice = hasMore ? posts.slice(0, take) : posts;

  const items: FeedPostItem[] = slice.map((post) => {
    let likes = 0;
    let dislikes = 0;
    let userVote: PostVoteValue | null = null;

    for (const vote of post.votes) {
      if (vote.value === "LIKE") likes += 1;
      else dislikes += 1;
      if (viewerUserId && vote.userId === viewerUserId) {
        userVote = vote.value;
      }
    }

    let canVote = !!viewerUserId;
    let voteDisabledReason: string | null = null;

    if (!viewerUserId) {
      canVote = false;
      voteDisabledReason = "Необходимо войти в аккаунт";
    } else if (post.type === "APPROVAL_REQUEST" && post.achievementTemplateId) {
      const voteAccess = canVoteOnApprovalRequest({
        isAdmin: viewerIsAdmin,
        hasAchievement: viewerUnlockedAchievementIds.has(post.achievementTemplateId),
        moderationStatus: post.moderationStatus,
      });
      canVote = voteAccess.allowed;
      voteDisabledReason = voteAccess.reason;
    }

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      type: post.type,
      createdAt: post.createdAt,
      author: post.author,
      achievement: post.achievementTemplate
        ? {
            id: post.achievementTemplate.id,
            title: post.achievementTemplate.title,
            sphereId: post.achievementTemplate.sphere.id,
            sphereName: post.achievementTemplate.sphere.name,
          }
        : null,
      reactions: { likes, dislikes, userVote },
      canVote,
      voteDisabledReason,
      moderationStatus: post.moderationStatus,
      moderationNote: post.moderationNote,
    };
  });

  return {
    posts: items,
    nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null,
  };
}

export async function getFeedFilterData(): Promise<FeedFilterSphere[]> {
  const spheres = await prisma.lifeSphere.findMany({
    where: { isActive: true },
    include: {
      achievementTemplates: {
        where: { isActive: true },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return spheres
    .filter((sphere) => sphere.achievementTemplates.length > 0)
    .map((sphere) => ({
      id: sphere.id,
      name: sphere.name,
      achievements: sphere.achievementTemplates,
    }));
}

export async function getUserCurrentGoalsForFeed(userId: string) {
  await clearStaleCurrentGoals(userId);

  const goals = await prisma.userCurrentGoal.findMany({
    where: { userId },
    include: {
      achievementTemplate: {
        include: { sphere: { select: { id: true, name: true } } },
      },
    },
  });

  return goals.map((goal) => ({
    achievementTemplateId: goal.achievementTemplateId,
    title: goal.achievementTemplate.title,
    sphereId: goal.sphereId,
    sphereName: goal.achievementTemplate.sphere.name,
  }));
}
