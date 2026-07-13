import styles from "./xp-bar.module.css";

type XpProgressBarProps = {
  current: number;
  needed: number;
  total: number;
  percent: number;
  wide?: boolean;
};

export function XpProgressBar({ current, needed, total, percent, wide }: XpProgressBarProps) {
  const className = [styles["xp-bar"], wide ? styles["xp-bar--wide"] : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className={styles["xp-bar__track"]}>
        <div
          className={styles["xp-bar__fill"]}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={styles["xp-bar__label"]}>
        {current} / {needed} XP ({total} всего)
      </span>
    </div>
  );
}
