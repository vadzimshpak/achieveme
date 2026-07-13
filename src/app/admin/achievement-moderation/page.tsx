import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  approveAchievementRequestFormAction,
  rejectAchievementRequestFormAction,
} from "@/actions/achievement-moderation";
import { getPendingAchievementModeration } from "@/lib/achievement-moderation";
import { extractPlainTextFromPostBody } from "@/lib/post-body";
import { formatDate } from "@/lib/utils";
import styles from "../../settings/settings.module.css";

export default async function AdminAchievementModerationPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const [requests, pendingCount] = await Promise.all([
    getPendingAchievementModeration(),
    prisma.post.count({
      where: { type: "APPROVAL_REQUEST", moderationStatus: "PENDING" },
    }),
  ]);

  return (
    <main className={styles["page"]}>
      <h1 className={styles["page__title"]}>Модерация ачивок</h1>
      <p className={styles["page__subtitle"]}>
        Заявки с более чем 10 лайками и оценкой выше +70%
      </p>

      <nav className={styles["page__nav"]}>
        <Link href="/admin" className={styles["page__nav-link"]}>
          ← Назад
        </Link>
        <span className={styles["page__nav-meta"]}>На рассмотрении: {pendingCount}</span>
      </nav>

      {requests.length === 0 ? (
        <p className={styles["page__empty"]}>Нет заявок на модерации</p>
      ) : (
        requests.map((request) => (
          <article key={request.id} className={styles["moderation-card"]}>
            <header className={styles["moderation-card__header"]}>
              <div>
                <h2 className={styles["moderation-card__title"]}>{request.title}</h2>
                <p className={styles["moderation-card__meta"]}>
                  {request.author.nickname} · {formatDate(request.createdAt)}
                </p>
              </div>
              <div className={styles["moderation-card__stats"]}>
                <span className={styles["moderation-card__stat-like"]}>▲ {request.likes}</span>
                <span className={styles["moderation-card__stat-score"]}>+{request.score}%</span>
                <span className={styles["moderation-card__stat-dislike"]}>▼ {request.dislikes}</span>
              </div>
            </header>

            <div className={styles["moderation-card__achievement"]}>
              <p className={styles["moderation-card__achievement-title"]}>
                {request.achievement.title}
              </p>
              <p className={styles["moderation-card__achievement-meta"]}>
                {request.achievement.sphereName} · +{request.achievement.xpReward} XP
              </p>
              {request.achievement.description && (
                <p className={styles["moderation-card__achievement-desc"]}>
                  {request.achievement.description}
                </p>
              )}
            </div>

            <p className={styles["moderation-card__body"]}>
              {extractPlainTextFromPostBody(request.body) || "Без текста"}
            </p>

            <div className={styles["moderation-card__actions"]}>
              <form action={approveAchievementRequestFormAction}>
                <input type="hidden" name="postId" value={request.id} />
                <button
                  type="submit"
                  className={`${styles["btn-small"]} ${styles["btn-small--success"]}`}
                >
                  Одобрить
                </button>
              </form>

              <form action={rejectAchievementRequestFormAction} className={styles["moderation-card__reject-form"]}>
                <input type="hidden" name="postId" value={request.id} />
                <input
                  type="text"
                  name="note"
                  required
                  maxLength={500}
                  placeholder="Причина отклонения"
                  className={styles["moderation-card__reject-input"]}
                />
                <button
                  type="submit"
                  className={`${styles["btn-small"]} ${styles["btn-small--danger"]}`}
                >
                  Отклонить
                </button>
              </form>
            </div>
          </article>
        ))
      )}
    </main>
  );
}
