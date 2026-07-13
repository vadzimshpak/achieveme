"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePostAction } from "@/actions/post";
import styles from "./feed.module.css";

type PostDeleteButtonProps = {
  postId: string;
  onDeleted: () => void;
};

export function PostDeleteButton({ postId, onDeleted }: PostDeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm("Удалить этот пост?")) return;

    startTransition(async () => {
      setError(null);
      const result = await deletePostAction(postId);

      if (result.error) {
        setError(result.error);
        return;
      }

      onDeleted();
      router.refresh();
    });
  };

  return (
    <div className={styles["post-card__delete"]}>
      <button
        type="button"
        className={styles["post-card__delete-btn"]}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "Удаление..." : "Удалить"}
      </button>
      {error && <p className={styles["post-card__delete-error"]}>{error}</p>}
    </div>
  );
}
