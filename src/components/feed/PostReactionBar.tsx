"use client";

import { useState, useTransition } from "react";
import { votePostReactionAction } from "@/actions/post";
import {
  formatReactionScore,
  getReactionBarFill,
  getReactionScore,
  type PostReactions,
} from "@/lib/post-reactions";
import styles from "./feed.module.css";

type PostReactionBarProps = {
  postId: string;
  reactions: PostReactions;
  isLoggedIn: boolean;
  canVote: boolean;
  voteDisabledReason?: string | null;
};

export function PostReactionBar({
  postId,
  reactions,
  isLoggedIn,
  canVote,
  voteDisabledReason,
}: PostReactionBarProps) {
  const [likes, setLikes] = useState(reactions.likes);
  const [dislikes, setDislikes] = useState(reactions.dislikes);
  const [userVote, setUserVote] = useState(reactions.userVote);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const score = getReactionScore(likes, dislikes);
  const scoreLabel = formatReactionScore(score);
  const barFill = getReactionBarFill(score);
  const votingDisabled = !isLoggedIn || !canVote || isPending;

  const handleVote = (vote: "LIKE" | "DISLIKE") => {
    if (votingDisabled) return;

    startTransition(async () => {
      setError(null);
      const result = await votePostReactionAction(postId, vote);

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
    <div className={styles["post-reaction"]}>
      <button
        type="button"
        className={`${styles["post-reaction__btn"]} ${styles["post-reaction__btn--like"]} ${
          userVote === "LIKE" ? styles["post-reaction__btn--active-like"] : ""
        }`}
        onClick={() => handleVote("LIKE")}
        disabled={votingDisabled}
        aria-label="Лайк"
        aria-pressed={userVote === "LIKE"}
      >
        <span className={styles["post-reaction__btn-icon"]} aria-hidden="true">
          ▲
        </span>
        <span className={styles["post-reaction__btn-count"]}>{likes}</span>
      </button>

      <div
        className={styles["post-reaction__track"]}
        role="meter"
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label={`Оценка поста: ${scoreLabel}`}
      >
        <div className={styles["post-reaction__track-center"]} aria-hidden="true" />
        {barFill.likeWidth > 0 && (
          <div
            className={styles["post-reaction__fill-like"]}
            style={{ left: `${barFill.likeLeft}%`, width: `${barFill.likeWidth}%` }}
          />
        )}
        {barFill.dislikeWidth > 0 && (
          <div
            className={styles["post-reaction__fill-dislike"]}
            style={{ left: `${barFill.dislikeLeft}%`, width: `${barFill.dislikeWidth}%` }}
          />
        )}
        <span className={styles["post-reaction__ratio"]}>{scoreLabel}</span>
      </div>

      <button
        type="button"
        className={`${styles["post-reaction__btn"]} ${styles["post-reaction__btn--dislike"]} ${
          userVote === "DISLIKE" ? styles["post-reaction__btn--active-dislike"] : ""
        }`}
        onClick={() => handleVote("DISLIKE")}
        disabled={votingDisabled}
        aria-label="Дизлайк"
        aria-pressed={userVote === "DISLIKE"}
      >
        <span className={styles["post-reaction__btn-count"]}>{dislikes}</span>
        <span className={styles["post-reaction__btn-icon"]} aria-hidden="true">
          ▼
        </span>
      </button>

      {(error || (!canVote && isLoggedIn && voteDisabledReason)) && (
        <p className={styles["post-reaction__error"]}>{error ?? voteDisabledReason}</p>
      )}
    </div>
  );
}
