"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sendChatMessageAction } from "@/actions/chat";
import { AchievementImage } from "@/components/sphere/AchievementImage";
import { userAvatarSrc } from "@/lib/image-urls";
import { formatShortDateTime } from "@/lib/utils";
import type { AchievementChatRoom, ChatMessageItem, DirectChatRoom } from "@/lib/chat";
import styles from "./chat-page.module.css";

export function ChatPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRoomId = searchParams.get("room");

  const [achievementRooms, setAchievementRooms] = useState<AchievementChatRoom[]>([]);
  const [directRooms, setDirectRooms] = useState<DirectChatRoom[]>([]);
  const [roomTitle, setRoomTitle] = useState("");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch("/api/chat/rooms");
      if (!response.ok) return;
      const data = (await response.json()) as {
        achievementRooms: AchievementChatRoom[];
        directRooms: DirectChatRoom[];
      };
      setAchievementRooms(data.achievementRooms);
      setDirectRooms(data.directRooms);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (!response.ok) {
        setError("Не удалось загрузить сообщения");
        return;
      }
      const data = (await response.json()) as {
        room: { title: string };
        messages: Array<Omit<ChatMessageItem, "createdAt"> & { createdAt: string }>;
      };
      setRoomTitle(data.room.title);
      setMessages(
        data.messages.map((message) => ({
          ...message,
          createdAt: new Date(message.createdAt),
        })),
      );
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (selectedRoomId) {
      void loadMessages(selectedRoomId);
    } else {
      setMessages([]);
      setRoomTitle("");
    }
  }, [selectedRoomId, loadMessages]);

  const selectRoom = (roomId: string) => {
    router.push(`/chat?room=${roomId}`);
  };

  const handleSend = () => {
    if (!selectedRoomId || !text.trim()) return;

    startTransition(async () => {
      const result = await sendChatMessageAction(selectedRoomId, text.trim());
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.message) {
        setMessages((current) => [...current, result.message!]);
        setText("");
        void loadRooms();
      }
    });
  };

  return (
    <div className={styles["chat-page"]}>
      <h1 className={styles["chat-page__title"]}>Чат</h1>

      <div className={styles["chat-page__layout"]}>
        <aside className={styles["chat-page__sidebar"]}>
          <div
            className={`${styles["chat-page__rooms-section"]} ${styles["chat-page__rooms-section--achievements"]}`}
          >
            <h2 className={styles["chat-page__section-title"]}>Чаты ачивок</h2>
            {loadingRooms ? (
              <p className={styles["chat-page__rooms-empty"]}>Загрузка...</p>
            ) : achievementRooms.length === 0 ? (
              <p className={styles["chat-page__rooms-empty"]}>Нет открытых ачивок</p>
            ) : (
              <ul className={styles["chat-page__rooms-list"]}>
                {achievementRooms.map((room) => (
                  <li
                    key={room.roomId}
                    className={`${styles["chat-page__room-item"]} ${
                      selectedRoomId === room.roomId ? styles["chat-page__room-item--active"] : ""
                    }`}
                  >
                    <AchievementImage
                      achievementTemplateId={room.achievementId}
                      title={room.title}
                      description={room.description}
                      size={32}
                    />
                    <button
                      type="button"
                      className={styles["chat-page__room-btn"]}
                      onClick={() => selectRoom(room.roomId)}
                    >
                      <span className={styles["chat-page__room-info"]}>
                        <span className={styles["chat-page__room-title"]}>{room.title}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={`${styles["chat-page__rooms-section"]} ${styles["chat-page__rooms-section--direct"]}`}
          >
            <h2 className={styles["chat-page__section-title"]}>Личные сообщения</h2>
            {loadingRooms ? (
              <p className={styles["chat-page__rooms-empty"]}>Загрузка...</p>
            ) : directRooms.length === 0 ? (
              <p className={styles["chat-page__rooms-empty"]}>Нет диалогов</p>
            ) : (
              <ul className={styles["chat-page__rooms-list"]}>
                {directRooms.map((room) => (
                  <li key={room.roomId}>
                    <button
                      type="button"
                      className={`${styles["chat-page__room-btn"]} ${styles["chat-page__room-btn--full"]} ${
                        selectedRoomId === room.roomId ? styles["chat-page__room-btn--active"] : ""
                      }`}
                      onClick={() => selectRoom(room.roomId)}
                    >
                      <Image
                        src={userAvatarSrc(room.userId)}
                        alt={room.nickname}
                        width={32}
                        height={32}
                        className={styles["chat-page__room-avatar"]}
                      />
                      <span className={styles["chat-page__room-info"]}>
                        <span className={styles["chat-page__room-title"]}>{room.nickname}</span>
                        {room.lastMessage && (
                          <span className={styles["chat-page__room-preview"]}>{room.lastMessage}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className={styles["chat-page__main"]}>
          {!selectedRoomId ? (
            <p className={styles["chat-page__empty"]}>Выберите чат слева</p>
          ) : (
            <>
              <div className={styles["chat-page__main-header"]}>{roomTitle}</div>

              {error && <p className={styles["chat-page__error"]}>{error}</p>}

              <div className={styles["chat-page__messages"]}>
                {loadingMessages ? (
                  <p className={styles["chat-page__empty"]}>Загрузка сообщений...</p>
                ) : messages.length === 0 ? (
                  <p className={styles["chat-page__empty"]}>Сообщений пока нет</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles["chat-page__message"]} ${
                        message.isOwn ? styles["chat-page__message--own"] : ""
                      }`}
                    >
                      <Image
                        src={userAvatarSrc(message.author.id)}
                        alt={message.author.nickname}
                        width={32}
                        height={32}
                        className={styles["chat-page__message-avatar"]}
                      />
                      <div className={styles["chat-page__message-body"]}>
                        <div className={styles["chat-page__message-header"]}>
                          <Link
                            href={`/id/${message.author.nickname}`}
                            className={styles["chat-page__message-author"]}
                          >
                            {message.author.nickname}
                          </Link>
                          <time
                            className={styles["chat-page__message-date"]}
                            dateTime={message.createdAt.toISOString()}
                          >
                            {formatShortDateTime(message.createdAt)}
                          </time>
                        </div>
                        <p className={styles["chat-page__message-text"]}>{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                className={styles["chat-page__form"]}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <input
                  type="text"
                  className={styles["chat-page__input"]}
                  placeholder="Написать сообщение..."
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  className={styles["chat-page__send"]}
                  disabled={isPending || !text.trim()}
                >
                  {isPending ? "..." : "Отправить"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
