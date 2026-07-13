"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
} from "@/actions/friend";
import styles from "./notification-bell.module.css";

type NotificationData = {
  id: string;
  type: "FRIEND_REQUEST";
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    nickname: string;
  } | null;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications");
    if (!response.ok) return;

    const data = (await response.json()) as {
      notifications: NotificationData[];
      unreadCount: number;
    };

    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFriendRequest = (friendRequestId: string, action: "accept" | "decline") => {
    startTransition(async () => {
      const result =
        action === "accept"
          ? await acceptFriendRequestAction(friendRequestId)
          : await declineFriendRequestAction(friendRequestId);

      if (!result.error) {
        await loadNotifications();
      }
    });
  };

  return (
    <div className={styles["site-header__notifications"]} ref={containerRef}>
      <button
        type="button"
        className={`${styles["site-header__bell"]} ${
          unreadCount > 0 ? styles["site-header__bell--active"] : ""
        }`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <svg
          className={styles["site-header__bell-icon"]}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5-6.71V4a2 2 0 1 0-4 0v.29A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles["site-header__bell-badge"]}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles["site-header__notifications-dropdown"]}>
          <p className={styles["site-header__notifications-title"]}>Уведомления</p>

          {notifications.length === 0 ? (
            <p className={styles["site-header__notifications-empty"]}>Нет уведомлений</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={styles["site-header__notification"]}>
                {notification.type === "FRIEND_REQUEST" && notification.actor && (
                  <>
                    <p className={styles["site-header__notification-text"]}>
                      <Link
                        href={`/id/${notification.actor.nickname}`}
                        className={styles["site-header__notification-link"]}
                      >
                        {notification.actor.nickname}
                      </Link>{" "}
                      хочет добавить вас в друзья
                    </p>
                    {notification.entityId && (
                      <div className={styles["site-header__notification-actions"]}>
                        <button
                          type="button"
                          className={`${styles["site-header__notification-btn"]} ${styles["site-header__notification-btn--accept"]}`}
                          disabled={isPending}
                          onClick={() =>
                            handleFriendRequest(notification.entityId!, "accept")
                          }
                        >
                          Принять
                        </button>
                        <button
                          type="button"
                          className={`${styles["site-header__notification-btn"]} ${styles["site-header__notification-btn--decline"]}`}
                          disabled={isPending}
                          onClick={() =>
                            handleFriendRequest(notification.entityId!, "decline")
                          }
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
