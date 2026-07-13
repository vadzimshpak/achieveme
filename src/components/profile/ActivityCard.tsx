import Image from "next/image";
import { sphereIconSrc } from "@/lib/image-urls";
import { AchievementImage } from "@/components/sphere/AchievementImage";
import { formatRelativeDate } from "@/lib/utils";
import styles from "./activity-card.module.css";

type ActivityCardProps = {
  achievementTemplateId?: string;
  iconSrc?: string;
  title: string;
  description?: string | null;
  sphereId: string;
  sphereName: string;
  xpReward: number;
  unlockedAt: Date;
};

export function ActivityCard({
  achievementTemplateId,
  iconSrc,
  title,
  description,
  sphereId,
  sphereName,
  xpReward,
  unlockedAt,
}: ActivityCardProps) {
  return (
    <article className={styles["activity-card"]}>
      <div className={styles["activity-card__thumb"]}>
        <Image
          src={sphereIconSrc(sphereId)}
          alt={sphereName}
          width={184}
          height={69}
          className={styles["activity-card__thumb-img"]}
        />
      </div>

      <div className={styles["activity-card__body"]}>
        <div className={styles["activity-card__achievement"]}>
          <h3 className={styles["activity-card__title"]}>{title}</h3>
          <p className={styles["activity-card__meta"]}>
            {sphereName} · +{xpReward} XP
          </p>
        </div>
        <p className={styles["activity-card__date"]}>
          Разблокировано: {formatRelativeDate(unlockedAt)}
        </p>
      </div>

      <AchievementImage
        achievementTemplateId={achievementTemplateId}
        iconSrc={iconSrc}
        title={title}
        description={description}
        size={48}
      />
    </article>
  );
}
