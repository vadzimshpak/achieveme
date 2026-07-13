"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeFriendAction,
  sendFriendRequestAction,
  type ActionState,
} from "@/actions/friend";
import type { FriendRelationStatus } from "@/lib/friendship";
import styles from "./profile-header.module.css";

type ProfileFriendButtonProps = {
  targetUserId: string;
  initialStatus: FriendRelationStatus;
};

export function ProfileFriendButton({ targetUserId, initialStatus }: ProfileFriendButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<FriendRelationStatus>(initialStatus);
  const [message, setMessage] = useState<string | null>(null);

  if (status === "self") return null;

  const handleAction = () => {
    startTransition(async () => {
      let result: ActionState;

      if (status === "friends") {
        result = await removeFriendAction(targetUserId);
        if (!result.error) setStatus("none");
      } else if (status === "none") {
        result = await sendFriendRequestAction(targetUserId);
        if (!result.error) setStatus("pending_outgoing");
      } else {
        return;
      }

      setMessage(result.error ?? result.success ?? null);
      router.refresh();
    });
  };

  let label = "Добавить в друзья";
  let disabled = isPending;

  if (status === "friends") {
    label = "Удалить из друзей";
  } else if (status === "pending_outgoing") {
    label = "Заявка отправлена";
    disabled = true;
  } else if (status === "pending_incoming") {
    label = "Заявка получена";
    disabled = true;
  }

  return (
    <>
      <button
        type="button"
        className={styles["profile-header__edit-btn"]}
        onClick={handleAction}
        disabled={disabled}
      >
        {isPending ? "..." : label}
      </button>
      {message && <p className={styles["profile-header__action-message"]}>{message}</p>}
    </>
  );
}
