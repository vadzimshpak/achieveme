import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "../settings/settings.module.css";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const [spheresCount, pendingAchievements, usersCount, achievementsCount] = await Promise.all([
    prisma.lifeSphere.count(),
    prisma.post.count({
      where: { type: "APPROVAL_REQUEST", moderationStatus: "PENDING" },
    }),
    prisma.user.count(),
    prisma.achievementTemplate.count(),
  ]);

  return (
    <main className={styles["page"]}>
      <h1 className={styles["page__title"]}>Админ-панель</h1>

      <div className={styles["admin-stats"]}>
        <div className={styles["admin-stat"]}>
          <div className={styles["admin-stat__value"]}>{usersCount}</div>
          <div className={styles["admin-stat__label"]}>Пользователей</div>
        </div>
        <div className={styles["admin-stat"]}>
          <div className={styles["admin-stat__value"]}>{spheresCount}</div>
          <div className={styles["admin-stat__label"]}>Сфер</div>
        </div>
        <div className={styles["admin-stat"]}>
          <div className={styles["admin-stat__value"]}>{achievementsCount}</div>
          <div className={styles["admin-stat__label"]}>Достижений</div>
        </div>
        <div className={styles["admin-stat"]}>
          <div className={styles["admin-stat__value"]}>{pendingAchievements}</div>
          <div className={styles["admin-stat__label"]}>Заявки на ачивки</div>
        </div>
      </div>

      <nav className={styles["page__nav"]}>
        <Link href="/admin/spheres" className={styles["page__nav-link"]}>
          Управление сферами
        </Link>
        <Link href="/admin/achievements" className={styles["page__nav-link"]}>
          Каталог достижений
        </Link>
        <Link href="/admin/achievement-moderation" className={styles["page__nav-link"]}>
          Модерация ачивок
        </Link>
      </nav>
    </main>
  );
}
