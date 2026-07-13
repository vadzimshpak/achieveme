"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { AchievementImage } from "@/components/sphere/AchievementImage";
import { formatRelativeDate } from "@/lib/utils";
import type { FeedPostItem } from "@/lib/posts";
import { PostReactionBar } from "./PostReactionBar";
import { PostSubmitModerationButton } from "./PostSubmitModerationButton";
import { PostDeleteButton } from "./PostDeleteButton";
import { PostComments } from "./PostComments";
import styles from "./feed.module.css";

const BlockNoteViewer = dynamic(
  () => import("./BlockNoteViewer").then((module) => module.BlockNoteViewer),
  { ssr: false },
);

type PostCardProps = {
  post: FeedPostItem;
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentUserId?: string;
  isOpen: boolean;
  onToggle: () => void;
  onDeleted: () => void;
};

const TYPE_LABELS = {
  PROGRESS: "Прогресс",
  APPROVAL_REQUEST: "Заявка на ачивку",
  ACHIEVEMENT_PROPOSAL: "Предложение ачивки",
} as const;

const MODERATION_LABELS = {
  NONE: null,
  PENDING: "На модерации",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
} as const;

export function PostCard({
  post,
  isLoggedIn,
  isAdmin,
  currentUserId,
  isOpen,
  onToggle,
  onDeleted,
}: PostCardProps) {
  const moderationLabel =
    post.type === "APPROVAL_REQUEST" ? MODERATION_LABELS[post.moderationStatus] : null;
  const showSubmitModeration =
    isAdmin && post.type === "APPROVAL_REQUEST" && post.moderationStatus === "NONE";

  return (
    <article className={styles["post-card"]}>
      <div className={styles["post-card__stub"]}>
        <div
          className={styles["post-card__stub-main"]}
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggle();
            }
          }}
          aria-expanded={isOpen}
        >
          <h2 className={styles["post-card__title"]}>{post.title}</h2>
          <div className={styles["post-card__meta-row"]}>
            <Link
              href={`/id/${post.author.nickname}`}
              className={styles["post-card__author"]}
              onClick={(event) => event.stopPropagation()}
            >
              {post.author.nickname}
            </Link>
            <span className={styles["post-card__date"]}>{formatRelativeDate(post.createdAt)}</span>
            <span
              className={`${styles["post-card__type"]} ${
                post.type === "APPROVAL_REQUEST"
                  ? styles["post-card__type--approval"]
                  : post.type === "ACHIEVEMENT_PROPOSAL"
                    ? styles["post-card__type--proposal"]
                    : ""
              }`}
            >
              {TYPE_LABELS[post.type]}
            </span>
            {moderationLabel && (
              <span
                className={`${styles["post-card__moderation"]} ${
                  post.moderationStatus === "APPROVED"
                    ? styles["post-card__moderation--approved"]
                    : post.moderationStatus === "REJECTED"
                      ? styles["post-card__moderation--rejected"]
                      : post.moderationStatus === "PENDING"
                        ? styles["post-card__moderation--pending"]
                        : ""
                }`}
              >
                {moderationLabel}
              </span>
            )}
          </div>
        </div>

        {post.achievement && (
          <div className={styles["post-card__stub-icon"]}>
            <AchievementImage
              achievementTemplateId={post.achievement.id}
              title={post.achievement.title}
              size={64}
            />
          </div>
        )}
      </div>

      {isOpen && (
        <div className={styles["post-card__dropdown"]}>
          {showSubmitModeration && (
            <div className={styles["post-card__dropdown-admin"]}>
              <PostSubmitModerationButton postId={post.id} />
            </div>
          )}

          {post.moderationStatus === "REJECTED" && post.moderationNote && (
            <p className={styles["post-card__moderation-note"]}>{post.moderationNote}</p>
          )}

          <div className={styles["post-card__body"]}>
            <BlockNoteViewer content={post.body} />
          </div>

          <PostReactionBar
            postId={post.id}
            reactions={post.reactions}
            isLoggedIn={isLoggedIn}
            canVote={post.canVote}
            voteDisabledReason={post.voteDisabledReason}
          />

          {isAdmin && <PostDeleteButton postId={post.id} onDeleted={onDeleted} />}

          <PostComments
            postId={post.id}
            postAuthorId={post.author.id}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </article>
  );
}
