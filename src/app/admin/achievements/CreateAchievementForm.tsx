"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { createAchievementTemplateAction } from "@/actions/admin-catalog";
import { ActivityCard } from "@/components/profile/ActivityCard";
import { defaultAchievementIconSrc } from "@/lib/image-urls";
import activityStyles from "@/components/profile/profile-activity.module.css";
import styles from "../../settings/settings.module.css";

type Sphere = {
  id: string;
  name: string;
};

type AchievementProfilePreviewProps = {
  spheres: Sphere[];
  title: string;
  description: string;
  sphereId: string;
  xpReward: number;
  iconPreviewUrl: string | null;
};

function AchievementProfilePreview({
  spheres,
  title,
  description,
  sphereId,
  xpReward,
  iconPreviewUrl,
}: AchievementProfilePreviewProps) {
  const sphereName = spheres.find((sphere) => sphere.id === sphereId)?.name ?? "Сфера";
  const displayTitle = title.trim() || "Название достижения";
  const iconSrc = iconPreviewUrl ?? defaultAchievementIconSrc();

  return (
    <div className={styles["achievement-preview"]}>
      <p className={styles["achievement-preview__label"]}>Предпросмотр в профиле</p>
      <section className={activityStyles["profile-activity"]}>
        <div className={activityStyles["profile-activity__header"]}>
          <h2 className={activityStyles["profile-activity__title"]}>Недавняя активность</h2>
          <span className={activityStyles["profile-activity__counter"]}>Предпросмотр</span>
        </div>
        <div className={activityStyles["profile-activity__list"]}>
          <ActivityCard
            iconSrc={iconSrc}
            title={displayTitle}
            description={description.trim() || null}
            sphereId={sphereId}
            sphereName={sphereName}
            xpReward={xpReward}
            unlockedAt={new Date()}
          />
        </div>
      </section>
    </div>
  );
}

type CreateAchievementFormProps = {
  spheres: Sphere[];
};

export function CreateAchievementForm({ spheres }: CreateAchievementFormProps) {
  const [state, formAction, pending] = useActionState(createAchievementTemplateAction, {});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sphereId, setSphereId] = useState(spheres[0]?.id ?? "");
  const [xpReward, setXpReward] = useState(10);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
    };
  }, [iconPreviewUrl]);

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setIconPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  return (
    <form action={formAction} encType="multipart/form-data" className={styles["form-card"]}>
      <h2 className={styles["form-card__title"]}>Создать достижение</h2>
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
        <label className={styles["form-field__label"]}>Сфера</label>
        <select
          name="sphereId"
          required
          value={sphereId}
          onChange={(event) => setSphereId(event.target.value)}
          className={styles["form-field__select"]}
        >
          {spheres.map((sphere) => (
            <option key={sphere.id} value={sphere.id}>
              {sphere.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles["form-field"]}>
        <label className={styles["form-field__label"]}>Название</label>
        <input
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={styles["form-field__input"]}
        />
      </div>
      <div className={styles["form-field"]}>
        <label className={styles["form-field__label"]}>Описание</label>
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={styles["form-field__textarea"]}
        />
      </div>
      <div className={styles["form-field"]}>
        <label className={styles["form-field__label"]}>XP награда</label>
        <input
          name="xpReward"
          type="number"
          value={xpReward}
          min={1}
          step={1}
          onChange={(event) => setXpReward(Math.max(1, Number(event.target.value) || 1))}
          className={styles["form-field__input"]}
        />
      </div>
      <div className={styles["form-field"]}>
        <label className={styles["form-field__label"]}>Иконка</label>
        <input
          name="icon"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          onChange={handleIconChange}
          className={styles["form-field__input"]}
        />
      </div>

      {sphereId && (
        <AchievementProfilePreview
          spheres={spheres}
          title={title}
          description={description}
          sphereId={sphereId}
          xpReward={xpReward}
          iconPreviewUrl={iconPreviewUrl}
        />
      )}

      <button type="submit" className={styles["form-submit"]} disabled={pending}>
        {pending ? "Создание..." : "Создать"}
      </button>
    </form>
  );
}
