"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updatePrivacyAction } from "@/actions/privacy";
import type { PrivacyLevel } from "@/generated/prisma/client";
import { PRIVACY_LABELS } from "@/lib/privacy";
import styles from "./settings.module.css";

type PrivacySettingsProps = {
  whoCanMessage: PrivacyLevel;
  whoCanComment: PrivacyLevel;
  whoCanViewProfile: PrivacyLevel;
};

const PRIVACY_OPTIONS: PrivacyLevel[] = ["EVERYONE", "FRIENDS", "NOBODY"];

function PrivacyField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: PrivacyLevel;
}) {
  return (
    <div className={styles["form-field"]}>
      <span className={styles["form-field__label"]}>{label}</span>
      <div className={styles["privacy-options"]}>
        {PRIVACY_OPTIONS.map((option) => (
          <label key={option} className={styles["privacy-options__item"]}>
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={value === option}
              className={styles["privacy-options__input"]}
            />
            <span>{PRIVACY_LABELS[option]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function PrivacySettings({
  whoCanMessage,
  whoCanComment,
  whoCanViewProfile,
}: PrivacySettingsProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updatePrivacyAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className={styles["form-card"]}>
      <h2 className={styles["form-card__title"]}>Конфиденциальность</h2>

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

      <PrivacyField
        name="whoCanMessage"
        label="Кто может присылать личные сообщения?"
        value={whoCanMessage}
      />
      <PrivacyField
        name="whoCanComment"
        label="Кто может писать комментарии в профиле?"
        value={whoCanComment}
      />
      <PrivacyField
        name="whoCanViewProfile"
        label="Кто может видеть профиль?"
        value={whoCanViewProfile}
      />

      <button type="submit" className={styles["form-submit"]} disabled={pending}>
        {pending ? "Сохранение..." : "Сохранить настройки"}
      </button>
    </form>
  );
}
