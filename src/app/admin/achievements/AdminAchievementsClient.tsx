"use client";

import Link from "next/link";
import {
  toggleAchievementTemplateFormAction,
  deleteAchievementTemplateFormAction,
} from "@/actions/admin-catalog";
import { CreateAchievementForm } from "./CreateAchievementForm";
import styles from "../../settings/settings.module.css";

type Sphere = {
  id: string;
  name: string;
};

type AchievementTemplate = {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  isActive: boolean;
  sphere: { name: string };
};

export function AdminAchievementsClient({
  spheres,
  achievementTemplates,
}: {
  spheres: Sphere[];
  achievementTemplates: AchievementTemplate[];
}) {
  return (
    <main className={styles["page"]}>
      <h1 className={styles["page__title"]}>Каталог достижений</h1>
      <nav className={styles["page__nav"]}>
        <Link href="/admin" className={styles["page__nav-link"]}>
          ← Назад
        </Link>
      </nav>

      <CreateAchievementForm spheres={spheres} />

      <section className={styles["form-card"]}>
        <h2 className={styles["form-card__title"]}>Все достижения</h2>
        {achievementTemplates.length === 0 ? (
          <p className={styles["form-card__hint"]}>Достижений пока нет</p>
        ) : (
          achievementTemplates.map((item) => (
            <div key={item.id} className={styles["list-item"]}>
              <div>
                <p className={styles["list-item__title"]}>
                  {item.title} {!item.isActive && "(неактивно)"}
                </p>
                <p className={styles["list-item__meta"]}>
                  {item.sphere.name} · +{item.xpReward} XP · {item.description ?? "Без описания"}
                </p>
              </div>
              <div className={styles["list-item__actions"]}>
                <form action={toggleAchievementTemplateFormAction}>
                  <input type="hidden" name="achievementTemplateId" value={item.id} />
                  <input type="hidden" name="isActive" value={String(!item.isActive)} />
                  <button
                    type="submit"
                    className={`${styles["btn-small"]} ${item.isActive ? styles["btn-small--danger"] : styles["btn-small--success"]}`}
                  >
                    {item.isActive ? "Деактивировать" : "Активировать"}
                  </button>
                </form>
                <form action={deleteAchievementTemplateFormAction}>
                  <input type="hidden" name="achievementTemplateId" value={item.id} />
                  <button
                    type="submit"
                    className={`${styles["btn-small"]} ${styles["btn-small--danger"]}`}
                  >
                    Удалить
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
