import { Suspense } from "react";
import { auth } from "@/lib/auth";
import {
  getFeedFilterData,
  getFeedPosts,
  getUserCurrentGoalsForFeed,
  type FeedTypeFilter,
} from "@/lib/posts";
import { FeedPage } from "@/components/feed/FeedPage";
import { getHCaptchaSiteKey } from "@/lib/hcaptcha";
import styles from "@/components/feed/feed.module.css";

function parseTypeFilter(value: string | undefined): FeedTypeFilter {
  if (value === "progress" || value === "approval" || value === "proposal") return value;
  return "all";
}

type HomePageProps = {
  searchParams: Promise<{ type?: string; achievementId?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const typeFilter = parseTypeFilter(params.type);
  const achievementId = params.achievementId ?? null;

  const session = await auth();

  const [feed, spheres, currentGoals] = await Promise.all([
    getFeedPosts({
      limit: 10,
      type: typeFilter,
      achievementId,
      viewerUserId: session?.user?.id ?? null,
    }),
    getFeedFilterData(),
    session?.user?.id ? getUserCurrentGoalsForFeed(session.user.id) : Promise.resolve([]),
  ]);

  const hcaptchaSiteKey = getHCaptchaSiteKey();

  return (
    <Suspense fallback={<div className={styles["feed-page__loading"]}>Загрузка ленты...</div>}>
      <FeedPage
        initialPosts={feed.posts}
        initialNextCursor={feed.nextCursor}
        spheres={spheres}
        currentGoals={currentGoals}
        isLoggedIn={!!session?.user?.id}
        isAdmin={session?.user?.role === "ADMIN"}
        currentUserId={session?.user?.id}
        typeFilter={typeFilter}
        achievementId={achievementId}
        hcaptchaSiteKey={hcaptchaSiteKey}
      />
    </Suspense>
  );
}
