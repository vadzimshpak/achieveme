import styles from "./profile-summary.module.css";

type ProfileSummaryProps = {
  bio: string | null;
};

export function ProfileSummary({ bio }: ProfileSummaryProps) {
  return (
    <section className={styles["profile-summary"]}>
      <h2 className={styles["profile-summary__title"]}>О себе</h2>
      <div className={styles["profile-summary__text"]}>
        {bio ? (
          bio
        ) : (
          <span className={styles["profile-summary__placeholder"]}>
            Пользователь ещё ничего не написал
          </span>
        )}
      </div>
    </section>
  );
}
