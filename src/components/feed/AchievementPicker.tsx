"use client";

import { useMemo, useState } from "react";
import { AchievementImage } from "@/components/sphere/AchievementImage";
import type { FeedFilterSphere } from "@/lib/posts";
import styles from "./feed.module.css";

type CurrentGoalOption = {
  achievementTemplateId: string;
  title: string;
  sphereId: string;
  sphereName: string;
};

type AchievementPickerProps = {
  spheres: FeedFilterSphere[];
  currentGoals: CurrentGoalOption[];
  selectedId: string;
  onSelect: (achievementId: string) => void;
};

export function AchievementPicker({
  spheres,
  currentGoals,
  selectedId,
  onSelect,
}: AchievementPickerProps) {
  const [query, setQuery] = useState("");

  const filteredSpheres = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return spheres;

    return spheres
      .map((sphere) => ({
        ...sphere,
        achievements: sphere.achievements.filter(
          (achievement) =>
            achievement.title.toLowerCase().includes(normalized) ||
            sphere.name.toLowerCase().includes(normalized),
        ),
      }))
      .filter((sphere) => sphere.achievements.length > 0);
  }, [query, spheres]);

  return (
    <div className={styles["achievement-picker"]}>
      {currentGoals.length > 0 && (
        <div className={styles["achievement-picker__quick"]}>
          <p className={styles["achievement-picker__label"]}>Текущие цели</p>
          <div className={styles["achievement-picker__quick-list"]}>
            {currentGoals.map((goal) => (
              <button
                key={goal.achievementTemplateId}
                type="button"
                className={`${styles["achievement-picker__quick-item"]} ${
                  selectedId === goal.achievementTemplateId
                    ? styles["achievement-picker__quick-item--active"]
                    : ""
                }`}
                onClick={() => onSelect(goal.achievementTemplateId)}
              >
                <AchievementImage
                  achievementTemplateId={goal.achievementTemplateId}
                  title={goal.title}
                  size={32}
                  interactive={false}
                />
                <span>
                  {goal.title}
                  <span className={styles["achievement-picker__quick-meta"]}>
                    {goal.sphereName}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles["achievement-picker__search"]}>
        <label className={styles["achievement-picker__label"]} htmlFor="achievement-search">
          Поиск достижения
        </label>
        <input
          id="achievement-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Сфера или достижение..."
          className={styles["achievement-picker__input"]}
        />
      </div>

      <div className={styles["achievement-picker__list"]}>
        {filteredSpheres.length === 0 ? (
          <p className={styles["achievement-picker__empty"]}>Ничего не найдено</p>
        ) : (
          filteredSpheres.map((sphere) => (
            <details key={sphere.id} className={styles["achievement-picker__sphere"]} open>
              <summary className={styles["achievement-picker__sphere-summary"]}>
                {sphere.name}
              </summary>
              <ul className={styles["achievement-picker__achievements"]}>
                {sphere.achievements.map((achievement) => (
                  <li key={achievement.id}>
                    <button
                      type="button"
                      className={`${styles["achievement-picker__achievement"]} ${
                        selectedId === achievement.id
                          ? styles["achievement-picker__achievement--active"]
                          : ""
                      }`}
                      onClick={() => onSelect(achievement.id)}
                    >
                      <AchievementImage
                        achievementTemplateId={achievement.id}
                        title={achievement.title}
                        interactive={false}
                      />
                      <span>{achievement.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
