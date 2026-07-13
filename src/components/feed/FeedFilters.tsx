"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FeedFilterSphere, FeedTypeFilter } from "@/lib/posts";
import styles from "./feed.module.css";

type FeedFiltersProps = {
  spheres: FeedFilterSphere[];
  typeFilter: FeedTypeFilter;
  achievementId: string | null;
};

export function FeedFilters({ spheres, typeFilter, achievementId }: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (next: { type?: FeedTypeFilter; achievementId?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (next.type !== undefined) {
      if (next.type === "all") params.delete("type");
      else params.set("type", next.type);
    }

    if (next.achievementId !== undefined) {
      if (next.achievementId) params.set("achievementId", next.achievementId);
      else params.delete("achievementId");
    }

    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <aside className={styles["feed-filters"]}>
      <section className={styles["feed-filters__section"]}>
        <h2 className={styles["feed-filters__title"]}>Тип постов</h2>
        <div className={styles["feed-filters__type-list"]}>
          <button
            type="button"
            className={`${styles["feed-filters__type-btn"]} ${
              typeFilter === "progress" ? styles["feed-filters__type-btn--active"] : ""
            }`}
            onClick={() => updateFilters({ type: "progress" })}
          >
            Прогресс
          </button>
          <button
            type="button"
            className={`${styles["feed-filters__type-btn"]} ${
              typeFilter === "approval" ? styles["feed-filters__type-btn--active"] : ""
            }`}
            onClick={() => updateFilters({ type: "approval" })}
          >
            Заявки на ачивку
          </button>
          <button
            type="button"
            className={`${styles["feed-filters__type-btn"]} ${
              typeFilter === "proposal" ? styles["feed-filters__type-btn--active"] : ""
            }`}
            onClick={() => updateFilters({ type: "proposal" })}
          >
            Предложения ачивок
          </button>
          <button
            type="button"
            className={`${styles["feed-filters__type-btn"]} ${
              typeFilter === "all" ? styles["feed-filters__type-btn--active"] : ""
            }`}
            onClick={() => updateFilters({ type: "all" })}
          >
            Все посты
          </button>
        </div>
      </section>

      <section className={styles["feed-filters__section"]}>
        <div className={styles["feed-filters__section-header"]}>
          <h2 className={styles["feed-filters__title"]}>Достижения</h2>
          {achievementId && (
            <button
              type="button"
              className={styles["feed-filters__reset"]}
              onClick={() => updateFilters({ achievementId: null })}
            >
              Сбросить
            </button>
          )}
        </div>

        <div className={styles["feed-filters__spheres"]}>
          {spheres.length === 0 ? (
            <p className={styles["feed-filters__empty"]}>Достижений пока нет</p>
          ) : (
            spheres.map((sphere) => (
              <details key={sphere.id} className={styles["feed-filters__sphere"]}>
                <summary className={styles["feed-filters__sphere-summary"]}>{sphere.name}</summary>
                <ul className={styles["feed-filters__achievements"]}>
                  {sphere.achievements.map((achievement) => (
                    <li key={achievement.id}>
                      <button
                        type="button"
                        className={`${styles["feed-filters__achievement"]} ${
                          achievementId === achievement.id
                            ? styles["feed-filters__achievement--active"]
                            : ""
                        }`}
                        onClick={() => updateFilters({ achievementId: achievement.id })}
                      >
                        {achievement.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
