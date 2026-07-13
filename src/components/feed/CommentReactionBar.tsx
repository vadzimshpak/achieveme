"use client";

import { useState, useTransition } from "react";
import { votePostCommentReactionAction } from "@/actions/post-comment";
import type { PostReactions } from "@/lib/post-reactions";
import styles from "./feed.module.css";

type CommentReactionBarProps = {
  commentId: string;
  reactions: PostReactions;
  isLoggedIn: boolean;
};

export function CommentReactionBar({ commentId, reactions, isLoggedIn }: CommentReactionBarProps) {
  const [likes, setLikes] = useState(reactions.likes);
  const [dislikes, setDislikes] = useState(reactions.dislikes);
  const [userVote, setUserVote] = useState(reactions.userVote);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const votingDisabled = !isLoggedIn || isPending;

  const handleVote = (vote: "LIKE" | "DISLIKE") => {
    if (votingDisabled) return;

    startTransition(async () => {
      setError(null);
      const result = await votePostCommentReactionAction(commentId, vote);

      if (result.error) {
        setError(result.error);
        return;
      }

      setLikes(result.likes);
      setDislikes(result.dislikes);
      setUserVote(result.userVote);
    });
  };

  return (
    <div className={styles["comment-reaction"]}>
      <button
        type="button"
        className={`${styles["comment-reaction__btn"]} ${styles["comment-reaction__btn--like"]} ${
          userVote === "LIKE" ? styles["comment-reaction__btn--active-like"] : ""
        }`}
        onClick={() => handleVote("LIKE")}
        disabled={votingDisabled}
        aria-label="Лайк"
        aria-pressed={userVote === "LIKE"}
      >
        <span className={styles["comment-reaction__btn-icon"]} aria-hidden="true">
          ▲
        </span>
        <span className={styles["comment-reaction__btn-count"]}>{likes}</span>
      </button>

      <button
        type="button"
        className={`${styles["comment-reaction__btn"]} ${styles["comment-reaction__btn--dislike"]} ${
          userVote === "DISLIKE" ? styles["comment-reaction__btn--active-dislike"] : ""
        }`}
        onClick={() => handleVote("DISLIKE")}
        disabled={votingDisabled}
        aria-label="Дизлайк"
        aria-pressed={userVote === "DISLIKE"}
      >
        <span className={styles["comment-reaction__btn-icon"]} aria-hidden="true">
          ▼
        </span>
        <span className={styles["comment-reaction__btn-count"]}>{dislikes}</span>
      </button>

      {error && <p className={styles["comment-reaction__error"]}>{error}</p>}
    </div>
  );
}
