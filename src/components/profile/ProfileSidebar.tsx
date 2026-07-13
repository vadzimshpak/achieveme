import { AchievementIcon } from "@/components/sphere/AchievementIcon";
import type { FriendListItem } from "@/lib/friendship";
import { ProfileFriendsList } from "./ProfileFriendsList";
import { formatRelativeDate } from "@/lib/utils";
import styles from "./profile-sidebar.module.css";

type ProfileSidebarProps = {
  stats: {
    achievements: number;
    comments: number;
  };
  lastActivity: Date | null;
  topAchievements: { id: string; title: string; description: string | null }[];
  friends: FriendListItem[];
  isOwner: boolean;
};

export function ProfileSidebar({
  stats,
  lastActivity,
  topAchievements,
  friends,
  isOwner,
}: ProfileSidebarProps) {
  return (
    <aside className={styles["profile-sidebar"]}>
      <div className={styles["profile-sidebar__section"]}>
        <p className={styles["profile-sidebar__status"]}>
          <span className={styles["profile-sidebar__status-offline"]}>Не в сети</span>
        </p>
        {lastActivity && (
          <p className={styles["profile-sidebar__status-date"]}>
            Последняя активность: {formatRelativeDate(lastActivity)}
          </p>
        )}
      </div>

      <div className={styles["profile-sidebar__section"]}>
        <h3 className={styles["profile-sidebar__title"]}>Статистика</h3>
        <a href="#achievements" className={styles["sidebar-link"]}>
          <span>Достижения</span>
          <span className={styles["sidebar-link__count"]}>{stats.achievements}</span>
        </a>
        <a href="#comments" className={styles["sidebar-link"]}>
          <span>Комментарии</span>
          <span className={styles["sidebar-link__count"]}>{stats.comments}</span>
        </a>
      </div>

      <div className={styles["profile-sidebar__section"]} id="achievements">
        <h3 className={styles["profile-sidebar__title"]}>Последние ачивки</h3>
        {topAchievements.length === 0 ? (
          <p className={styles["profile-sidebar__badges-empty"]}>Пока нет ачивок</p>
        ) : (
          <div className={styles["profile-sidebar__badges"]}>
            {topAchievements.slice(0, 4).map((a) => (
              <AchievementIcon
                key={a.id}
                achievementTemplateId={a.id}
                title={a.title}
                description={a.description}
                large
              />
            ))}
          </div>
        )}
      </div>

      {isOwner ? (
        <ProfileFriendsList friends={friends} />
      ) : (
        <div className={styles["profile-sidebar__section"]}>
          <h3 className={styles["profile-sidebar__title"]}>Друзья</h3>
          <p className={styles["profile-sidebar__friends-empty"]}>Список друзей скрыт</p>
        </div>
      )}
    </aside>
  );
}
