import { ActivityCard } from "./ActivityCard";
import styles from "./profile-activity.module.css";

type RecentActivityItem = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  unlockedAt: Date;
  sphereId: string;
  sphereName: string;
};

type ProfileActivityProps = {
  recentActivity: RecentActivityItem[];
  recentAchievementsCount: number;
};

export function ProfileActivity({
  recentActivity,
  recentAchievementsCount,
}: ProfileActivityProps) {
  return (
    <section className={styles["profile-activity"]}>
      <div className={styles["profile-activity__header"]}>
        <h2 className={styles["profile-activity__title"]}>Недавняя активность</h2>
        <span className={styles["profile-activity__counter"]}>
          {recentAchievementsCount} ачивок за последние 2 недели
        </span>
      </div>

      {recentActivity.length === 0 ? (
        <p className={styles["profile-activity__empty"]}>
          Пока нет разблокированных достижений
        </p>
      ) : (
        <div className={styles["profile-activity__list"]}>
          {recentActivity.map((item) => (
            <ActivityCard
              key={`${item.id}-${item.unlockedAt.toISOString()}`}
              achievementTemplateId={item.id}
              title={item.title}
              description={item.description}
              sphereId={item.sphereId}
              sphereName={item.sphereName}
              xpReward={item.xpReward}
              unlockedAt={item.unlockedAt}
            />
          ))}
        </div>
      )}
    </section>
  );
}
