"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedPostItem, FeedTypeFilter } from "@/lib/posts";
import { PostCard } from "./PostCard";
import styles from "./feed.module.css";

type PostFeedProps = {
  initialPosts: FeedPostItem[];
  initialNextCursor: string | null;
  typeFilter: FeedTypeFilter;
  achievementId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  currentUserId?: string;
};

export function PostFeed({
  initialPosts,
  initialNextCursor,
  typeFilter,
  achievementId,
  isLoggedIn,
  isAdmin,
  currentUserId,
}: PostFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setNextCursor(initialNextCursor);
  }, [initialPosts, initialNextCursor]);

  useEffect(() => {
    setOpenPostId(null);
  }, [typeFilter, achievementId]);

  const handleTogglePost = useCallback((postId: string) => {
    setOpenPostId((current) => (current === postId ? null : postId));
  }, []);

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
    setOpenPostId((current) => (current === postId ? null : current));
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor, limit: "10" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (achievementId) params.set("achievementId", achievementId);

      const response = await fetch(`/api/posts?${params.toString()}`);
      if (!response.ok) return;

      const data = (await response.json()) as {
        posts: Array<Omit<FeedPostItem, "createdAt"> & { createdAt: string }>;
        nextCursor: string | null;
      };

      setPosts((current) => [
        ...current,
        ...data.posts.map((post) => ({ ...post, createdAt: new Date(post.createdAt) })),
      ]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [achievementId, loading, nextCursor, typeFilter]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return <p className={styles["post-feed__empty"]}>Пока нет постов по выбранным фильтрам</p>;
  }

  return (
    <div className={styles["post-feed"]}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          isOpen={openPostId === post.id}
          onToggle={() => handleTogglePost(post.id)}
          onDeleted={() => handlePostDeleted(post.id)}
        />
      ))}

      <div ref={sentinelRef} className={styles["post-feed__sentinel"]} aria-hidden="true" />

      {loading && <p className={styles["post-feed__loading"]}>Загрузка...</p>}
      {!nextCursor && posts.length > 0 && (
        <p className={styles["post-feed__end"]}>Больше постов нет</p>
      )}
    </div>
  );
}
