"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { updateProfileAction } from "@/actions/profile";
import { bannerPresetSrc, userAvatarSrc } from "@/lib/image-urls";
import styles from "./settings.module.css";

type BannerPreset = {
  id: string;
  name: string;
};

type SettingsFormProps = {
  userId: string;
  nickname: string;
  bio: string | null;
  bannerPresets: BannerPreset[];
  selectedBannerPresetId: string;
};

export function SettingsForm({
  userId,
  nickname,
  bio,
  bannerPresets,
  selectedBannerPresetId,
}: SettingsFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} encType="multipart/form-data" className={styles["form-card"]}>
      <h2 className={styles["form-card__title"]}>Редактирование профиля</h2>

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
        <label htmlFor="nickname" className={styles["form-field__label"]}>
          Никнейм
        </label>
        <input
          id="nickname"
          name="nickname"
          defaultValue={nickname}
          required
          className={styles["form-field__input"]}
        />
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="bio" className={styles["form-field__label"]}>
          О себе
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={500}
          className={styles["form-field__textarea"]}
        />
      </div>

      <div className={styles["form-field"]}>
        <label htmlFor="avatar" className={styles["form-field__label"]}>
          Аватар
        </label>
        <Image
          src={userAvatarSrc(userId)}
          alt="Текущий аватар"
          width={64}
          height={64}
          className={styles["form-field__preview"]}
        />
        <input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className={styles["form-field__input"]}
        />
      </div>

      <fieldset className={styles["banner-picker"]}>
        <legend className={styles["banner-picker__legend"]}>Баннер профиля</legend>
        <div className={styles["banner-picker__grid"]}>
          {bannerPresets.map((preset) => (
            <label key={preset.id} className={styles["banner-picker__option"]}>
              <input
                type="radio"
                name="bannerPresetId"
                value={preset.id}
                defaultChecked={preset.id === selectedBannerPresetId}
                className={styles["banner-picker__input"]}
                required
              />
              <Image
                src={bannerPresetSrc(preset.id)}
                alt={preset.name}
                width={240}
                height={68}
                className={styles["banner-picker__preview"]}
              />
              <span className={styles["banner-picker__name"]}>{preset.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className={styles["form-submit"]} disabled={pending}>
        {pending ? "Сохранение..." : "Сохранить"}
      </button>
    </form>
  );
}
