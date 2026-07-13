import { Suspense } from "react";
import Link from "next/link";
import type { FeedFilterSphere, FeedPostItem, FeedTypeFilter } from "@/lib/posts";
import { CreatePostSection } from "./CreatePostSection";
import { FeedFilters } from "./FeedFilters";
import { PostFeed } from "./PostFeed";
import styles from "./feed.module.css";

type CurrentGoalOption = {
  achievementTemplateId: string;
  title: string;
  sphereId: string;
  sphereName: string;
};

type FeedPageProps = {
  initialPosts: FeedPostItem[];
  initialNextCursor: string | null;
  spheres: FeedFilterSphere[];
  currentGoals: CurrentGoalOption[];
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  typeFilter: FeedTypeFilter;
  achievementId: string | null;
  hcaptchaSiteKey: string;
};

export function FeedPage({
  initialPosts,
  initialNextCursor,
  spheres,
  currentGoals,
  isLoggedIn,
  isAdmin,
  currentUserId,
  typeFilter,
  achievementId,
  hcaptchaSiteKey,
}: FeedPageProps) {
  const defaultAchievementId = currentGoals[0]?.achievementTemplateId;

  return (
    <main className={styles["feed-page"]}>
      <div className={styles["feed-page__inner"]}>
        <div className={styles["feed-page__main"]}>
          {!isLoggedIn && (
            <section className={styles["feed-page__guest"]}>
              <h1 className={styles["feed-page__guest-title"]}>Лента достижений</h1>
              <p className={styles["feed-page__guest-text"]}>
                Следите за прогрессом других пользователей или делитесь своим.
              </p>
              <div className={styles["feed-page__guest-actions"]}>
                <Link href="/register" className={styles["feed-page__guest-btn"]}>
                  Регистрация
                </Link>
                <Link href="/login" className={styles["feed-page__guest-btn-secondary"]}>
                  Войти
                </Link>
              </div>
            </section>
          )}

          {isLoggedIn && (
            <CreatePostSection
              spheres={spheres}
              currentGoals={currentGoals}
              defaultAchievementId={defaultAchievementId}
              hcaptchaSiteKey={hcaptchaSiteKey}
            />
          )}

          <PostFeed
            initialPosts={initialPosts}
            initialNextCursor={initialNextCursor}
            typeFilter={typeFilter}
            achievementId={achievementId}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        </div>

        <Suspense
          fallback={
            <aside className={styles["feed-filters"]}>
              <div className={styles["feed-filters__section"]}>Загрузка фильтров...</div>
            </aside>
          }
        >
          <FeedFilters
            spheres={spheres}
            typeFilter={typeFilter}
            achievementId={achievementId}
          />
        </Suspense>
      </div>
    </main>
  );
}
