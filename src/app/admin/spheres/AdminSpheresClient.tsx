"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSphereAction, toggleSphereFormAction } from "@/actions/sphere-admin";
import styles from "../../settings/settings.module.css";

type Sphere = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function AdminSpheresClient({ spheres }: { spheres: Sphere[] }) {
  const [state, formAction, pending] = useActionState(createSphereAction, {});

  return (
    <main className={styles["page"]}>
      <h1 className={styles["page__title"]}>Управление сферами</h1>
      <nav className={styles["page__nav"]}>
        <Link href="/admin" className={styles["page__nav-link"]}>
          ← Назад
        </Link>
      </nav>

      <form action={formAction} encType="multipart/form-data" className={styles["form-card"]}>
        <h2 className={styles["form-card__title"]}>Создать сферу</h2>
        {state.error && (
          <div className={`${styles["form-message"]} ${styles["form-message--error"]}`}>
            {state.error}
          </div>
        )}
        {state.success && (
          <div className={`${styles["form-message"]} ${styles["form-message--success"]}`}>
            {state.success}
          </div>
        )}
        <div className={styles["form-field"]}>
          <label className={styles["form-field__label"]}>Название</label>
          <input name="name" required className={styles["form-field__input"]} />
        </div>
        <div className={styles["form-field"]}>
          <label className={styles["form-field__label"]}>Описание</label>
          <textarea name="description" className={styles["form-field__textarea"]} />
        </div>
        <div className={styles["form-field"]}>
          <label className={styles["form-field__label"]}>Иконка</label>
          <input
            name="icon"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className={styles["form-field__input"]}
          />
        </div>
        <div className={styles["form-field"]}>
          <label className={styles["form-field__label"]}>Порядок сортировки</label>
          <input name="sortOrder" type="number" defaultValue={0} className={styles["form-field__input"]} />
        </div>
        <button type="submit" className={styles["form-submit"]} disabled={pending}>
          {pending ? "Создание..." : "Создать"}
        </button>
      </form>

      <section className={styles["form-card"]}>
        <h2 className={styles["form-card__title"]}>Все сферы</h2>
        {spheres.map((sphere) => (
          <div key={sphere.id} className={styles["list-item"]}>
            <div>
              <p className={styles["list-item__title"]}>
                {sphere.name} {!sphere.isActive && "(неактивна)"}
              </p>
              <p className={styles["list-item__meta"]}>
                {sphere.description ?? "Без описания"} · порядок: {sphere.sortOrder}
              </p>
            </div>
            <form action={toggleSphereFormAction}>
              <input type="hidden" name="sphereId" value={sphere.id} />
              <input type="hidden" name="isActive" value={String(!sphere.isActive)} />
              <button
                type="submit"
                className={`${styles["btn-small"]} ${sphere.isActive ? styles["btn-small--danger"] : styles["btn-small--success"]}`}
              >
                {sphere.isActive ? "Деактивировать" : "Активировать"}
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
