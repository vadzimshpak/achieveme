"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitAchievementForModerationAction } from "@/actions/achievement-moderation";
import styles from "./feed.module.css";

type PostSubmitModerationButtonProps = {
  postId: string;
};

export function PostSubmitModerationButton({ postId }: PostSubmitModerationButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      setError(null);
      const result = await submitAchievementForModerationAction(postId);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className={styles["post-card__admin-action"]}>
      <button
        type="button"
        className={styles["post-card__submit-moderation"]}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Отправка..." : "Отправить на рассмотрение"}
      </button>
      {error && <p className={styles["post-card__admin-action-error"]}>{error}</p>}
    </div>
  );
}
