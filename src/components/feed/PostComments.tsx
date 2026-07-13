"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { addPostCommentAction, deletePostCommentAction } from "@/actions/post-comment";
import type { PostCommentItem } from "@/lib/post-comments";
import { userAvatarSrc } from "@/lib/image-urls";
import { formatRelativeDate } from "@/lib/utils";
import { CommentReactionBar } from "./CommentReactionBar";
import styles from "./feed.module.css";

type PostCommentsProps = {
  postId: string;
  postAuthorId: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  isAdmin: boolean;
};

export function PostComments({
  postId,
  postAuthorId,
  isLoggedIn,
  currentUserId,
  isAdmin,
}: PostCommentsProps) {
  const [comments, setComments] = useState<PostCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addPostCommentAction, {});

  const loadComments = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        setLoadError("Не удалось загрузить комментарии");
        return;
      }

      const data = (await response.json()) as {
        comments: Array<Omit<PostCommentItem, "createdAt"> & { createdAt: string }>;
      };

      setComments(
        data.comments.map((comment) => ({
          ...comment,
          createdAt: new Date(comment.createdAt),
        })),
      );
    } catch {
      setLoadError("Не удалось загрузить комментарии");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (state.comment) {
      setComments((current) => {
        if (current.some((comment) => comment.id === state.comment?.id)) {
          return current;
        }
        return [...current, state.comment!];
      });
    }
  }, [state.comment]);

  const handleDelete = async (commentId: string) => {
    const result = await deletePostCommentAction(commentId);
    if (result.error) return;
    setComments((current) => current.filter((comment) => comment.id !== commentId));
  };

  return (
    <section className={styles["post-comments"]}>
      <h3 className={styles["post-comments__title"]}>
        Комментарии{!loading ? ` (${comments.length})` : ""}
      </h3>

      {isLoggedIn ? (
        <form action={formAction} className={styles["post-comments__form"]}>
          <input type="hidden" name="postId" value={postId} />
          {state.error && (
            <p
              className={`${styles["post-comments__message"]} ${styles["post-comments__message--error"]}`}
            >
              {state.error}
            </p>
          )}
          <textarea
            key={comments.length}
            name="text"
            className={styles["post-comments__textarea"]}
            placeholder="Написать комментарий..."
            required
            maxLength={500}
          />
          <button
            type="submit"
            className={styles["post-comments__submit"]}
            disabled={pending}
          >
            {pending ? "Отправка..." : "Отправить"}
          </button>
        </form>
      ) : (
        <p className={styles["post-comments__login-hint"]}>
          <Link href="/login">Войдите</Link>, чтобы оставить комментарий
        </p>
      )}

      {loading && <p className={styles["post-comments__loading"]}>Загрузка комментариев...</p>}
      {loadError && <p className={styles["post-comments__message--error"]}>{loadError}</p>}

      {!loading && !loadError && comments.length === 0 && (
        <p className={styles["post-comments__empty"]}>Комментариев пока нет</p>
      )}

      {!loading && !loadError && comments.length > 0 && (
        <ul className={styles["post-comments__list"]}>
          {comments.map((comment) => {
            const canDelete =
              isAdmin ||
              currentUserId === comment.author.id ||
              currentUserId === postAuthorId;

            return (
              <li key={comment.id} className={styles["post-comments__item"]}>
                <Image
                  src={userAvatarSrc(comment.author.id)}
                  alt={comment.author.nickname}
                  width={32}
                  height={32}
                  className={styles["post-comments__avatar"]}
                />
                <div className={styles["post-comments__content"]}>
                  <div className={styles["post-comments__header"]}>
                    <div>
                      <Link
                        href={`/id/${comment.author.nickname}`}
                        className={styles["post-comments__author"]}
                      >
                        {comment.author.nickname}
                      </Link>
                      <span className={styles["post-comments__date"]}>
                        {formatRelativeDate(comment.createdAt)}
                      </span>
                    </div>
                    <CommentReactionBar
                      commentId={comment.id}
                      reactions={comment.reactions}
                      isLoggedIn={isLoggedIn}
                    />
                  </div>
                  <p className={styles["post-comments__text"]}>{comment.text}</p>
                  {canDelete && (
                    <button
                      type="button"
                      className={styles["post-comments__delete"]}
                      onClick={() => void handleDelete(comment.id)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
