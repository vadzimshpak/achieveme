"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startDirectChatAction } from "@/actions/chat";
import styles from "./profile-header.module.css";

type ProfileMessageButtonProps = {
  targetUserId: string;
  isLoggedIn: boolean;
};

export function ProfileMessageButton({ targetUserId, isLoggedIn }: ProfileMessageButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) return null;

  const handleClick = () => {
    startTransition(async () => {
      setError(null);
      const result = await startDirectChatAction(targetUserId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.roomId) {
        router.push(`/chat?room=${result.roomId}`);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className={styles["profile-header__edit-btn"]}
        onClick={handleClick}
        disabled={isPending}
      >
        {isPending ? "..." : "Отправить сообщение"}
      </button>
      {error && <p className={styles["profile-header__action-message"]}>{error}</p>}
    </>
  );
}
