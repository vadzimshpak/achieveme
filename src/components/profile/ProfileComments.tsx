"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { addCommentAction, deleteCommentFormAction } from "@/actions/comment";
import { HCaptchaField } from "@/components/captcha/HCaptchaField";
import { useHCaptchaForm } from "@/components/captcha/useHCaptchaForm";
import { userAvatarSrc } from "@/lib/image-urls";
import { formatDate } from "@/lib/utils";
import styles from "./profile-comments.module.css";

type Comment = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    nickname: string;
  };
};

type ProfileCommentsProps = {
  profileUserId: string;
  comments: Comment[];
  currentUserId?: string;
  profileOwnerId: string;
  isLoggedIn: boolean;
  canComment?: boolean;
  hcaptchaSiteKey: string;
};

export function ProfileComments({
  profileUserId,
  comments,
  currentUserId,
  profileOwnerId,
  isLoggedIn,
  canComment = true,
  hcaptchaSiteKey,
}: ProfileCommentsProps) {
  const [state, formAction, pending] = useActionState(addCommentAction, {});
  const { captchaToken, setCaptchaToken, resetSignal, captchaRequired, canSubmit } = useHCaptchaForm(
    Boolean(state.error),
    hcaptchaSiteKey,
  );

  return (
    <section className={styles["profile-comments"]} id="comments">
      <h2 className={styles["profile-comments__title"]}>
        Комментарии ({comments.length})
      </h2>

      {isLoggedIn && canComment ? (
        <form action={formAction} className={styles["profile-comments__form"]}>
          <input type="hidden" name="profileUserId" value={profileUserId} />
          <input type="hidden" name="hcaptchaToken" value={captchaToken} />
          {state.error && (
            <p className={`${styles["profile-comments__message"]} ${styles["profile-comments__message--error"]}`}>
              {state.error}
            </p>
          )}
          {state.success && (
            <p className={`${styles["profile-comments__message"]} ${styles["profile-comments__message--success"]}`}>
              {state.success}
            </p>
          )}
          <textarea
            name="text"
            className={styles["profile-comments__textarea"]}
            placeholder="Оставить комментарий..."
            required
            maxLength={500}
          />
          {captchaRequired && (
            <HCaptchaField
              siteKey={hcaptchaSiteKey}
              onTokenChange={setCaptchaToken}
              resetSignal={resetSignal}
            />
          )}
          <button
            type="submit"
            className={styles["profile-comments__submit"]}
            disabled={pending || !canSubmit}
          >
            {pending ? "Отправка..." : "Оставить комментарий"}
          </button>
        </form>
      ) : isLoggedIn && !canComment ? (
        <p className={styles["profile-comments__login-hint"]}>
          Комментарии к этому профилю ограничены
        </p>
      ) : (
        <p className={styles["profile-comments__login-hint"]}>
          <Link href="/login">Войдите</Link>, чтобы оставить комментарий
        </p>
      )}

      {comments.length === 0 ? (
        <p className={styles["profile-comments__empty"]}>Комментариев пока нет</p>
      ) : (
        <ul className={styles["profile-comments__list"]}>
          {comments.map((comment) => {
            const canDelete =
              currentUserId === comment.author.id || currentUserId === profileOwnerId;

            return (
              <li key={comment.id} className={styles["profile-comments__item"]}>
                <Image
                  src={userAvatarSrc(comment.author.id)}
                  alt={comment.author.nickname}
                  width={32}
                  height={32}
                  className={styles["profile-comments__avatar"]}
                />
                <div className={styles["profile-comments__content"]}>
                  <div>
                    <Link
                      href={`/id/${comment.author.nickname}`}
                      className={styles["profile-comments__author"]}
                    >
                      {comment.author.nickname}
                    </Link>
                    <span className={styles["profile-comments__date"]}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className={styles["profile-comments__text"]}>{comment.text}</p>
                  {canDelete && (
                    <form action={deleteCommentFormAction}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button type="submit" className={styles["profile-comments__delete"]}>
                        Удалить
                      </button>
                    </form>
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
