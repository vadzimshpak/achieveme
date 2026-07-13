"use client";

import Image from "next/image";
import { AchievementImage } from "@/components/sphere/AchievementImage";
import { sphereIconSrc } from "@/lib/image-urls";
import { GlossaryAchievementItem } from "./GlossaryAchievementItem";
import styles from "../settings/settings.module.css";

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  sphere: { name: string };
};

type SphereAchievement = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  isUnlocked: boolean;
  isCurrentGoal: boolean;
};

type SphereItem = {
  id: string;
  name: string;
  description: string | null;
  totalAchievements: number;
  unlockedAchievements: number;
  achievements: SphereAchievement[];
};

type SpheresManagerProps = {
  achievements: Achievement[];
  spheres: SphereItem[];
};

export function SpheresManager({ achievements, spheres }: SpheresManagerProps) {
  return (
    <>
      <section className={styles["form-card"]}>
        <h2 className={styles["form-card__title"]}>Мои достижения</h2>
        {achievements.length === 0 ? (
          <p className={styles["form-card__hint"]}>Достижений пока нет</p>
        ) : (
          achievements.map((ach) => (
            <div key={ach.id} className={`${styles["list-item"]} ${styles["list-item--with-icon"]}`}>
              <AchievementImage
                achievementTemplateId={ach.id}
                title={ach.title}
                description={ach.description}
                size={48}
              />
              <div className={styles["list-item__content"]}>
                <p className={styles["list-item__title"]}>{ach.title}</p>
                <p className={styles["list-item__meta"]}>
                  {ach.sphere.name} · +{ach.xpReward} XP
                </p>
              </div>
            </div>
          ))
        )}
      </section>

      <section className={styles["form-card"]}>
        <h2 className={styles["form-card__title"]}>Глоссарий</h2>
        {spheres.length === 0 ? (
          <p className={styles["form-card__hint"]}>Сферы пока не добавлены администратором</p>
        ) : (
          <div className={styles["sphere-accordion"]}>
            {spheres.map((sphere) => (
              <details key={sphere.id} className={styles["sphere-accordion__item"]}>
                <summary className={styles["sphere-accordion__summary"]}>
                  <Image
                    src={sphereIconSrc(sphere.id)}
                    alt={sphere.name}
                    width={96}
                    height={36}
                    className={styles["sphere-accordion__cover"]}
                  />
                  <div className={styles["sphere-accordion__info"]}>
                    <p className={styles["sphere-accordion__name"]}>{sphere.name}</p>
                    <p className={styles["sphere-accordion__progress"]}>
                      {sphere.unlockedAchievements} из {sphere.totalAchievements} достижений
                      открыто
                    </p>
                  </div>
                  <span className={styles["sphere-accordion__arrow"]} aria-hidden="true" />
                </summary>
                <div className={styles["sphere-accordion__body"]}>
                  {sphere.description && (
                    <p className={styles["sphere-accordion__description"]}>{sphere.description}</p>
                  )}
                  {sphere.achievements.length === 0 ? (
                    <p className={styles["form-card__hint"]}>В этой сфере пока нет достижений</p>
                  ) : (
                    <ul className={styles["sphere-accordion__achievements"]}>
                      {sphere.achievements.map((item) => (
                        <GlossaryAchievementItem
                          key={item.id}
                          id={item.id}
                          title={item.title}
                          description={item.description}
                          xpReward={item.xpReward}
                          isUnlocked={item.isUnlocked}
                          isCurrentGoal={item.isCurrentGoal}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
