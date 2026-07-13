"use client";

import { useState } from "react";
import type { FeedFilterSphere } from "@/lib/posts";
import { CreatePostForm } from "./CreatePostForm";
import styles from "./feed.module.css";

type CurrentGoalOption = {
  achievementTemplateId: string;
  title: string;
  sphereId: string;
  sphereName: string;
};

type CreatePostSectionProps = {
  spheres: FeedFilterSphere[];
  currentGoals: CurrentGoalOption[];
  defaultAchievementId?: string;
  hcaptchaSiteKey: string;
};

export function CreatePostSection({
  spheres,
  currentGoals,
  defaultAchievementId,
  hcaptchaSiteKey,
}: CreatePostSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles["create-post-section"]}>
      {!isOpen && (
        <button
          type="button"
          className={styles["create-post-section__toggle"]}
          onClick={() => setIsOpen(true)}
        >
          + Новый пост
        </button>
      )}

      {isOpen && (
        <CreatePostForm
          spheres={spheres}
          currentGoals={currentGoals}
          defaultAchievementId={defaultAchievementId}
          hcaptchaSiteKey={hcaptchaSiteKey}
          onCancel={() => setIsOpen(false)}
          onSuccess={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
