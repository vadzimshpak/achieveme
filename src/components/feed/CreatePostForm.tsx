"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createPostAction } from "@/actions/post";
import type { FeedFilterSphere } from "@/lib/posts";
import { HCaptchaField } from "@/components/captcha/HCaptchaField";
import { useHCaptchaForm } from "@/components/captcha/useHCaptchaForm";
import { AchievementPicker } from "./AchievementPicker";
import blocknoteStyles from "./blocknote.module.css";
import styles from "./feed.module.css";

const BlockNoteEditorField = dynamic(
  () => import("./BlockNoteEditorField").then((module) => module.BlockNoteEditorField),
  {
    ssr: false,
    loading: () => (
      <div className={blocknoteStyles["blocknote-editor__loading"]}>Загрузка редактора...</div>
    ),
  },
);

type PostFormType = "PROGRESS" | "APPROVAL_REQUEST" | "ACHIEVEMENT_PROPOSAL";

type CurrentGoalOption = {
  achievementTemplateId: string;
  title: string;
  sphereId: string;
  sphereName: string;
};

type CreatePostFormProps = {
  spheres: FeedFilterSphere[];
  currentGoals: CurrentGoalOption[];
  defaultAchievementId?: string;
  hcaptchaSiteKey: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function CreatePostForm({
  spheres,
  currentGoals,
  defaultAchievementId,
  hcaptchaSiteKey,
  onCancel,
  onSuccess,
}: CreatePostFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPostAction, {});
  const { captchaToken, setCaptchaToken, resetSignal, captchaRequired, canSubmit: canSubmitCaptcha } =
    useHCaptchaForm(Boolean(state.error), hcaptchaSiteKey);
  const [postType, setPostType] = useState<PostFormType>("PROGRESS");
  const [achievementId, setAchievementId] = useState(
    defaultAchievementId ?? currentGoals[0]?.achievementTemplateId ?? spheres[0]?.achievements[0]?.id ?? "",
  );
  const [bodyJson, setBodyJson] = useState("[]");
  const handleBodyChange = useCallback((json: string) => setBodyJson(json), []);

  const needsAchievement = postType !== "ACHIEVEMENT_PROPOSAL";
  const canSubmit = !pending && (!needsAchievement || !!achievementId) && canSubmitCaptcha;

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  return (
    <section className={styles["create-post"]}>
      <h2 className={styles["create-post__title"]}>Новый пост</h2>

      {state.error && (
        <div className={`${styles["create-post__message"]} ${styles["create-post__message--error"]}`}>
          {state.error}
        </div>
      )}
      {state.success && (
        <div className={`${styles["create-post__message"]} ${styles["create-post__message--success"]}`}>
          {state.success}
        </div>
      )}

      <form
        action={formAction}
        className={styles["create-post__form"]}
        onSubmit={() => {
          setTimeout(() => router.refresh(), 0);
        }}
      >
        {needsAchievement && (
          <input type="hidden" name="achievementTemplateId" value={achievementId} />
        )}
        <input type="hidden" name="body" value={bodyJson} />
        <input type="hidden" name="hcaptchaToken" value={captchaToken} />

        <div className={styles["create-post__field"]}>
          <label className={styles["create-post__label"]} htmlFor="post-title">
            Заголовок
          </label>
          <input
            id="post-title"
            name="title"
            required
            maxLength={200}
            className={styles["create-post__input"]}
            placeholder={
              postType === "ACHIEVEMENT_PROPOSAL" ? "Название предлагаемой ачивки" : "Что нового в прогрессе?"
            }
          />
        </div>

        <div className={styles["create-post__field"]}>
          <label className={styles["create-post__label"]} htmlFor="post-type">
            Тип поста
          </label>
          <select
            id="post-type"
            name="type"
            value={postType}
            onChange={(event) => setPostType(event.target.value as PostFormType)}
            className={styles["create-post__select"]}
          >
            <option value="PROGRESS">Прогресс</option>
            <option value="APPROVAL_REQUEST">Заявка на ачивку</option>
            <option value="ACHIEVEMENT_PROPOSAL">Предложение ачивки</option>
          </select>
        </div>

        {needsAchievement && (
          <div className={styles["create-post__field"]}>
            <p className={styles["create-post__label"]}>Достижение</p>
            <AchievementPicker
              spheres={spheres}
              currentGoals={currentGoals}
              selectedId={achievementId}
              onSelect={setAchievementId}
            />
          </div>
        )}

        <div className={styles["create-post__field"]}>
          <p className={styles["create-post__label"]}>Тело поста</p>
          <BlockNoteEditorField onChange={handleBodyChange} />
        </div>

        <div className={styles["create-post__actions"]}>
          {captchaRequired && (
            <HCaptchaField
              siteKey={hcaptchaSiteKey}
              onTokenChange={setCaptchaToken}
              resetSignal={resetSignal}
            />
          )}
          {onCancel && (
            <button
              type="button"
              className={styles["create-post__cancel"]}
              onClick={onCancel}
              disabled={pending}
            >
              Отмена
            </button>
          )}
          <button type="submit" className={styles["create-post__submit"]} disabled={!canSubmit}>
            {pending ? "Публикация..." : "Опубликовать"}
          </button>
        </div>
      </form>
    </section>
  );
}
