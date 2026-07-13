import styles from "./level-badge.module.css";

type LevelBadgeProps = {
  level: number;
  compact?: boolean;
};

export function LevelBadge({ level, compact = false }: LevelBadgeProps) {
  const isHigh = level >= 20;
  const className = [
    styles["level-badge"],
    isHigh ? styles["level-badge--high"] : "",
    compact ? styles["level-badge--compact"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {!compact && <span className={styles["level-badge__label"]}>Уровень</span>}
      <div className={styles["level-badge__ring"]}>
        <span className={styles["level-badge__number"]}>{level}</span>
      </div>
    </div>
  );
}
