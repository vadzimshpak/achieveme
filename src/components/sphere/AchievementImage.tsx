"use client";

import { useCallback, useEffect, useId, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { achievementIconSrc, achievementImageUnoptimized } from "@/lib/image-urls";
import styles from "./achievement-image.module.css";

type AchievementImageProps = {
  achievementTemplateId?: string;
  iconSrc?: string;
  title: string;
  description?: string | null;
  size?: 32 | 48 | 64;
  className?: string;
  interactive?: boolean;
};

type AchievementRarityTier = "bronze" | "silver" | "gold" | "purple" | "single" | "unknown";

type AchievementRarity = {
  owners: number;
  totalUsers: number;
  percent: number;
  tier: AchievementRarityTier;
};

const RARITY_LABELS: Record<AchievementRarityTier, string> = {
  bronze: "Обычная",
  silver: "Редкая",
  gold: "Эпическая",
  purple: "Легендарная",
  single: "Уникальная",
  unknown: "Неизведанная",
};

const RARITY_MODAL_CLASS: Record<AchievementRarityTier, string> = {
  bronze: styles["achievement-modal__rarity--bronze"],
  silver: styles["achievement-modal__rarity--silver"],
  gold: styles["achievement-modal__rarity--gold"],
  purple: styles["achievement-modal__rarity--purple"],
  single: styles["achievement-modal__rarity--single"],
  unknown: styles["achievement-modal__rarity--unknown"],
};

type AchievementModalProps = {
  open: boolean;
  title: string;
  description?: string | null;
  iconSrc: string;
  rarity: AchievementRarity | null;
  titleId: string;
  onClose: () => void;
};

function AchievementModal({
  open,
  title,
  description,
  iconSrc,
  rarity,
  titleId,
  onClose,
}: AchievementModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles["achievement-modal"]} role="presentation">
      <button
        type="button"
        className={styles["achievement-modal__backdrop"]}
        onClick={onClose}
        aria-label="Закрыть"
      />
      <div
        className={styles["achievement-modal__dialog"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={styles["achievement-modal__title"]}>
          {title}
        </h2>
        <div className={styles["achievement-modal__image-wrap"]}>
          <Image
            src={iconSrc}
            alt={title}
            width={128}
            height={128}
            unoptimized={achievementImageUnoptimized(iconSrc)}
            className={styles["achievement-modal__image"]}
          />
        </div>
        <p className={styles["achievement-modal__description"]}>
          {description?.trim() || "Описание отсутствует"}
        </p>
        {rarity && (
          <p
            className={[
              styles["achievement-modal__rarity"],
              RARITY_MODAL_CLASS[rarity.tier],
            ].join(" ")}
          >
            Редкость:{" "}
            <span className={styles["achievement-modal__rarity-value"]}>
              {RARITY_LABELS[rarity.tier]} ·{" "}
              {rarity.percent.toFixed(rarity.percent < 1 ? 2 : 1)}% ({rarity.owners}/
              {rarity.totalUsers})
            </span>
          </p>
        )}
        <button type="button" className={styles["achievement-modal__close"]} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function AchievementImage({
  achievementTemplateId,
  iconSrc,
  title,
  description,
  size = 32,
  className,
  interactive = true,
}: AchievementImageProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rarity, setRarity] = useState<AchievementRarity | null>(null);
  const titleId = useId();
  const resolvedIconSrc = iconSrc ?? achievementIconSrc(achievementTemplateId!);

  const sizeClass =
    size === 64
      ? styles["achievement-image--64"]
      : size === 48
        ? styles["achievement-image--48"]
        : "";

  const rarityClass = rarity
    ? rarity.tier === "bronze"
      ? styles["achievement-image--rarity-bronze"]
      : rarity.tier === "silver"
        ? styles["achievement-image--rarity-silver"]
        : rarity.tier === "gold"
          ? styles["achievement-image--rarity-gold"]
          : rarity.tier === "purple"
            ? styles["achievement-image--rarity-purple"]
            : rarity.tier === "single"
              ? styles["achievement-image--rarity-single"]
              : styles["achievement-image--rarity-unknown"]
    : "";

  const handleOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!achievementTemplateId) return;

    const cacheKey = achievementTemplateId;
    const globalCache = (globalThis as unknown as { __achievemeRarity?: Map<string, AchievementRarity> })
      .__achievemeRarity;
    const cache = globalCache ?? new Map<string, AchievementRarity>();
    (globalThis as unknown as { __achievemeRarity?: Map<string, AchievementRarity> }).__achievemeRarity =
      cache;

    const cached = cache.get(cacheKey);
    if (cached) {
      setRarity(cached);
      return;
    }

    let cancelled = false;
    void fetch(`/api/achievements/${achievementTemplateId}/rarity`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AchievementRarity | null) => {
        if (cancelled || !data) return;
        cache.set(cacheKey, data);
        setRarity(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [achievementTemplateId]);

  const image = (
    <figure className={styles["achievement-image__figure"]}>
      <Image
        src={resolvedIconSrc}
        alt={title}
        fill
        sizes={`${size}px`}
        unoptimized={achievementImageUnoptimized(resolvedIconSrc)}
        className={styles["achievement-image__img"]}
      />
    </figure>
  );

  return (
    <>
      <div
        className={[styles["achievement-image"], sizeClass, rarityClass, className]
          .filter(Boolean)
          .join(" ")}
      >
        {interactive ? (
          <button
            type="button"
            className={styles["achievement-image__button"]}
            onClick={handleOpen}
            aria-label={`Открыть достижение «${title}»`}
          >
            {image}
          </button>
        ) : (
          image
        )}
      </div>

      {interactive && mounted && (
        <AchievementModal
          open={open}
          title={title}
          description={description}
          iconSrc={resolvedIconSrc}
          rarity={rarity}
          titleId={titleId}
          onClose={handleClose}
        />
      )}
    </>
  );
}
