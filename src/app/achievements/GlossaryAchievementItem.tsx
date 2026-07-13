"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCurrentGoalFormAction } from "@/actions/goal";
import { AchievementImage } from "@/components/sphere/AchievementImage";
import styles from "../settings/settings.module.css";

type GlossaryAchievementItemProps = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  isUnlocked: boolean;
  isCurrentGoal: boolean;
};

export function GlossaryAchievementItem({
  id,
  title,
  description,
  xpReward,
  isUnlocked,
  isCurrentGoal,
}: GlossaryAchievementItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (isUnlocked) {
    return (
      <li
        className={`${styles["glossary-achievement"]} ${styles["glossary-achievement--unlocked"]}`}
      >
        <AchievementImage
          achievementTemplateId={id}
          title={title}
          description={description}
        />
        <div className={styles["glossary-achievement__info"]}>
          <p className={styles["glossary-achievement__title"]}>{title}</p>
          <p className={styles["glossary-achievement__meta"]}>
            +{xpReward} XP · открыто
          </p>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`${styles["glossary-achievement"]} ${styles["glossary-achievement--locked"]} ${
        isCurrentGoal ? styles["glossary-achievement--goal"] : ""
      } ${pending ? styles["glossary-achievement--pending"] : ""}`}
    >
      <div className={styles["glossary-achievement__icon"]}>
        <AchievementImage
          achievementTemplateId={id}
          title={title}
          description={description}
        />
      </div>
      <form
        action={(formData) => {
          startTransition(async () => {
            await toggleCurrentGoalFormAction(formData);
            router.refresh();
          });
        }}
        className={styles["glossary-achievement__form"]}
      >
        <input type="hidden" name="achievementTemplateId" value={id} />
        <button type="submit" className={styles["glossary-achievement__button"]}>
          <div className={styles["glossary-achievement__info"]}>
            <p className={styles["glossary-achievement__title"]}>{title}</p>
            <p className={styles["glossary-achievement__meta"]}>
              +{xpReward} XP · закрыто
            </p>
          </div>
          <div className={styles["glossary-achievement__action"]}>
            {!isCurrentGoal && (
              <span className={styles["glossary-achievement__action-text"]}>
                Выбрать цель
              </span>
            )}
          </div>
        </button>
      </form>
    </li>
  );
}
