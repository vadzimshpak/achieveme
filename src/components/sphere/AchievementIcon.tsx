"use client";

import { AchievementImage } from "./AchievementImage";

type AchievementIconProps = {
  achievementTemplateId?: string;
  iconSrc?: string;
  title: string;
  description?: string | null;
  large?: boolean;
};

export function AchievementIcon({
  achievementTemplateId,
  iconSrc,
  title,
  description,
  large,
}: AchievementIconProps) {
  return (
    <AchievementImage
      achievementTemplateId={achievementTemplateId}
      iconSrc={iconSrc}
      title={title}
      description={description}
      size={large ? 64 : 32}
    />
  );
}
