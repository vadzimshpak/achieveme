import { AchievementImage } from "@/components/sphere/AchievementImage";
import styles from "./profile-current-goal.module.css";

type CurrentGoal = {
  achievementTemplateId: string;
  title: string;
  description: string | null;
  xpReward: number;
  sphereId: string;
  sphereName: string;
};

type ProfileCurrentGoalProps = {
  goals: CurrentGoal[];
};

export function ProfileCurrentGoal({ goals }: ProfileCurrentGoalProps) {
  if (goals.length === 0) return null;

  return (
    <section className={styles["profile-current-goal"]}>
      <h2 className={styles["profile-current-goal__title"]}>Текущая цель</h2>
      <div className={styles["profile-current-goal__list"]}>
        {goals.map((goal) => (
          <article key={goal.sphereId} className={styles["profile-current-goal__card"]}>
            <AchievementImage
              achievementTemplateId={goal.achievementTemplateId}
              title={goal.title}
              description={goal.description}
              size={64}
            />
            <div className={styles["profile-current-goal__info"]}>
              <p className={styles["profile-current-goal__sphere"]}>{goal.sphereName}</p>
              <h3 className={styles["profile-current-goal__name"]}>{goal.title}</h3>
              {goal.description && (
                <p className={styles["profile-current-goal__description"]}>{goal.description}</p>
              )}
              <p className={styles["profile-current-goal__meta"]}>+{goal.xpReward} XP за выполнение</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
